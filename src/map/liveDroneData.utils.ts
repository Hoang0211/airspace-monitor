import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { distance } from "../data/geo.utils";
import { SENSORS } from "../data/sensors";
import { ZONES } from "../data/zones";
import { detectZoneEntries } from "../detection/alerts.utils";
import { classifyDrone } from "../detection/classifyDrone.utils";
import type {
  Alert,
  ClassifiedDrone,
  DroneSummary,
  FirstSeenByDrone,
  ZonesByDrone,
} from "../detection/detection.types";
import { updateFirstSeen } from "../detection/firstSeen.utils";
import { DroneSimulator } from "../simulation/droneSimulator";
import type { Drone } from "../simulation/droneSimulator.types";
import type { Playback } from "../state/store.types";
import { dronesToGeoJSON, linesToGeoJSON, pilotsToGeoJSON } from "./geojson.utils";

// At 1× speed.
const TICK_INTERVAL_MS = 1000;

type LiveMap = Pick<MapLibreMap, "getSource">;

function updateSources(map: LiveMap, drones: ClassifiedDrone[]): void {
  map.getSource<GeoJSONSource>("drones")?.setData(dronesToGeoJSON(drones));
  map.getSource<GeoJSONSource>("pilots")?.setData(pilotsToGeoJSON(drones));
  map.getSource<GeoJSONSource>("lines")?.setData(linesToGeoJSON(drones));
}

/**
 * Runs the simulation and hands each update straight to the map, so the drones never go through
 * React. Only the site time, any new alerts and a small summary of each drone go further, through
 * `onTick`. Each tick is one simulated second, so a higher speed simply ticks more often. Returns
 * the controls for changing the playback and stopping for good.
 */
export function startLiveDroneData(
  map: LiveMap,
  initialPlayback: Playback,
  onTick: (siteTime: number, newAlerts: Alert[], drones: DroneSummary[]) => void,
): { setPlayback: (playback: Playback) => void; stop: () => void } {
  const simulator = new DroneSimulator();
  const openedAt = simulator.simTime;
  let zonesByDrone: ZonesByDrone = new Map();
  let firstSeen: FirstSeenByDrone = new Map();
  let interval: ReturnType<typeof setInterval> | undefined;

  const update = (drones: Drone[]) => {
    const classified = drones.map((drone) => ({
      ...drone,
      ...classifyDrone(drone, SENSORS, ZONES),
    }));
    updateSources(map, classified);

    const siteTime = simulator.simTime - openedAt;
    const entries = detectZoneEntries(zonesByDrone, classified, siteTime);
    zonesByDrone = entries.zonesByDrone;
    firstSeen = updateFirstSeen(firstSeen, classified, siteTime);

    onTick(
      siteTime,
      entries.alerts,
      // A small copy of each drone, so its trail and waypoints stay out of React state.
      classified.map(({ id, behavior, status, speed, position, pilot }) => ({
        id,
        behavior,
        status,
        speed,
        position,
        pilot,
        firstSeenAt: firstSeen.get(id) ?? null,
        // Worked out here, as a drone doesn't store its distance to the pilot.
        distanceToPilot: distance(position, pilot),
      })),
    );
  };

  const stop = () => clearInterval(interval);

  const setPlayback = ({ playing, speed }: Playback) => {
    stop();
    if (!playing) return;

    interval = setInterval(() => update(simulator.tick()), TICK_INTERVAL_MS / speed);
  };

  update(simulator.getDrones());
  setPlayback(initialPlayback);

  return { setPlayback, stop };
}
