import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { DroneSummary } from "../detection/detection.types";
import { useAppStore } from "../state/store";
import { DroneDetails } from "./DroneDetails";

function makeSummary(overrides: Partial<DroneSummary> = {}): DroneSummary {
  return {
    id: "UAV-007",
    behavior: "patrol",
    status: "alert",
    speed: 12.34,
    firstSeenAt: 30,
    distanceToPilot: 2500,
    position: [24.97, 60.3],
    pilot: [24.98, 60.31],
    ...overrides,
  };
}

describe("DroneDetails", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("invites a selection when no drone is selected", () => {
    useAppStore.getState().recordTick(0, [], [makeSummary()]);

    render(<DroneDetails />);

    expect(screen.getByRole("heading", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByText("Select a drone to see its details.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("shows the selected drone's details", () => {
    useAppStore.getState().recordTick(165, [], [makeSummary()]);
    useAppStore.getState().selectDrone("UAV-007");

    render(<DroneDetails />);

    expect(screen.getByRole("heading", { name: "UAV-007" })).toBeInTheDocument();
    expect(screen.getByText("Alert")).toBeInTheDocument();
    expect(screen.getByText("Patrol")).toBeInTheDocument();
    expect(screen.getByText("12.3 m/s")).toBeInTheDocument();
    expect(screen.getByText("02:15 ago")).toBeInTheDocument();
    expect(screen.getByText("2.5 km")).toBeInTheDocument();
    expect(screen.getByText("60.30000, 24.97000")).toBeInTheDocument();
    expect(screen.getByText("60.31000, 24.98000")).toBeInTheDocument();
  });

  it("says when a drone has not been seen yet", () => {
    useAppStore.getState().recordTick(0, [], [makeSummary({ firstSeenAt: null })]);
    useAppStore.getState().selectDrone("UAV-007");

    render(<DroneDetails />);

    expect(screen.getByText("Not yet")).toBeInTheDocument();
  });

  it("updates as new ticks arrive", () => {
    useAppStore.getState().recordTick(0, [], [makeSummary()]);
    useAppStore.getState().selectDrone("UAV-007");
    render(<DroneDetails />);

    act(() => useAppStore.getState().recordTick(1, [], [makeSummary({ status: "tracked" })]));

    expect(screen.getByText("Tracked")).toBeInTheDocument();
  });

  it("reports lost contact when the selected drone is gone", () => {
    useAppStore.getState().recordTick(0, [], [makeSummary()]);
    useAppStore.getState().selectDrone("UAV-007");
    render(<DroneDetails />);

    act(() => useAppStore.getState().recordTick(1, [], []));

    expect(screen.getByRole("heading", { name: "UAV-007" })).toBeInTheDocument();
    expect(screen.getByText("Lost contact")).toBeInTheDocument();
  });

  it("clears the selection when closed", async () => {
    const user = userEvent.setup();
    useAppStore.getState().recordTick(0, [], [makeSummary()]);
    useAppStore.getState().selectDrone("UAV-007");
    render(<DroneDetails />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(useAppStore.getState().selectedDroneId).toBeNull();
    expect(screen.getByRole("heading", { name: "Details" })).toBeInTheDocument();
  });
});
