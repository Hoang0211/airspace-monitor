import type { Sensor } from "./sensors.types";

/**
 * Fictional sensor sites, not real installations. They are placed so every restricted zone is
 * fully covered, while the outer edges of the monitored area stay out of range.
 */
export const SENSORS: Sensor[] = [
  { id: "sensor-north", name: "Sensor North", position: [24.96, 60.335], rangeMeters: 3500 },
  { id: "sensor-east", name: "Sensor East", position: [25.04, 60.3], rangeMeters: 3500 },
  { id: "sensor-south", name: "Sensor South", position: [24.97, 60.275], rangeMeters: 3500 },
  { id: "sensor-west", name: "Sensor West", position: [24.895, 60.3], rangeMeters: 3500 },
];
