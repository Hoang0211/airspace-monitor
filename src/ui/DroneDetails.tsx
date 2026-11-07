import type { Behavior } from "../simulation/droneSimulator.types";
import { useAppStore } from "../state/store";
import { formatCoordinates, formatDistance } from "./droneDetails.utils";
import { STATUS_LABELS } from "./droneStatus";
import { formatSiteTime } from "./siteTime.utils";

const BEHAVIOR_LABELS: Record<Behavior, string> = {
  patrol: "Patrol",
  loiter: "Loiter",
  transit: "Transit",
};

export function DroneDetails() {
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const drone = useAppStore((state) => state.drones.find(({ id }) => id === state.selectedDroneId));
  const siteTime = useAppStore((state) => state.siteTime);
  const selectDrone = useAppStore((state) => state.selectDrone);

  // A fixed height, so the lists above never shift as the selection changes.
  if (!selectedDroneId) {
    return (
      <section className="h-48 shrink-0">
        <h2 className="mb-2 text-sm font-semibold">Details</h2>
        <p className="text-sm text-gray-400">Select a drone to see its details.</p>
      </section>
    );
  }

  return (
    <section className="h-48 shrink-0">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{selectedDroneId}</h2>
        <button
          type="button"
          className="cursor-pointer text-sm text-gray-400 hover:text-gray-100"
          onClick={() => selectDrone(null)}
        >
          Close
        </button>
      </div>

      {drone ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-400">Status</dt>
          <dd className={`font-semibold ${STATUS_LABELS[drone.status].className}`}>
            {STATUS_LABELS[drone.status].label}
          </dd>
          <dt className="text-gray-400">Behavior</dt>
          <dd>{BEHAVIOR_LABELS[drone.behavior]}</dd>
          <dt className="text-gray-400">Speed</dt>
          <dd className="tabular-nums">{drone.speed.toFixed(1)} m/s</dd>
          <dt className="text-gray-400">First seen</dt>
          <dd className="tabular-nums">
            {drone.firstSeenAt === null
              ? "Not yet"
              : `${formatSiteTime(siteTime - drone.firstSeenAt)} ago`}
          </dd>
          <dt className="text-gray-400">To pilot</dt>
          <dd className="tabular-nums">{formatDistance(drone.distanceToPilot)}</dd>
          <dt className="text-gray-400">Drone at</dt>
          <dd className="tabular-nums">{formatCoordinates(drone.position)}</dd>
          <dt className="text-gray-400">Pilot at</dt>
          <dd className="tabular-nums">{formatCoordinates(drone.pilot)}</dd>
        </dl>
      ) : (
        <p className="text-sm font-semibold text-red-400">Lost contact</p>
      )}
    </section>
  );
}
