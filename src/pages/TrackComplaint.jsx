import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ArrowRight,
  UserRound,
  Clock,
  XCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import ComplaintTimeline from "@/components/ComplaintTimeline";

import { getComplaintId } from "@/lib/complaints";
import { supabase } from "@/lib/supabase";

const issueCategories = [
  { id: "garbage", label: "Garbage" },
  { id: "pothole", label: "Pothole / Road Damage" },
  { id: "streetlight", label: "Broken Streetlight" },
  { id: "water", label: "Water Leakage" },
  { id: "drainage", label: "Drainage Problem" },
  { id: "tree", label: "Fallen Tree" },
  { id: "electrical", label: "Electrical Problem" },
  { id: "infrastructure", label: "Public Infrastructure" },
  { id: "park", label: "Park / Public Area" },
  { id: "other", label: "Other" },
];

function getProgress(workStatus) {
  switch (workStatus) {
    case "Assigned":
      return 25;

    case "In Progress":
      return 60;

    case "Proof Submitted":
      return 85;

    case "Completed":
    case "Resolved":
      return 100;

    case "Pending":
    default:
      return 0;
  }
}

function buildTimeline(history) {
  return history.map((item) => ({
    status: item.status || "Pending",
    timestamp: item.created_at,
    note: item.message || "",
  }));
}

