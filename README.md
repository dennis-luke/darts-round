# Darts Round

A real-time scoreboard application for a "darts" round in a quiz. Displays two team scoreboards with animated scoring, answer tracking, and fun Giphy overlays for game events.

## Usage

- **Main View** (`/`) - Displays both team scoreboards
- **Admin** (`/admin`) - Full game control panel for game master

## Prerequisites

- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Run

```bash
ng serve
```

Runs the app at `http://localhost:4200`

## Game State

Game state is stored in browser localStorage under the key `scoreboard`. The game can be reset via the admin panel.