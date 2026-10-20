
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express = require("express");
const helmet = require("helmet");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

// Normalize the Supabase project URL.
function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
}

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "CivicFix API",
  });
});

app.get("/api/instance", (req, res) => {
  res.status(200).json({
    service: "CivicFix API",
    instance: os.hostname(),
    timestamp: new Date().toISOString(),
  });
});

// Authenticate the Supabase user from their access token.
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({
        error: "Authentication token required",
      });
    }

    const token = match[1].trim();
    const url = getSupabaseUrl();
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return res.status(503).json({
        error: "Supabase is not configured",
      });
    }

    // Use the authenticated user's token for database queries.
    // Never use a service-role key in this request flow.
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired authentication token",
      });
    }

    req.supabase = supabase;
    req.authUser = user;
    req.accessToken = token;

    return next();
  } catch (error) {
    console.error("Authentication failed:", error.message);

    return res.status(500).json({
      error: "Authentication could not be completed",
    });
  }
}

// Require a validated access token with AAL2.
function requireMFA(req, res, next) {
  try {
    const token = req.accessToken;

    if (!token || !req.authUser) {
      return res.status(401).json({
        error: "Authentication token required",
      });
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    // authenticateUser has already validated this same token with
    // Supabase Auth. Read its claims only after that validation.
    const claims = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    if (claims.sub !== req.authUser.id) {
      return res.status(401).json({
        error: "Authentication token user mismatch",
      });
    }

    if (claims.aal !== "aal2") {
      return res.status(403).json({
        error: "MFA verification required",
        code: "MFA_REQUIRED",
        currentLevel: claims.aal || null,
        nextLevel: "aal2",
      });
    }

    return next();
  } catch (error) {
    console.error("MFA token check failed:", error.message);

    return res.status(403).json({
      error: "MFA verification could not be completed",
    });
  }
}

// Verify that the authenticated user is a worker assigned
// to the requested complaint.
async function getAssignedWorkerComplaint(
  supabase,
  authUser,
  complaintId
) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(complaintId)) {
    return {
      status: 400,
      error: "A valid complaint database UUID is required",
    };
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

  if (profileError) {
    console.error("Profile lookup failed:", profileError.message);

    return {
      status: 403,
      error: "Unable to verify user permissions",
    };
  }

  if (!profile || profile.role !== "worker") {
    return {
      status: 403,
      error: "Only workers can modify assigned work",
    };
  }

  const { data: worker, error: workerError } =
    await supabase
      .from("workers")
      .select("id")
      .eq("profile_id", authUser.id)
      .maybeSingle();

  if (workerError) {
    console.error("Worker lookup failed:", workerError.message);

    return {
      status: 403,
      error: "Unable to verify worker assignment",
    };
  }

  if (!worker) {
    return {
      status: 403,
      error: "No worker record is linked to this account",
    };
  }

  const { data: complaint, error: complaintError } =
    await supabase
      .from("complaints")
      .select("id, assigned_worker_id, work_status")
      .eq("id", complaintId)
      .maybeSingle();

  if (complaintError) {
    console.error(
      "Complaint lookup failed:",
      complaintError.message
    );

    return {
      status: 403,
      error: "Unable to verify complaint access",
    };
  }

  if (!complaint) {
    return {
      status: 404,
      error: "Complaint not found or not accessible",
    };
  }

  if (complaint.assigned_worker_id !== worker.id) {
    return {
      status: 403,
      error: "This complaint is not assigned to you",
    };
  }

  return {
    worker,
    complaint,
  };
}

