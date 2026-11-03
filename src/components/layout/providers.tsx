"use client";

import { MotionConfig } from "motion/react";

/** Motion respeta prefers-reduced-motion en toda la app. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
