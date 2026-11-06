import type { Map as MapLibreMap } from "maplibre-gl";
import {
  COVERAGE_COLOR,
  DRONE_ICON_IMAGE,
  LABEL_HALO_COLOR,
  PILOT_COLOR,
  PILOT_ICON_IMAGE,
  SENSOR_ICON_IMAGE,
  ZONE_COLOR,
  ZONE_HATCH_IMAGE,
} from "./layers";

const PIXEL_RATIO = 2;
const SENSOR_ICON_SIZE = 40;
const HATCH_SIZE = 16;
const HATCH_STRIPE_HALF_WIDTH = 2;
const HATCH_OPACITY = 0.3;
const PILOT_ICON_SIZE = 32;
const DRONE_ICON_SIZE = 48;
/** A dart pointing north, in image pixels. */
const DRONE_ARROW: [number, number][] = [
  [23.5, 6],
  [37, 40],
  [23.5, 31],
  [10, 40],
];
// MapLibre reads a distance-field icon's alpha as the distance to its edge. The edge sits at 0.75,
// and alpha changes by 1/8 per screen pixel, which is 1/16 per image pixel at this pixel ratio.
const SDF_EDGE_ALPHA = 0.75;
const SDF_ALPHA_PER_IMAGE_PIXEL = 1 / 16;

interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** How much of a pixel a shape covers, given how far inside the shape's edge the pixel is. */
function coverage(distanceInsideEdge: number): number {
  return Math.min(1, Math.max(0, distanceInsideEdge + 0.5));
}

/** A dark disc with a ring and centre dot, so it stays readable over any part of the map. */
export function createSensorIcon(): RgbaImage {
  const size = SENSOR_ICON_SIZE;
  const center = (size - 1) / 2;
  const outerRadius = 18;
  const ringInnerRadius = 14;
  const dotRadius = 6;
  const accent = hexToRgb(COVERAGE_COLOR);
  const background = hexToRgb(LABEL_HALO_COLOR);
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot(x - center, y - center);
      const ring = coverage(outerRadius - distance) * coverage(distance - ringInnerRadius);
      const accentAmount = Math.max(ring, coverage(dotRadius - distance));
      const offset = (y * size + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        data[offset + channel] = Math.round(
          background[channel] + (accent[channel] - background[channel]) * accentAmount,
        );
      }
      data[offset + 3] = Math.round(coverage(outerRadius - distance) * 255);
    }
  }

  return { width: size, height: size, data };
}

/** Diagonal stripes that join up seamlessly when the image repeats across a zone. */
export function createZoneHatch(): RgbaImage {
  const size = HATCH_SIZE;
  const [red, green, blue] = hexToRgb(ZONE_COLOR);
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const position = (x + y) % size;
      const distanceFromStripe = Math.min(position, size - position) * Math.SQRT1_2;
      const offset = (y * size + x) * 4;

      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = blue;
      data[offset + 3] = Math.round(
        coverage(HATCH_STRIPE_HALF_WIDTH - distanceFromStripe) * HATCH_OPACITY * 255,
      );
    }
  }

  return { width: size, height: size, data };
}

/** A light diamond with a dark center, which looks different from the arrows and sensors. */
export function createPilotIcon(): RgbaImage {
  const size = PILOT_ICON_SIZE;
  const center = (size - 1) / 2;
  const outerRadius = 14;
  const innerRadius = 8;
  const accent = hexToRgb(PILOT_COLOR);
  const background = hexToRgb(LABEL_HALO_COLOR);
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const radius = Math.abs(x - center) + Math.abs(y - center);
      const accentAmount = coverage((radius - innerRadius) * Math.SQRT1_2);
      const offset = (y * size + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        data[offset + channel] = Math.round(
          background[channel] + (accent[channel] - background[channel]) * accentAmount,
        );
      }
      data[offset + 3] = Math.round(coverage((outerRadius - radius) * Math.SQRT1_2) * 255);
    }
  }

  return { width: size, height: size, data };
}

function distanceToSegment(
  x: number,
  y: number,
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const along = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));

  return Math.hypot(x - (x1 + along * dx), y - (y1 + along * dy));
}

/** The distance to a polygon's edge: positive inside the polygon and negative outside. */
function signedDistanceToPolygon(x: number, y: number, polygon: [number, number][]): number {
  let nearest = Infinity;
  let inside = false;

  polygon.forEach((corner, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    nearest = Math.min(nearest, distanceToSegment(x, y, previous, corner));

    const crossesRow = corner[1] > y !== previous[1] > y;
    const crossingX =
      corner[0] + ((y - corner[1]) * (previous[0] - corner[0])) / (previous[1] - corner[1]);
    if (crossesRow && x < crossingX) inside = !inside;
  });

  return inside ? nearest : -nearest;
}

/**
 * The drone arrow, stored as a distance field rather than as colours. That lets the map tint it
 * and draw a halo around it, and it stays sharp when rotated.
 */
export function createDroneIcon(): RgbaImage {
  const size = DRONE_ICON_SIZE;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = signedDistanceToPolygon(x, y, DRONE_ARROW);
      const alpha = SDF_EDGE_ALPHA + distance * SDF_ALPHA_PER_IMAGE_PIXEL;
      const offset = (y * size + x) * 4;

      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
    }
  }

  return { width: size, height: size, data };
}

export function addMapIcons(map: Pick<MapLibreMap, "addImage">): void {
  map.addImage(SENSOR_ICON_IMAGE, createSensorIcon(), { pixelRatio: PIXEL_RATIO });
  map.addImage(ZONE_HATCH_IMAGE, createZoneHatch(), { pixelRatio: PIXEL_RATIO });
  map.addImage(PILOT_ICON_IMAGE, createPilotIcon(), { pixelRatio: PIXEL_RATIO });
  map.addImage(DRONE_ICON_IMAGE, createDroneIcon(), { pixelRatio: PIXEL_RATIO, sdf: true });
}
