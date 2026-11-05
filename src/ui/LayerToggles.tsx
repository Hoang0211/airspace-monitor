import { useAppStore } from "../state/store";
import type { LayerToggle } from "../state/store.types";

const LAYER_OPTIONS: { layer: LayerToggle; label: string }[] = [
  { layer: "sensors", label: "Sensors" },
  { layer: "coverage", label: "Coverage" },
  { layer: "zones", label: "Restricted zones" },
  { layer: "trails", label: "Trails" },
  { layer: "pilots", label: "Pilots" },
];

export function LayerToggles() {
  const layers = useAppStore((state) => state.layers);
  const setLayerVisible = useAppStore((state) => state.setLayerVisible);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Layers</legend>
      <div className="flex flex-col gap-1">
        {LAYER_OPTIONS.map(({ layer, label }) => (
          <label key={layer} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={layers[layer]}
              onChange={(event) => setLayerVisible(layer, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
