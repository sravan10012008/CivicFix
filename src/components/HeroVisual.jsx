import { motion } from "framer-motion";
import { Lightbulb, MapPin, CheckCircle2 } from "lucide-react";

export default function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto h-[520px] w-full max-w-[640px]"
    >
      {/* Soft background glow */}
      <div className="absolute left-1/2 top-1/2 h-[460px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/20 via-secondary/15 to-blue-300/10 blur-3xl" />

      {/* MAIN CITY PANEL */}
      <div className="absolute left-1/2 top-1/2 h-[490px] w-[610px] -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-[32px] border border-primary/10 bg-gradient-to-br from-blue-50/90 via-white/80 to-slate-100/90 shadow-2xl">
        
        {/* Inner soft background */}
        <div className="absolute inset-0 overflow-hidden rounded-[32px]">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white/20 to-slate-100/50" />

          {/* BUILDINGS */}
          <div className="absolute bottom-[110px] left-[72px] flex items-end gap-[10px]">
            
            {/* Building 1 */}
            <div className="relative h-[135px] w-[54px] rounded-t-[7px] bg-[#5b82dc]">
              <div className="absolute left-[13px] top-[17px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>
            </div>

            {/* Building 2 */}
            <div className="relative h-[185px] w-[54px] rounded-t-[7px] bg-[#49bfd0]">
              <div className="absolute left-[14px] top-[18px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>
            </div>

            {/* Building 3 */}
            <div className="relative h-[150px] w-[54px] rounded-t-[7px] bg-[#5279d0]">
              <div className="absolute left-[13px] top-[18px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>
            </div>

            {/* Building 4 */}
            <div className="relative h-[205px] w-[62px] rounded-t-[7px] bg-[#49baca]">
              <div className="absolute left-[15px] top-[18px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>

              {/* Tiny white light */}
              <div className="absolute left-1/2 top-[18px] h-[8px] w-[8px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>

            {/* Building 5 */}
            <div className="relative h-[155px] w-[54px] rounded-t-[7px] bg-[#547bd4]">
              <div className="absolute left-[13px] top-[18px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>
            </div>

            {/* Building 6 */}
            <div className="relative h-[190px] w-[58px] rounded-t-[7px] bg-[#49baca]">
              <div className="absolute left-[14px] top-[18px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>

              {/* Small purple detail */}
              <div className="absolute left-1/2 top-[-18px] h-[7px] w-[5px] -translate-x-1/2 rounded-full bg-purple-500" />
            </div>

            {/* Building 7 */}
            <div className="relative h-[135px] w-[54px] rounded-t-[7px] bg-[#5b82dc]">
              <div className="absolute left-[13px] top-[17px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>
            </div>

            {/* Building 8 */}
            <div className="relative h-[165px] w-[54px] rounded-t-[7px] bg-[#49baca]">
              <div className="absolute left-[13px] top-[18px] space-y-[14px]">
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
                <div className="h-[9px] w-[9px] rounded-[2px] bg-white/35" />
              </div>
            </div>
          </div>

          {/* ROAD */}
          <div className="absolute bottom-0 left-0 right-0 h-[105px] bg-slate-200/90">
            <div className="absolute left-0 right-0 top-[44px] border-t-[4px] border-dashed border-slate-400/45" />
          </div>

          {/* STREET LIGHT */}
          <div className="absolute bottom-[70px] left-[180px] z-10">
            {/* Pole */}
            <div className="h-[135px] w-[5px] rounded-full bg-slate-500" />

            {/* Curved arm */}
            <div className="absolute left-0 top-0 h-[5px] w-[50px] rounded-full bg-slate-500" />

            <div className="absolute left-[44px] top-[-7px] h-[26px] w-[26px] rounded-full bg-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.55)]" />
          </div>
        </div>

        {/* TOP LEFT ISSUE CARD */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="absolute left-[-48px] top-[48px] z-30 w-[210px] rounded-2xl border border-border bg-white p-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-500">
              <Lightbulb className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                Streetlight Issue
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sector 12
              </p>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-600">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            Assigned
          </div>
        </motion.div>

        {/* TOP RIGHT STATUS */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="absolute right-[30px] top-[28px] z-30 rounded-2xl border border-border bg-white px-5 py-3.5 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
            <span className="text-sm font-semibold text-foreground">
              In Progress
            </span>
          </div>
        </motion.div>

        {/* BOTTOM RIGHT COMPLAINT CARD */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="absolute bottom-[66px] right-[-38px] z-30 w-[230px] rounded-2xl border border-border bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Complaint
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                #CF1024
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Resolved
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-green-500" />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Resolved in 2 days
          </p>
        </motion.div>

        {/* LOCATION */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute bottom-[8px] left-[38px] z-30 flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 shadow-lg"
        >
          <MapPin className="h-4 w-4 text-cyan-500" />

          <span className="text-xs font-semibold text-foreground">
            Main Road, Sector 12
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}