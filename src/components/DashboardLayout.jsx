import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Menu, X, Search } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardLayout({
  items,
  role,
  user,
  children,
  title,
  subtitle,
  actions,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

  /*
   * Public pages use the normal CivicFix Navbar and Footer.
   * They should not show the dashboard sidebar.
   */
  if (role === "Public") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="content-above-glow mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
          {(title || subtitle || actions) && (
            <div className="mb-8">
              {title && (
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              )}

              {actions && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          )}

          {children}
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          items={items}
          role={role}
          greeting={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{
                type: "spring",
                damping: 26,
                stiffness: 240,
              }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <div className="relative h-full">

                <Sidebar
                  items={items}
                  role={role}
                  greeting={user}
                  onLogout={handleLogout}
                />

                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main dashboard area */}
      <div className="flex min-w-0 flex-1 flex-col">

        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">

          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">

            <h1 className="truncate font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {title}
            </h1>

            {subtitle && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            )}

          </div>

          <div className="hidden items-center rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground sm:flex">

            <Search className="mr-2 h-4 w-4" />

            <input
              className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search…"
            />

          </div>

          {/* Working notification button */}
          {actions && (
            <div className="flex items-center">
              {actions}
            </div>
          )}

          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white sm:flex">
            {typeof user === "string"
              ? user?.[0]?.toUpperCase() || "A"
              : "A"}
          </div>

        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">

          {children}

        </div>

      </div>

    </div>
  );
}