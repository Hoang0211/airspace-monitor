import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { describe, expect, it } from "vitest";
import { SENSORS } from "../data/sensors";
import { ZONES } from "../data/zones";
import type { ClassifiedDrone } from "../detection/detection.types";
import {
  coverageToGeoJSON,
  dronesToGeoJSON,
  linesToGeoJSON,
  pilotsToGeoJSON,
  sensorsToGeoJSON,
  zonesToGeoJSON,
} from "./geojson.utils";

const METERS_PER_DEGREE_LAT = 111_195;

function makeDrone(overrides: Partial<ClassifiedDrone> = {}): ClassifiedDrone {
  return {
    id: "UAV-012",
    behavior: "transit",
    position: [24.97, 60.3],
    pilot: [24.98, 60.31],
    heading: 45,
    speed: 10,
    waypoints: [[25, 60.4]],
    waypointIndex: 0,
    missionRemaining: null,
    trail: [
      [24.96, 60.29],
      [24.97, 60.3],
    ],
    status: "tracked",
    zone: null,
    ...overrides,
  };
}

function metersBetween([lng1, lat1]: number[], [lng2, lat2]: number[]): number {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot((lng2 - lng1) * metersPerDegreeLng, (lat2 - lat1) * METERS_PER_DEGREE_LAT);
}

describe("GeoJSON conversion", () => {
  it("creates one labelled point per sensor", () => {
    const { features } = sensorsToGeoJSON(SENSORS);

    expect(features).toHaveLength(SENSORS.length);
    expect(features[0].geometry.coordinates).toEqual(SENSORS[0].position);
    expect(features[0].properties?.name).toBe(SENSORS[0].name);
  });

  it("creates one coverage polygon per sensor at that sensor's range", () => {
    const { features } = coverageToGeoJSON(SENSORS);

    expect(features).toHaveLength(SENSORS.length);
    features.forEach((feature, index) => {
      const sensor = SENSORS[index];
      expect(feature.properties?.sensorId).toBe(sensor.id);

      for (const vertex of feature.geometry.coordinates[0]) {
        const distance = metersBetween(sensor.position, vertex);
        expect(Math.abs(distance - sensor.rangeMeters)).toBeLessThan(sensor.rangeMeters * 0.01);
      }
    });
  });

  it("keeps each zone's polygon and name", () => {
    const { features } = zonesToGeoJSON(ZONES);

    expect(features).toHaveLength(ZONES.length);
    expect(features[0].geometry).toEqual(ZONES[0].polygon);
    expect(features[0].properties?.name).toBe(ZONES[0].name);
  });

  it("draws each drone at its position, with a numeric ID, its heading and its status", () => {
    const drone = makeDrone({ status: "alert" });
    const [feature] = dronesToGeoJSON([drone]).features;

    expect(feature.id).toBe(12);
    expect(feature.geometry.coordinates).toEqual(drone.position);
    expect(feature.properties).toEqual({ droneId: "UAV-012", heading: 45, status: "alert" });
  });

  it("draws each pilot at the pilot's position", () => {
    const drone = makeDrone();
    const [feature] = pilotsToGeoJSON([drone]).features;

    expect(feature.geometry.coordinates).toEqual(drone.pilot);
    expect(feature.properties?.droneId).toBe("UAV-012");
  });

  it("creates a trail and a pilot link for each drone", () => {
    const drone = makeDrone({ status: "undetected" });
    const { features } = linesToGeoJSON([drone]);
    const trail = features.find((feature) => feature.properties?.kind === "trail");
    const link = features.find((feature) => feature.properties?.kind === "pilot-link");

    expect(features).toHaveLength(2);
    expect(trail?.id).toBe(12);
    expect(trail?.geometry.coordinates).toEqual(drone.trail);
    expect(trail?.properties?.status).toBe("undetected");
    expect(link?.geometry.coordinates).toEqual([drone.pilot, drone.position]);
  });

  it("skips a trail that is too short to be a line", () => {
    const { features } = linesToGeoJSON([makeDrone({ trail: [[24.97, 60.3]] })]);

    expect(features.map((feature) => feature.properties?.kind)).toEqual(["pilot-link"]);
  });

  it("returns empty collections when there are no drones", () => {
    expect(dronesToGeoJSON([]).features).toEqual([]);
    expect(pilotsToGeoJSON([]).features).toEqual([]);
    expect(linesToGeoJSON([]).features).toEqual([]);
  });
});

describe("static data", () => {
  it("keeps every restricted zone fully inside sensor coverage", () => {
    const coverage = coverageToGeoJSON(SENSORS).features;
    const steps = 40;

    for (const zone of ZONES) {
      const ring = zone.polygon.coordinates[0];
      const lngs = ring.map(([lng]) => lng);
      const lats = ring.map(([, lat]) => lat);
      const [west, east] = [Math.min(...lngs), Math.max(...lngs)];
      const [south, north] = [Math.min(...lats), Math.max(...lats)];

      for (let i = 0; i <= steps; i++) {
        for (let j = 0; j <= steps; j++) {
          const point = [west + ((east - west) * i) / steps, south + ((north - south) * j) / steps];
          if (!booleanPointInPolygon(point, zone.polygon)) continue;

          const covered = coverage.some((area) => booleanPointInPolygon(point, area));
          expect(covered, `${zone.id} is uncovered at ${point.join(", ")}`).toBe(true);
        }
      }
    }
  });
});
