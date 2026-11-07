import type { Alert, ClassifiedDrone, ZoneEntries, ZonesByDrone } from "./detection.types";

const MAX_ALERTS = 100;

/**
 * Compares where drones are now with where they were on the last tick, and raises an alert only for
 * a drone that has just entered a zone. Pass the returned `zonesByDrone` back in on the next tick.
 * It is rebuilt from the current drones each time, so a removed drone is forgotten.
 */
export function detectZoneEntries(
  previous: ZonesByDrone,
  current: Pick<ClassifiedDrone, "id" | "zone">[],
  time: number,
): ZoneEntries {
  const alerts: Alert[] = [];
  const zonesByDrone = new Map<string, string>();

  for (const { id: droneId, zone } of current) {
    if (!zone) continue;
    zonesByDrone.set(droneId, zone.id);

    if (previous.get(droneId) !== zone.id) {
      alerts.push({ id: `${droneId}-${zone.id}-${time}`, droneId, zoneName: zone.name, time });
    }
  }

  return { alerts, zonesByDrone };
}

/** Adds new alerts to the top of the list, and drops the oldest once it is full. */
export function addAlerts(existing: Alert[], newAlerts: Alert[]): Alert[] {
  return [...newAlerts, ...existing].slice(0, MAX_ALERTS);
}
