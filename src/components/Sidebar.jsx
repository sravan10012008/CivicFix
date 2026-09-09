import { Link, useLocation } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({
  items = [],
  role = "Citizen",
  greeting,
  onLogout,
}) {
  const location = useLocation();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
            <Shield className="h-5 w-5" />
          </span>

          <span className="font-heading text-lg font-bold text-foreground">
            CivicFix
          </span>
        </Link>
      </div>

      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {role}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {greeting || "User"}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && (
                <Icon className="h-4 w-4 shrink-0" />
              )}

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}