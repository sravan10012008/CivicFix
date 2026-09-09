import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wrench,
  Users,
  BarChart3,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
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

export default function Reports() {
  const { user } = useAuth();

  const [complaints, setComplaints] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [workers, setWorkers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  /*
   * LOAD REPORT DATA
   */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

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
            .select("*")
            .order("name", {
              ascending: true,
            }),

          supabase
            .from("workers")
            .select("*"),
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

        const workerData =
          workersResult.data || [];

        let workerProfiles = [];

        /*
         * LOAD WORKER PROFILE NAMES
         */

        if (workerData.length > 0) {
          const profileIds =
            workerData.map(
              (worker) =>
                worker.profile_id
            );

          const {
            data: profiles,
            error: profilesError,
          } = await supabase
            .from("profiles")
            .select(
              "id, full_name"
            )
            .in(
              "id",
              profileIds
            );

          if (profilesError) {
            throw profilesError;
          }

          workerProfiles =
            profiles || [];
        }

        /*
         * COMBINE WORKER + PROFILE DATA
         */

        const formattedWorkers =
          workerData.map(
            (worker) => {
              const profile =
                workerProfiles.find(
                  (p) =>
                    p.id ===
                    worker.profile_id
                );

              return {
                ...worker,
                name:
                  profile?.full_name ||
                  "Worker",
              };
            }
          );

        setComplaints(
          complaintsResult.data ||
            []
        );

        setDepartments(
          departmentsResult.data ||
            []
        );

        setWorkers(
          formattedWorkers
        );
      } catch (error) {
        console.error(
          "Error loading reports:",
          error
        );

        setComplaints([]);
        setDepartments([]);
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * STATISTICS
   */

  const stats = [
    {
      label: "Total Complaints",
      value:
        complaints.length,
      icon: "FileText",
      tone: "primary",
    },
    {
      label: "Pending Review",
      value:
        complaints.filter(
          (c) =>
            c.verification_status ===
            "Pending Review"
        ).length,
      icon: "Clock",
      tone: "warning",
    },
    {
      label: "Approved",
      value:
        complaints.filter(
          (c) =>
            c.verification_status ===
            "Approved"
        ).length,
      icon: "CheckCircle2",
      tone: "success",
    },
    {
      label: "Rejected",
      value:
        complaints.filter(
          (c) =>
            c.verification_status ===
            "Rejected"
        ).length,
      icon: "XCircle",
      tone: "destructive",
    },
    {
      label: "Assigned",
      value:
        complaints.filter(
          (c) =>
            c.work_status ===
            "Assigned"
        ).length,
      icon: "UserCheck",
      tone: "secondary",
    },
    {
      label: "In Progress",
      value:
        complaints.filter(
          (c) =>
            c.work_status ===
            "In Progress"
        ).length,
      icon: "Loader",
      tone: "primary",
    },
    {
      label: "Resolved",
      value:
        complaints.filter(
          (c) =>
            c.work_status ===
            "Completed"
        ).length,
      icon: "CheckCircle2",
      tone: "success",
    },
  ];

  /*
   * COMPLAINTS BY CATEGORY
   */

  const byCategory =
    issueCategories
      .map((cat) => ({
        ...cat,
        count:
          complaints.filter(
            (c) =>
              c.category ===
              cat.id
          ).length,
      }))
      .filter(
        (c) => c.count > 0
      )
      .sort(
        (a, b) =>
          b.count - a.count
      );

  /*
   * COMPLAINTS BY DEPARTMENT
   */

  const byDepartment =
    departments
      .map((dept) => ({
        ...dept,
        count:
          complaints.filter(
            (c) =>
              c.department_id ===
              dept.id
          ).length,
      }))
      .sort(
        (a, b) =>
          b.count - a.count
      );

  /*
   * COMPLAINT STATUS BREAKDOWN
   *
   * Work status is used for the normal
   * complaint workflow.
   *
   * Rejected complaints are counted
   * separately using verification_status.
   */

  const statusBreakdown = [
    {
      label: "Pending",
      count:
        complaints.filter(
          (c) =>
            c.work_status ===
              "Pending" &&
            c.verification_status !==
              "Rejected"
        ).length,
    },
    {
      label: "Assigned",
      count:
        complaints.filter(
          (c) =>
            c.work_status ===
            "Assigned"
        ).length,
    },
    {
      label: "In Progress",
      count:
        complaints.filter(
          (c) =>
            c.work_status ===
            "In Progress"
        ).length,
    },
    {
      label: "Proof Submitted",
      count:
        complaints.filter(
          (c) =>
            c.work_status ===
            "Proof Submitted"
        ).length,
    },
    {
      label: "Resolved",
      count:
        complaints.filter(
          (c) =>
            c.work_status ===
            "Completed"
        ).length,
    },
    {
      label: "Rejected",
      count:
        complaints.filter(
          (c) =>
            c.verification_status ===
            "Rejected"
        ).length,
    },
  ];

  /*
   * MONTHLY COMPLAINT TREND
   */

  const monthlyComplaintTrend =
    (() => {
      const grouped = {};

      complaints.forEach(
        (complaint) => {
          if (
            !complaint.created_at
          ) {
            return;
          }

          const date =
            new Date(
              complaint.created_at
            );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return;
          }

          const year =
            date.getFullYear();

          const month =
            date.getMonth();

          const key = `${year}-${String(
            month + 1
          ).padStart(2, "0")}`;

          if (!grouped[key]) {
            grouped[key] = {
              year,
              month,
              count: 0,
            };
          }

          grouped[key].count +=
            1;
        }
      );

      return Object.entries(
        grouped
      )
        .map(
          ([key, value]) => ({
            key,
            ...value,
            label: new Date(
              value.year,
              value.month,
              1
            ).toLocaleDateString(
              "en-US",
              {
                month: "short",
                year: "numeric",
              }
            ),
          })
        )
        .sort((a, b) =>
          a.key.localeCompare(
            b.key
          )
        );
    })();

  /*
   * DEPARTMENT PERFORMANCE
   */

  const departmentPerformance =
    departments
      .map((department) => {
        const departmentComplaints =
          complaints.filter(
            (complaint) =>
              complaint.department_id ===
              department.id
          );

        const total =
          departmentComplaints.length;

        const pending =
          departmentComplaints.filter(
            (complaint) =>
              complaint.work_status ===
                "Pending" &&
              complaint.verification_status !==
                "Rejected"
          ).length;

        const inProgress =
          departmentComplaints.filter(
            (complaint) =>
              complaint.work_status ===
              "In Progress"
          ).length;

        const resolved =
          departmentComplaints.filter(
            (complaint) =>
              complaint.work_status ===
              "Completed"
          ).length;

        const resolutionRate =
          total > 0
            ? Math.round(
                (resolved / total) *
                  100
              )
            : 0;

        return {
          ...department,
          total,
          pending,
          inProgress,
          resolved,
          resolutionRate,
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total
      );

  /*
   * WORKER WORKLOAD
   */

  const workerWorkload =
    workers
      .map((worker) => {
        const department =
          departments.find(
            (dept) =>
              dept.id ===
              worker.department_id
          );

        const assigned =
          complaints.filter(
            (complaint) =>
              complaint.assigned_worker_id ===
              worker.id
          );

        return {
          ...worker,

          deptName:
            department?.name ||
            "—",

          total:
            assigned.length,

          inProgress:
            assigned.filter(
              (c) =>
                c.work_status ===
                "In Progress"
            ).length,

          completed:
            assigned.filter(
              (c) =>
                c.work_status ===
                "Completed"
            ).length,
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total
      );

  /*
   * MAXIMUM VALUES FOR BAR WIDTHS
   */

  const maxCatCount =
    Math.max(
      ...byCategory.map(
        (c) => c.count
      ),
      1
    );

  const maxDeptCount =
    Math.max(
      ...byDepartment.map(
        (d) => d.count
      ),
      1
    );

  const maxStatusCount =
    Math.max(
      ...statusBreakdown.map(
        (s) => s.count
      ),
      1
    );

  const maxMonthlyCount =
    Math.max(
      ...monthlyComplaintTrend.map(
        (m) => m.count
      ),
      1
    );

  const userName =
    user?.full_name ||
    user?.name ||
    "Manager";

  return (
    <DashboardLayout
      items={nav}
      role="Authority"
      user={userName}
      title="Reports & Statistics"
      subtitle="Overview of complaint data across the system."
    >
      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map(
          (s, i) => (
            <StatCard
              key={s.label}
              stat={s}
              index={i}
            />
          )
        )}
      </div>

      {/* CATEGORY AND DEPARTMENT */}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        {/* COMPLAINTS BY CATEGORY */}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">

          <h2 className="text-sm font-semibold text-foreground">
            Complaints by Category
          </h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map(
                (i) => (
                  <div
                    key={i}
                    className="h-8 animate-pulse rounded-lg bg-muted/40"
                  />
                )
              )}
            </div>
          ) : byCategory.length ===
            0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No data available.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {byCategory.map(
                (cat) => (
                  <div
                    key={cat.id}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">

                      <span className="font-medium text-foreground">
                        {cat.label}
                      </span>

                      <span className="text-muted-foreground">
                        {cat.count}
                      </span>

                    </div>

                    <div className="h-2 w-full rounded-full bg-muted">

                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${
                            (cat.count /
                              maxCatCount) *
                            100
                          }%`,
                        }}
                        transition={{
                          duration: 0.5,
                        }}
                        className="h-2 rounded-full bg-primary"
                      />

                    </div>
                  </div>
                )
              )}
            </div>
          )}

        </div>

        {/* COMPLAINTS BY DEPARTMENT */}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">

          <h2 className="text-sm font-semibold text-foreground">
            Complaints by Department
          </h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map(
                (i) => (
                  <div
                    key={i}
                    className="h-8 animate-pulse rounded-lg bg-muted/40"
                  />
                )
              )}
            </div>
          ) : byDepartment.length ===
            0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No data available.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {byDepartment.map(
                (dept) => (
                  <div
                    key={dept.id}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">

                      <span className="font-medium text-foreground">
                        {dept.name}
                      </span>

                      <span className="text-muted-foreground">
                        {dept.count}
                      </span>

                    </div>

                    <div className="h-2 w-full rounded-full bg-muted">

                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${
                            (dept.count /
                              maxDeptCount) *
                            100
                          }%`,
                        }}
                        transition={{
                          duration: 0.5,
                        }}
                        className="h-2 rounded-full bg-secondary"
                      />

                    </div>
                  </div>
                )
              )}
            </div>
          )}

        </div>

      </div>

      {/* COMPLAINT STATUS BREAKDOWN */}

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">

        <h2 className="text-sm font-semibold text-foreground">
          Complaint Status Breakdown
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Current distribution of complaints across the CivicFix workflow.
        </p>

        {loading ? (
          <div className="mt-5 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(
              (i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-lg bg-muted/40"
                />
              )
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {statusBreakdown.map(
              (status) => (
                <div
                  key={
                    status.label
                  }
                >
                  <div className="mb-1 flex items-center justify-between text-xs">

                    <span className="font-medium text-foreground">
                      {status.label}
                    </span>

                    <span className="text-muted-foreground">
                      {status.count}
                    </span>

                  </div>

                  <div className="h-3 w-full rounded-full bg-muted">

                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${
                          (status.count /
                            maxStatusCount) *
                          100
                        }%`,
                      }}
                      transition={{
                        duration: 0.5,
                      }}
                      className="h-3 rounded-full bg-primary"
                    />

                  </div>
                </div>
              )
            )}
          </div>
        )}

      </div>

      {/* COMPLAINT TREND */}

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Complaints Over Time
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Number of complaints submitted each month.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted/40" />
        ) : monthlyComplaintTrend.length ===
          0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No complaint history available.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto">

            <div className="flex min-w-[500px] items-end gap-4 px-2 pb-2">

              {monthlyComplaintTrend.map(
                (month) => {
                  const barHeight =
                    Math.max(
                      (month.count /
                        maxMonthlyCount) *
                        220,
                      month.count >
                        0
                        ? 12
                        : 0
                    );

                  return (
                    <div
                      key={
                        month.key
                      }
                      className="flex min-w-[70px] flex-1 flex-col items-center"
                    >

                      <div className="mb-2 text-xs font-semibold text-foreground">
                        {month.count}
                      </div>

                      <div className="flex h-[220px] w-full items-end justify-center">

                        <motion.div
                          initial={{
                            height: 0,
                          }}
                          animate={{
                            height:
                              barHeight,
                          }}
                          transition={{
                            duration: 0.5,
                          }}
                          className="w-10 rounded-t-lg bg-primary"
                          title={`${month.label}: ${month.count} complaints`}
                        />

                      </div>

                      <div className="mt-3 text-center text-xs text-muted-foreground">
                        {month.label}
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>
        )}

      </div>

      {/* DEPARTMENT PERFORMANCE */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">

        <div className="border-b border-border p-4">

          <h2 className="text-sm font-semibold text-foreground">
            Department Performance
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Complaint workload and resolution performance by department.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px] text-left text-sm">

            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">

              <tr>

                <th className="px-4 py-3 font-semibold">
                  Department
                </th>

                <th className="px-4 py-3 font-semibold">
                  Total
                </th>

                <th className="px-4 py-3 font-semibold">
                  Pending
                </th>

                <th className="px-4 py-3 font-semibold">
                  In Progress
                </th>

                <th className="px-4 py-3 font-semibold">
                  Resolved
                </th>

                <th className="px-4 py-3 font-semibold">
                  Resolution Rate
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {loading ? (
                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>

                </tr>
              ) : departmentPerformance.length ===
                0 ? (
                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No departments found.
                  </td>

                </tr>
              ) : (
                departmentPerformance.map(
                  (department) => (
                    <tr
                      key={
                        department.id
                      }
                      className="transition-colors hover:bg-muted/40"
                    >

                      <td className="px-4 py-3 font-medium text-foreground">
                        {department.name}
                      </td>

                      <td className="px-4 py-3 text-foreground">
                        {department.total}
                      </td>

                      <td className="px-4 py-3 text-warning">
                        {department.pending}
                      </td>

                      <td className="px-4 py-3 text-secondary">
                        {department.inProgress}
                      </td>

                      <td className="px-4 py-3 text-success">
                        {department.resolved}
                      </td>

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">

                            <div
                              className="h-full rounded-full bg-success"
                              style={{
                                width: `${department.resolutionRate}%`,
                              }}
                            />

                          </div>

                          <span className="font-medium text-foreground">
                            {
                              department.resolutionRate
                            }
                            %
                          </span>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* WORKER PERFORMANCE */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">

        <div className="border-b border-border p-4">

          <h2 className="text-sm font-semibold text-foreground">
            Worker Performance
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Workload and resolution performance of each worker.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] text-left text-sm">

            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">

              <tr>

                <th className="px-4 py-3 font-semibold">
                  Worker
                </th>

                <th className="px-4 py-3 font-semibold">
                  Department
                </th>

                <th className="px-4 py-3 font-semibold">
                  Total Assigned
                </th>

                <th className="px-4 py-3 font-semibold">
                  In Progress
                </th>

                <th className="px-4 py-3 font-semibold">
                  Completed
                </th>

                <th className="px-4 py-3 font-semibold">
                  Resolution Rate
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {loading ? (
                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>

                </tr>
              ) : workerWorkload.length ===
                0 ? (
                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No workers found.
                  </td>

                </tr>
              ) : (
                workerWorkload.map(
                  (worker) => {
                    const resolutionRate =
                      worker.total >
                      0
                        ? Math.round(
                            (worker.completed /
                              worker.total) *
                              100
                          )
                        : 0;

                    return (
                      <tr
                        key={
                          worker.id
                        }
                        className="transition-colors hover:bg-muted/40"
                      >

                        <td className="px-4 py-3 font-medium text-foreground">
                          {worker.name}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {worker.deptName}
                        </td>

                        <td className="px-4 py-3 text-foreground">
                          {worker.total}
                        </td>

                        <td className="px-4 py-3 text-secondary">
                          {
                            worker.inProgress
                          }
                        </td>

                        <td className="px-4 py-3 text-success">
                          {
                            worker.completed
                          }
                        </td>

                        <td className="px-4 py-3">

                          <div className="flex items-center gap-3">

                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">

                              <div
                                className="h-full rounded-full bg-success"
                                style={{
                                  width: `${resolutionRate}%`,
                                }}
                              />

                            </div>

                            <span className="font-medium text-foreground">
                              {
                                resolutionRate
                              }
                              %
                            </span>

                          </div>

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
    </DashboardLayout>
  );
}