# 0.10.1-beta progress

Implementation integrated without conflicts. Runtime changes are the two reader JS/CSS pairs and one index.html click-guard condition. The additional integration QA assertions cover the already deployed Retry / Save controls; no other production code was added.

Validation completed before publication:
- 15 integration regression suites passed: three session/mode suites; blank retry and explicit save; review capability fallback; completion/menu/progress; wrong-answer practice; shared four-tab UI; keyboard, navigation and responsive browser checks.
- Exact baseline comparison passed for 14 source views and 276 draft fields (104 Goryeo, 172 Joseon), including text, tables, source card/figure IDs and teardown. Input bundles stayed unchanged.
- Goryeo inline notes passed all six views with original nodes restored and repeated mounts verified.
- Full application QA passed 20 era/viewport combinations at 320, 390, 1440 and 812x375 in isolated headless Edge with reduced motion. Topic/mode navigation, local retry, explicit-save presence, absent review checkboxes, cancelled real page leave, Back/Forward draft retention and image-dialog dismissal passed. Script errors, document overflow and workspace writes were all zero.
- Mobile, desktop and landscape screenshots were inspected. The user's Chrome and real account data were not used. This is not physical-device or all-engine certification.

Known baseline test debt is kept separate: test-joseon-script-reader.cjs fails its obsolete practice placeholder assertion at line 18 on both deployed 38b8d14 and this candidate. The implementation review also identified pre-existing obsolete test-goryeo-stage1.cjs expectations on 3518020. Neither legacy test was weakened or reported as passing. The exact source-preservation comparison above is the release-specific content check.

Exact-commit static/version build, remote CI/CD and live SHA checks follow the release commit; their completion is reported after publication.