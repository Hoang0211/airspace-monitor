import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { distance } from "../data/geo.utils";
import type { Sensor } from "../data/sensors.types";
import type { Zone } from "../data/zones.types";
import type { Drone } from "../simulation/droneSimulator.types";
import type { Classification } from "./detection.types";

/**
 * Works out what the operator knows about a drone. A drone no sensor can reach is undetected, even
 * inside a restricted zone, because nothing is there to report it.
 */
export function classifyDrone(
  { position }: Pick<Drone, "position">,
  sensors: Sensor[],
  zones: Zone[],
): Classification {
  const isDetected = sensors.some(
    (sensor) => distance(position, sensor.position) <= sensor.rangeMeters,
  );
  if (!isDetected) return { status: "undetected", zone: null };

  const zone = zones.find(({ polygon }) => booleanPointInPolygon(position, polygon));

  return zone ? { status: "alert", zone } : { status: "tracked", zone: null };
}
