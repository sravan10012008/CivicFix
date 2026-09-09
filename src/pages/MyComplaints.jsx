import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  Search,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
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

const filters = [
  "All",
  "Pending Review",
  "Approved",
  "Not Assigned",
  "Assigned",
  "In Progress",
  "Completed",
  "Rejected",
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getCategoryLabel(complaint) {
  return (
    issueCategories.find(
      (cat) =>
        cat.id === complaint?.category
    )?.label ||
    complaint?.category_label ||
    complaint?.category ||
    complaint?.title ||
    "Civic Issue"
  );
}

export default function MyComplaints() {
  const { user } = useAuth();

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [complaints, setComplaints] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadComplaints();
  }, [user]);

  /*
   * LOAD THE CURRENT CITIZEN'S COMPLAINTS
   * FROM SUPABASE
   */

  const loadComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      if (!user?.id) {
        setComplaints([]);
        return;
      }

      const {
        data,
        error: complaintsError,
      } = await supabase
        .from("complaints")
        .select("*")
        .eq("citizen_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (complaintsError) {
        console.error(
          "Unable to load complaints:",
          complaintsError
        );

        setError(
          complaintsError.message ||
            "Unable to load complaints."
        );

        setComplaints([]);
        return;
      }

      setComplaints(data || []);
    } catch (err) {
      console.error(
        "My complaints error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load complaints."
      );

      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * SEARCH + STATUS FILTER
   */

  const filtered =
    complaints.filter((c) => {
      const catLabel =
        getCategoryLabel(c);

      const complaintId =
        c.complaint_id || "";

      const searchText = [
        complaintId,
        catLabel,
        c.title,
        c.category,
        c.location,
        c.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQ =
        searchText.includes(
          query.toLowerCase()
        );

      const verificationStatus =
        c.verification_status ||
        "Pending Review";

      const workStatus =
        c.work_status ||
        c.status ||
        "Pending";

      const matchesF =
        filter === "All" ||
        verificationStatus ===
          filter ||
        workStatus === filter;

      return matchesQ && matchesF;
    });

  const userName =
    user?.name ||
    user?.full_name ||
    "Citizen";

  return (
    <DashboardLayout
      items={nav}
      role="Citizen"
      user={userName}
      title="My Complaints"
      subtitle="All civic issues you have reported."
    >
      {/* SEARCH + FILTERS */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="relative flex-1 sm:max-w-xs">

          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search by ID, issue, location…"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />

        </div>

        <div className="flex flex-wrap gap-1.5">

          {filters.map((f) => (
            <button
              key={f}
              onClick={() =>
                setFilter(f)
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-foreground text-white"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}

        </div>
      </div>

      {/* COMPLAINT TABLE */}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[640px] text-left text-sm">

            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">

              <tr>

                <th className="px-4 py-3 font-semibold">
                  Complaint ID
                </th>

                <th className="px-4 py-3 font-semibold">
                  Issue
                </th>

                <th className="px-4 py-3 font-semibold">
                  Location
                </th>

                <th className="px-4 py-3 font-semibold">
                  Date
                </th>

                <th className="px-4 py-3 font-semibold">
                  Verification
                </th>

                <th className="px-4 py-3 font-semibold">
                  Status
                </th>

                <th className="px-4 py-3 font-semibold text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {/* LOADING */}

              {loading ? (
                <tr>

                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>

                </tr>

              ) : error ? (

                /* ERROR */

                <tr>

                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">

                        <FileText className="h-5 w-5 text-destructive" />

                      </div>

                      <p className="mt-3 text-sm font-medium text-foreground">
                        Unable to load complaints.
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {error}
                      </p>

                      <button
                        onClick={
                          loadComplaints
                        }
                        className="mt-4 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary"
                      >
                        Try Again
                      </button>

                    </div>

                  </td>

                </tr>

              ) : filtered.length ===
                0 ? (

                /* NO COMPLAINTS */

                <tr>

                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">

                        <FileText className="h-5 w-5 text-muted-foreground" />

                      </div>

                      <p className="mt-3 text-sm font-medium text-foreground">
                        No complaints found.
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {query ||
                        filter !== "All"
                          ? "Try changing your search or filter."
                          : "You haven't reported any issues yet."}
                      </p>

                      {!query &&
                        filter ===
                          "All" && (
                          <Link
                            to="/report"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Report an Issue
                          </Link>
                        )}

                    </div>

                  </td>

                </tr>

              ) : (

                /* COMPLAINTS */

                filtered.map((c) => {

                  const catLabel =
                    getCategoryLabel(c);

                  const complaintId =
                    c.complaint_id ||
                    "—";

                  const verificationStatus =
                    c.verification_status ||
                    "Pending Review";

                  const workStatus =
                    c.work_status ||
                    c.status ||
                    "Pending";

                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-muted/40"
                    >

                      {/* COMPLAINT ID */}

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
                          "Location not available"}
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          c.created_at
                        )}
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

                      {/* ACTION */}

                      <td className="px-4 py-3 text-right">

                        <Link
                          to={`/complaint/${complaintId}`}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                        >
                          View
                        </Link>

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