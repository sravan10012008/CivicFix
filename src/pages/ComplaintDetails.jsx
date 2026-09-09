import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  UserRound,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

/*
 * Civic issue categories.
 *
 * Kept locally for this page.
 */
const issueCategories = [
  {
    id: "garbage",
    label: "Garbage",
  },
  {
    id: "pothole",
    label: "Pothole / Road Damage",
  },
  {
    id: "streetlight",
    label: "Broken Streetlight",
  },
  {
    id: "water",
    label: "Water Leakage",
  },
  {
    id: "drainage",
    label: "Drainage Problem",
  },
  {
    id: "tree",
    label: "Fallen Tree",
  },
  {
    id: "electrical",
    label: "Electrical Problem",
  },
  {
    id: "infrastructure",
    label: "Public Infrastructure",
  },
  {
    id: "park",
    label: "Park / Public Area",
  },
  {
    id: "other",
    label: "Other",
  },
];

const nav = [
  {
    label: "Dashboard",
    to: "/citizen",
  },
  {
    label: "Report Issue",
    to: "/report",
  },
  {
    label: "My Complaints",
    to: "/my-complaints",
  },
  {
    label: "Track Complaint",
    to: "/track",
  },
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function getCategoryLabel(complaint) {
  return (
    issueCategories.find(
      (item) =>
        item.id === complaint?.category
    )?.label ||
    complaint?.category_label ||
    complaint?.category ||
    complaint?.title ||
    "Civic Issue"
  );
}

function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export default function ComplaintDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [complaint, setComplaint] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [worker, setWorker] =
    useState(null);

  const [department, setDepartment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    setLoading(true);
    setError("");
    setComplaint(null);
    setHistory([]);
    setWorker(null);
    setDepartment(null);

    try {
      if (!id) {
        setError(
          "Complaint ID is missing."
        );
        return;
      }

      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const currentUser =
        authData?.user || null;

      let complaintData = null;
      let complaintError = null;

      /*
       * Support both:
       *
       * 1. Supabase UUID
       * 2. Human-readable complaint ID
       *    such as CF-1007
       */

      if (isValidUUID(id)) {
        const uuidResult =
          await supabase
            .from("complaints")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        complaintData =
          uuidResult.data;

        complaintError =
          uuidResult.error;
      } else {
        const complaintIdResult =
          await supabase
            .from("complaints")
            .select("*")
            .eq(
              "complaint_id",
              id.toUpperCase()
            )
            .maybeSingle();

        complaintData =
          complaintIdResult.data;

        complaintError =
          complaintIdResult.error;
      }

      if (complaintError) {
        console.error(
          "Complaint loading error:",
          complaintError
        );

        setError(
          complaintError.message ||
            "Unable to load complaint."
        );

        return;
      }

      if (!complaintData) {
        setError(
          "Complaint not found."
        );
        return;
      }

      /*
       * Logged-in citizens can only view
       * their own complaints.
       *
       * Public users can view complaint
       * information without seeing citizen
       * personal information.
       */

      if (currentUser) {
        const {
          data: profile,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq(
            "id",
            currentUser.id
          )
          .maybeSingle();

        if (
          profile?.role ===
            "citizen" &&
          complaintData.citizen_id !==
            currentUser.id
        ) {
          setError(
            "You do not have permission to view this complaint."
          );

          return;
        }
      }

      setComplaint(
        complaintData
      );

      /*
       * Load complaint status history.
       */

      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from(
          "complaint_status_history"
        )
        .select("*")
        .eq(
          "complaint_id",
          complaintData.id
        )
        .order("created_at", {
          ascending: true,
        });

      if (historyError) {
        console.warn(
          "History loading error:",
          historyError
        );
      }

      setHistory(
        historyData || []
      );

      /*
       * Worker information is private.
       *
       * Public users do NOT receive
       * worker details.
       */

      if (
        currentUser &&
        complaintData.assigned_worker_id
      ) {
        const {
          data: workerData,
          error: workerError,
        } = await supabase
          .from("workers")
          .select(
            "id, profile_id, department_id, employee_id, status"
          )
          .eq(
            "id",
            complaintData.assigned_worker_id
          )
          .maybeSingle();

        if (workerError) {
          console.warn(
            "Worker loading error:",
            workerError
          );
        }

        if (workerData) {
          const {
            data: workerProfile,
          } = await supabase
            .from("profiles")
            .select(
              "id, full_name, phone"
            )
            .eq(
              "id",
              workerData.profile_id
            )
            .maybeSingle();

          setWorker({
            ...workerData,

            name:
              workerProfile?.full_name ||
              "Worker Assigned",

            phone:
              workerProfile?.phone ||
              "",
          });
        }
      }

      /*
       * Load department information.
       */

      if (
        complaintData.department_id
      ) {
        const {
          data: departmentData,
          error: departmentError,
        } = await supabase
          .from("departments")
          .select("*")
          .eq(
            "id",
            complaintData.department_id
          )
          .maybeSingle();

        if (departmentError) {
          console.warn(
            "Department loading error:",
            departmentError
          );
        }

        setDepartment(
          departmentData
        );
      }
    } catch (err) {
      console.error(
        "Complaint details error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load complaint."
      );
    } finally {
      setLoading(false);
    }
  };

  const userName =
    user?.name ||
    user?.full_name ||
    user?.email ||
    "User";

  const isLoggedIn =
    Boolean(user);

  /*
   * LOADING STATE
   */

  if (loading) {
    return (
      <DashboardLayout
        items={nav}
        role={
          isLoggedIn
            ? "Citizen"
            : "Public"
        }
        user={userName}
        title="Complaint Details"
        subtitle="Loading complaint information..."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ERROR / NOT FOUND
   */

  if (error || !complaint) {
    return (
      <DashboardLayout
        items={nav}
        role={
          isLoggedIn
            ? "Citizen"
            : "Public"
        }
        user={userName}
        title="Complaint Details"
        subtitle="View complaint information."
      >
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <Clock className="h-7 w-7 text-destructive" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-foreground">
            Complaint Not Found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "We couldn't find the complaint you're looking for."}
          </p>

          <Link
            to="/track"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tracking
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * COMPLAINT DATA
   */

  const categoryLabel =
    getCategoryLabel(
      complaint
    );

  const verificationStatus =
    complaint.verification_status ||
    "Pending Review";

  const workStatus =
    complaint.work_status ||
    complaint.status ||
    "Pending";

  const complaintPhoto =
    complaint.photo_url ||
    complaint.photoUrl ||
    "";

  const completionPhoto =
    complaint.completion_photo_url ||
    complaint.completion_proof_url ||
    complaint.proof_url ||
    complaint.completionPhotoUrl ||
    complaint.completionProofUrl ||
    complaint.proofUrl ||
    "";

  return (
    <DashboardLayout
      items={nav}
      role={
        isLoggedIn
          ? "Citizen"
          : "Public"
      }
      user={userName}
      title="Complaint Details"
      subtitle="View complete information and progress."
    >
      <div className="mx-auto max-w-4xl space-y-6">

        {/* BACK */}

        <Link
          to="/track"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tracking
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">

          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Complaint ID
              </p>

              <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">
                {complaint.complaint_id}
              </h1>

              <p className="mt-2 text-lg font-semibold text-foreground">
                {categoryLabel}
              </p>

              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />

                {complaint.location ||
                  "Location not available"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">

              <StatusBadge
                status={
                  verificationStatus
                }
              />

              <StatusBadge
                status={
                  workStatus
                }
              />

            </div>
          </div>

          {/* DATES */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-border bg-muted/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reported On
              </p>

              <p className="mt-2 text-sm font-medium text-foreground">
                {formatDate(
                  complaint.created_at
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Last Updated
              </p>

              <p className="mt-2 text-sm font-medium text-foreground">
                {formatDate(
                  complaint.updated_at
                )}
              </p>
            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </p>

            <p className="mt-2 text-sm leading-6 text-foreground">
              {complaint.description ||
                "No description provided."}
            </p>

          </div>

          {/* COMPLAINT PHOTO */}

          {complaintPhoto && (
            <div className="mt-6">

              <div className="mb-3 flex items-center gap-2">

                <ImageIcon className="h-4 w-4 text-muted-foreground" />

                <h2 className="text-sm font-semibold text-foreground">
                  Complaint Photo
                </h2>

              </div>

              <img
                src={complaintPhoto}
                alt="Complaint"
                className="max-h-[450px] w-full rounded-2xl border border-border object-cover"
              />

            </div>
          )}

          {/* DEPARTMENT */}

          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </p>

            <p className="mt-2 text-sm font-semibold text-foreground">
              {department?.name ||
                "Not assigned"}
            </p>

          </div>

          {/* WORKER */}

          {isLoggedIn && (
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Worker
                  </p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {worker?.name ||
                      (complaint.assigned_worker_id
                        ? "Worker Assigned"
                        : "Worker not assigned yet")}
                  </p>

                  {worker?.employee_id && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Employee ID:{" "}
                      {worker.employee_id}
                    </p>
                  )}
                </div>

              </div>

              {worker?.phone && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Contact:{" "}
                  {worker.phone}
                </p>
              )}

            </div>
          )}

          {/* COMPLETION PROOF */}

          {completionPhoto && (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">

              <div className="flex items-center gap-2">

                <CheckCircle2 className="h-5 w-5 text-primary" />

                <h2 className="text-sm font-semibold text-foreground">
                  Completion Proof
                </h2>

              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Photo submitted by the assigned worker as proof of completed work.
              </p>

              <img
                src={completionPhoto}
                alt="Completion proof"
                className="mt-4 max-h-[450px] w-full rounded-2xl border border-border object-cover"
              />

            </div>
          )}

          {/* TIMELINE */}

          <div className="mt-8 border-t border-border pt-8">

            <h2 className="text-lg font-semibold text-foreground">
              Complaint Timeline
            </h2>

            {history.length ===
            0 ? (
              <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-6 text-center">

                <Clock className="mx-auto h-6 w-6 text-muted-foreground" />

                <p className="mt-3 text-sm text-muted-foreground">
                  No status history is available yet.
                </p>

              </div>
            ) : (
              <div className="mt-5 space-y-4">

                {history.map(
                  (
                    item,
                    index
                  ) => {

                    const status =
                      item.status ||
                      item.work_status ||
                      item.new_status ||
                      "Pending";

                    const note =
                      item.note ||
                      item.description ||
                      item.message ||
                      "";

                    const date =
                      item.created_at ||
                      item.timestamp ||
                      item.changed_at;

                    return (
                      <div
                        key={
                          item.id ||
                          `${status}-${index}`
                        }
                        className="flex gap-4"
                      >

                        <div className="flex flex-col items-center">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>

                          {index <
                            history.length -
                              1 && (
                            <div className="mt-2 h-full min-h-8 w-px bg-border" />
                          )}

                        </div>

                        <div className="pb-5">

                          <div className="flex flex-wrap items-center gap-2">

                            <StatusBadge
                              status={
                                status
                              }
                            />

                            {date && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(
                                  date
                                )}
                              </span>
                            )}

                          </div>

                          {note && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {note}
                            </p>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}