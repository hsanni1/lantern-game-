# Lantern Game

## Scene 1: Festival Street

A semi-realistic night street in a lantern festival town, built in Blender 5.2.

![Festival street preview](renders/festival_street_preview.png)

| File | What it is |
|---|---|
| `blender/festival_street.blend` | Source scene (collections: Environment, Buildings, Lanterns, Lighting) |
| `exports/festival_street.glb` | Game-ready export with lights and camera |
| `renders/festival_street_preview.png` | Preview render from the main camera |

**Scene contents:** a 60 m cobblestone street with sidewalks, 20 gabled houses with lit and dark windows,
11 rope strings of red/orange/gold paper lanterns (shared meshes, one warm point light per string),
45 floating sky lanterns, and a red lacquer festival gate at the far end.

**Notes:** lanterns and windows are emissive materials; enable bloom in your game engine for the glow.
