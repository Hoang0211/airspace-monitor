import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Alert } from "../detection/detection.types";
import { useAppStore } from "../state/store";
import { AlertList } from "./AlertList";

function makeAlert(droneId: string, time: number): Alert {
  return { id: `${droneId}-${time}`, droneId, zoneName: "Helsinki Airport", time };
}

describe("AlertList", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("says when there are no alerts", () => {
    render(<AlertList />);

    expect(screen.getByRole("heading", { name: "Alerts (0)" })).toBeInTheDocument();
    expect(screen.getByText("No alerts")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("shows the drone, zone and time of an alert", () => {
    useAppStore.getState().recordTick(0, [makeAlert("UAV-007", 135)]);
    render(<AlertList />);

    const row = within(screen.getByRole("listitem"));

    expect(row.getByText("UAV-007")).toBeInTheDocument();
    expect(row.getByText("Helsinki Airport")).toBeInTheDocument();
    expect(row.getByText("02:15")).toBeInTheDocument();
    expect(screen.queryByText("No alerts")).not.toBeInTheDocument();
  });

  it("adds a new alert above the older ones and updates the count", () => {
    useAppStore.getState().recordTick(0, [makeAlert("UAV-001", 10)]);
    render(<AlertList />);

    act(() => useAppStore.getState().recordTick(0, [makeAlert("UAV-002", 20)]));

    const rows = screen.getAllByRole("listitem");

    expect(screen.getByRole("heading", { name: "Alerts (2)" })).toBeInTheDocument();
    expect(within(rows[0]).getByText("UAV-002")).toBeInTheDocument();
    expect(within(rows[1]).getByText("UAV-001")).toBeInTheDocument();
  });

  it("keeps the existing rows when a new alert arrives, so they don't flash again", () => {
    useAppStore.getState().recordTick(0, [makeAlert("UAV-001", 10)]);
    render(<AlertList />);
    const originalRow = screen.getByRole("listitem");

    act(() => useAppStore.getState().recordTick(0, [makeAlert("UAV-002", 20)]));

    expect(screen.getAllByRole("listitem")[1]).toBe(originalRow);
  });
});
