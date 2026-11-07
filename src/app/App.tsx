import { MapView } from "../map/MapView";
import { SidePanel } from "../ui/SidePanel";

function App() {
  return (
    // On narrow screens the panel sits under the map, each scrolling on its own.
    <main className="flex h-dvh flex-col md:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1">
        <MapView />
        <p className="pointer-events-none absolute top-2.5 left-2.5 z-10 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs font-semibold tracking-wide text-gray-200 uppercase">
          Simulated data
        </p>
      </div>
      <SidePanel />
    </main>
  );
}

export default App;
