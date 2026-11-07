import type { DroneStatus, DroneSummary } from "../detection/detection.types";
import type { DroneSort } from "./droneList.types";

// Most urgent first.
const STATUS_ORDER: Record<DroneStatus, number> = { alert: 0, tracked: 1, undetected: 2 };

/** Returns a sorted copy. Drones with the same status stay in ID order, so rows don't jump. */
export function sortDrones(drones: DroneSummary[], sortBy: DroneSort): DroneSummary[] {
  return [...drones].sort((a, b) => {
    const byStatus = sortBy === "status" ? STATUS_ORDER[a.status] - STATUS_ORDER[b.status] : 0;

    return byStatus || a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}
