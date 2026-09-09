import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wrench,
  Users,
  BarChart3,
  Search,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getComplaintId,
  formatDate,
} from "@/lib/complaints";

/*
 * CIVIC ISSUE CATEGORIES
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
  "Not Assigned",
  "Pending",
  "Assigned",
  "In Progress",
  "Proof Submitted",
  "Completed",
];

export default function AllComplaints() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [verFilter, setVerFilter] =
    useState("All");
  const [workFilter, setWorkFilter] =
    useState("All");
  const [catFilter, setCatFilter] =
    useState("All");

  const [complaints, setComplaints] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [workers, setWorkers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * LOAD DATA FROM SUPABASE
   */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          complaintsResult,
          departmentsResult,
          workersResult,
        ] = await Promise.all([
          supabase
            .from("complaints")
            .select("*")
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("departments")
            .select(
              "id, name, description"
            )
            .order("name", {
              ascending: true,
            }),

          supabase
            .from("workers")
            .select(
              "id, profile_id, department_id, employee_id, status"
            ),
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

        setComplaints(
          complaintsResult.data || []
        );

        setDepartments(
          departmentsResult.data || []
        );

        setWorkers(
          workersResult.data || []
        );
      } catch (err) {
        console.error(
          "Failed to load complaints:",
          err
        );

        setError(
          err?.message ||
            "Failed to load complaints."
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  /*
   * CATEGORY LABEL
   */

  const getCategoryLabel = (
    category
  ) => {
    return (
      issueCategories.find(
        (cat) =>
          cat.id === category
      )?.label ||
      category ||
      "—"
    );
  };

  /*
   * DEPARTMENT
   */

  const getDepartment = (
    departmentId
  ) => {
    return departments.find(
      (department) =>
        department.id ===
        departmentId
    );
  };

  /*
   * WORKER
   */

  const getWorker = (
    workerId
  ) => {
    return workers.find(
      (worker) =>
        worker.id === workerId
    );
  };

  /*
   * FILTER COMPLAINTS
   */

  const filtered =
    complaints.filter((c) => {
      const catLabel =
        c.category_label ||
        getCategoryLabel(
          c.category
        );

      const complaintId =
        c.complaint_id ||
        c.complaintId ||
        getComplaintId(c) ||
        "";

      const title =
        c.title || "";

      const location =
        c.location || "";

      const description =
        c.description || "";

      const searchText = [
        complaintId,
        title,
        catLabel,
        location,
        description,
      ]
        .map((value) =>
          String(value)
            .trim()
            .toLowerCase()
        )
        .join(" ");

      const searchQuery =
        query
          .trim()
          .toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        searchText.includes(
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

      const matchesVerification =
        verFilter === "All" ||
        verificationStatus ===
          verFilter;

      const matchesWorkStatus =
        workFilter === "All" ||
        workStatus ===
          workFilter;

      const matchesCategory =
        catFilter === "All" ||
        c.category ===
          catFilter;

      return (
        matchesSearch &&
        matchesVerification &&
        matchesWorkStatus &&
        matchesCategory
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
      title="All Complaints"
      subtitle="Full complaint registry with advanced filtering."
    >
      {/* FILTERS */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* CATEGORY */}

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

          {/* VERIFICATION */}

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

          {/* WORK STATUS */}

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

        {/* SEARCH */}

        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search complaints…"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* COMPLAINT TABLE */}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
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
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>
                </tr>
              ) : filtered.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No complaints found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const catLabel =
                    c.category_label ||
                    getCategoryLabel(
                      c.category
                    );

                  const departmentId =
                    c.department_id ||
                    c.departmentId;

                  const workerId =
                    c.assigned_worker_id ||
                    c.assignedWorkerId ||
                    c.worker_id;

                  const dept =
                    getDepartment(
                      departmentId
                    );

                  const worker =
                    getWorker(workerId);

                  const verificationStatus =
                    c.verification_status ||
                    c.verificationStatus;

                  const workStatus =
                    c.work_status ||
                    c.workStatus;

                  const createdDate =
                    c.created_at ||
                    c.created_date;

                  const complaintId =
                    c.complaint_id ||
                    c.complaintId ||
                    getComplaintId(c);

                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* ID */}

                      <td className="px-4 py-3 font-semibold text-foreground">
                        {complaintId}
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
                        <StatusBadge
                          status={
                            workStatus
                          }
                          size="sm"
                        />
                      </td>

                      {/* DEPARTMENT */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {dept?.name ||
                          "—"}
                      </td>

                      {/* WORKER */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {worker?.employee_id ||
                          "—"}
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          createdDate
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}