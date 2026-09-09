import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  MapPin,
  Wrench,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Upload,
  LogOut,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

function StatusBadge({ status }) {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        Completed
      </span>
    );
  }

  if (status === "In Progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        <Wrench className="h-3 w-3" />
        In Progress
      </span>
    );
  }

  if (status === "Proof Submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
        <CheckCircle className="h-3 w-3" />
        Proof Submitted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
      <Clock className="h-3 w-3" />
      Assigned
    </span>
  );
}

function PriorityBadge({ priority }) {
  const className =
    priority === "High"
      ? "bg-red-100 text-red-700"
      : priority === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {priority}
    </span>
  );
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [proofComplaint, setProofComplaint] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);

    try {
      if (!user?.id) {
        setComplaints([]);
        return;
      }

      const {
        data: worker,
        error: workerError,
      } = await supabase
        .from("workers")
        .select(
          "id, profile_id, department_id, employee_id, status"
        )
        .eq("profile_id", user.id)
        .maybeSingle();

      if (workerError) {
        throw workerError;
      }

      if (!worker) {
        setComplaints([]);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("complaints")
        .select("*")
        .eq("assigned_worker_id", worker.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const formattedComplaints =
        (data || []).map((complaint) => ({
          id:
            complaint.complaint_id ||
            complaint.id,

          dbId: complaint.id,

          title:
            complaint.title ||
            complaint.category_label ||
            complaint.category ||
            "Civic Complaint",

          category:
            complaint.category_label ||
            complaint.category ||
            "Other",

          location:
            complaint.location ||
            "Location not available",

          status:
            complaint.work_status ||
            "Assigned",

          priority:
            complaint.priority ||
            "Medium",

          description:
            complaint.description ||
            "No description available.",

          assignedDate:
            complaint.created_at
              ? new Date(
                  complaint.created_at
                ).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )
              : "—",

          completionPhotoUrl:
            complaint.completion_photo_url ||
            null,

          proofRejectionReason:
            complaint.proof_rejection_reason ||
            "",
        }));

      setComplaints(formattedComplaints);
    } catch (error) {
      console.error(
        "Failed to load worker complaints:",
        error
      );

      alert(
        error.message ||
          "Failed to load worker complaints."
      );

      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [user?.id]);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      alert(
        error.message ||
          "Failed to logout."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const startWork = async (id) => {
    try {
      const complaint =
        complaints.find(
          (item) => item.dbId === id
        );

      if (!complaint) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("complaints")
        .update({
          work_status: "In Progress",
          status: "In Progress",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", complaint.dbId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setComplaints((current) =>
        current.map((item) =>
          item.dbId === data.id
            ? {
                ...item,
                status:
                  data.work_status ||
                  "In Progress",
              }
            : item
        )
      );

      alert(
        "Work started successfully."
      );
    } catch (error) {
      console.error(
        "Failed to start work:",
        error
      );

      alert(
        error.message ||
          "Failed to start work."
      );
    }
  };

  const openProofModal = (
    complaint
  ) => {
    setProofComplaint(complaint);
    setProofFile(null);
    setIsDragging(false);
  };

  const closeProofModal = () => {
    if (submittingProof) {
      return;
    }

    setProofComplaint(null);
    setProofFile(null);
    setIsDragging(false);
  };

  // Validate and select completion proof image
  const validateAndSetProofFile = (
    selectedFile
  ) => {
    if (!selectedFile) {
      return;
    }

    if (
      !selectedFile.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please select a valid image file."
      );

      return;
    }

    setProofFile(selectedFile);
  };

  // Handle normal file selection
  const handleProofFileChange = (
    event
  ) => {
    validateAndSetProofFile(
      event.target.files?.[0] || null
    );
  };

  // Handle dragging an image over the upload box
  const handleProofDragOver = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  // Handle leaving the upload box
  const handleProofDragLeave = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  // Handle dropping an image into the upload box
  const handleProofDrop = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0] ||
      null;

    validateAndSetProofFile(
      droppedFile
    );
  };

  const submitCompletionProof =
    async () => {
      if (
        !proofComplaint ||
        !proofFile ||
        !user?.id
      ) {
        return;
      }

      if (
        !proofFile.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Please select a valid image file."
        );

        return;
      }

      setSubmittingProof(true);

      let uploadedFilePath = null;

      try {
        const fileExtension =
          proofFile.name
            .split(".")
            .pop() || "jpg";

        const fileName =
          `${proofComplaint.id}-${Date.now()}.${fileExtension}`;

        const filePath =
          `completion-proofs/${user.id}/${fileName}`;

        uploadedFilePath = filePath;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from("complaint-photos")
            .upload(
              filePath,
              proofFile,
              {
                cacheControl: "3600",
                upsert: false,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: publicUrlData,
        } =
          supabase.storage
            .from("complaint-photos")
            .getPublicUrl(
              filePath
            );

        const completionPhotoUrl =
          publicUrlData?.publicUrl;

        if (!completionPhotoUrl) {
          throw new Error(
            "Unable to create completion proof URL."
          );
        }

        const {
          data,
          error,
        } =
          await supabase
            .from("complaints")
            .update({
              completion_photo_url:
                completionPhotoUrl,

              proof_rejection_reason:
                null,

              work_status:
                "Proof Submitted",

              status:
                "Proof Submitted",

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              proofComplaint.dbId
            )
            .select()
            .single();

        if (error) {
          throw error;
        }

        setComplaints((current) =>
          current.map((item) =>
            item.dbId === data.id
              ? {
                  ...item,

                  status:
                    data.work_status ||
                    "Proof Submitted",

                  completionPhotoUrl:
                    data.completion_photo_url ||
                    completionPhotoUrl,

                  proofRejectionReason:
                    data.proof_rejection_reason ||
                    "",
                }
              : item
          )
        );

        setProofComplaint(null);
        setProofFile(null);
        setIsDragging(false);

        alert(
          "Completion proof submitted successfully. Waiting for manager approval."
        );
      } catch (error) {
        console.error(
          "Failed to submit completion proof:",
          error
        );

        if (uploadedFilePath) {
          try {
            await supabase.storage
              .from("complaint-photos")
              .remove([
                uploadedFilePath,
              ]);
          } catch (removeError) {
            console.error(
              "Unable to remove uploaded proof:",
              removeError
            );
          }
        }

        alert(
          error.message ||
            "Failed to submit completion proof."
        );
      } finally {
        setSubmittingProof(false);
      }
    };

  const refreshComplaints = () => {
    setSearch("");
    loadComplaints();
  };

  const filteredComplaints =
    complaints.filter(
      (complaint) => {
        const value =
          search.toLowerCase();

        return (
          complaint.id
            .toLowerCase()
            .includes(value) ||
          complaint.title
            .toLowerCase()
            .includes(value) ||
          complaint.category
            .toLowerCase()
            .includes(value) ||
          complaint.location
            .toLowerCase()
            .includes(value)
        );
      }
    );

  const assignedCount =
    complaints.filter(
      (complaint) =>
        complaint.status ===
        "Assigned"
    ).length;

  const inProgressCount =
    complaints.filter(
      (complaint) =>
        complaint.status ===
        "In Progress"
    ).length;

  const completedCount =
    complaints.filter(
      (complaint) =>
        complaint.status ===
        "Completed"
    ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Worker Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your assigned civic complaints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={
                refreshComplaints
              }
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Assigned
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {complaints.length}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Assigned
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-600">
                  {assignedCount}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  In Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {inProgressCount}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {completedCount}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              My Complaints
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complaints assigned to you by the authority.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search complaint..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="space-y-5">
          {loading ? (
            <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
              <RefreshCw className="mx-auto h-10 w-10 animate-spin text-blue-500" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Loading complaints...
              </h3>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No complaints found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try searching with a different complaint ID or keyword.
              </p>
            </div>
          ) : (
            filteredComplaints.map(
              (complaint) => (
                <div
                  key={complaint.dbId}
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {complaint.id}
                        </span>

                        <StatusBadge
                          status={
                            complaint.status
                          }
                        />

                        <PriorityBadge
                          priority={
                            complaint.priority
                          }
                        />
                      </div>

                      <h3 className="text-xl font-semibold text-slate-900">
                        {complaint.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {
                          complaint.description
                        }
                      </p>

                      <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          {
                            complaint.category
                          }
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {
                            complaint.location
                          }
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {
                            complaint.assignedDate
                          }
                        </div>
                      </div>

                      {complaint.status ===
                        "In Progress" &&
                        complaint.proofRejectionReason && (
                          <div className="mt-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">

                            <div className="flex items-start gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <XCircle className="h-5 w-5" />
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                  Completion Proof Rejected
                                </p>

                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                  Manager's Message
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-700">
                                  {
                                    complaint.proofRejectionReason
                                  }
                                </p>

                                <p className="mt-3 text-xs text-slate-500">
                                  Please complete the required work and submit a new completion proof.
                                </p>
                              </div>

                            </div>

                          </div>
                        )}

                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-52">

                      {complaint.status ===
                        "Assigned" && (
                        <button
                          onClick={() =>
                            startWork(
                              complaint.dbId
                            )
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Start Work
                        </button>
                      )}

                      {complaint.status ===
                        "In Progress" && (
                        <button
                          onClick={() =>
                            openProofModal(
                              complaint
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          <Upload className="h-4 w-4" />
                          Submit Proof
                        </button>
                      )}

                      {complaint.status ===
                        "Proof Submitted" && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700">
                          <CheckCircle className="h-4 w-4" />
                          Awaiting Review
                        </div>
                      )}

                      {complaint.status ===
                        "Completed" && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Resolved
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </main>

      {proofComplaint && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeProofModal}
          />

          <div className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Submit Completion Proof
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload a photo showing that the civic issue has been fixed.
                </p>
              </div>

              <button
                onClick={closeProofModal}
                disabled={submittingProof}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Complaint
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {proofComplaint.id}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {proofComplaint.title}
              </p>
            </div>

            {proofComplaint.proofRejectionReason && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                <div className="flex items-start gap-3">

                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                      Manager's Previous Feedback
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {
                        proofComplaint.proofRejectionReason
                      }
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Make sure the new proof addresses this feedback.
                    </p>
                  </div>

                </div>

              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Completion Photo
              </label>

              {/* Drag-and-drop completion proof area */}
              <label
                onDragOver={
                  handleProofDragOver
                }
                onDragLeave={
                  handleProofDragLeave
                }
                onDrop={
                  handleProofDrop
                }
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                  isDragging
                    ? "border-green-500 bg-green-50"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <Upload
                  className={`h-8 w-8 ${
                    isDragging
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                />

                <span className="mt-3 text-sm font-medium text-slate-700">
                  {proofFile
                    ? proofFile.name
                    : isDragging
                    ? "Drop your photo here"
                    : "Choose a photo or drag and drop"}
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  Upload a clear photo of the completed work
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    handleProofFileChange
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">

              <button
                onClick={closeProofModal}
                disabled={submittingProof}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  submitCompletionProof
                }
                disabled={
                  submittingProof ||
                  !proofFile
                }
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />

                {submittingProof
                  ? "Uploading..."
                  : "Submit Proof"}
              </button>

            </div>

          </div>
        </>
      )}
    </div>
  );
}