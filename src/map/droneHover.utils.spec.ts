import { describe, expect, it, vi } from "vitest";
import { enableDroneHover } from "./droneHover.utils";

function fakeMap() {
  const handlers = new Map<string, (event?: unknown) => void>();
  const canvas = { style: { cursor: "" } };
  const setFeatureState = vi.fn();

  const map = {
    on: (type: string, _layer: string, handler: (event?: unknown) => void) => {
      handlers.set(type, handler);
    },
    off: (type: string) => {
      handlers.delete(type);
    },
    setFeatureState,
    getCanvas: () => canvas,
  };

  const moveOver = (id: number) => handlers.get("mousemove")?.({ features: [{ id }] });
  const leave = () => handlers.get("mouseleave")?.();

  return { map: map as never, handlers, canvas, setFeatureState, moveOver, leave };
}

describe("enableDroneHover", () => {
  it("marks the drone under the mouse and shows a pointer", () => {
    const { map, canvas, setFeatureState, moveOver } = fakeMap();

    enableDroneHover(map);
    moveOver(7);

    expect(setFeatureState).toHaveBeenCalledExactlyOnceWith(
      { source: "drones", id: 7 },
      { hover: true },
    );
    expect(canvas.style.cursor).toBe("pointer");
  });

  it("does nothing more while the mouse stays on the same drone", () => {
    const { map, setFeatureState, moveOver } = fakeMap();

    enableDroneHover(map);
    moveOver(7);
    moveOver(7);

    expect(setFeatureState).toHaveBeenCalledOnce();
  });

  it("moves the mark when the mouse goes straight to another drone", () => {
    const { map, canvas, setFeatureState, moveOver } = fakeMap();

    enableDroneHover(map);
    moveOver(7);
    setFeatureState.mockClear();
    moveOver(9);

    expect(setFeatureState.mock.calls).toEqual([
      [{ source: "drones", id: 7 }, { hover: false }],
      [{ source: "drones", id: 9 }, { hover: true }],
    ]);
    expect(canvas.style.cursor).toBe("pointer");
  });

  it("clears the mark and the pointer when the mouse leaves", () => {
    const { map, canvas, setFeatureState, moveOver, leave } = fakeMap();

    enableDroneHover(map);
    moveOver(7);
    setFeatureState.mockClear();
    leave();

    expect(setFeatureState).toHaveBeenCalledExactlyOnceWith(
      { source: "drones", id: 7 },
      { hover: false },
    );
    expect(canvas.style.cursor).toBe("");
  });

  it("removes its listeners when turned off", () => {
    const { map, handlers } = fakeMap();

    const disable = enableDroneHover(map);
    expect(handlers.size).toBe(2);

    disable();

    expect(handlers.size).toBe(0);
  });
});
