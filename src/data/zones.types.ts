import type { Polygon } from "geojson";

export interface Zone {
  id: string;
  name: string;
  kind: "airport" | "protected-site";
  polygon: Polygon;
}
