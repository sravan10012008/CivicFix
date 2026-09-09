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
  UserCheck,
  ClipboardList,
  CheckCircle2,
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

export default function Workers() {
  const { user } = useAuth();

  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("All");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * LOAD WORKER DATA
   */

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        workersResult,
        departmentsResult,
        profilesResult,
        complaintsResult,
      ] = await Promise.all([
        supabase
          .from("workers")
          .select(
            `
              id,
              profile_id,
              department_id,
              employee_id,
              status,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("departments")
          .select("id, name, description")
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("profiles")
          .select(
            "id, full_name, phone, role"
          )
          .order("full_name", {
            ascending: true,
          }),

        supabase
          .from("complaints")
          .select(
            "id, complaint_id, assigned_worker_id, work_status, status"
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (workersResult.error) {
        throw workersResult.error;
      }

      if (departmentsResult.error) {
        throw departmentsResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      if (complaintsResult.error) {
        throw complaintsResult.error;
      }

      setWorkers(workersResult.data || []);
      setDepartments(
        departmentsResult.data || []
      );
      setProfiles(profilesResult.data || []);
      setComplaints(
        complaintsResult.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load worker data:",
        err
      );

      setError(
        err.message ||
          "Failed to load workers. Please check your database."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * HELPER FUNCTIONS
   */

  const getProfile = (profileId) => {
    return profiles.find(
      (profile) =>
        profile.id === profileId
    );
  };

  const getDepartment = (departmentId) => {
    return departments.find(
      (department) =>
        department.id === departmentId
    );
  };

  const getWorkerComplaints = (worker) => {
    return complaints.filter(
      (complaint) =>
        complaint.assigned_worker_id ===
        worker.id
    );
  };

  const getWorkerComplaintCount = (
    worker
  ) => {
    return getWorkerComplaints(worker).length;
  };

  const getWorkerInProgressCount = (
    worker
  ) => {
    return getWorkerComplaints(worker).filter(
      (complaint) =>
        complaint.work_status ===
        "In Progress"
    ).length;
  };

  const getWorkerCompletedCount = (
    worker
  ) => {
    return getWorkerComplaints(worker).filter(
      (complaint) =>
        complaint.work_status ===
        "Completed"
    ).length;
  };

  /*
   * USERS WHO CAN BE CONVERTED INTO WORKERS
   *
   * Admins and existing workers are excluded.
   */

  const availableProfiles = profiles.filter(
    (profile) =>
      profile.role !== "admin" &&
      profile.role !== "worker"
  );

  /*
   * FORM FUNCTIONS
   */

  const resetForm = () => {
    setSelectedProfileId("");
    setName("");
    setPhone("");
    setEmployeeId("");
    setDepartmentId("");
    setEditing(null);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (worker) => {
    const profile = getProfile(
      worker.profile_id
    );

    setEditing(worker);

    setSelectedProfileId(
      worker.profile_id || ""
    );

    setName(
      profile?.full_name || ""
    );

    setPhone(
      profile?.phone || ""
    );

    setEmployeeId(
      worker.employee_id || ""
    );

    setDepartmentId(
      worker.department_id || ""
    );

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  const handleProfileChange = (
    profileId
  ) => {
    setSelectedProfileId(profileId);

    const selectedProfile =
      profiles.find(
        (profile) =>
          profile.id === profileId
      );

    if (!selectedProfile) {
      setName("");
      setPhone("");
      return;
    }

    setName(
      selectedProfile.full_name || ""
    );

    setPhone(
      selectedProfile.phone || ""
    );
  };

  /*
   * SAVE WORKER
   */

  const save = async () => {
    setError("");
    setSuccess("");

    if (
      !editing &&
      !selectedProfileId
    ) {
      setError(
        "Please select a registered user."
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Full name is required."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        "Phone number is required."
      );
      return;
    }

    if (
      !/^\d{10}$/.test(
        phone.trim()
      )
    ) {
      setError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    if (!employeeId.trim()) {
      setError(
        "Employee ID is required."
      );
      return;
    }

    if (!departmentId) {
      setError(
        "Please select a department."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * EDIT EXISTING WORKER
       */

      if (editing) {
        const {
          error: workerError,
        } = await supabase
          .from("workers")
          .update({
            department_id:
              departmentId,
            employee_id:
              employeeId.trim(),
          })
          .eq("id", editing.id);

        if (workerError) {
          throw workerError;
        }

        const {
          error: profileError,
        } = await supabase
          .from("profiles")
          .update({
            full_name:
              name.trim(),
            phone:
              phone.trim(),
            role: "worker",
          })
          .eq(
            "id",
            editing.profile_id
          );

        if (profileError) {
          throw profileError;
        }

        setSuccess(
          "Worker updated successfully."
        );
      }

      /*
       * CREATE NEW WORKER
       */

      else {
        const alreadyWorker =
          workers.some(
            (worker) =>
              worker.profile_id ===
              selectedProfileId
          );

        if (alreadyWorker) {
          setError(
            "This user is already registered as a worker."
          );

          setSaving(false);
          return;
        }

        const {
          error: profileError,
        } = await supabase
          .from("profiles")
          .update({
            full_name:
              name.trim(),
            phone:
              phone.trim(),
            role: "worker",
          })
          .eq(
            "id",
            selectedProfileId
          );

        if (profileError) {
          throw profileError;
        }

        const {
          error: workerError,
        } = await supabase
          .from("workers")
          .insert({
            profile_id:
              selectedProfileId,
            department_id:
              departmentId,
            employee_id:
              employeeId.trim(),
            status:
              "available",
          });

        if (workerError) {
          throw workerError;
        }

        setSuccess(
          "Worker added and department assigned successfully."
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
        "Failed to save worker:",
        err
      );

      setError(
        err.message ||
          "Failed to save worker. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * WORKER STATISTICS
   */

  const totalWorkers =
    workers.length;

  const availableWorkers =
    workers.filter(
      (worker) =>
        worker.status ===
        "available"
    ).length;

  const workersWithActiveWork =
    workers.filter(
      (worker) =>
        getWorkerInProgressCount(
          worker
        ) > 0
    ).length;

  const workersWithCompletedWork =
    workers.filter(
      (worker) =>
        getWorkerCompletedCount(
          worker
        ) > 0
    ).length;

  /*
   * SEARCH + DEPARTMENT FILTER
   */

  const filteredWorkers =
    workers.filter((worker) => {
      const profile = getProfile(
        worker.profile_id
      );

      const department =
        getDepartment(
          worker.department_id
        );

      const searchText = [
        profile?.full_name,
        profile?.phone,
        worker.employee_id,
        worker.status,
        department?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchText.includes(
          query.toLowerCase()
        );

      const matchesDepartment =
        departmentFilter === "All" ||
        worker.department_id ===
          departmentFilter;

      return (
        matchesSearch &&
        matchesDepartment
      );
    });

  const userName =
    user?.name ||
    user?.full_name ||
    "Manager";

  return (
    <DashboardLayout
      items={nav}
      role="Authority"
      user={userName}
      title="Workers"
      subtitle="Manage field workers and their department assignments."
    >
      {/* WORKER STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* AVAILABLE WORKERS */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Available Workers
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading
                  ? "—"
                  : availableWorkers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ACTIVE WORKERS */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Workers In Progress
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading
                  ? "—"
                  : workersWithActiveWork}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* COMPLETED WORKERS */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Workers With Completed Work
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading
                  ? "—"
                  : workersWithCompletedWork}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS + FILTERS */}

      <div className="mt-6 mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* FILTERS */}

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* SEARCH */}

          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value
                )
              }
              placeholder="Search workers..."
              className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* DEPARTMENT FILTER */}

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="All">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* ADD WORKER */}

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary"
        >
          <Plus className="h-4 w-4" />
          Add Worker
        </button>
      </div>

      {/* RESULT COUNT */}

      {!loading && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {
                filteredWorkers.length
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {workers.length}
            </span>{" "}
            workers
          </p>
        </div>
      )}

      {/* ERROR */}

      {error && !showForm && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && !showForm && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* WORKERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  Name
                </th>

                <th className="px-4 py-3 font-semibold">
                  Phone
                </th>

                <th className="px-4 py-3 font-semibold">
                  Employee ID
                </th>

                <th className="px-4 py-3 font-semibold">
                  Department
                </th>

                <th className="px-4 py-3 font-semibold">
                  Status
                </th>

                <th className="px-4 py-3 font-semibold">
                  Assigned
                </th>

                <th className="px-4 py-3 font-semibold">
                  In Progress
                </th>

                <th className="px-4 py-3 font-semibold">
                  Completed
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Loading workers...
                  </td>
                </tr>
              ) : filteredWorkers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No workers found.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(
                  (worker) => {
                    const profile =
                      getProfile(
                        worker.profile_id
                      );

                    const department =
                      getDepartment(
                        worker.department_id
                      );

                    const complaintCount =
                      getWorkerComplaintCount(
                        worker
                      );

                    const inProgressCount =
                      getWorkerInProgressCount(
                        worker
                      );

                    const completedCount =
                      getWorkerCompletedCount(
                        worker
                      );

                    return (
                      <tr
                        key={
                          worker.id
                        }
                        className="transition-colors hover:bg-muted/40"
                      >
                        {/* NAME */}

                        <td className="px-4 py-3 font-medium text-foreground">
                          {profile?.full_name ||
                            "—"}
                        </td>

                        {/* PHONE */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {profile?.phone ||
                            "—"}
                        </td>

                        {/* EMPLOYEE ID */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {worker.employee_id ||
                            "—"}
                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {department?.name ||
                            "—"}
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              worker.status ===
                              "available"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {worker.status ||
                              "available"}
                          </span>
                        </td>

                        {/* ASSIGNED */}

                        <td className="px-4 py-3 font-medium text-foreground">
                          {
                            complaintCount
                          }
                        </td>

                        {/* IN PROGRESS */}

                        <td className="px-4 py-3 text-secondary">
                          {
                            inProgressCount
                          }
                        </td>

                        {/* COMPLETED */}

                        <td className="px-4 py-3 text-success">
                          {
                            completedCount
                          }
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              openEdit(
                                worker
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT WORKER MODAL */}

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
              className="fixed left-1/2 top-8 z-50 flex max-h-[90vh] w-[92%] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-glow"
            >
              {/* MODAL HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
                <h3 className="text-lg font-bold text-foreground">
                  {editing
                    ? "Edit Worker"
                    : "Add Worker"}
                </h3>

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
                <div className="space-y-4">
                  {/* REGISTERED USER */}

                  {!editing && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Registered User
                      </label>

                      <select
                        value={
                          selectedProfileId
                        }
                        onChange={(e) =>
                          handleProfileChange(
                            e.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">
                          — Select Registered User —
                        </option>

                        {availableProfiles.map(
                          (
                            profile
                          ) => (
                            <option
                              key={
                                profile.id
                              }
                              value={
                                profile.id
                              }
                            >
                              {profile.full_name ||
                                "Unnamed User"}
                            </option>
                          )
                        )}
                      </select>

                      {availableProfiles.length ===
                        0 && (
                        <p className="mt-1.5 text-xs text-red-600">
                          No registered users
                          available. The
                          worker must register
                          first.
                        </p>
                      )}
                    </div>
                  )}

                  {/* FULL NAME */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Full Name
                    </label>

                    <input
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      disabled={
                        !editing
                      }
                      placeholder="Worker name"
                      className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted disabled:opacity-70"
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Phone
                    </label>

                    <input
                      value={phone}
                      onChange={(e) => {
                        const value =
                          e.target.value.replace(
                            /\D/g,
                            ""
                          );

                        if (
                          value.length <=
                          10
                        ) {
                          setPhone(
                            value
                          );
                        }
                      }}
                      placeholder="9876543210"
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Enter exactly 10 digits.
                    </p>
                  </div>

                  {/* EMPLOYEE ID */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Employee ID
                    </label>

                    <input
                      value={
                        employeeId
                      }
                      onChange={(e) =>
                        setEmployeeId(
                          e.target.value
                        )
                      }
                      placeholder="EMP001"
                      className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Department
                    </label>

                    <select
                      value={
                        departmentId
                      }
                      onChange={(e) =>
                        setDepartmentId(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">
                        — Select Department —
                      </option>

                      {departments.map(
                        (
                          department
                        ) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    {departments.length ===
                      0 && (
                      <p className="mt-1.5 text-xs text-red-600">
                        No departments found.
                        Please add departments
                        first.
                      </p>
                    )}
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
                  disabled={
                    saving ||
                    departments.length ===
                      0 ||
                    (!editing &&
                      !selectedProfileId)
                  }
                  className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Worker"
                    : "Add Worker"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}