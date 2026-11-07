import { useAppStore } from "../state/store";
import { formatSiteTime } from "./siteTime.utils";

export function AlertList() {
  const alerts = useAppStore((state) => state.alerts);

  return (
    // Shares the space left in the panel, which also keeps the sections below it at the bottom.
    <section className="flex min-h-24 flex-1 flex-col">
      <h2 className="mb-2 text-sm font-semibold">Alerts ({alerts.length})</h2>
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-400">No alerts</p>
      ) : (
        <ol aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {alerts.map(({ id, droneId, zoneName, time }) => (
            // Each row keeps its ID, so the flash only plays when a new row appears.
            <li
              key={id}
              className="animate-alert-flash flex items-baseline gap-2 rounded px-2 py-1 text-sm motion-reduce:animate-none"
            >
              <span className="font-semibold text-red-400">{droneId}</span>
              <span className="min-w-0 flex-1 truncate text-gray-300">{zoneName}</span>
              <span className="text-gray-400 tabular-nums">{formatSiteTime(time)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
