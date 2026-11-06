import { describe, expect, it, vi } from "vitest";
import {
  addMapIcons,
  createDroneIcon,
  createPilotIcon,
  createSensorIcon,
  createZoneHatch,
} from "./icons.utils";
import { DRONE_ICON_IMAGE, PILOT_ICON_IMAGE, SENSOR_ICON_IMAGE, ZONE_HATCH_IMAGE } from "./layers";

function alphaAt(image: ReturnType<typeof createSensorIcon>, x: number, y: number): number {
  return image.data[(y * image.width + x) * 4 + 3];
}

describe("createSensorIcon", () => {
  it("has one RGBA value per pixel", () => {
    const icon = createSensorIcon();

    expect(icon.data).toHaveLength(icon.width * icon.height * 4);
  });

  it("is round: solid in the middle and transparent in the corners", () => {
    const icon = createSensorIcon();
    const middle = Math.floor(icon.width / 2);

    expect(alphaAt(icon, middle, middle)).toBe(255);
    expect(alphaAt(icon, 0, 0)).toBe(0);
    expect(alphaAt(icon, icon.width - 1, icon.height - 1)).toBe(0);
  });
});

describe("createZoneHatch", () => {
  it("has one RGBA value per pixel", () => {
    const hatch = createZoneHatch();

    expect(hatch.data).toHaveLength(hatch.width * hatch.height * 4);
  });

  it("has both stripes and gaps", () => {
    const hatch = createZoneHatch();
    const alphas = new Set<number>();

    for (let y = 0; y < hatch.height; y++) {
      for (let x = 0; x < hatch.width; x++) alphas.add(alphaAt(hatch, x, y));
    }

    expect(Math.min(...alphas)).toBe(0);
    expect(Math.max(...alphas)).toBeGreaterThan(0);
  });

  it("repeats without a visible seam", () => {
    const hatch = createZoneHatch();
    const size = hatch.width;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Stepping one pixel along a stripe, wrapping past the edge, must not change the value.
        const nextX = (x + 1) % size;
        const previousY = (y - 1 + size) % size;
        expect(alphaAt(hatch, nextX, previousY)).toBe(alphaAt(hatch, x, y));
      }
    }
  });
});

describe("createPilotIcon", () => {
  it("has one RGBA value per pixel", () => {
    const icon = createPilotIcon();

    expect(icon.data).toHaveLength(icon.width * icon.height * 4);
  });

  it("is a diamond: solid in the middle and transparent in the corners", () => {
    const icon = createPilotIcon();
    const middle = Math.floor(icon.width / 2);

    expect(alphaAt(icon, middle, middle)).toBe(255);
    expect(alphaAt(icon, 0, 0)).toBe(0);
    expect(alphaAt(icon, icon.width - 1, 0)).toBe(0);
    expect(alphaAt(icon, 0, icon.height - 1)).toBe(0);
    expect(alphaAt(icon, icon.width - 1, icon.height - 1)).toBe(0);
  });
});

describe("createDroneIcon", () => {
  // MapLibre treats alpha above 75% as inside a distance-field icon.
  const EDGE = 0.75 * 255;

  it("has one RGBA value per pixel", () => {
    const icon = createDroneIcon();

    expect(icon.data).toHaveLength(icon.width * icon.height * 4);
  });

  it("points north, with its notch at the bottom", () => {
    const icon = createDroneIcon();
    const middle = Math.floor(icon.width / 2);

    expect(alphaAt(icon, middle, 16)).toBeGreaterThan(EDGE);
    expect(alphaAt(icon, middle, 2)).toBeLessThan(EDGE);
    expect(alphaAt(icon, middle, 38)).toBeLessThan(EDGE);
  });

  it("is outside the shape in the corners", () => {
    const icon = createDroneIcon();

    expect(alphaAt(icon, 0, 0)).toBeLessThan(EDGE);
    expect(alphaAt(icon, icon.width - 1, icon.height - 1)).toBeLessThan(EDGE);
  });

  it("is symmetrical from left to right", () => {
    const icon = createDroneIcon();

    for (let y = 0; y < icon.height; y++) {
      for (let x = 0; x < icon.width / 2; x++) {
        expect(alphaAt(icon, x, y)).toBe(alphaAt(icon, icon.width - 1 - x, y));
      }
    }
  });

  it("fades gradually at the edge, leaving room for a halo", () => {
    const icon = createDroneIcon();
    const values = new Set<number>();

    for (let y = 0; y < icon.height; y++) {
      for (let x = 0; x < icon.width; x++) values.add(alphaAt(icon, x, y));
    }

    expect(values.size).toBeGreaterThan(20);
  });
});

describe("addMapIcons", () => {
  it("adds every image at double resolution", () => {
    const addImage = vi.fn();

    addMapIcons({ addImage } as never);

    expect(addImage).toHaveBeenCalledWith(SENSOR_ICON_IMAGE, expect.anything(), { pixelRatio: 2 });
    expect(addImage).toHaveBeenCalledWith(ZONE_HATCH_IMAGE, expect.anything(), { pixelRatio: 2 });
    expect(addImage).toHaveBeenCalledWith(PILOT_ICON_IMAGE, expect.anything(), { pixelRatio: 2 });
  });

  it("adds the drone arrow as a distance field, so the map can tint it", () => {
    const addImage = vi.fn();

    addMapIcons({ addImage } as never);

    expect(addImage).toHaveBeenCalledWith(DRONE_ICON_IMAGE, expect.anything(), {
      pixelRatio: 2,
      sdf: true,
    });
  });
});
