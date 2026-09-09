import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wrench,
  Users,
  BarChart3,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Bell,
  Camera,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/complaints";

/*
 * CIVIC ISSUE CATEGORIES
 *
 * Kept locally so AdminDashboard does not
 * depend on mockData.js.
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

const verificationFilters = [
  "All",
  "Pending Review",
  "Approved",
  "Rejected",
];

const workFilters = [
  "All",
  "Pending",
  "Assigned",
  "In Progress",
  "Proof Submitted",
  "Completed",
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [verFilter, setVerFilter] = useState("All");
  const [workFilter, setWorkFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const [selected, setSelected] = useState(null);

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignDept, setAssignDept] = useState("");
  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [showNotifs, setShowNotifs] = useState(false);

  /*
   * LOAD NOTIFICATIONS
   */

  const loadNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("notifications")
        .select(
          "id, user_id, complaint_id, title, message, is_read, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setNotifications(
        (data || []).map((notification) => ({
          ...notification,
          read: notification.is_read,
        }))
      );
    } catch (err) {
      console.error(
        "Failed to load notifications:",
        err
      );

      setNotifications([]);
    }
  };

  /*
   * LOAD ADMIN DATA
   */

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        complaintsResult,
        departmentsResult,
        workersResult,
        profilesResult,
      ] = await Promise.all([
        supabase
          .from("complaints")
          .select("*")
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
          .from("workers")
          .select(
            "id, profile_id, department_id, employee_id, status"
          ),

        supabase
          .from("profiles")
          .select(
            "id, full_name, phone, role"
          )
          .order("full_name", {
            ascending: true,
          }),
      ]);

      if (complaintsResult.error) {
        throw complaintsResult.error;
      }

      if (departmentsResult.error) {
        throw departmentsResult.error;
      }

      if (workersResult.error) {
        throw workersResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      setComplaints(
        complaintsResult.data || []
      );

      setDepartments(
        departmentsResult.data || []
      );

      setWorkers(
        workersResult.data || []
      );

      setProfiles(
        profilesResult.data || []
      );

      await loadNotifications();
    } catch (err) {
      console.error(
        "Failed to load admin data:",
        err
      );

      alert(
        err?.message ||
          "Failed to load admin data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  /*
   * REALTIME ADMIN NOTIFICATIONS
   */

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const channel = supabase
      .channel(
        `admin-notifications-${user.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification =
            payload.new;

          setNotifications((prev) => {
            if (
              prev.some(
                (n) =>
                  n.id ===
                  notification.id
              )
            ) {
              return prev;
            }

            return [
              {
                ...notification,
                read: notification.is_read,
              },
              ...prev,
            ];
          });

          if (
            notification.complaint_id
          ) {
            const {
              data: complaint,
              error,
            } = await supabase
              .from("complaints")
              .select("*")
              .eq(
                "id",
                notification.complaint_id
              )
              .maybeSingle();

            if (!error && complaint) {
              setComplaints((prev) => {
                if (
                  prev.some(
                    (c) =>
                      c.id ===
                      complaint.id
                  )
                ) {
                  return prev;
                }

                return [
                  complaint,
                  ...prev,
                ];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [user?.id]);

  /*
   * HELPER FUNCTIONS
   */

  const getProfile = (profileId) => {
    return profiles.find(
      (profile) =>
        profile.id === profileId
    );
  };

  const getWorker = (workerId) => {
    return workers.find(
      (worker) =>
        worker.id === workerId
    );
  };

  const getDepartment = (
    departmentId
  ) => {
    return departments.find(
      (department) =>
        department.id ===
        departmentId
    );
  };

  const getCategoryLabel = (
    category
  ) => {
    return (
      issueCategories.find(
        (cat) => cat.id === category
      )?.label ||
      category ||
      "—"
    );
  };

  const getCompletionProof = (
    complaint
  ) => {
    if (!complaint) {
      return "";
    }

    return (
      complaint.completion_photo_url ||
      complaint.completion_proof_url ||
      complaint.proof_url ||
      complaint.completionPhotoUrl ||
      complaint.completionProofUrl ||
      complaint.proofUrl ||
      ""
    );
  };

  const isProofSubmitted = (
    complaint
  ) => {
    if (!complaint) {
      return false;
    }

    const workStatus =
      complaint.work_status ||
      complaint.workStatus;

    return (
      workStatus ===
      "Proof Submitted"
    );
  };

  /*
   * FILTER COMPLAINTS
   */

  const filtered = complaints.filter(
    (c) => {
      const complaintId =
        String(
          c.complaint_id || ""
        )
          .trim()
          .toLowerCase();

      const title =
        String(c.title || "")
          .trim()
          .toLowerCase();

      const catLabel =
        String(
          c.category_label ||
            getCategoryLabel(
              c.category
            ) ||
            ""
        )
          .trim()
          .toLowerCase();

      const location =
        String(c.location || "")
          .trim()
          .toLowerCase();

      const description =
        String(c.description || "")
          .trim()
          .toLowerCase();

      const searchQuery =
        query
          .trim()
          .toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        complaintId.includes(
          searchQuery
        ) ||
        title.includes(searchQuery) ||
        catLabel.includes(
          searchQuery
        ) ||
        location.includes(
          searchQuery
        ) ||
        description.includes(
          searchQuery
        );

      const verificationStatus =
        c.verification_status ||
        c.verificationStatus ||
        "";

      const workStatus =
        c.work_status ||
        c.workStatus ||
        "";

      const vf =
        verFilter === "All" ||
        verificationStatus ===
          verFilter;

      const wf =
        workFilter === "All" ||
        workStatus === workFilter;

      const cf =
        catFilter === "All" ||
        c.category === catFilter;

      return (
        matchesSearch &&
        vf &&
        wf &&
        cf
      );
    }
  );

  /*
   * OPEN COMPLAINT MODAL
   */

  const openModal = (c) => {
    setSelected(c);

    setAssignDept(
      c.department_id ||
        c.departmentId ||
        ""
    );

    setAssignWorkerId(
      c.assigned_worker_id ||
        c.assignedWorkerId ||
        ""
    );

    setRejectReason("");
  };

  /*
   * APPROVE COMPLAINT / COMPLETION PROOF
   */

  const approve = async () => {
    if (!selected) {
      return;
    }

    const proofSubmitted =
      isProofSubmitted(selected);

    const confirmed =
      window.confirm(
        proofSubmitted
          ? "Are you sure you want to approve this completion proof? The complaint will be marked as Completed."
          : "Are you sure you want to approve this complaint?"
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      let updateData;

      if (proofSubmitted) {
        updateData = {
          verification_status:
            "Approved",

          work_status:
            "Completed",

          status:
            "Completed",

          proof_rejection_reason:
            null,

          updated_at:
            new Date().toISOString(),
        };
      } else {
        updateData = {
          verification_status:
            "Approved",

          work_status:
            "Pending",

          status:
            "Approved",

          rejection_reason:
            null,

          updated_at:
            new Date().toISOString(),
        };
      }

      const {
        data,
        error,
      } = await supabase
        .from("complaints")
        .update(updateData)
        .eq("id", selected.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? data
            : c
        )
      );

      setSelected(data);
      setRejectReason("");

      if (proofSubmitted) {
        alert(
          "Completion proof approved. Complaint marked as Completed."
        );
      } else {
        alert(
          "Complaint approved successfully."
        );
      }
    } catch (err) {
      console.error(
        "Failed to approve complaint:",
        err
      );

      alert(
        err?.message ||
          "Failed to approve complaint."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * REJECT COMPLETION PROOF
   */

  const rejectProof = async () => {
    if (!selected) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to reject this completion proof?"
      );

    if (!confirmed) {
      return;
    }

    const reason =
      window.prompt(
        "Enter the reason for rejecting this completion proof:"
      );

    if (reason === null) {
      return;
    }

    const trimmedReason =
      reason.trim();

    if (!trimmedReason) {
      alert(
        "Please enter a reason for rejecting the completion proof."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("complaints")
        .update({
          work_status:
            "In Progress",

          status:
            "In Progress",

          proof_rejection_reason:
            trimmedReason,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", selected.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? data
            : c
        )
      );

      setSelected(data);

      alert(
        "Completion proof rejected. The worker can see the reason, continue the work, and submit a new proof."
      );
    } catch (err) {
      console.error(
        "Failed to reject completion proof:",
        err
      );

      alert(
        err?.message ||
          "Failed to reject completion proof."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * REJECT COMPLAINT
   */

  const reject = async () => {
    if (
      !selected ||
      !rejectReason.trim()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to reject this complaint?"
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const reason =
        rejectReason.trim();

      const {
        data,
        error,
      } = await supabase
        .from("complaints")
        .update({
          verification_status:
            "Rejected",

          work_status:
            "Pending",

          status:
            "Rejected",

          rejection_reason:
            reason,

          assigned_worker_id:
            null,

          department_id:
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", selected.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? data
            : c
        )
      );

      setSelected(data);

      setAssignDept("");
      setAssignWorkerId("");

      alert(
        "Complaint rejected successfully."
      );
    } catch (err) {
      console.error(
        "Failed to reject complaint:",
        err
      );

      alert(
        err?.message ||
          "Failed to reject complaint."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ASSIGN WORKER
   */

  const handleAssign =
    async () => {
      if (
        !selected ||
        !assignWorkerId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to assign this complaint to the selected worker?"
        );

      if (!confirmed) {
        return;
      }

      setSaving(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("complaints")
          .update({
            department_id:
              assignDept || null,

            assigned_worker_id:
              assignWorkerId,

            work_status:
              "Assigned",

            status:
              "Assigned",

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", selected.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setComplaints((prev) =>
          prev.map((c) =>
            c.id === data.id
              ? data
              : c
          )
        );

        setSelected(data);

        alert(
          "Complaint assigned successfully."
        );
      } catch (err) {
        console.error(
          "Failed to assign complaint:",
          err
        );

        alert(
          err?.message ||
            "Failed to assign complaint."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * MARK NOTIFICATION AS READ
   */

  const markNotifRead = async (
    notifId
  ) => {
    try {
      const {
        error,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notifId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId
            ? {
                ...n,
                read: true,
                is_read: true,
              }
            : n
        )
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );
    }
  };

  /*
   * MARK ALL NOTIFICATIONS AS READ
   */

  const markAllNotificationsAsRead = async () => {
    if (!user?.id || unreadCount === 0) {
      return;
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      alert(
        err?.message ||
          "Failed to mark all notifications as read."
      );
    }
  };

  /*
   * HANDLE NOTIFICATION CLICK
   */

  const handleNotificationClick =
    async (notification) => {
      await markNotifRead(
        notification.id
      );

      if (
        !notification.complaint_id
      ) {
        return;
      }

      const complaint =
        complaints.find(
          (c) =>
            c.id ===
            notification.complaint_id
        );

      if (complaint) {
        openModal(complaint);
      }

      setShowNotifs(false);
    };

  /*
   * DASHBOARD STATISTICS
   */

  const stats = [
    {
      label: "Total Complaints",
      value: complaints.length,
      icon: "FileText",
      tone: "primary",
    },

    {
      label: "Pending Review",
      value: complaints.filter(
        (c) =>
          (
            c.verification_status ||
            c.verificationStatus
          ) === "Pending Review"
      ).length,
      icon: "Clock",
      tone: "warning",
    },

    {
      label: "Approved",
      value: complaints.filter(
        (c) =>
          (
            c.verification_status ||
            c.verificationStatus
          ) === "Approved"
      ).length,
      icon: "CheckCircle2",
      tone: "success",
    },

    {
      label: "Rejected",
      value: complaints.filter(
        (c) =>
          (
            c.verification_status ||
            c.verificationStatus
          ) === "Rejected"
      ).length,
      icon: "XCircle",
      tone: "destructive",
    },

    {
      label: "In Progress",
      value: complaints.filter(
        (c) =>
          (
            c.work_status ||
            c.workStatus
          ) === "In Progress"
      ).length,
      icon: "Loader",
      tone: "secondary",
    },

    {
      label: "Proof Submitted",
      value: complaints.filter(
        (c) =>
          isProofSubmitted(c) &&
          (
            c.work_status ||
            c.workStatus
          ) !== "Completed"
      ).length,
      icon: "Camera",
      tone: "warning",
    },

    {
      label: "Resolved",
      value: complaints.filter(
        (c) =>
          (
            c.work_status ||
            c.workStatus
          ) === "Completed"
      ).length,
      icon: "CheckCircle2",
      tone: "success",
    },
  ];

  const userName =
    user?.name ||
    user?.full_name ||
    "Manager";

  const unreadCount =
    notifications.filter(
      (n) => !n.read
    ).length;

  const workersInDept =
    assignDept
      ? workers.filter(
          (w) =>
            w.department_id ===
            assignDept
        )
      : workers;

  /*
   * NOTIFICATION BELL
   */

  const notifBell = (
    <div className="relative">
      <button
        onClick={() =>
          setShowNotifs(
            (v) => !v
          )
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showNotifs && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() =>
                setShowNotifs(
                  false
                )
              }
            />

            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card p-2 shadow-glow"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notifications
                  </p>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="shrink-0 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length ===
                0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No notifications
                  </p>
                ) : (
                  notifications.map(
                    (n) => (
                      <button
                        key={n.id}
                        onClick={() =>
                          handleNotificationClick(
                            n
                          )
                        }
                        className={`block w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                          !n.read
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">
                              {n.title}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {n.message}
                            </p>

                            {n.created_at && (
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {formatDate(
                                  n.created_at
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <DashboardLayout
      items={nav}
      role="Authority"
      user={userName}
      title="Authority Dashboard"
      subtitle="Manage and resolve civic complaints across the city."
      actions={notifBell}
    >
      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            stat={s}
            index={i}
          />
        ))}
      </div>

      {/* COMPLAINT MANAGEMENT HEADER */}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Complaint Management
        </h2>

        <div className="flex flex-wrap gap-2">
          {/* CATEGORY FILTER */}

          <select
            value={catFilter}
            onChange={(e) =>
              setCatFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
          >
            <option value="All">
              All Categories
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

          {/* VERIFICATION FILTER */}

          <select
            value={verFilter}
            onChange={(e) =>
              setVerFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
          >
            {verificationFilters.map(
              (f) => (
                <option
                  key={f}
                  value={f}
                >
                  {f === "All"
                    ? "All Verification"
                    : f}
                </option>
              )
            )}
          </select>

          {/* WORK STATUS FILTER */}

          <select
            value={workFilter}
            onChange={(e) =>
              setWorkFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
          >
            {workFilters.map(
              (f) => (
                <option
                  key={f}
                  value={f}
                >
                  {f === "All"
                    ? "All Work Status"
                    : f}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* SEARCH */}

      <div className="relative mb-4 mt-3 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search complaints…"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* COMPLAINT TABLE */}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  ID
                </th>

                <th className="px-4 py-3 font-semibold">
                  Issue
                </th>

                <th className="px-4 py-3 font-semibold">
                  Location
                </th>

                <th className="px-4 py-3 font-semibold">
                  Verification
                </th>

                <th className="px-4 py-3 font-semibold">
                  Work Status
                </th>

                <th className="px-4 py-3 font-semibold">
                  Department
                </th>

                <th className="px-4 py-3 font-semibold">
                  Worker
                </th>

                <th className="px-4 py-3 font-semibold">
                  Date
                </th>

                <th className="px-4 py-3 font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>
                </tr>
              ) : filtered.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No complaints found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const catLabel =
                    getCategoryLabel(
                      c.category
                    );

                  const departmentId =
                    c.department_id ||
                    c.departmentId;

                  const workerId =
                    c.assigned_worker_id ||
                    c.assignedWorkerId;

                  const dept =
                    getDepartment(
                      departmentId
                    );

                  const worker =
                    getWorker(workerId);

                  const profile =
                    worker
                      ? getProfile(
                          worker.profile_id
                        )
                      : null;

                  const verificationStatus =
                    c.verification_status ||
                    c.verificationStatus;

                  const workStatus =
                    c.work_status ||
                    c.workStatus;

                  const createdDate =
                    c.created_at ||
                    c.created_date;

                  const proofSubmitted =
                    isProofSubmitted(c);

                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* ID */}

                      <td className="px-4 py-3 font-semibold text-foreground">
                        {c.complaint_id ||
                          c.complaintId ||
                          "—"}
                      </td>

                      {/* ISSUE */}

                      <td className="px-4 py-3 text-foreground">
                        {catLabel}
                      </td>

                      {/* LOCATION */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {c.location ||
                          "—"}
                      </td>

                      {/* VERIFICATION */}

                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            verificationStatus
                          }
                          size="sm"
                        />
                      </td>

                      {/* WORK STATUS */}

                      <td className="px-4 py-3">
                        {proofSubmitted &&
                        workStatus !==
                          "Completed" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            <Camera className="h-3 w-3" />
                            Proof Submitted
                          </span>
                        ) : (
                          <StatusBadge
                            status={
                              workStatus
                            }
                            size="sm"
                          />
                        )}
                      </td>

                      {/* DEPARTMENT */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {dept?.name ||
                          "—"}
                      </td>

                      {/* WORKER */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {profile?.full_name ||
                          "—"}
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          createdDate
                        )}
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            openModal(c)
                          }
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLAINT MODAL */}

      <AnimatePresence>
        {selected && (
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
              onClick={() =>
                setSelected(null)
              }
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
              transition={{
                duration: 0.3,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="fixed left-1/2 top-8 z-50 w-[92%] max-w-lg -translate-x-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-glow sm:p-8 max-h-[90vh]"
            >
              {/* MODAL HEADER */}

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {selected.complaint_id ||
                      selected.complaintId ||
                      "—"}
                  </span>

                  <h3 className="mt-1 text-xl font-bold text-foreground">
                    {getCategoryLabel(
                      selected.category
                    )}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      status={
                        selected.verification_status ||
                        selected.verificationStatus
                      }
                      size="sm"
                    />

                    {isProofSubmitted(
                      selected
                    ) &&
                    (
                      selected.work_status ||
                      selected.workStatus
                    ) !==
                      "Completed" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        <Camera className="h-3 w-3" />
                        Proof Submitted
                      </span>
                    ) : (
                      <StatusBadge
                        status={
                          selected.work_status ||
                          selected.workStatus
                        }
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelected(null)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* BASIC DETAILS */}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Location
                  </p>

                  <p className="mt-0.5 font-medium text-foreground">
                    {selected.location ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Date
                  </p>

                  <p className="mt-0.5 font-medium text-foreground">
                    {formatDate(
                      selected.created_at ||
                        selected.created_date
                    )}
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Description
                </p>

                <p className="mt-0.5 text-sm text-foreground">
                  {selected.description ||
                    "—"}
                </p>
              </div>

              {/* CITIZEN PHOTO */}

              {selected.photo_url && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Citizen Photo Evidence
                  </p>

                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={
                        selected.photo_url
                      }
                      alt="Citizen evidence"
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* COMPLETION PROOF */}

              {isProofSubmitted(
                selected
              ) && (
                <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                      <Camera className="h-5 w-5 text-amber-700" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        Completion Proof
                        Submitted
                      </p>

                      <p className="text-xs text-amber-700">
                        Review the photo before
                        approving the work.
                      </p>
                    </div>
                  </div>

                  {getCompletionProof(
                    selected
                  ) ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-white">
                      <img
                        src={getCompletionProof(
                          selected
                        )}
                        alt="Worker completion proof"
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-white p-6 text-center">
                      <Camera className="mx-auto h-8 w-8 text-amber-500" />

                      <p className="mt-2 text-sm font-medium text-amber-800">
                        Proof status received
                      </p>

                      <p className="mt-1 text-xs text-amber-700">
                        No proof image URL was found.
                      </p>
                    </div>
                  )}

                  {/* WORKER */}

                  <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3">
                    <p className="text-xs text-muted-foreground">
                      Worker
                    </p>

                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {(() => {
                        const workerId =
                          selected.assigned_worker_id ||
                          selected.assignedWorkerId;

                        const worker =
                          getWorker(
                            workerId
                          );

                        const profile =
                          worker
                            ? getProfile(
                                worker.profile_id
                              )
                            : null;

                        return (
                          profile?.full_name ||
                          worker?.employee_id ||
                          "Assigned Worker"
                        );
                      })()}
                    </p>
                  </div>

                  {/* PROOF ACTIONS */}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={approve}
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-semibold text-white hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />

                      {saving
                        ? "Approving…"
                        : "Approve Completion"}
                    </button>

                    <button
                      onClick={
                        rejectProof
                      }
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />

                      {saving
                        ? "Processing…"
                        : "Reject Proof"}
                    </button>
                  </div>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Approve only if the photo clearly shows that the reported issue has been fixed.
                  </p>
                </div>
              )}

              {/* PROOF REJECTION MESSAGE */}

              {selected.proof_rejection_reason && (
                <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                        Completion Proof Rejected
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Manager's Message
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {
                          selected.proof_rejection_reason
                        }
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        The worker must correct the issue and submit new completion proof.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPLETION NOTE */}

              {selected.completion_note && (
                <div className="mt-3 rounded-xl border border-success/20 bg-success/5 p-3">
                  <p className="text-xs font-semibold text-success">
                    Work Completion Note
                  </p>

                  <p className="mt-0.5 text-sm text-foreground">
                    {
                      selected.completion_note
                    }
                  </p>
                </div>
              )}

              {/* REJECTION REASON */}

              {(
                selected.verification_status ||
                selected.verificationStatus
              ) ===
                "Rejected" &&
                (
                  selected.rejection_reason ||
                  selected.rejectionReason
                ) && (
                  <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold text-destructive">
                      Rejection Reason
                    </p>

                    <p className="mt-0.5 text-sm text-foreground">
                      {selected.rejection_reason ||
                        selected.rejectionReason}
                    </p>
                  </div>
                )}

              {/* VERIFICATION DECISION */}

              {(
                selected.work_status ||
                selected.workStatus
              ) !== "Completed" && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Verification Decision
                  </p>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Rejection reason
                      </label>

                      <input
                        value={
                          rejectReason
                        }
                        onChange={(e) =>
                          setRejectReason(
                            e.target.value
                          )
                        }
                        placeholder="Enter reason for rejection…"
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={approve}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-success/90 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />

                        {saving
                          ? "Processing…"
                          : "Approve"}
                      </button>

                      <button
                        onClick={reject}
                        disabled={
                          saving ||
                          !rejectReason.trim()
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />

                        {saving
                          ? "Processing…"
                          : "Reject"}
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      The manager can change the verification decision later if required.
                    </p>
                  </div>
                </div>
              )}

              {/* ASSIGN WORKER */}

              {(
                selected.verification_status ||
                selected.verificationStatus
              ) ===
                "Approved" &&
                !isProofSubmitted(
                  selected
                ) &&
                (
                  selected.work_status ||
                  selected.workStatus
                ) !== "Completed" && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Assign Worker
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* DEPARTMENT */}

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Department
                        </label>

                        <select
                          value={
                            assignDept
                          }
                          onChange={(e) => {
                            setAssignDept(
                              e.target.value
                            );

                            setAssignWorkerId(
                              ""
                            );
                          }}
                          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                        >
                          <option value="">
                            — Select —
                          </option>

                          {departments.map(
                            (d) => (
                              <option
                                key={d.id}
                                value={d.id}
                              >
                                {d.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* WORKER */}

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Worker
                        </label>

                        <select
                          value={
                            assignWorkerId
                          }
                          onChange={(e) =>
                            setAssignWorkerId(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                        >
                          <option value="">
                            — Select —
                          </option>

                          {workersInDept.map(
                            (w) => {
                              const profile =
                                getProfile(
                                  w.profile_id
                                );

                              return (
                                <option
                                  key={w.id}
                                  value={w.id}
                                >
                                  {profile?.full_name ||
                                    w.employee_id ||
                                    "Worker"}
                                </option>
                              );
                            }
                          )}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={
                        handleAssign
                      }
                      disabled={
                        saving ||
                        !assignWorkerId
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />

                      {saving
                        ? "Assigning…"
                        : "Assign Complaint"}
                    </button>
                  </div>
                )}

              {/* COMPLETED */}

              {(
                selected.work_status ||
                selected.workStatus
              ) ===
                "Completed" && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Complaint Resolved
                      </p>

                      <p className="text-xs text-green-700">
                        The manager approved the worker's completion proof.
                      </p>
                    </div>
                  </div>

                  {getCompletionProof(
                    selected
                  ) && (
                    <div className="mt-3 overflow-hidden rounded-xl">
                      <img
                        src={getCompletionProof(
                          selected
                        )}
                        alt="Approved completion proof"
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CLOSE */}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() =>
                    setSelected(null)
                  }
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}