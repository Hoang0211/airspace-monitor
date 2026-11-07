import type { DroneStatus } from "../detection/detection.types";

/** Status is always shown as text as well as color, so color is never the only signal. */
export const STATUS_LABELS: Record<DroneStatus, { label: string; className: string }> = {
  alert: { label: "Alert", className: "text-red-400" },
  tracked: { label: "Tracked", className: "text-amber-400" },
  undetected: { label: "Undetected", className: "text-gray-400" },
};
