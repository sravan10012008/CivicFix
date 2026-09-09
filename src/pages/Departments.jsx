import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wrench,
  Users,
  BarChart3,
  Plus,
  X,
  Edit2,
  Search,
  ClipboardList,
  UserCheck,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

const nav = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "All Complaints",
    to: "/all-complaints",
    icon: FileText,
  },
  {
    label: "Departments",
    to: "/departments",
    icon: Building2,
  },
  {
    label: "Workers",
    to: "/workers",
    icon: Wrench,
  },
  {
    label: "Users",
    to: "/users",
    icon: Users,
  },
  {
    label: "Reports",
    to: "/reports",
    icon: BarChart3,
  },
];

export default function Departments() {
  const { user } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * LOAD DEPARTMENT DATA
   */

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        departmentsResult,
        workersResult,
        complaintsResult,
      ] = await Promise.all([
        supabase
          .from("departments")
          .select(
            "id, name, description, created_at"
          )
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("workers")
          .select(
            "id, department_id"
          ),

        supabase
          .from("complaints")
          .select(
            "id, department_id, complaint_id, work_status, verification_status"
          ),
      ]);

      if (departmentsResult.error) {
        throw departmentsResult.error;
      }

      if (workersResult.error) {
        throw workersResult.error;
      }

      if (complaintsResult.error) {
        throw complaintsResult.error;
      }

      setDepartments(
        departmentsResult.data || []
      );

      setWorkers(
        workersResult.data || []
      );

      setComplaints(
        complaintsResult.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load department data:",
        err
      );

      setError(
        err.message ||
          "Failed to load departments."
      );

      setDepartments([]);
      setWorkers([]);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * DEPARTMENT STATISTICS
   */

  const totalDepartments =
    departments.length;

  const totalWorkers =
    workers.length;

  const totalComplaints =
    complaints.length;

  /*
   * GET NUMBER OF WORKERS
   * BELONGING TO A DEPARTMENT
   */

  const getWorkerCount = (
    departmentId
  ) => {
    return workers.filter(
      (worker) =>
        worker.department_id ===
        departmentId
    ).length;
  };

  /*
   * GET NUMBER OF COMPLAINTS
   * BELONGING TO A DEPARTMENT
   */

  const getComplaintCount = (
    departmentId
  ) => {
    return complaints.filter(
      (complaint) =>
        complaint.department_id ===
        departmentId
    ).length;
  };

  /*
   * GET ACTIVE COMPLAINT COUNT
   */

  const getActiveComplaintCount = (
    departmentId
  ) => {
    return complaints.filter(
      (complaint) =>
        complaint.department_id ===
          departmentId &&
        (
          complaint.work_status ===
            "Assigned" ||
          complaint.work_status ===
            "In Progress" ||
          complaint.work_status ===
            "Proof Submitted"
        )
    ).length;
  };

  /*
   * GET RESOLVED COMPLAINT COUNT
   */

  const getResolvedComplaintCount = (
    departmentId
  ) => {
    return complaints.filter(
      (complaint) =>
        complaint.department_id ===
          departmentId &&
        complaint.work_status ===
          "Completed"
    ).length;
  };

  /*
   * SEARCH
   */

  const filteredDepartments =
    departments.filter(
      (department) => {
        const searchText = [
          department.name,
          department.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchText.includes(
          query.toLowerCase()
        );
      }
    );

  /*
   * RESET FORM
   */

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditing(null);
    setError("");
  };

  /*
   * OPEN CREATE FORM
   */

  const openCreate = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
  };

  /*
   * OPEN EDIT FORM
   */

  const openEdit = (
    department
  ) => {
    setEditing(department);

    setName(
      department.name || ""
    );

    setDescription(
      department.description || ""
    );

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  /*
   * CLOSE FORM
   */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  /*
   * SAVE DEPARTMENT
   */

  const save = async () => {
    setError("");
    setSuccess("");

    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError(
        "Department name is required."
      );
      return;
    }

    if (trimmedName.length < 3) {
      setError(
        "Department name must contain at least 3 characters."
      );
      return;
    }

    if (!trimmedDescription) {
      setError(
        "Department description is required."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * EDIT EXISTING DEPARTMENT
       */

      if (editing) {
        const {
          error: updateError,
        } = await supabase
          .from("departments")
          .update({
            name: trimmedName,
            description:
              trimmedDescription,
          })
          .eq(
            "id",
            editing.id
          );

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Department updated successfully."
        );
      }

      /*
       * CREATE NEW DEPARTMENT
       */

      else {
        const {
          error: insertError,
        } = await supabase
          .from("departments")
          .insert({
            name: trimmedName,
            description:
              trimmedDescription,
          });

        if (insertError) {
          /*
           * Handle duplicate department name
           * in a user-friendly way.
           */

          if (
            insertError.code ===
            "23505"
          ) {
            throw new Error(
              "A department with this name already exists."
            );
          }

          throw insertError;
        }

        setSuccess(
          "Department added successfully."
        );
      }

      await loadData();

      setTimeout(() => {
        setShowForm(false);
        resetForm();
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error(
        "Failed to save department:",
        err
      );

      setError(
        err.message ||
          "Failed to save department. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const userName =
    user?.name ||
    user?.full_name ||
    "Manager";

  return (
    <DashboardLayout
      items={nav}
      role="Authority"
      user={userName}
      title="Departments"
      subtitle="Manage civic departments and monitor their workload."
    >
      {/* ================================================= */}
      {/* DEPARTMENT STATISTICS */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* TOTAL DEPARTMENTS */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Departments
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading
                  ? "—"
                  : totalDepartments}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* TOTAL WORKERS */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Workers
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading
                  ? "—"
                  : totalWorkers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* TOTAL COMPLAINTS */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Complaints
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading
                  ? "—"
                  : totalComplaints}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* SEARCH + ADD BUTTON */}
      {/* ================================================= */}

      <div className="mt-6 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* SEARCH */}

        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search departments..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* ADD DEPARTMENT */}

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* ================================================= */}
      {/* RESULT COUNT */}
      {/* ================================================= */}

      {!loading && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {
                filteredDepartments.length
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {departments.length}
            </span>{" "}
            departments
          </p>
        </div>
      )}

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && !showForm && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================= */}
      {/* SUCCESS */}
      {/* ================================================= */}

      {success && !showForm && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ================================================= */}
      {/* DEPARTMENT CARDS */}
      {/* ================================================= */}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="h-6 w-40 animate-pulse rounded bg-muted/50" />

                <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted/40" />

                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted/40" />

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
                  <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
                  <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
                </div>
              </div>
            )
          )}
        </div>
      ) : filteredDepartments.length ===
        0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-soft">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

          <h3 className="mt-3 text-sm font-semibold text-foreground">
            No departments found
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or add
            a new department.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredDepartments.map(
            (department) => {
              const workerCount =
                getWorkerCount(
                  department.id
                );

              const complaintCount =
                getComplaintCount(
                  department.id
                );

              const activeCount =
                getActiveComplaintCount(
                  department.id
                );

              const resolvedCount =
                getResolvedComplaintCount(
                  department.id
                );

              return (
                <motion.div
                  key={department.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  {/* CARD HEADER */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-foreground">
                          {
                            department.name
                          }
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {
                            department.description
                          }
                        </p>
                      </div>
                    </div>

                    {/* EDIT */}

                    <button
                      onClick={() =>
                        openEdit(
                          department
                        )
                      }
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                  </div>

                  {/* STATISTICS */}

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {/* WORKERS */}

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Workers
                      </div>

                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {
                          workerCount
                        }
                      </p>
                    </div>

                    {/* TOTAL COMPLAINTS */}

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Complaints
                      </div>

                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {
                          complaintCount
                        }
                      </p>
                    </div>

                    {/* ACTIVE */}

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Active
                      </div>

                      <p className="mt-2 text-xl font-semibold text-secondary">
                        {
                          activeCount
                        }
                      </p>
                    </div>
                  </div>

                  {/* FOOTER */}

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <span className="text-muted-foreground">
                      Resolved complaints
                    </span>

                    <span className="font-semibold text-green-700">
                      {
                        resolvedCount
                      }
                    </span>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* ADD / EDIT DEPARTMENT MODAL */}
      {/* ================================================= */}

      <AnimatePresence>
        {showForm && (
          <>
            {/* BACKDROP */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={closeForm}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            />

            {/* MODAL */}

            <motion.div
              initial={{
                opacity: 0,
                y: 24,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 24,
                scale: 0.98,
              }}
              className="fixed left-1/2 top-8 z-50 flex max-h-[calc(100vh-4rem)] w-[92%] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-glow"
            >
              {/* MODAL HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {editing
                      ? "Edit Department"
                      : "Add Department"}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {editing
                      ? "Update the department information."
                      : "Create a new CivicFix department."}
                  </p>
                </div>

                <button
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* MODAL BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  {/* NAME */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Department Name
                    </label>

                    <input
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Public Health"
                      className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Description
                    </label>

                    <textarea
                      value={
                        description
                      }
                      onChange={(e) =>
                        setDescription(
                          e.target.value
                        )
                      }
                      rows={4}
                      placeholder="Describe the responsibilities of this department..."
                      className="w-full resize-none rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* FORM ERROR */}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* FORM SUCCESS */}

                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                      {success}
                    </div>
                  )}
                </div>
              </div>

              {/* MODAL FOOTER */}

              <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-card px-6 py-4">
                <button
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Department"
                    : "Add Department"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}