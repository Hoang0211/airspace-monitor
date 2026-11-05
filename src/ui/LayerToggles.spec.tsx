import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../state/store";
import { LayerToggles } from "./LayerToggles";

describe("LayerToggles", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("shows a checked checkbox for every layer", () => {
    render(<LayerToggles />);

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes).toHaveLength(5);
    for (const checkbox of checkboxes) expect(checkbox).toBeChecked();
  });

  it("updates only the clicked layer in the store", async () => {
    const user = userEvent.setup();
    render(<LayerToggles />);

    await user.click(screen.getByRole("checkbox", { name: "Coverage" }));

    expect(useAppStore.getState().layers).toEqual({
      sensors: true,
      coverage: false,
      zones: true,
      trails: true,
      pilots: true,
    });
    expect(screen.getByRole("checkbox", { name: "Coverage" })).not.toBeChecked();
  });

  it("turns a hidden layer back on", async () => {
    const user = userEvent.setup();
    useAppStore.getState().setLayerVisible("zones", false);
    render(<LayerToggles />);

    const checkbox = screen.getByRole("checkbox", { name: "Restricted zones" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(useAppStore.getState().layers.zones).toBe(true);
    expect(checkbox).toBeChecked();
  });
});
