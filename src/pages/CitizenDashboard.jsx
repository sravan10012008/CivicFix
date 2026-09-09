import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ComplaintCard from "@/components/ComplaintCard";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

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

export default function CitizenDashboard() {
  const { user } = useAuth();

  const [complaints, setComplaints] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  /*
   * LOAD CITIZEN COMPLAINTS
   */

  useEffect(() => {
    const loadComplaints = async () => {
      if (!user) {
        setComplaints([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("complaints")
          .select("*")
          .eq("citizen_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(10);

        if (error) {
          throw error;
        }

        const formattedComplaints =
          (data || []).map((c) => ({
            ...c,

            citizenId:
              c.citizen_id,

            complaintId:
              c.complaint_id,

            categoryLabel:
              c.category_label,

            verificationStatus:
              c.verification_status,

            workStatus:
              c.work_status,

            createdDate:
              c.created_at,

            photoUrl:
              c.photo_url,
          }));

        setComplaints(
          formattedComplaints
        );
      } catch (error) {
        console.error(
          "Error loading complaints:",
          error
        );

        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [user]);

  /*
   * DASHBOARD STATISTICS
   *
   * Total Reports includes ALL complaints,
   * including rejected complaints.
   *
   * The four status categories below
   * therefore balance the total:
   *
   * Pending Review
   * + In Progress
   * + Resolved
   * + Rejected
   * = Total Reports
   */

  const stats = [
    {
      label: "Total Reports",
      value: complaints.length,
      icon: "FileText",
      tone: "primary",
    },

    {
      label: "Pending Review",
      value: complaints.filter(
        (c) =>
          c.verificationStatus ===
          "Pending Review"
      ).length,
      icon: "Clock",
      tone: "warning",
    },

    {
      label: "In Progress",
      value: complaints.filter(
        (c) =>
          c.workStatus ===
            "In Progress" ||
          c.workStatus ===
            "Assigned" ||
          c.workStatus ===
            "Proof Submitted"
      ).length,
      icon: "Loader",
      tone: "secondary",
    },

    {
      label: "Resolved",
      value: complaints.filter(
        (c) =>
          c.workStatus ===
            "Completed" ||
          c.workStatus ===
            "Resolved"
      ).length,
      icon: "CheckCircle2",
      tone: "success",
    },

    {
      label: "Rejected",
      value: complaints.filter(
        (c) =>
          c.verificationStatus ===
            "Rejected" ||
          c.status ===
            "Rejected"
      ).length,
      icon: "XCircle",
      tone: "destructive",
    },
  ];

  /*
   * USER NAME
   */

  const userName =
    user?.full_name ||
    user?.name ||
    "Citizen";

  /*
   * GREETING
   */

  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <DashboardLayout
      items={nav}
      role="Citizen"
      user={userName}
      title={`${greeting}, ${userName}`}
      subtitle="Here's what's happening with your reports."
    >

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

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

      {/* RECENT COMPLAINTS HEADER */}

      <div className="mt-8 flex items-center justify-between">

        <h2 className="font-heading text-lg font-semibold text-foreground">
          Recent Complaints
        </h2>

        <Link
          to="/my-complaints"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>

      </div>

      {/* LOADING */}

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {[1, 2, 3].map(
            (i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40"
              />
            )
          )}

        </div>
      ) : complaints.length === 0 ? (

        /* NO COMPLAINTS */

        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">

          <p className="text-sm text-muted-foreground">
            You haven't reported any issues yet.
          </p>

          <Link
            to="/report"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white hover:bg-primary"
          >
            <PlusCircle className="h-4 w-4" />

            Report an Issue
          </Link>

        </div>
      ) : (

        /* RECENT COMPLAINTS */

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {complaints
            .slice(0, 6)
            .map(
              (c, i) => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  index={i}
                />
              )
            )}

        </div>
      )}

    </DashboardLayout>
  );
}