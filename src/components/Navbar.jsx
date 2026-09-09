import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/complaints";

const links = [
  { label: "Home", to: "/" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Features", to: "/#features" },
  { label: "Track Complaint", to: "/track" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleNav = (to) => {
    if (to.startsWith("/#")) {
      const id = to.slice(2);

      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(
          () =>
            document
              .getElementById(id)
              ?.scrollIntoView({ behavior: "smooth" }),
          120
        );
      } else {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(to);
    }

    setOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6"
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 sm:px-5",
          scrolled
            ? "glass border-border shadow-soft"
            : "border-transparent bg-white/0"
        )}
      >
        {/* LOGO */}

        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
            <img
              src="/favicon.svg"
              alt="CivicFix"
              className="h-7 w-7 object-contain"
            />
          </span>

          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            CivicFix
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNav(l.to)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <button
              onClick={() =>
                navigate(getDashboardPath(user?.role))
              }
              className="group inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary"
            >
              Dashboard

              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/register")}
                className="group inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary"
              >
                Get Started

                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card md:hidden"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-border glass p-2 md:hidden"
          >
            {links.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNav(l.to)}
                className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </button>
            ))}

            <div className="mt-1 flex gap-2 border-t border-border p-2">
              {isAuthenticated ? (
                <button
                  onClick={() =>
                    navigate(
                      getDashboardPath(user?.role)
                    )
                  }
                  className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() =>
                      navigate("/login")
                    }
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                  >
                    Login
                  </button>

                  <button
                    onClick={() =>
                      navigate("/register")
                    }
                    className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}