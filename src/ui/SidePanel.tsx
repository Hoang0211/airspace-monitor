import { useState } from "react";
import { useAppStore } from "../state/store";
import { AlertList } from "./AlertList";
import { DroneDetails } from "./DroneDetails";
import { DroneList } from "./DroneList";
import { LayerToggles } from "./LayerToggles";
import { PanelTabs } from "./PanelTabs";
import { PlaybackControls } from "./PlaybackControls";
import { SiteTime } from "./SiteTime";
import type { PanelTab } from "./sidePanel.types";

export function SidePanel() {
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const [activeTab, setActiveTab] = useState<PanelTab>("alerts");
  const [lastSelectedDroneId, setLastSelectedDroneId] = useState(selectedDroneId);

  // A newly selected drone opens its details, wherever it was selected from.
  if (selectedDroneId !== lastSelectedDroneId) {
    setLastSelectedDroneId(selectedDroneId);
    if (selectedDroneId) setActiveTab("details");
  }

  // Narrow screens show only the active section. On wider screens the wrapper drops out of the
  // layout, so every section sits in the panel as usual.
  const tabSection = (tab: PanelTab) =>
    `${tab === activeTab ? "flex min-h-0 flex-1 flex-col" : "hidden"} md:contents`;

  return (
    <aside className="flex h-[45dvh] w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-gray-800 bg-gray-950 p-4 text-gray-100 md:h-auto md:w-80 md:border-t-0 md:border-l">
      <PlaybackControls />
      <SiteTime />
      <PanelTabs activeTab={activeTab} onSelect={setActiveTab} />
      <div className={tabSection("alerts")}>
        <AlertList />
      </div>
      <div className={tabSection("drones")}>
        <DroneList />
      </div>
      <div className={tabSection("details")}>
        <DroneDetails />
      </div>
      <div className={tabSection("layers")}>
        <LayerToggles />
      </div>
    </aside>
  );
}
