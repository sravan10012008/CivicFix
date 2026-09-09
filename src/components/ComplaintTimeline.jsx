import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const statusStyle = {
  done: {
    ring: "bg-success",
    line: "bg-success",
    text: "text-success",
  },

  active: {
    ring: "bg-primary",
    line: "bg-primary",
    text: "text-primary",
  },

  pending: {
    ring: "bg-muted-foreground/30",
    line: "bg-border",
    text: "text-muted-foreground",
  },
};

function getDisplayStatus(status) {
  switch (status) {
    case "Pending":
      return "Pending";

    case "Approved":
      return "Approved";

    case "Assigned":
      return "Assigned";

    case "In Progress":
      return "In Progress";

    case "Proof Submitted":
      return "Proof Submitted";

    case "Completed":
      return "Completed";

    case "Resolved":
      return "Resolved";

    default:
      return status || "Pending";
  }
}

function formatDate(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getEventState(event, index, events) {
  const status = event.status;

  /*
   * These statuses represent workflow events
   * that have already occurred and are stored
   * in the complaint history.
   *
   * Pending is included because it is the
   * initial recorded complaint state.
   */
  const completedStatuses = [
    "Pending",
    "Approved",
    "Assigned",
    "In Progress",
    "Proof Submitted",
    "Completed",
    "Resolved",
  ];

  const isLast = index === events.length - 1;

  /*
   * If the event is already a UI-style status,
   * keep it.
   */
  if (
    status === "done" ||
    status === "active" ||
    status === "pending"
  ) {
    return status;
  }

  /*
   * Completed/previous events are shown as done.
   */
  if (
    status === "Completed" ||
    status === "Resolved"
  ) {
    return "done";
  }

  /*
   * If this is the final event and it isn't completed,
   * show it as the current active step.
   */
  if (isLast) {
    return "active";
  }

  /*
   * Previous workflow steps are completed.
   *
   * Pending is included here because it represents
   * the initial historical event of the complaint.
   */
  if (completedStatuses.includes(status)) {
    return "done";
  }

  return "pending";
}

export default function ComplaintTimeline({
  events = [],
}) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          No timeline information is available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-2">

      {events.map((event, index) => {

        const state = getEventState(
          event,
          index,
          events
        );

        const style =
          statusStyle[state];

        const isLast =
          index === events.length - 1;

        const title =
          event.title ||
          getDisplayStatus(
            event.status
          );

        const date =
          event.date ||
          formatDate(
            event.timestamp ||
              event.created_at
          );

        const note =
          event.note ||
          event.message ||
          "";

        return (
          <motion.div
            key={
              event.id ||
              `${event.status}-${index}`
            }
            initial={{
              opacity: 0,
              x: -10,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
            }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >

            {!isLast && (
              <span
                className={cn(
                  "absolute left-[14px] top-7 h-[calc(100%-7px)] w-px",
                  style.line
                )}
                aria-hidden
              />
            )}

            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                style.ring
              )}
            >

              {state === "done" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5 text-white"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {state === "active" && (
                <span className="h-2 w-2 rounded-full bg-white" />
              )}

              {state === "pending" && (
                <span className="h-2 w-2 rounded-full border border-white" />
              )}

            </span>

            <div className="min-w-0 pt-0.5">

              <p
                className={cn(
                  "text-sm font-semibold",
                  state === "pending"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {title}
              </p>

              {date && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {date}
                </p>
              )}

              {note && (
                <p className="mt-1 text-xs italic text-muted-foreground/80">
                  "{note}"
                </p>
              )}

            </div>

          </motion.div>
        );
      })}

    </div>
  );
}