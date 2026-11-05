export type LayerToggle = "sensors" | "coverage" | "zones" | "trails" | "pilots";

export type LayerVisibility = Record<LayerToggle, boolean>;

export interface AppState {
  layers: LayerVisibility;
  setLayerVisible: (layer: LayerToggle, visible: boolean) => void;
}
