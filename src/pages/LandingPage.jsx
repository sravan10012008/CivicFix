import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroVisual from "@/components/HeroVisual";
import IssueCard from "@/components/IssueCard";
import ComplaintTimeline from "@/components/ComplaintTimeline";
import StatCard from "@/components/StatCard";

/*
 * Static landing-page content.
 *
 * These are only used to display information on the
 * public landing page. They are not application/database data.
 *
 * Keeping them locally makes the landing page self-contained.
 */

const issueCategories = [
  {
    id: "garbage",
    label: "Garbage",
  },
  {
    id: "pothole",
    label: "Pothole / Road Damage",
  },
  {
    id: "streetlight",
    label: "Broken Streetlight",
  },
  {
    id: "water",
    label: "Water Leakage",
  },
  {
    id: "drainage",
    label: "Drainage Problem",
  },
  {
    id: "tree",
    label: "Fallen Tree",
  },
  {
    id: "electrical",
    label: "Electrical Problem",
  },
  {
    id: "infrastructure",
    label: "Public Infrastructure",
  },
  {
    id: "park",
    label: "Park / Public Area",
  },
  {
    id: "other",
    label: "Other",
  },
];

const howItWorks = [
  {
    num: "01",
    title: "Report an Issue",
    desc: "Submit a civic complaint with the issue details, location, and photo.",
  },
  {
    num: "02",
    title: "Get Verified",
    desc: "The concerned authority reviews and verifies your complaint.",
  },
  {
    num: "03",
    title: "Work Gets Assigned",
    desc: "The verified complaint is assigned to the appropriate department and worker.",
  },
  {
    num: "04",
    title: "Track & Resolve",
    desc: "Follow the progress until the issue is completed and resolved.",
  },
];

