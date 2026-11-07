import { useState } from "react";
import { useAppStore } from "../state/store";
import type { DroneSort } from "./droneList.types";
import { sortDrones } from "./droneList.utils";
import { STATUS_LABELS } from "./droneStatus";

export function DroneList() {
  const drones = useAppStore((state) => state.drones);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const selectDrone = useAppStore((state) => state.selectDrone);
  const flyTo = useAppStore((state) => state.flyTo);
  const [sortBy, setSortBy] = useState<DroneSort>("status");

  return (
    <section className="flex min-h-24 flex-1 flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Drones ({drones.length})</h2>
        <button
          type="button"
          className="cursor-pointer text-sm text-gray-400 hover:text-gray-100"
          onClick={() => setSortBy(sortBy === "status" ? "id" : "status")}
        >
          Sort: {sortBy === "status" ? "Status" : "ID"}
        </button>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {sortDrones(drones, sortBy).map(({ id, status, position }) => (
          <li key={id}>
            <button
              type="button"
              aria-current={id === selectedDroneId}
              className={`flex w-full cursor-pointer items-baseline justify-between rounded px-2 py-0.5 text-sm hover:bg-gray-800 ${
                id === selectedDroneId ? "bg-gray-800" : ""
              }`}
              onClick={() => {
                selectDrone(id);
                flyTo(position);
              }}
            >
              <span className="font-semibold">{id}</span>
              <span className={STATUS_LABELS[status].className}>{STATUS_LABELS[status].label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
