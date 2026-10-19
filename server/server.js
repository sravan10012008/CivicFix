
const express = require("express");
const helmet = require("helmet");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

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
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return res.status(503).json({
        error: "Supabase is not configured",
      });
    }

    // The user's token is used for both identity verification
    // and subsequent database queries. No service-role key.
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
    next();
  } catch (error) {
    console.error("Authentication failed:", error.message);
    return res.status(500).json({
      error: "Authentication could not be completed",
    });
  }
}

// Start work only if the authenticated worker is assigned
// to this complaint. Database RLS must also permit the update.
app.post(
  "/api/complaints/:id/start",
  authenticateUser,
  async (req, res) => {
    try {
      const { supabase, authUser } = req;
      const complaintId = req.params.id;

      // This endpoint expects the database UUID, not CF-1007.
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(complaintId)) {
        return res.status(400).json({
          error: "A valid complaint database UUID is required",
        });
      }

      // Never trust a role supplied by the browser.
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle();

      if (profileError) {
        console.error("Profile lookup failed:", profileError.message);
        return res.status(403).json({
          error: "Unable to verify user permissions",
        });
      }

      if (!profile || profile.role !== "worker") {
        return res.status(403).json({
          error: "Only workers can start assigned work",
        });
      }

      // Find the worker record belonging to this authenticated profile.
      const { data: worker, error: workerError } =
        await supabase
          .from("workers")
          .select("id")
          .eq("profile_id", authUser.id)
          .maybeSingle();

      if (workerError) {
        console.error("Worker lookup failed:", workerError.message);
        return res.status(403).json({
          error: "Unable to verify worker assignment",
        });
      }

      if (!worker) {
        return res.status(403).json({
          error: "No worker record is linked to this account",
        });
      }

      // Confirm this complaint belongs to the authenticated worker.
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
        return res.status(403).json({
          error: "Unable to verify complaint access",
        });
      }

      if (!complaint) {
        return res.status(404).json({
          error: "Complaint not found or not accessible",
        });
      }

      if (complaint.assigned_worker_id !== worker.id) {
        return res.status(403).json({
          error: "This complaint is not assigned to you",
        });
      }

      if (complaint.work_status === "Completed") {
        return res.status(409).json({
          error: "Completed work cannot be started again",
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
          .eq("id", complaintId)
          .eq("assigned_worker_id", worker.id)
          .select("id, complaint_id, work_status, status")
          .maybeSingle();

      if (updateError) {
        console.error("Complaint update failed:", updateError.message);
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CivicFix API running on port ${PORT}`);
});
