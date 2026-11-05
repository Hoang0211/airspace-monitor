import type { Zone } from "./zones.types";

/** Hand-drawn zones with approximate shapes and fictional restrictions, not real airspace data. */
export const ZONES: Zone[] = [
  {
    id: "zone-airport",
    name: "Helsinki Airport",
    kind: "airport",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [24.892, 60.308],
          [24.934, 60.3035],
          [24.984, 60.3022],
          [24.996, 60.304],
          [24.9975, 60.336],
          [24.993, 60.34],
          [24.9625, 60.3412],
          [24.9445, 60.3398],
          [24.892, 60.3135],
          [24.892, 60.308],
        ],
      ],
    },
  },
  {
    id: "zone-tikkurila",
    name: "Tikkurila protected site",
    kind: "protected-site",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [25.03, 60.286],
          [25.046, 60.285],
          [25.05, 60.293],
          [25.038, 60.297],
          [25.029, 60.293],
          [25.03, 60.286],
        ],
      ],
    },
  },
];
