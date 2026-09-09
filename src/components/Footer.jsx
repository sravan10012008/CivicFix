import { Link } from "react-router-dom";
import { Shield, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              to="/"
              className="flex items-center gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
                <Shield className="h-5 w-5" />
              </span>

              <span className="font-heading text-lg font-bold">
                CivicFix
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Report. Track. Resolve. A modern civic
              issue reporting and resolution platform
              built for citizens, authorities, and field
              workers.
            </p>

            <div className="mt-5 flex gap-3">
              {[Twitter, Github, Linkedin].map(
                (Icon, i) => (
                  <span
                    key={i}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">
              Product
            </h4>

            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/"
                  className="hover:text-foreground"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/report"
                  className="hover:text-foreground"
                >
                  Report Issue
                </Link>
              </li>

              <li>
                <Link
                  to="/track"
                  className="hover:text-foreground"
                >
                  Track Complaint
                </Link>
              </li>

              <li>
                <Link
                  to="/citizen"
                  className="hover:text-foreground"
                >
                  Citizen Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">
              Dashboards
            </h4>

            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/admin"
                  className="hover:text-foreground"
                >
                  Authority
                </Link>
              </li>

              <li>
                <Link
                  to="/worker"
                  className="hover:text-foreground"
                >
                  Worker
                </Link>
              </li>

              <li>
                <Link
                  to="/citizen"
                  className="hover:text-foreground"
                >
                  Citizen
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="hover:text-foreground"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © 2026 CivicFix. A college cloud computing
            project.
          </p>

          <p>
            Civic Issue Reporting &amp; Resolution
            Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}