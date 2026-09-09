import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Loader,
  CheckCircle2,
  Users,
  AlertCircle,
  ClipboardList,
  CircleCheck,
} from "lucide-react";

const iconMap = {
  FileText,
  Clock,
  Loader,
  CheckCircle2,
  Users,
  AlertCircle,
  ClipboardList,
  CircleCheck,
};

const toneMap = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
  },
  secondary: {
    bg: "bg-secondary/10",
    text: "text-secondary",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
  },
};

export default function StatCard({
  stat,
  value,
  label,
  icon,
  tone = "primary",
  index = 0,
}) {
  /*
   * Supports the CivicFix format:
   *
   * <StatCard stat={stat} index={i} />
   *
   * and also the older format:
   *
   * <StatCard value={...} label={...} icon={...} />
   */

  const currentStat = stat || {};

  const displayValue =
    value !== undefined
      ? value
      : currentStat.value;

  const displayLabel =
    label !== undefined
      ? label
      : currentStat.label;

  const iconName =
    typeof icon === "string"
      ? icon
      : currentStat.icon;

  const Icon =
    typeof icon === "function"
      ? icon
      : iconMap[iconName] || FileText;

  const currentTone =
    toneMap[currentStat.tone || tone] ||
    toneMap.primary;

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
      custom={index}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -5,
        transition: {
          duration: 0.2,
        },
      }}
      className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow duration-300 hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        {/* Number and Label */}
        <div>
          <motion.p
            initial={{
              opacity: 0,
              y: 8,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.08 + 0.1,
            }}
            className="font-heading text-3xl font-bold text-foreground"
          >
            {displayValue}
          </motion.p>

          <p className="mt-2 text-sm text-muted-foreground">
            {displayLabel}
          </p>
        </div>

        {/* Icon */}
        <motion.div
          whileHover={{
            scale: 1.08,
            rotate: 4,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${currentTone.bg} ${currentTone.text}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}