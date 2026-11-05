import { MapView } from "../map/MapView";
import { SidePanel } from "../ui/SidePanel";

function App() {
  return (
    <main className="flex h-dvh">
      <div className="min-w-0 flex-1">
        <MapView />
      </div>
      <SidePanel />
    </main>
  );
}

export default App;
