import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { describe, expect, it } from "vitest";
import type { LngLat } from "../data/geo.types";
import { offset } from "../data/geo.utils";
import { SENSORS } from "../data/sensors";
import type { Sensor } from "../data/sensors.types";
import { ZONES } from "../data/zones";
import type { Zone } from "../data/zones.types";
import { classifyDrone } from "./classifyDrone.utils";

const CENTER: LngLat = [24.97, 60.3];
const RANGE = 3000;

function makeSensor(position: LngLat): Sensor {
  return { id: "test-sensor", name: "Test sensor", position, rangeMeters: RANGE };
}

/** A square zone reaching `halfSize` meters from its center in each direction. */
function makeZone(id: string, center: LngLat, halfSize: number): Zone {
  const west = offset(center, 270, halfSize)[0];
  const east = offset(center, 90, halfSize)[0];
  const south = offset(center, 180, halfSize)[1];
  const north = offset(center, 0, halfSize)[1];

  return {
    id,
    name: id,
    kind: "protected-site",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  };
}

describe("classifyDrone", () => {
  const sensor = makeSensor(CENTER);

  it("is tracked inside sensor range and outside every zone", () => {
    const zones = [makeZone("far-zone", offset(CENTER, 90, 20_000), 500)];

    expect(classifyDrone({ position: CENTER }, [sensor], zones)).toEqual({
      status: "tracked",
      zone: null,
    });
  });

  it("is an alert inside sensor range and inside a zone, naming the zone", () => {
    const zone = makeZone("near-zone", CENTER, 500);

    expect(classifyDrone({ position: CENTER }, [sensor], [zone])).toEqual({
      status: "alert",
      zone,
    });
  });

  it("names the zone the drone is in when there are several", () => {
    const first = makeZone("first-zone", offset(CENTER, 270, 1500), 500);
    const second = makeZone("second-zone", offset(CENTER, 90, 1500), 500);
    const position = offset(CENTER, 90, 1500);

    expect(classifyDrone({ position }, [sensor], [first, second]).zone).toBe(second);
  });

  it("is undetected outside the range of every sensor", () => {
    const position = offset(CENTER, 0, RANGE + 1000);

    expect(classifyDrone({ position }, [sensor], [])).toEqual({
      status: "undetected",
      zone: null,
    });
  });

  it("is undetected inside a zone that no sensor reaches", () => {
    const position = offset(CENTER, 0, RANGE + 1000);
    const zone = makeZone("uncovered-zone", position, 500);

    expect(classifyDrone({ position }, [sensor], [zone])).toEqual({
      status: "undetected",
      zone: null,
    });
  });

  it("is undetected with no sensors at all", () => {
    expect(classifyDrone({ position: CENTER }, [], []).status).toBe("undetected");
  });

  it("only needs one sensor to reach the drone", () => {
    const farSensor = makeSensor(offset(CENTER, 180, 50_000));

    expect(classifyDrone({ position: CENTER }, [farSensor, sensor], []).status).toBe("tracked");
  });

  it("changes status at the edge of sensor range", () => {
    const justInside = offset(CENTER, 45, RANGE - 1);
    const justOutside = offset(CENTER, 45, RANGE + 1);

    expect(classifyDrone({ position: justInside }, [sensor], []).status).toBe("tracked");
    expect(classifyDrone({ position: justOutside }, [sensor], []).status).toBe("undetected");
  });

  it("raises an alert everywhere inside the real restricted zones", () => {
    const steps = 40;

    for (const zone of ZONES) {
      const ring = zone.polygon.coordinates[0];
      const lngs = ring.map(([lng]) => lng);
      const lats = ring.map(([, lat]) => lat);
      const [west, east] = [Math.min(...lngs), Math.max(...lngs)];
      const [south, north] = [Math.min(...lats), Math.max(...lats)];

      for (let i = 0; i <= steps; i++) {
        for (let j = 0; j <= steps; j++) {
          const position: LngLat = [
            west + ((east - west) * i) / steps,
            south + ((north - south) * j) / steps,
          ];
          if (!booleanPointInPolygon(position, zone.polygon)) continue;

          const { status, zone: found } = classifyDrone({ position }, SENSORS, ZONES);

          expect(status, `no alert at ${position.join(", ")}`).toBe("alert");
          expect(found).toBe(zone);
        }
      }
    }
  });
});
