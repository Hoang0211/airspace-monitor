import { describe, expect, it } from "vitest";
import { formatSiteTime } from "./siteTime.utils";

describe("formatSiteTime", () => {
  it.each([
    [0, "00:00"],
    [9, "00:09"],
    [135, "02:15"],
    [3600, "60:00"],
  ])("shows %i seconds as %s", (seconds, expected) => {
    expect(formatSiteTime(seconds)).toBe(expected);
  });
});
