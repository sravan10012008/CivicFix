// Helper functions for complaint display formatting

export function formatComplaintId(id) {
  if (!id) return "—";
  const short = id.slice(-6).toUpperCase();
  return `CF-${short}`;
}

export function getComplaintId(complaint) {
  if (!complaint) return "—";
  return complaint.complaintId || formatComplaintId(complaint.id);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function getCategoryLabel(categoryId, categories) {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? cat.label : categoryId;
}

export function getDashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "worker") return "/worker";
  return "/citizen";
}

export function buildTimelineFromHistory(history) {
  if (!history || history.length === 0) return [];
  const statusTitles = {
    "Pending Review": "Complaint Submitted",
    "Approved": "Complaint Approved",
    "Rejected": "Complaint Rejected",
    "Not Assigned": "Complaint Submitted",
    "Assigned": "Complaint Assigned",
    "In Progress": "Work Started",
    "Completed": "Issue Resolved",
    "Pending": "Complaint Submitted",
    "Resolved": "Issue Resolved",
  };
  const sorted = [...history].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  return sorted.map((h, i) => ({
    title: statusTitles[h.status] || h.status,
    date: formatDateTime(h.created_date),
    status: i === sorted.length - 1 ? "active" : "done",
    note: h.note,
  }));
}

export function getProgressPercent(workStatus) {
  switch (workStatus) {
    case "Completed": return 100;
    case "In Progress": return 66;
    case "Assigned": return 33;
    default: return 12;
  }
}