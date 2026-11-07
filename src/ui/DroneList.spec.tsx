import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { LngLat } from "../data/geo.types";
import type { DroneStatus, DroneSummary } from "../detection/detection.types";
import { useAppStore } from "../state/store";
import { DroneList } from "./DroneList";

const POSITION: LngLat = [24.97, 60.3];

function makeDrone(id: string, status: DroneStatus): DroneSummary {
  return {
    id,
    behavior: "transit",
    status,
    speed: 10,
    firstSeenAt: 0,
    distanceToPilot: 100,
    position: POSITION,
    pilot: [24.98, 60.3],
  };
}

const rowNames = () => screen.getAllByRole("listitem").map((row) => row.textContent);

describe("DroneList", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
    useAppStore
      .getState()
      .recordTick(0, [], [makeDrone("UAV-002", "tracked"), makeDrone("UAV-001", "undetected")]);
    useAppStore.setState({ flyTarget: null });
  });

  it("shows the count, and each drone's ID and status as text", () => {
    render(<DroneList />);

    const rows = screen.getAllByRole("listitem");

    expect(screen.getByRole("heading", { name: "Drones (2)" })).toBeInTheDocument();
    expect(within(rows[0]).getByText("UAV-002")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Tracked")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Undetected")).toBeInTheDocument();
  });

  it("sorts by status by default, and by ID after using the toggle", async () => {
    const user = userEvent.setup();
    render(<DroneList />);

    expect(rowNames()).toEqual(["UAV-002Tracked", "UAV-001Undetected"]);

    await user.click(screen.getByRole("button", { name: "Sort: Status" }));

    expect(rowNames()).toEqual(["UAV-001Undetected", "UAV-002Tracked"]);

    await user.click(screen.getByRole("button", { name: "Sort: ID" }));

    expect(rowNames()).toEqual(["UAV-002Tracked", "UAV-001Undetected"]);
  });

  it("selects the drone and flies to it when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<DroneList />);

    await user.click(screen.getByRole("button", { name: /UAV-001/ }));

    expect(useAppStore.getState().selectedDroneId).toBe("UAV-001");
    expect(useAppStore.getState().flyTarget).toEqual(POSITION);
  });

  it("marks only the selected row", () => {
    useAppStore.getState().selectDrone("UAV-001");
    render(<DroneList />);

    expect(screen.getByRole("button", { name: /UAV-001/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /UAV-002/ })).toHaveAttribute(
      "aria-current",
      "false",
    );
  });

  it("moves a drone to the top when its status becomes an alert", () => {
    render(<DroneList />);

    act(() =>
      useAppStore
        .getState()
        .recordTick(1, [], [makeDrone("UAV-002", "tracked"), makeDrone("UAV-001", "alert")]),
    );

    expect(rowNames()).toEqual(["UAV-001Alert", "UAV-002Tracked"]);
  });

  it("removes a drone that has gone", () => {
    render(<DroneList />);

    act(() => useAppStore.getState().recordTick(1, [], [makeDrone("UAV-002", "tracked")]));

    expect(screen.getByRole("heading", { name: "Drones (1)" })).toBeInTheDocument();
    expect(screen.queryByText("UAV-001")).not.toBeInTheDocument();
  });
});
