# Airspace Monitor

A browser-based operator view for drone detection. Simulated drones fly over Vantaa, Finland, while fictional sensors detect them. The live map shows drones, their pilots, sensor coverage and restricted-zone alerts.

> **All data is simulated.** Sensor sites and zones are fictional and approximate, not real aviation data.

## What it does

- **Live map:** follow drones and their pilots as they move, with sensor coverage and restricted zones drawn on the map.
- **Detection status:** see at a glance whether each drone is undetected, tracked or inside a restricted zone.
- **Alerts:** get an alert when a drone enters a restricted zone.
- **Focus on a drone:** select one to see its details and move the camera to it.
- **Simulation controls:** play, pause or speed up the simulation.

It is a demonstration project. It doesn't use real sensor data and has no way to act on a drone.

## Built with

React, TypeScript, MapLibre GL JS, Tailwind CSS, Zustand and Vite, with an [OpenFreeMap](https://openfreemap.org) basemap.

## Running it locally

You'll need [Node.js](https://nodejs.org). Then run:

```bash
npm install
npm run dev
```

Vite prints a local URL to open in your browser.
