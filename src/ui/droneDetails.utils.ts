import type { LngLat } from "../data/geo.types";

/** Shows short distances in meters and longer ones in kilometers. */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

/** Shows a position as latitude then longitude, which is about 1 m of precision at 5 decimals. */
export function formatCoordinates([lng, lat]: LngLat): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
