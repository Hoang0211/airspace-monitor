import type { Map as MapLibreMap } from "maplibre-gl";
import {
  COVERAGE_COLOR,
  LABEL_HALO_COLOR,
  SENSOR_ICON_IMAGE,
  ZONE_COLOR,
  ZONE_HATCH_IMAGE,
} from "./layers";

const PIXEL_RATIO = 2;
const SENSOR_ICON_SIZE = 40;
const HATCH_SIZE = 16;
const HATCH_STRIPE_HALF_WIDTH = 2;
const HATCH_OPACITY = 0.5;

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

export function addMapIcons(map: Pick<MapLibreMap, "addImage">): void {
  map.addImage(SENSOR_ICON_IMAGE, createSensorIcon(), { pixelRatio: PIXEL_RATIO });
  map.addImage(ZONE_HATCH_IMAGE, createZoneHatch(), { pixelRatio: PIXEL_RATIO });
}
