import { useAppStore } from "../state/store";
import type { PlaybackSpeed } from "../state/store.types";

const SPEEDS: PlaybackSpeed[] = [1, 2, 5, 10];

const BUTTON_CLASS = "cursor-pointer rounded px-3 py-1 text-sm font-semibold";

export function PlaybackControls() {
  const { playing, speed: currentSpeed } = useAppStore((state) => state.playback);
  const setPlaying = useAppStore((state) => state.setPlaying);
  const setSpeed = useAppStore((state) => state.setSpeed);

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        className={`${BUTTON_CLASS} w-20 border border-gray-700 hover:bg-gray-800`}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? "Pause" : "Play"}
      </button>

      <div role="group" aria-label="Simulation speed" className="flex gap-1">
        {SPEEDS.map((speed) => {
          const isSelected = speed === currentSpeed;

          return (
            <button
              key={speed}
              type="button"
              aria-pressed={isSelected}
              className={`${BUTTON_CLASS} ${
                isSelected ? "bg-teal-300 text-gray-950" : "text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => setSpeed(speed)}
            >
              {speed}×
            </button>
          );
        })}
      </div>
    </div>
  );
}
