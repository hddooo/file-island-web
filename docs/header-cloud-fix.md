# Header seam and English cloud correction

Scope: existing header/scene connection and English-map decorative clouds only.
No font, route, auth, question, progress, audio, database or permission changes.

## Evidence

Both supplied reference screenshots were inspected:
- libfile_e9f283f9fdc08191b111a63e0bf182bb (English map)
- libfile_d3af7909330c819196ecb1ae202bb865 (world map)

The continuous-screen rules already existed but lost to older, more specific
desktop selectors. The two-ID selector now wins only inside that existing
correction block: zero shell padding, a single hardware clip, no second crown
radius, header and scene sharing exact horizontal edges.

The old atmosphere animation was running in local Chromium, not completely
broken. Its faint large ellipses were difficult to distinguish from the static
clouds painted into the original image. English-only soft cloud banks now move
visibly across the upper scene. The original artwork and water stay unchanged.
Hidden/offscreen/low-power pause and OS reduced-motion preferences are retained.
This does not establish why a particular user browser was paused.

## Validation

Run with Playwright available on NODE_PATH:
node scripts/test-header-cloud.cjs

8 synthetic local full-app cases: 320x740, 390x844, 844x390, 1440x1000;
English map and world map. Exact header/content seam, no inner side gap,
no duplicate rounded crown, no horizontal overflow. English cloud transform
changes over time, paused class pauses it, reduced motion hides/disables it.
All URLs intercepted: local assets or synthetic API data; no production writes.
Desktop and 390px screenshots visually reviewed. Evidence generated under
evidence/header-cloud (not committed).

Parent owns integration and deployment. No index.html change is necessary.
