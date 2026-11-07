import { useAppStore } from "../state/store";
import { formatSiteTime } from "./siteTime.utils";

export function SiteTime() {
  const siteTime = useAppStore((state) => state.siteTime);

  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="font-semibold">Site time</span>
      <span role="timer" className="text-gray-300 tabular-nums">
        {formatSiteTime(siteTime)}
      </span>
    </div>
  );
}
