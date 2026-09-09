import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";
import {
  getComplaintId,
  formatDate,
} from "@/lib/complaints";

export default function ComplaintCard({
  complaint,
  index = 0,
}) {
  const catLabel =
    complaint.category_label ||
    complaint.category ||
    "Unknown Category";

  /*
   * REJECTED HAS HIGHEST PRIORITY
   *
   * A rejected complaint may still have
   * work_status = "Pending" in the database.
   *
   * Therefore, always check verification_status
   * first. If it is rejected, show Rejected.
   *
   * Otherwise, show the actual work status.
   */

  const verificationStatus =
    complaint.verification_status ||
    complaint.verificationStatus ||
    "";

  const workStatus =
    complaint.workStatus ||
    complaint.work_status ||
    complaint.status ||
    "Pending";

  const displayStatus =
    verificationStatus === "Rejected" ||
    complaint.status === "Rejected"
      ? "Rejected"
      : workStatus;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
    >

      {/* HEADER */}

      <div className="flex items-start justify-between">

        <div>

          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {getComplaintId(complaint)}
          </span>

          <h3 className="mt-1 text-base font-semibold text-foreground">
            {catLabel}
          </h3>

        </div>

        {/* STATUS */}

        <StatusBadge
          status={displayStatus}
        />

      </div>

      {/* LOCATION */}

      <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">

        <MapPin className="h-4 w-4" />

        {complaint.location ||
          "Location not provided"}

      </div>

      {/* FOOTER */}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">

        <span className="text-xs text-muted-foreground">
          {formatDate(
            complaint.created_date ||
              complaint.created_at
          )}
        </span>

        <div className="flex gap-2">

          {/* VIEW */}

          <Link
            to={`/complaint/${complaint.id}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
          >
            View
          </Link>

          {/* TRACK */}

          <Link
            to={`/track?complaint=${encodeURIComponent(
              getComplaintId(complaint)
            )}`}
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary"
          >
            Track
          </Link>

        </div>

      </div>

    </motion.div>
  );
}