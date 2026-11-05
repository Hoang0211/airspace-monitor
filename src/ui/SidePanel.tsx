import { LayerToggles } from "./LayerToggles";

export function SidePanel() {
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-800 bg-gray-950 p-4 text-gray-100">
      <LayerToggles />
    </aside>
  );
}
