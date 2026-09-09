import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  Upload,
  CheckCircle2,
  ArrowRight,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

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
    icon: LayoutDashboard,
  },
  {
    label: "Report Issue",
    to: "/report",
    icon: PlusCircle,
  },
  {
    label: "My Complaints",
    to: "/my-complaints",
    icon: FileText,
  },
  {
    label: "Track Complaint",
    to: "/track",
    icon: MapPin,
  },
];

export default function ReportIssue() {
  const { user } = useAuth();

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [file, setFile] =
    useState(null);

  const [fileName, setFileName] =
    useState("");

  /*
   * Tracks whether a file is currently
   * being dragged over the upload area.
   */
  const [isDragging, setIsDragging] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [complaintId, setComplaintId] =
    useState("");

  const [complaintEntityId, setComplaintEntityId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const userName =
    user?.name ||
    user?.full_name ||
    "Citizen";

  /*
   * HANDLE PHOTO SELECTION
   *
   * This is used by both:
   *
   * 1. Choose Photo
   * 2. Drag & Drop
   */
  const handleSelectedFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    if (
      !selectedFile.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image file."
      );

      setFile(null);
      setFileName("");

      return;
    }

    setFile(selectedFile);
    setFileName(
      selectedFile.name
    );
    setError("");
  };

  /*
   * HANDLE FILE INPUT
   *
   * Existing "Choose Photo"
   * functionality.
   */
  const handleFileChange = (e) => {
    const selectedFile =
      e.target.files?.[0];

    handleSelectedFile(
      selectedFile
    );
  };

  /*
   * HANDLE DRAG OVER
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
  };

  /*
   * HANDLE DRAG LEAVE
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  };

  /*
   * HANDLE DROP
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const droppedFile =
      e.dataTransfer.files?.[0];

    handleSelectedFile(
      droppedFile
    );
  };

  /*
   * SUBMIT COMPLAINT
   */
  const submit = async (e) => {
    e.preventDefault();

    setError("");

    /*
     * BASIC VALIDATION
     */
    if (!category) {
      setError(
        "Please select an issue category."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Please enter a description of the issue."
      );
      return;
    }

    if (!location.trim()) {
      setError(
        "Please enter the issue location."
      );
      return;
    }

    if (!file) {
      setError(
        "Photo evidence is required for complaint verification."
      );
      return;
    }

    setLoading(true);

    let uploadedFilePath = null;

    try {
      /*
       * GET CURRENT SUPABASE USER
       */
      const {
        data: {
          user: supabaseUser,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Unable to get Supabase user:",
          userError
        );

        setError(
          "Unable to verify your login. Please log in again."
        );

        return;
      }

      if (!supabaseUser) {
        setError(
          "You are not logged in. Please log in before submitting a complaint."
        );

        return;
      }

      /*
       * GET SELECTED CATEGORY LABEL
       */
      const selectedCategory =
        issueCategories.find(
          (item) =>
            item.id === category
        );

      const categoryLabel =
        selectedCategory?.label ||
        category;

      /*
       * =========================================================
       * POSSIBLE DUPLICATE COMPLAINT CHECK
       * =========================================================
       *
       * We check for an existing ACTIVE complaint
       * having:
       *
       * 1. Same category
       * 2. Same location
       *
       * Rejected complaints are ignored.
       * Completed complaints are ignored because
       * the issue may happen again later.
       *
       * This check happens BEFORE uploading the photo.
       */

      const normalizedLocation =
        location.trim();

      const {
        data: possibleDuplicate,
        error: duplicateCheckError,
      } =
        await supabase
          .from("complaints")
          .select(
            "id, complaint_id, category, category_label, location, verification_status, work_status, status"
          )
          .eq(
            "category",
            category
          )
          .ilike(
            "location",
            normalizedLocation
          )
          .neq(
            "verification_status",
            "Rejected"
          )
          .neq(
            "work_status",
            "Completed"
          )
          .limit(1)
          .maybeSingle();

      /*
       * If duplicate checking itself fails,
       * stop submission rather than silently
       * pretending that no duplicate exists.
       */
      if (duplicateCheckError) {
        console.error(
          "DUPLICATE CHECK ERROR:",
          duplicateCheckError
        );

        setError(
          "Unable to check for existing complaints. Please try again."
        );

        return;
      }

      /*
       * POSSIBLE DUPLICATE FOUND
       */
      if (possibleDuplicate) {
        const shouldContinue =
          window.confirm(
            `Possible Duplicate Complaint\n\n` +
            `A similar active complaint has already been reported at this location.\n\n` +
            `Complaint ID: ${possibleDuplicate.complaint_id}\n` +
            `Category: ${
              possibleDuplicate.category_label ||
              possibleDuplicate.category
            }\n` +
            `Location: ${possibleDuplicate.location}\n\n` +
            `If this is the same issue, you can cancel the submission. ` +
            `If it is a different or additional issue, click OK to submit anyway.`
          );

        /*
         * Citizen chose CANCEL.
         *
         * Nothing has been uploaded or created.
         */
        if (!shouldContinue) {
          setLoading(false);
          return;
        }
      }

      /*
       * CREATE SAFE FILE EXTENSION
       */
      const originalExtension =
        file.name.includes(".")
          ? file.name
              .split(".")
              .pop()
              .toLowerCase()
          : "jpg";

      const safeExtension =
        originalExtension.replace(
          /[^a-z0-9]/gi,
          ""
        ) || "jpg";

      /*
       * CREATE UNIQUE STORAGE FILE NAME
       */
      const uniqueName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}.${safeExtension}`;

      const filePath =
        `${supabaseUser.id}/${uniqueName}`;

      uploadedFilePath =
        filePath;

      /*
       * UPLOAD PHOTO
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from(
          "complaint-photos"
        )
        .upload(
          filePath,
          file,
          {
            contentType:
              file.type,
            cacheControl:
              "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "PHOTO UPLOAD ERROR:",
          uploadError
        );

        setError(
          uploadError.message ||
            "Failed to upload photo. Please try again."
        );

        return;
      }

      /*
       * GET PUBLIC PHOTO URL
       */
      const {
        data: publicUrlData,
      } = supabase.storage
        .from(
          "complaint-photos"
        )
        .getPublicUrl(
          filePath
        );

      const photoUrl =
        publicUrlData?.publicUrl;

      if (!photoUrl) {
        console.error(
          "Could not generate public photo URL."
        );

        await supabase.storage
          .from(
            "complaint-photos"
          )
          .remove([
            filePath,
          ]);

        uploadedFilePath =
          null;

        setError(
          "Unable to create photo URL. Please try again."
        );

        return;
      }

      /*
       * CREATE COMPLAINT
       *
       * complaint_id is NOT provided.
       *
       * PostgreSQL/Supabase generates
       * the Complaint ID automatically.
       */
      const {
        data: insertedComplaint,
        error: insertError,
      } =
        await supabase
          .from("complaints")
          .insert({
            citizen_id:
              supabaseUser.id,

            category:
              category,

            category_label:
              categoryLabel,

            title:
              categoryLabel,

            description:
              description.trim(),

            location:
              location.trim(),

            photo_url:
              photoUrl,

            verification_status:
              "Pending Review",

            work_status:
              "Pending",

            status:
              "Pending",

            department_id:
              null,

            assigned_worker_id:
              null,
          })
          .select()
          .single();

      /*
       * HANDLE INSERT ERROR
       */
      if (insertError) {
        console.error(
          "SUPABASE COMPLAINT INSERT ERROR:",
          insertError
        );

        /*
         * Remove uploaded photo if
         * complaint creation failed.
         */
        if (
          uploadedFilePath
        ) {
          await supabase.storage
            .from(
              "complaint-photos"
            )
            .remove([
              uploadedFilePath,
            ]);
        }

        setError(
          insertError.message ||
            "Failed to submit complaint. Please try again."
        );

        return;
      }

      /*
       * MAKE SURE COMPLAINT WAS RETURNED
       */
      if (!insertedComplaint) {
        console.error(
          "Complaint was not returned after insert."
        );

        if (
          uploadedFilePath
        ) {
          await supabase.storage
            .from(
              "complaint-photos"
            )
            .remove([
              uploadedFilePath,
            ]);
        }

        setError(
          "Complaint was not created. Please try again."
        );

        return;
      }

      /*
       * MAKE SURE DATABASE GENERATED
       * THE COMPLAINT ID
       */
      if (
        !insertedComplaint.complaint_id
      ) {
        console.error(
          "Complaint was created without a complaint ID."
        );

        if (
          uploadedFilePath
        ) {
          await supabase.storage
            .from(
              "complaint-photos"
            )
            .remove([
              uploadedFilePath,
            ]);
        }

        setError(
          "Complaint was created, but the Complaint ID could not be generated. Please contact the administrator."
        );

        return;
      }

      /*
       * OPTIONAL LOCAL STORAGE COMPATIBILITY
       *
       * Supabase remains the real source
       * of application data.
       */
      try {
        localStorage.removeItem(
          "civicfix_complaints"
        );

        const smallLocalComplaint =
          {
            id:
              insertedComplaint.id,

            complaint_id:
              insertedComplaint.complaint_id,

            citizen_id:
              insertedComplaint.citizen_id,

            category:
              insertedComplaint.category,

            category_label:
              insertedComplaint.category_label,

            title:
              insertedComplaint.title,

            description:
              insertedComplaint.description,

            location:
              insertedComplaint.location,

            photo_url:
              insertedComplaint.photo_url,

            verification_status:
              insertedComplaint.verification_status,

            work_status:
              insertedComplaint.work_status,

            status:
              insertedComplaint.status,

            created_at:
              insertedComplaint.created_at,

            citizenName:
              userName,

            citizenEmail:
              supabaseUser.email ||
              user?.email ||
              "",

            issue:
              categoryLabel,

            image:
              photoUrl,

            photo:
              photoUrl,

            photoUrl:
              photoUrl,

            verificationStatus:
              "Pending Review",

            workStatus:
              "Pending",

            createdAt:
              insertedComplaint.created_at,

            timeline: [
              {
                status:
                  "Reported",

                title:
                  "Complaint Reported",

                description:
                  "Your complaint has been submitted successfully.",

                date:
                  insertedComplaint.created_at,
              },

              {
                status:
                  "Pending Review",

                title:
                  "Pending Manager Review",

                description:
                  "Your complaint is waiting for verification by the manager.",

                date:
                  insertedComplaint.created_at,
              },
            ],
          };

        localStorage.setItem(
          "civicfix_complaints",
          JSON.stringify([
            smallLocalComplaint,
          ])
        );

        localStorage.setItem(
          "civicfix_latest_complaint",
          JSON.stringify(
            smallLocalComplaint
          )
        );
      } catch (storageError) {
        console.warn(
          "LocalStorage unavailable. Supabase submission is still successful.",
          storageError
        );
      }

      /*
       * SHOW SUCCESS SCREEN
       */
      setComplaintId(
        insertedComplaint.complaint_id
      );

      setComplaintEntityId(
        insertedComplaint.id
      );

      setSubmitted(true);
    } catch (err) {
      console.error(
        "COMPLAINT SUBMISSION ERROR:",
        err
      );

      /*
       * CLEAN UP PHOTO IF SOMETHING
       * FAILED AFTER UPLOAD.
       */
      if (
        uploadedFilePath
      ) {
        try {
          await supabase.storage
            .from(
              "complaint-photos"
            )
            .remove([
              uploadedFilePath,
            ]);
        } catch (
          removeError
        ) {
          console.error(
            "Unable to remove uploaded photo:",
            removeError
          );
        }
      }

      setError(
        err?.message ||
          "Failed to submit complaint. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * RESET FORM
   */
  const reset = () => {
    setSubmitted(false);

    setCategory("");
    setDescription("");
    setLocation("");

    setFile(null);
    setFileName("");

    setIsDragging(false);

    setComplaintId("");
    setComplaintEntityId("");

    setError("");
  };

  return (
    <DashboardLayout
      items={nav}
      role="Citizen"
      user={userName}
      title="Report a Civic Issue"
      subtitle="Fill in the details below and submit your complaint."
    >
      <AnimatePresence mode="wait">

        {/* SUCCESS SCREEN */}

        {submitted ? (
          <motion.div
            key="success"
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-card"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>

            <h2 className="mt-6 font-heading text-2xl font-bold text-foreground">
              Complaint Submitted Successfully
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Your complaint has been registered and is awaiting manager
              verification. Track its progress anytime.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-left">

              <div className="rounded-xl border border-border bg-muted/40 p-4">

                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Complaint ID
                </p>

                <p className="mt-1 text-lg font-bold text-foreground">
                  {complaintId}
                </p>

              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-4">

                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Verification
                </p>

                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-sm font-medium text-warning">

                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />

                  Pending Review

                </p>

              </div>

            </div>

            <div className="mt-8 flex justify-center gap-3">

              {complaintEntityId && (
                <Link
                  to={`/complaint/${complaintEntityId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white hover:bg-primary"
                >
                  View Details

                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              <button
                onClick={reset}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
              >
                Report Another
              </button>

            </div>
          </motion.div>
        ) : (

          /* REPORT FORM */

          <motion.form
            key="form"
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            onSubmit={submit}
            className="mx-auto max-w-2xl space-y-6"
          >

            {/* CATEGORY */}

            <div>

              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Issue Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >

                <option
                  value=""
                  disabled
                >
                  Select a category
                </option>

                {issueCategories.map(
                  (c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.label}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* DESCRIPTION */}

            <div>

              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                required
                rows={5}
                placeholder="Describe the issue in detail — what's wrong, since when, and how it affects the area…"
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />

            </div>

            {/* LOCATION */}

            <div>

              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Location
              </label>

              <input
                value={location}
                onChange={(e) =>
                  setLocation(
                    e.target.value
                  )
                }
                required
                placeholder="e.g. Main Road, Sector 12"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />

            </div>

            {/* PHOTO */}

            <div>

              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Photo Evidence{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              {/*
               * DRAG & DROP AREA
               *
               * The same area also works as the
               * Choose Photo button because it
               * remains a <label>.
               */}

              <label
                onDragOver={
                  handleDragOver
                }
                onDragEnter={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-border bg-card hover:border-primary hover:bg-primary/5"
                }`}
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">

                  {fileName ? (
                    <Camera className="h-5 w-5" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}

                </div>

                <p className="text-sm font-medium text-foreground">

                  {isDragging
                    ? "Drop your photo here"
                    : fileName ||
                      "Drag & drop a photo here"}

                </p>

                {!fileName && (
                  <p className="text-xs text-muted-foreground">

                    or{" "}

                    <span className="font-semibold text-primary">
                      Choose Photo
                    </span>

                  </p>
                )}

                {fileName && (
                  <p className="text-xs text-muted-foreground">
                    Click or drag another image to replace it.
                  </p>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    handleFileChange
                  }
                />

              </label>

              <p className="mt-2 text-xs text-muted-foreground">
                Photo evidence is required for the manager to verify your
                complaint.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <motion.p
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
            >

              {loading ? (
                "Submitting…"
              ) : (
                <>
                  Submit Complaint

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}

            </button>

          </motion.form>
        )}

      </AnimatePresence>
    </DashboardLayout>
  );
}