const heroStats = [
  {
    label: "Issues Reported",
    value: "1K+",
  },
  {
    label: "Issues Resolved",
    value: "800+",
  },
  {
    label: "Active Citizens",
    value: "500+",
  },
];

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },

  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  id,
}) {
  return (
    <div
      id={id}
      className="mx-auto max-w-2xl text-center"
    >
      {eyebrow && (
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
      )}

      <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  /*
   * Static example used only for the public
   * tracking preview.
   *
   * This is NOT application/database data.
   */

  const sample = {
    id: "CF-1024",
    issue: "Broken Streetlight",
    location: "Main Road, Sector 12",

    timeline: [
      {
        title: "Complaint Reported",
        date: "2 Sept, 10:32 AM",
        status: "done",
      },
      {
        title: "Complaint Assigned",
        date: "2 Sept, 11:15 AM",
        status: "done",
      },
      {
        title: "Worker Started Work",
        date: "2 Sept, 1:40 PM",
        status: "active",
      },
      {
        title: "Issue Resolved",
        date: "Pending",
        status: "pending",
      },
    ],
  };

  /*
   * Static preview statistics for the
   * public landing page.
   *
   * These are visual examples only.
   * They are NOT application/database data.
   */

  const previewStats = [
    {
      label: "Total Reports",
      value: 8,
      icon: "FileText",
      tone: "primary",
    },
    {
      label: "Pending",
      value: 2,
      icon: "Clock",
      tone: "warning",
    },
    {
      label: "In Progress",
      value: 3,
      icon: "Loader",
      tone: "secondary",
    },
    {
      label: "Resolved",
      value: 3,
      icon: "CheckCircle2",
      tone: "success",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main className="content-above-glow">

        {/* HERO */}

        <section className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-36 sm:pb-24">

          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">

            <div>

              <motion.span
                initial={{
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  ★
                </span>

                Report. Track. Resolve.
              </motion.span>

              <motion.h1
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.7,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                }}
                className="mt-5 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl"
              >
                Fix Your City,
                <br />

                <span className="text-gradient-brand">
                  One Report at a Time.
                </span>
              </motion.h1>

              <motion.p
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                }}
                className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg"
              >
                Report civic issues, track their progress,
                and help make your community better — from
                potholes to broken streetlights.
              </motion.p>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.2,
                }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >

                <Link
                  to="/report"
                  className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary hover:shadow-glow"
                >
                  Report an Issue

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/track"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-muted"
                >
                  Track Complaint
                </Link>

              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                }}
                className="mt-10 grid max-w-md grid-cols-3 gap-4"
              >

                {heroStats.map((s) => (
                  <div key={s.label}>

                    <p className="font-heading text-2xl font-bold text-foreground">
                      {s.value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.label}
                    </p>

                  </div>
                ))}

              </motion.div>

            </div>

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
            >
              <HeroVisual />
            </motion.div>

          </div>
        </section>

        {/* HOW IT WORKS */}

        <section
          id="how-it-works"
          className="px-4 py-20 sm:px-6 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">

            <SectionHeading
              eyebrow="Process"
              title="How CivicFix Works"
              subtitle="From spotting a problem to getting it resolved — four simple steps."
            />

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {howItWorks.map(
                (step, i) => (
                  <motion.div
                    key={step.num}
                    variants={fadeUp}
                    custom={i}
                    initial="hidden"
                    whileInView="show"
                    viewport={{
                      once: true,
                      margin: "-60px",
                    }}
                    whileHover={{
                      y: -6,
                    }}
                    className="relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-card"
                  >

                    <span className="font-heading text-4xl font-extrabold text-primary/15">
                      {step.num}
                    </span>

                    <h3 className="mt-3 text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {step.desc}
                    </p>

                  </motion.div>
                )
              )}

            </div>
          </div>
        </section>

        {/* ISSUE CATEGORIES */}

        <section
          id="features"
          className="px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">

            <SectionHeading
              eyebrow="Categories"
              title="Report Any Civic Issue"
              subtitle="Choose from a range of categories designed to cover everyday public problems."
            />

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

              {issueCategories.map(
                (c, i) => (
                  <IssueCard
                    key={c.id}
                    category={c}
                    index={i}
                  />
                )
              )}

            </div>
          </div>
        </section>

        {/* TRACKING PREVIEW */}

        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">

            <SectionHeading
              eyebrow="Tracking"
              title="Know What Happens Next."
              subtitle="Every complaint moves through a clear lifecycle you can follow in real time."
            />

            <div className="mt-14 grid gap-8 lg:grid-cols-2">

              <motion.div
                initial={{
                  opacity: 0,
                  x: -24,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.6,
                }}
                className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {sample.id}
                    </span>

                    <h3 className="mt-1 text-xl font-semibold text-foreground">
                      {sample.issue}
                    </h3>

                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    In Progress
                  </span>

                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  📍 {sample.location}
                </p>

                <div className="mt-6">

                  <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>
                      Reported
                    </span>

                    <span>
                      Resolved
                    </span>
                  </div>

                  <div className="relative h-2 w-full rounded-full bg-muted">

                    <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-gradient-to-r from-primary to-secondary" />

                    <span className="absolute -top-1 left-2/3 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-card bg-primary" />

                  </div>

                </div>

                <Link
                  to="/track"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
                >
                  Track a Complaint

                  <ArrowUpRight className="h-4 w-4" />
                </Link>

              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                  x: 24,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.1,
                }}
                className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
              >

                <h3 className="text-base font-semibold text-foreground">
                  Complaint Timeline
                </h3>

                <div className="mt-6">
                  <ComplaintTimeline
                    events={sample.timeline}
                  />
                </div>

              </motion.div>

            </div>
          </div>
        </section>

        {/* CITIZEN DASHBOARD PREVIEW */}

        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">

            <SectionHeading
              eyebrow="Citizen"
              title="Your Personal Dashboard"
              subtitle="A clean overview of every report you've filed and its current status."
            />

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {previewStats.map(
                (s, i) => (
                  <StatCard
                    key={s.label}
                    stat={s}
                    index={i}
                  />
                )
              )}

            </div>

          </div>
        </section>

        {/* CTA */}

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-foreground to-slate-800 p-10 text-center shadow-glow sm:p-16">

            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to fix your city?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
              Join CivicFix and turn everyday civic problems into resolved
              issues.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-foreground transition-transform hover:scale-[1.02]"
              >
                Create an Account

                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/report"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Report an Issue
              </Link>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}