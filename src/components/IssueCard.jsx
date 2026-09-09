import { motion } from "framer-motion";
import {
  Trash2,
  Construction,
  Lightbulb,
  Droplets,
  Waves,
  TreePine,
  Zap,
  Building2,
  Trees,
  CircleAlert,
  MapPin,
  Clock,
} from "lucide-react";

const categoryIcons = {
  garbage: Trash2,
  trash: Trash2,

  pothole: Construction,
  "road-damage": Construction,
  road_damage: Construction,

  streetlight: Lightbulb,
  "broken-streetlight": Lightbulb,
  street_light: Lightbulb,

  water: Droplets,
  "water-leakage": Droplets,
  water_leakage: Droplets,

  drainage: Waves,
  "drainage-problem": Waves,
  drainage_problem: Waves,

  tree: TreePine,
  "fallen-tree": TreePine,
  fallen_tree: TreePine,

  electrical: Zap,
  "electrical-problem": Zap,
  electrical_problem: Zap,

  infrastructure: Building2,
  "public-infrastructure": Building2,
  public_infrastructure: Building2,

  park: Trees,
  "public-area": Trees,
  "park-public-area": Trees,
  park_public_area: Trees,

  other: CircleAlert,
};

const categoryColors = {
  garbage: "bg-emerald-400",
  trash: "bg-emerald-400",

  pothole: "bg-orange-400",
  "road-damage": "bg-orange-400",
  road_damage: "bg-orange-400",

  streetlight: "bg-amber-400",
  "broken-streetlight": "bg-amber-400",
  street_light: "bg-amber-400",

  water: "bg-blue-500",
  "water-leakage": "bg-blue-500",
  water_leakage: "bg-blue-500",

  drainage: "bg-cyan-500",
  "drainage-problem": "bg-cyan-500",
  drainage_problem: "bg-cyan-500",

  tree: "bg-emerald-500",
  "fallen-tree": "bg-emerald-500",
  fallen_tree: "bg-emerald-500",

  electrical: "bg-purple-500",
  "electrical-problem": "bg-purple-500",
  electrical_problem: "bg-purple-500",

  infrastructure: "bg-slate-500",
  "public-infrastructure": "bg-slate-500",
  public_infrastructure: "bg-slate-500",

  park: "bg-green-500",
  "public-area": "bg-green-500",
  "park-public-area": "bg-green-500",
  park_public_area: "bg-green-500",

  other: "bg-pink-500",
};

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

const categoryMotion = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },

  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      delay: index * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function IssueCard({
  category,
  issue,
  index = 0,
}) {
  /*
   * ---------------------------------------------------------
   * CATEGORY CARD
   * Used by LandingPage.jsx
   * ---------------------------------------------------------
   */

  if (category) {
    const label =
      category.label ||
      category.title ||
      category.name ||
      "Civic Issue";

    const id = normalize(
      category.id ||
        category.slug ||
        category.key ||
        label
    );

    const Icon =
      categoryIcons[id] || CircleAlert;

    const color =
      categoryColors[id] || "bg-blue-500";

    return (
      <motion.div
        variants={categoryMotion}
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          amount: 0.2,
        }}
        whileHover={{
          y: -8,
          scale: 1.02,
          transition: {
            duration: 0.25,
            ease: "easeOut",
          },
        }}
        className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow duration-300 hover:shadow-card"
      >
        {/* Animated Icon */}
        <motion.div
          whileHover={{
            scale: 1.08,
            rotate: 3,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} text-white shadow-sm`}
        >
          <Icon className="h-7 w-7" strokeWidth={2} />
        </motion.div>

        {/* Category Name */}
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true }}
          transition={{
            duration: 0.4,
            delay: index * 0.08 + 0.12,
          }}
          className="mt-5 text-base font-semibold text-foreground"
        >
          {label}
        </motion.h3>
      </motion.div>
    );
  }

  /*
   * ---------------------------------------------------------
   * COMPLAINT CARD
   * Keeps compatibility with places that use:
   * <IssueCard issue={...} />
   * ---------------------------------------------------------
   */

  const currentIssue = issue || {};

  const {
    title = "Civic Issue",
    category: issueCategory = "General",
    location = "Location not available",
    status = "Pending",
    image,
  } = currentIssue;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
      }}
      whileHover={{
        y: -5,
        transition: {
          duration: 0.2,
        },
      }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-card"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="h-48 w-full object-cover"
        />
      )}

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {issueCategory}
          </span>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {status}
          </span>
        </div>

        <h3 className="font-heading text-lg font-bold text-foreground">
          {title}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Recently reported</span>
        </div>
      </div>
    </motion.div>
  );
}