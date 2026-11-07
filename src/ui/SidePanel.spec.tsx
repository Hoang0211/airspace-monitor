import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { DroneSummary } from "../detection/detection.types";
import { useAppStore } from "../state/store";
import { SidePanel } from "./SidePanel";

const DRONE: DroneSummary = {
  id: "UAV-007",
  behavior: "patrol",
  status: "tracked",
  speed: 10,
  firstSeenAt: 0,
  distanceToPilot: 100,
  position: [24.97, 60.3],
  pilot: [24.98, 60.3],
};

const tab = (name: RegExp) => screen.getByRole("button", { name });

/** The wrapper around a section, which hides it on narrow screens unless its tab is active. */
const wrapperOf = (heading: string) =>
  screen.getByRole("heading", { name: heading }).closest("section")?.parentElement;

describe("SidePanel tabs", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
    useAppStore.getState().recordTick(0, [], [DRONE]);
  });

  it("opens on the alerts, showing counts on the list tabs", () => {
    render(<SidePanel />);

    expect(tab(/^Alerts \(0\)$/)).toHaveAttribute("aria-pressed", "true");
    expect(tab(/^Drones \(1\)$/)).toHaveAttribute("aria-pressed", "false");
    expect(wrapperOf("Alerts (0)")).not.toHaveClass("hidden");
    expect(wrapperOf("Drones (1)")).toHaveClass("hidden");
  });

  it("switches section when a tab is pressed", async () => {
    const user = userEvent.setup();
    render(<SidePanel />);

    await user.click(tab(/^Drones/));

    expect(tab(/^Drones/)).toHaveAttribute("aria-pressed", "true");
    expect(tab(/^Alerts/)).toHaveAttribute("aria-pressed", "false");
    expect(wrapperOf("Drones (1)")).not.toHaveClass("hidden");
    expect(wrapperOf("Alerts (0)")).toHaveClass("hidden");
  });

  it("opens the details when a drone is selected", () => {
    render(<SidePanel />);

    act(() => useAppStore.getState().selectDrone("UAV-007"));

    expect(tab(/^Details$/)).toHaveAttribute("aria-pressed", "true");
    expect(wrapperOf("UAV-007")).not.toHaveClass("hidden");
  });

  it("opens the details when a drone is chosen from the list", async () => {
    const user = userEvent.setup();
    render(<SidePanel />);

    await user.click(tab(/^Drones/));
    await user.click(screen.getByRole("button", { name: /UAV-007.*Tracked/ }));

    expect(tab(/^Details$/)).toHaveAttribute("aria-pressed", "true");
  });

  it("stays on the current tab when the selection is cleared", async () => {
    const user = userEvent.setup();
    useAppStore.getState().selectDrone("UAV-007");
    render(<SidePanel />);
    await user.click(tab(/^Layers$/));

    act(() => useAppStore.getState().selectDrone(null));

    expect(tab(/^Layers$/)).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps every section in the panel on wider screens", () => {
    render(<SidePanel />);

    for (const heading of ["Alerts (0)", "Drones (1)", "Details"]) {
      expect(wrapperOf(heading)).toHaveClass("md:contents");
    }
  });
});
