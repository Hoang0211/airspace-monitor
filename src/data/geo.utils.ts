import type { LngLat } from "./geo.types";

// These helpers treat the earth as flat, which is accurate enough across a few kilometres.
const METERS_PER_DEGREE_LAT = 111_320;

function metersPerDegreeLng(lat: number): number {
  return METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
}

/** The point reached by moving `meters` from `from`. Bearings are degrees clockwise from north. */
export function offset(from: LngLat, bearing: number, meters: number): LngLat {
  const [lng, lat] = from;
  const radians = (bearing * Math.PI) / 180;

  return [
    lng + (Math.sin(radians) * meters) / metersPerDegreeLng(lat),
    lat + (Math.cos(radians) * meters) / METERS_PER_DEGREE_LAT,
  ];
}

/** The distance between two points, in meters. */
export function distance(from: LngLat, to: LngLat): number {
  const dx = (to[0] - from[0]) * metersPerDegreeLng((from[1] + to[1]) / 2);
  const dy = (to[1] - from[1]) * METERS_PER_DEGREE_LAT;

  return Math.hypot(dx, dy);
}

/** The direction from one point to another, in degrees clockwise from north (0 up to 360). */
export function bearingTo(from: LngLat, to: LngLat): number {
  const dx = (to[0] - from[0]) * metersPerDegreeLng((from[1] + to[1]) / 2);
  const dy = (to[1] - from[1]) * METERS_PER_DEGREE_LAT;

  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}
