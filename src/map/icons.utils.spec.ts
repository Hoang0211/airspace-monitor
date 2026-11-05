import { describe, expect, it, vi } from "vitest";
import { addMapIcons, createSensorIcon, createZoneHatch } from "./icons.utils";
import { SENSOR_ICON_IMAGE, ZONE_HATCH_IMAGE } from "./layers";

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

describe("addMapIcons", () => {
  it("adds both images at double resolution", () => {
    const addImage = vi.fn();

    addMapIcons({ addImage } as never);

    expect(addImage).toHaveBeenCalledWith(SENSOR_ICON_IMAGE, expect.anything(), { pixelRatio: 2 });
    expect(addImage).toHaveBeenCalledWith(ZONE_HATCH_IMAGE, expect.anything(), { pixelRatio: 2 });
  });
});