// Start work only if the authenticated worker is assigned.
// Supabase database policies must also permit the update.
app.post(
  "/api/complaints/:id/start",
  authenticateUser,
  requireMFA,
  async (req, res) => {
    try {
      const { supabase, authUser } = req;

      const result = await getAssignedWorkerComplaint(
        supabase,
        authUser,
        req.params.id
      );

      if (result.error) {
        return res.status(result.status).json({
          error: result.error,
        });
      }

      const { worker, complaint } = result;

      if (
        complaint.work_status === "Completed" ||
        complaint.work_status === "Proof Submitted"
      ) {
        return res.status(409).json({
          error: "Work that has been completed or submitted cannot be restarted",
        });
      }

      const { data: updatedComplaint, error: updateError } =
        await supabase
          .from("complaints")
          .update({
            work_status: "In Progress",
            status: "In Progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", complaint.id)
          .eq("assigned_worker_id", worker.id)
          .select("id, complaint_id, work_status, status")
          .maybeSingle();

      if (updateError) {
        console.error(
          "Complaint update failed:",
          updateError.message
        );

        return res.status(403).json({
          error: "Database policy rejected the update",
        });
      }

      if (!updatedComplaint) {
        return res.status(403).json({
          error: "Update not permitted by database policies",
        });
      }

      return res.status(200).json({
        message: "Work started successfully",
        complaint: updatedComplaint,
      });
    } catch (error) {
      console.error("Start-work request failed:", error.message);

      return res.status(500).json({
        error: "Unable to start work",
      });
    }
  }
);

// Submit completion proof only for assigned, in-progress work.
// The image must already be uploaded to the expected storage bucket.
app.post(
  "/api/complaints/:id/submit-proof",
  authenticateUser,
  requireMFA,
  async (req, res) => {
    try {
      const { supabase, authUser } = req;
      const { completionPhotoUrl } = req.body;

      const result = await getAssignedWorkerComplaint(
        supabase,
        authUser,
        req.params.id
      );

      if (result.error) {
        return res.status(result.status).json({
          error: result.error,
        });
      }

      const { worker, complaint } = result;

      if (complaint.work_status !== "In Progress") {
        return res.status(409).json({
          error: "Only in-progress work can submit completion proof",
        });
      }

      const supabaseUrl = getSupabaseUrl();

      if (!supabaseUrl) {
        return res.status(503).json({
          error: "Supabase is not configured",
        });
      }

      if (typeof completionPhotoUrl !== "string") {
        return res.status(400).json({
          error: "A valid completion photo URL is required",
        });
      }

      let photoUrl;
      let baseUrl;

      try {
        photoUrl = new URL(completionPhotoUrl);
        baseUrl = new URL(supabaseUrl);
      } catch {
        return res.status(400).json({
          error: "A valid completion photo URL is required",
        });
      }

      const expectedPathPrefix =
        "/storage/v1/object/public/complaint-photos/";

      if (
        photoUrl.origin !== baseUrl.origin ||
        !photoUrl.pathname.startsWith(expectedPathPrefix) ||
        photoUrl.search ||
        photoUrl.hash
      ) {
        return res.status(400).json({
          error: "The photo must belong to the complaint-photos bucket",
        });
      }

      // A worker may submit only their own uploaded proof.
      const uploadedPath = photoUrl.pathname.slice(
        expectedPathPrefix.length
      );

      if (
        !uploadedPath.startsWith(
          `completion-proofs/${authUser.id}/`
        )
      ) {
        return res.status(403).json({
          error: "You can submit only your own uploaded proof",
        });
      }

      const { data: updatedComplaint, error: updateError } =
        await supabase
          .from("complaints")
          .update({
            completion_photo_url: photoUrl.toString(),
            proof_rejection_reason: null,
            work_status: "Proof Submitted",
            status: "Proof Submitted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", complaint.id)
          .eq("assigned_worker_id", worker.id)
          .select(
            "id, complaint_id, completion_photo_url, proof_rejection_reason, work_status, status"
          )
          .maybeSingle();

      if (updateError) {
        console.error(
          "Proof submission update failed:",
          updateError.message
        );

        return res.status(403).json({
          error: "Database policy rejected the proof submission",
        });
      }

      if (!updatedComplaint) {
        return res.status(403).json({
          error: "Proof submission not permitted by database policies",
        });
      }

      return res.status(200).json({
        message: "Completion proof submitted successfully",
        complaint: updatedComplaint,
      });
    } catch (error) {
      console.error("Proof submission failed:", error.message);

      return res.status(500).json({
        error: "Unable to submit completion proof",
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CivicFix API running on port ${PORT}`);
});
