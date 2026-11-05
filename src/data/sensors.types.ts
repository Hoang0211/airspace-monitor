import type { LngLat } from "./geo.types";

export interface Sensor {
  id: string;
  name: string;
  position: LngLat;
  rangeMeters: number;
}
