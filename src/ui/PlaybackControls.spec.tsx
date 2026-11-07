import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../state/store";
import { PlaybackControls } from "./PlaybackControls";

describe("PlaybackControls", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("starts playing at 1×", () => {
    render(<PlaybackControls />);

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1×" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "2×" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "5×" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "10×" })).toHaveAttribute("aria-pressed", "false");
  });

  it("pauses and plays again", async () => {
    const user = userEvent.setup();
    render(<PlaybackControls />);

    await user.click(screen.getByRole("button", { name: "Pause" }));

    expect(useAppStore.getState().playback.playing).toBe(false);

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(useAppStore.getState().playback.playing).toBe(true);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("selects only the clicked speed", async () => {
    const user = userEvent.setup();
    render(<PlaybackControls />);

    await user.click(screen.getByRole("button", { name: "5×" }));

    expect(useAppStore.getState().playback.speed).toBe(5);
    expect(screen.getByRole("button", { name: "5×" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "1×" })).toHaveAttribute("aria-pressed", "false");
  });

  it("stays paused when the speed changes, and keeps the speed when pausing", async () => {
    const user = userEvent.setup();
    render(<PlaybackControls />);

    await user.click(screen.getByRole("button", { name: "Pause" }));
    await user.click(screen.getByRole("button", { name: "2×" }));

    expect(useAppStore.getState().playback).toEqual({ playing: false, speed: 2 });

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(useAppStore.getState().playback).toEqual({ playing: true, speed: 2 });
  });
});
