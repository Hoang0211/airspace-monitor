import { useAppStore } from "../state/store";
import type { PanelTab } from "./sidePanel.types";

interface PanelTabsProps {
  activeTab: PanelTab;
  onSelect: (tab: PanelTab) => void;
}

/** Only shown on narrow screens, where the panel has room for one section at a time. */
export function PanelTabs({ activeTab, onSelect }: PanelTabsProps) {
  const alertCount = useAppStore((state) => state.alerts.length);
  const droneCount = useAppStore((state) => state.drones.length);

  const tabs: { tab: PanelTab; label: string }[] = [
    { tab: "alerts", label: `Alerts (${alertCount})` },
    { tab: "drones", label: `Drones (${droneCount})` },
    { tab: "details", label: "Details" },
    { tab: "layers", label: "Layers" },
  ];

  return (
    <div
      role="group"
      aria-label="Panel section"
      className="flex justify-between gap-1 border-b border-gray-800 md:hidden"
    >
      {tabs.map(({ tab, label }) => (
        <button
          key={tab}
          type="button"
          aria-pressed={tab === activeTab}
          className={`-mb-px cursor-pointer border-b-2 px-1 pb-1.5 text-sm ${
            tab === activeTab
              ? "border-teal-300 font-semibold text-gray-100"
              : "border-transparent text-gray-400"
          }`}
          onClick={() => onSelect(tab)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
