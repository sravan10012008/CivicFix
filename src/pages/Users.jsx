import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wrench,
  Users,
  BarChart3,
  Search,
  UserRound,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/complaints";

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

const roleLabels = {
  citizen: "Citizen",
  worker: "Worker",
  admin: "Manager",
};

export default function UsersPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);

      try {
        const [
          profilesResult,
          departmentsResult,
          workersResult,
          complaintsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
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

          supabase
            .from("complaints")
            .select("citizen_id, complaint_id")
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (profilesResult.error) {
          throw profilesResult.error;
        }

        if (departmentsResult.error) {
          throw departmentsResult.error;
        }

        if (workersResult.error) {
          throw workersResult.error;
        }

        if (complaintsResult.error) {
          throw complaintsResult.error;
        }

        const profiles = profilesResult.data || [];
        const departmentsData = departmentsResult.data || [];
        const workersData = workersResult.data || [];
        const complaintsData = complaintsResult.data || [];

        /*
         * Create a map:
         *
         * citizen_id -> complaint IDs
         *
         * Example:
         *
         * user1 -> CF-1007, CF-1006
         * user2 -> CF-1005
         */

        const complaintsByCitizen = {};

        complaintsData.forEach((complaint) => {
          if (!complaint.citizen_id) {
            return;
          }

          if (!complaintsByCitizen[complaint.citizen_id]) {
            complaintsByCitizen[complaint.citizen_id] = [];
          }

          if (complaint.complaint_id) {
            complaintsByCitizen[complaint.citizen_id].push(
              complaint.complaint_id
            );
          }
        });

        /*
         * Combine profile information
         * with worker and complaint information.
         */

        const formattedUsers = profiles.map((profile) => {
          const worker = workersData.find(
            (w) => w.profile_id === profile.id
          );

          const complaintIds =
            complaintsByCitizen[profile.id] || [];

          return {
            ...profile,

            name: profile.full_name,

            email: profile.email || null,

            departmentId:
              worker?.department_id || null,

            role: profile.role || "citizen",

            created_date: profile.created_at,

            complaintIds,

            complaintCount: complaintIds.length,
          };
        });

        setUsers(formattedUsers);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error loading users:", error);

        setUsers([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  /*
   * USER STATISTICS
   */

  const totalUsers = users.length;

  const totalCitizens = users.filter(
    (u) => u.role === "citizen"
  ).length;

  const totalWorkers = users.filter(
    (u) => u.role === "worker"
  ).length;

  const totalManagers = users.filter(
    (u) => u.role === "admin"
  ).length;

  /*
   * SEARCH + ROLE FILTER
   */

  const filtered = users.filter((u) => {
    const searchText = [
      u.name,
      u.full_name,
      u.email,
      u.phone,
      u.role,
      ...(u.complaintIds || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(
      query.toLowerCase()
    );

    const matchesRole =
      roleFilter === "All" ||
      u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const userName =
    user?.full_name ||
    user?.name ||
    "Manager";

  return (
    <DashboardLayout
      items={nav}
      role="Authority"
      user={userName}
      title="Users"
      subtitle="View all registered users and their complaints."
    >
      {/* USER STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Users
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading ? "—" : totalUsers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Citizens */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Citizens
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading ? "—" : totalCitizens}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Workers */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Workers
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading ? "—" : totalWorkers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Managers */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Managers
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading ? "—" : totalManagers}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}

      <div className="mt-6 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            "All",
            "citizen",
            "worker",
            "admin",
          ].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? "bg-foreground text-white"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {r === "All"
                ? "All Roles"
                : roleLabels[r] || r}
            </button>
          ))}
        </div>

        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search users…"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* RESULT COUNT */}

      {!loading && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {users.length}
            </span>{" "}
            users
          </p>
        </div>
      )}

      {/* USERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  Name
                </th>

                <th className="px-4 py-3 font-semibold">
                  Email
                </th>

                <th className="px-4 py-3 font-semibold">
                  Phone
                </th>

                <th className="px-4 py-3 font-semibold">
                  Role
                </th>

                <th className="px-4 py-3 font-semibold">
                  Department
                </th>

                <th className="px-4 py-3 font-semibold">
                  Complaints
                </th>

                <th className="px-4 py-3 font-semibold">
                  Complaint ID
                </th>

                <th className="px-4 py-3 font-semibold">
                  Joined
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const dept = departments.find(
                    (d) =>
                      d.id === u.departmentId
                  );

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* NAME */}

                      <td className="px-4 py-3 font-medium text-foreground">
                        {u.name ||
                          u.full_name ||
                          "—"}
                      </td>

                      {/* EMAIL */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {u.email || "—"}
                      </td>

                      {/* PHONE */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {u.phone || "—"}
                      </td>

                      {/* ROLE */}

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-accent/10 text-accent"
                              : u.role === "worker"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {roleLabels[u.role] ||
                            u.role}
                        </span>
                      </td>

                      {/* DEPARTMENT */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {dept?.name || "—"}
                      </td>

                      {/* COMPLAINT COUNT */}

                      <td className="px-4 py-3">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                          {u.complaintCount}
                        </span>
                      </td>

                      {/* COMPLAINT IDs */}

                      <td className="px-4 py-3">
                        {u.complaintIds &&
                        u.complaintIds.length > 0 ? (
                          <div className="flex max-w-[260px] flex-wrap gap-1.5">
                            {u.complaintIds.map(
                              (complaintId) => (
                                <Link
                                  key={
                                    complaintId
                                  }
                                  to={`/complaint/${complaintId}`}
                                  className="inline-flex rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 hover:underline"
                                >
                                  {complaintId}
                                </Link>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      {/* JOINED */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          u.created_date
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