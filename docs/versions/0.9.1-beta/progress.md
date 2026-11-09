# 0.9.1-beta progress

- Implemented 18 reviewed note placements in Goryeo political and social/economic history. Notes are extracted from the pinned private DOM at runtime, not copied into the public bundle. Original nodes return on stop and before blank recall.
- Passed the 436-form term suite, tooltip interactions, glossary boundaries, and private-source checks across six study/exam views with repeated mounts and exact original-node restoration.
- Passed Edge desktop automation at 320/390/1440px, normal/company mode (108 note placements), keyboard/click/Escape, viewport bounds, no horizontal page overflow and recall round trips. Reviewed 390px screenshots. This is not physical mobile QA.
- Existing tooltip CSS unit test fails on both this branch and unchanged 944ca3e because the installed CSS parser returns hex rather than rgb strings. No CSS was changed; actual browser layouts pass.
- Static build regression passed on implementation commit c7d661e67c526563175e7252b53aaf32b028c582: repeatable manifest, full SHA, 1,724 runtime files, private/source exclusions and existing-output preservation. This follow-up changes documentation only. Main build/deployment and production verification are pending. Deployment-controller repair belongs to a separate task and was not changed here.
