// @ts-nocheck

import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import PropTypes from "prop-types";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        <Link to="/" className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Shield className="h-5 w-5" />
          </span>

          <span className="font-heading text-lg font-bold">
            CivicFix
          </span>
        </Link>

        <div className="relative">
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Fix Your City,
            <br />
            One Report at a Time.
          </h2>

          <p className="mt-4 max-w-sm text-sm text-slate-300">
            Report civic issues, track their progress, and help make your
            community better.
          </p>

          <div className="mt-8 flex gap-8">
            {[
              ["500+", "Reported"],
              ["320+", "Resolved"],
              ["24/7", "Tracking"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-heading text-2xl font-bold">
                  {value}
                </p>

                <p className="text-xs text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          © 2026 CivicFix — College cloud computing project.
        </p>
      </div>

      <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
              <Shield className="h-5 w-5" />
            </span>

            <span className="font-heading text-lg font-bold">
              CivicFix
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}

          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};