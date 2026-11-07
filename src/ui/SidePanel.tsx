import { AlertList } from "./AlertList";
import { DroneDetails } from "./DroneDetails";
import { LayerToggles } from "./LayerToggles";
import { PlaybackControls } from "./PlaybackControls";
import { SiteTime } from "./SiteTime";

export function SidePanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-gray-800 bg-gray-950 p-4 text-gray-100">
      <PlaybackControls />
      <SiteTime />
      <AlertList />
      <DroneDetails />
      <LayerToggles />
    </aside>
  );
}
