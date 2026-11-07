import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../state/store";
import { SiteTime } from "./SiteTime";

describe("SiteTime", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("starts at zero", () => {
    render(<SiteTime />);

    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
  });

  it("follows the site time in the store", () => {
    render(<SiteTime />);

    act(() => useAppStore.getState().recordTick(135, []));

    expect(screen.getByRole("timer")).toHaveTextContent("02:15");
  });
});
