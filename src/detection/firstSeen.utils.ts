import type { ClassifiedDrone, FirstSeenByDrone } from "./detection.types";

/**
 * Records the time of any drone detected for the first time. Pass the result back in on the next
 * tick. It is rebuilt from the current drones each time, so a removed drone is forgotten.
 */
export function updateFirstSeen(
  previous: FirstSeenByDrone,
  current: Pick<ClassifiedDrone, "id" | "status">[],
  time: number,
): FirstSeenByDrone {
  const firstSeen = new Map<string, number>();

  for (const { id, status } of current) {
    const firstSeenAt = previous.get(id) ?? (status === "undetected" ? undefined : time);
    if (firstSeenAt !== undefined) firstSeen.set(id, firstSeenAt);
  }

  return firstSeen;
}
