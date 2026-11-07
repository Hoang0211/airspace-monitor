import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { SENSORS } from "../data/sensors";
import { ZONES } from "../data/zones";
import { classifyDrone } from "../detection/classifyDrone.utils";
import { DroneSimulator } from "../simulation/droneSimulator";
import type { Drone } from "../simulation/droneSimulator.types";
import type { Playback } from "../state/store.types";
import { dronesToGeoJSON, linesToGeoJSON, pilotsToGeoJSON } from "./geojson.utils";

// At 1× speed.
const TICK_INTERVAL_MS = 1000;

type LiveMap = Pick<MapLibreMap, "getSource">;

function updateSources(map: LiveMap, drones: Drone[]): void {
  const classified = drones.map((drone) => ({
    ...drone,
    ...classifyDrone(drone, SENSORS, ZONES),
  }));

  map.getSource<GeoJSONSource>("drones")?.setData(dronesToGeoJSON(classified));
  map.getSource<GeoJSONSource>("pilots")?.setData(pilotsToGeoJSON(drones));
  map.getSource<GeoJSONSource>("lines")?.setData(linesToGeoJSON(classified));
}

/**
 * Runs the simulation and hands each update straight to the map, so a tick never re-renders React.
 * Each tick is one simulated second, so a higher speed simply ticks more often. Returns the
 * controls for changing the playback and stopping for good.
 */
export function startLiveDroneData(
  map: LiveMap,
  initialPlayback: Playback,
): { setPlayback: (playback: Playback) => void; stop: () => void } {
  const simulator = new DroneSimulator();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stop = () => clearInterval(interval);

  const setPlayback = ({ playing, speed }: Playback) => {
    stop();
    if (!playing) return;

    interval = setInterval(() => updateSources(map, simulator.tick()), TICK_INTERVAL_MS / speed);
  };

  updateSources(map, simulator.getDrones());
  setPlayback(initialPlayback);

  return { setPlayback, stop };
}
