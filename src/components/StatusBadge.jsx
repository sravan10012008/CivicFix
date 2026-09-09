import { cn } from "@/lib/utils";

const statusMeta = {
  Pending: {
    label: "Pending",
    color: "warning",
    dot: "bg-warning",
  },

  "Pending Review": {
    label: "Pending Review",
    color: "warning",
    dot: "bg-warning",
  },

  Approved: {
    label: "Approved",
    color: "primary",
    dot: "bg-primary",
  },

  Assigned: {
    label: "Assigned",
    color: "secondary",
    dot: "bg-secondary",
  },

  "In Progress": {
    label: "In Progress",
    color: "primary",
    dot: "bg-primary",
  },

  "Proof Submitted": {
    label: "Proof Submitted",
    color: "secondary",
    dot: "bg-secondary",
  },

  Completed: {
    label: "Resolved",
    color: "success",
    dot: "bg-success",
  },

  Resolved: {
    label: "Resolved",
    color: "success",
    dot: "bg-success",
  },

  Rejected: {
    label: "Rejected",
    color: "destructive",
    dot: "bg-destructive",
  },
};

const toneMap = {
  warning:
    "bg-warning/10 text-warning ring-warning/20",

  secondary:
    "bg-secondary/10 text-secondary ring-secondary/20",

  primary:
    "bg-primary/10 text-primary ring-primary/20",

  success:
    "bg-success/10 text-success ring-success/20",

  destructive:
    "bg-destructive/10 text-destructive ring-destructive/20",
};

export default function StatusBadge({
  status,
  className,
  size = "default",
}) {
  const meta =
    statusMeta[status] || {
      label: status || "Unknown",
      color: "warning",
      dot: "bg-warning",
    };

  const sizes =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1"
      : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
        toneMap[meta.color] ||
          toneMap.warning,
        sizes,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.dot
        )}
      />

      {meta.label}
    </span>
  );
}