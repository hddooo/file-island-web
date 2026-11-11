# 0.10.7-beta progress

Baseline: a06605d42717e2545d0474f4e1f9c3f164f4ad33 (0.10.6-beta).

Implementation and local checks passed. The subtitle is a block-level small element, 14px/1.5, below the unchanged 20px heading, with parentheses and wrapping within the existing header cell.

`test-joseon-group-subtitle.cjs <private bundle JSON> <baseline reader JS>` compared 16 repeated study/exam views across four topics, normalized only the new subtitle parentheses, and found all other rendered DOM unchanged. Recall answer counts remain 45/73/66/78 (262 total). The bundle bytes and teardown behavior are unchanged. Private inputs and answer text are not included in this repository.

An isolated cloud-browser synthetic fixture verified the 320/390/1440/844px layouts, exact computed sizes, below-heading placement and visible wrapping. This is not an authenticated production or physical-device test.

Publication is tracked separately. The active main build workflow performs a static build, not automatic regression tests. No workflow was changed.