export default function TrackComplaint() {
  const [searchParams] = useSearchParams();

  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  /*
   * SEARCH COMPLAINT
   *
   * The function can receive an ID directly.
   *
   * This allows:
   *
   * 1. Manual search from the input box.
   * 2. Automatic search when coming from
   *    a Track button on a complaint card.
   */

  const search = async (
    e,
    complaintIdFromUrl = ""
  ) => {
    if (e) {
      e.preventDefault();
    }

    const searchValue =
      complaintIdFromUrl || id;

    const trimmed =
      searchValue.trim();

    if (!trimmed) {
      return;
    }

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const searchId =
        trimmed.toUpperCase();

      /*
       * GET CURRENT SUPABASE USER
       */

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      /*
       * Public users should NOT receive
       * private citizen information.
       *
       * Logged-in users need citizen_id so
       * that a citizen can be checked against
       * the complaint owner.
       */

      const complaintSelect =
        currentUser
          ? "*"
          : `
            id,
            complaint_id,
            category,
            category_label,
            title,
            description,
            location,
            photo_url,
            verification_status,
            work_status,
            status,
            department_id,
            assigned_worker_id,
            rejection_reason,
            created_at,
            updated_at
          `;

      const {
        data: complaint,
        error: complaintError,
      } = await supabase
        .from("complaints")
        .select(complaintSelect)
        .eq("complaint_id", searchId)
        .maybeSingle();

      if (complaintError) {
        console.error(
          "Complaint search error:",
          complaintError
        );

        setResult(null);
        return;
      }

      if (!complaint) {
        setResult(null);
        return;
      }

      /*
       * LOGGED-IN CITIZENS CAN ONLY VIEW
       * THEIR OWN COMPLAINTS.
       */

      if (currentUser) {
        const {
          data: profile,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();

        const role =
          profile?.role;

        if (
          role === "citizen" &&
          complaint.citizen_id !==
            currentUser.id
        ) {
          setResult(null);
          return;
        }
      }

      /*
       * LOAD COMPLAINT STATUS HISTORY
       */

      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from("complaint_status_history")
        .select(
          "id, complaint_id, status, message, changed_by, created_at"
        )
        .eq(
          "complaint_id",
          complaint.id
        )
        .order("created_at", {
          ascending: true,
        });

      if (historyError) {
        console.error(
          "History loading error:",
          historyError
        );
      }

      /*
       * WORKER INFORMATION
       *
       * Worker information is only loaded
       * for authenticated users.
       */

      let worker = null;

      if (
        currentUser &&
        complaint.assigned_worker_id
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
            complaint.assigned_worker_id
          )
          .maybeSingle();

        if (workerError) {
          console.error(
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

          worker = {
            ...workerData,

            name:
              workerProfile?.full_name ||
              "Worker Assigned",

            phone:
              workerProfile?.phone ||
              "",
          };
        }
      }

      /*
       * NORMALIZE COMPLAINT DATA
       */

      const normalizedHistory =
        historyData || [];

      const finalComplaint = {
        ...complaint,

        complaintId:
          complaint.complaint_id,

        verificationStatus:
          complaint.verification_status ||
          "Pending Review",

        workStatus:
          complaint.work_status ||
          complaint.status ||
          "Pending",

        status:
          complaint.status ||
          complaint.work_status ||
          "Pending",

        rejectionReason:
          complaint.rejection_reason ||
          "",

        assignedWorkerId:
          complaint.assigned_worker_id ||
          "",

        worker,

        workerName:
          worker?.name || "",

        assignedWorkerName:
          worker?.name || "",

        history:
          normalizedHistory,

        statusHistory:
          normalizedHistory,
      };

      setResult(
        finalComplaint
      );
    } catch (error) {
      console.error(
        "Unable to search complaints:",
        error
      );

      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  /*
   * AUTOMATIC TRACKING
   *
   * If the URL contains:
   *
   * /track?complaint=CF-1021
   *
   * automatically load CF-1021.
   *
   * Normal /track without a complaint
   * parameter continues to work normally.
   */

  useEffect(() => {
    const complaintFromUrl =
      searchParams.get(
        "complaint"
      );

    if (
      complaintFromUrl?.trim()
    ) {
      const normalizedId =
        complaintFromUrl
          .trim()
          .toUpperCase();

      setId(normalizedId);

      search(
        null,
        normalizedId
      );
    }
  }, [searchParams]);

  const catLabel = result
    ? issueCategories.find(
        (cat) =>
          cat.id ===
          result.category
      )?.label ||
      result.category_label ||
      result.category ||
      "Civic Issue"
    : "";

  const history =
    result?.history ||
    result?.statusHistory ||
    [];

  const timeline =
    buildTimeline(history);

  const workStatus =
    result?.workStatus ||
    result?.work_status ||
    result?.status ||
    "Pending";

  const verificationStatus =
    result?.verificationStatus ||
    result?.verification_status ||
    "Pending Review";

  const rejectionReason =
    result?.rejectionReason ||
    result?.rejection_reason ||
    "";

  const isRejected =
    verificationStatus ===
    "Rejected";

  const progressPercent =
    result
      ? getProgress(workStatus)
      : 0;

  const workerAssigned =
    !isRejected &&
    (
      Boolean(
        result?.assigned_worker_id
      ) ||
      Boolean(
        result?.assignedWorkerId
      ) ||
      Boolean(result?.worker)
    );

  const workerName =
    result?.workerName ||
    result?.assignedWorkerName ||
    result?.worker?.name ||
    "";

  return (
    <div className="min-h-screen bg-background">

      <Navbar />

      <main className="content-above-glow mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 sm:pt-40">

        <div className="text-center">

          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Tracking
          </span>

          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Track Your Complaint
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Enter your complaint ID (e.g. CF-AE3A4D) to see its current status and timeline.
          </p>

        </div>

        {/* SEARCH FORM */}

        <form
          onSubmit={search}
          className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
        >

          <div className="relative flex-1">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={id}
              onChange={(e) =>
                setId(
                  e.target.value
                )
              }
              required
              placeholder="Enter complaint ID (e.g. CF-AE3A4D)"
              className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
          >
            {loading
              ? "Searching…"
              : "Track"}
          </button>

        </form>

        {/* COMPLAINT RESULT */}

        {searched &&
          result && (
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
              }}
              className="mx-auto mt-10 max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
            >

              {/* HEADER */}

              <div className="flex flex-wrap items-start justify-between gap-3">

                <div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {getComplaintId(
                      result
                    )}
                  </span>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    {catLabel}
                  </h2>

                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />

                    {result.location ||
                      "Location not available"}
                  </p>

                </div>

                <div className="flex flex-col items-end gap-2">

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

              {/* DESCRIPTION */}

              {result.description && (
                <div className="mt-6 rounded-xl bg-muted/40 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>

                  <p className="mt-2 text-sm text-foreground">
                    {result.description}
                  </p>

                </div>
              )}

              {/* REJECTION REASON */}

              {isRejected &&
                rejectionReason && (
                  <div className="mt-5 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-5">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <XCircle className="h-5 w-5" />
                      </div>

                      <div className="flex-1">

                        <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                          Complaint Rejected
                        </p>

                        <p className="mt-2 text-sm font-semibold text-foreground">
                          Reason for Rejection
                        </p>

                        <p className="mt-1 text-sm leading-6 text-foreground">
                          {rejectionReason}
                        </p>

                        <p className="mt-3 text-xs text-muted-foreground">
                          Please review the reason above before submitting a new complaint.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              {/* WORKER INFORMATION */}

              {!isRejected && (
                <div
                  className={`mt-6 rounded-2xl border p-5 ${
                    workerAssigned
                      ? "border-primary/20 bg-primary/5"
                      : "border-warning/20 bg-warning/5"
                  }`}
                >

                  {workerAssigned ? (
                    <>
                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Assigned Worker
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {workerName ||
                              "Worker Assigned"}
                          </p>

                        </div>

                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">
                        Your complaint has been assigned to a worker and work is being tracked below.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                          <Clock className="h-5 w-5" />
                        </div>

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                            Worker Assignment
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            Worker is still not yet assigned
                          </p>

                        </div>

                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">
                        Your complaint has been received. A worker will be assigned to this complaint before the work begins.
                      </p>
                    </>
                  )}

                </div>
              )}

              {/* REJECTED CURRENT STATUS */}

              {isRejected && (
                <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <XCircle className="h-5 w-5" />
                    </div>

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                        Current Status
                      </p>

                      <p className="mt-1 text-sm font-semibold text-foreground">
                        This complaint has been rejected by the authority.
                      </p>

                    </div>

                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    The complaint was not assigned to a worker. Please check the rejection reason above.
                  </p>

                </div>
              )}

              {/* PROGRESS */}

              {!isRejected &&
                workerAssigned && (
                  <div className="mt-8">

                    <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">

                      <span>
                        Reported
                      </span>

                      <span>
                        Resolved
                      </span>

                    </div>

                    <div className="relative h-2 w-full rounded-full bg-muted">

                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-success transition-all duration-700"
                        style={{
                          width: `${progressPercent}%`,
                        }}
                      />

                      <span
                        className="absolute -top-1 h-4 w-4 rounded-full border-2 border-card bg-primary transition-all duration-700"
                        style={{
                          left: `${progressPercent}%`,
                          transform:
                            "translateX(-50%)",
                        }}
                      />

                    </div>

                    <p className="mt-2 text-right text-xs font-medium text-muted-foreground">
                      {progressPercent}% complete
                    </p>

                  </div>
                )}

              {/* TIMELINE */}

              {(workerAssigned ||
                isRejected) && (
                <div className="mt-8">

                  <h3 className="text-sm font-semibold text-foreground">
                    Complaint Timeline
                  </h3>

                  <div className="mt-4">

                    {timeline.length >
                    0 ? (
                      <ComplaintTimeline
                        events={
                          timeline
                        }
                      />
                    ) : (
                      <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">

                        <p className="text-sm text-muted-foreground">
                          Complaint timeline information is not available yet.
                        </p>

                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* WAITING FOR ASSIGNMENT */}

              {!workerAssigned &&
                !isRejected && (
                  <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6 text-center">

                    <Clock className="mx-auto h-7 w-7 text-muted-foreground" />

                    <h3 className="mt-3 text-sm font-semibold text-foreground">
                      Waiting for Worker Assignment
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                      You can continue checking this complaint. Once a worker is assigned, their progress will appear here.
                    </p>

                  </div>
                )}

              {/* FULL DETAILS */}

              <div className="mt-8 border-t border-border pt-6">

                <Link
                  to={`/complaint/${result.complaintId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
                >
                  View Full Details

                  <ArrowRight className="h-4 w-4" />

                </Link>

              </div>

            </motion.div>
          )}

        {/* NO RESULT */}

        {searched &&
          !result &&
          !loading && (
            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mx-auto mt-10 max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-soft"
            >

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>

              <p className="mt-4 text-sm font-medium text-foreground">
                No complaint found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">

                No complaint was found with ID{" "}

                <span className="font-semibold text-foreground">
                  {id}
                </span>

                .

              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Please check the complaint ID from your My Complaints page and try again.
              </p>

            </motion.div>
          )}

      </main>

      <Footer />

    </div>
  );
}