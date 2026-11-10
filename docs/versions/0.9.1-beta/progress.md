# 0.9.1-beta progress

## Integration on 2026-11-10

Base: main 9551d0eb853707ba90ca1812216d2295b946032e. Integrated the reviewed Goryeo implementation c7d661e and its report 3647522, reader aliases 2954acc, wrong-blank keyboard/completion summary 3e3bc635, and explicit save/complete 8d9e1e6 in an isolated worktree. No textual conflicts. The repaired deployment controller and existing pagination remain unchanged.

The API prerequisite is deployed and healthy; see the [API deployment record](https://github.com/hddooo/file-island-api/commit/0de6dc0d1c67963cc184b78d641133452c73f699). The UI accepts completion only after an acknowledged completed response. Partial/empty completion does not invent answers or wrong-answer rows. Temporary reader aliases do not change persisted quiz/API/XP grading. English-island changes and the unfinished all-era tooltip expansion are not included.

## Functional and regression verification

- Passed 24 targeted Node/JSDOM suites covering the new features, 436 term forms, glossary source/boundary guards, source-node restoration, sparse responses, repeated clicks, late acknowledgements, uncertain retries, definite CAS conflicts, account cleanup, Hongmungwan/PDF and read-only re-practice.
- Verified all 697 current eight-era source questions and 702 re-practice inputs. The old 642-count assertion also failed on unchanged main. Corrected it to the actual approved manifest counts (37/69/55/100/172/118/84/62) and added per-era count and pinned-source SHA assertions. No source data changed.
- Made two test-environment corrections without relaxing behavior: CRLF normalization for a source assertion and the existing JSDOM_PATH dependency override.
- An independent code review found no confirmed release-blocking defect in the four features.

## Isolated headless Edge verification

No user Chrome session/profile was opened. All API interactions used synthetic fixtures; no real-member writes occurred.

- Wrong-answer keyboard: 8 viewport/company combinations, multi-slot/classification/sequence, Tab/Shift+Tab/Enter, IME/repeat/modifiers, focus boundaries, manual grade, Escape/reopen/Back/account switch, reduced motion.
- Save/complete: 32 combinations over four era adapters, 320/390/1440 and low landscape, normal/company mode, one-row score/action, immediate feedback, acknowledged completion and no autosave.
- Full-app navigation: 22 checks for tab/profile/history cancellation, discard and saved navigation.
- Reader aliases: 6 synthetic and 12 source-page combinations. A pre-existing 320px table input clipped Korean text identically on main. Added only a one-glyph-plus-padding minimum to recall textareas; all alias/layout checks now pass, including every input staying within its own table cell and no horizontal page overflow.
- Goryeo tooltips: 6 viewport/company combinations, 18 notes each, keyboard/click/Escape, viewport bounds, repeated mounts and exact restoration before recall.
- Hongmungwan: 25 items across 3 pages at 320/390/1440, unique coverage, preserved return page, full-era review/PDF, era reset and owner cleanup.

Inspected the 390px save screen, 320px wrong-answer modal, fixed 320px source table, and a 390px Goryeo tooltip screenshot. Private source bytes and screenshots stay excluded from Git. Physical iPhone testing and real-account writes are not claimed. These are targeted checks, not a claim that every historical repository test passes; the earlier tooltip CSS-parser hex/RGB comparison remains a known tooling limitation.

Exact-commit build, CI/CD, and deployed version/asset evidence are verified separately after the integration commit is published.
