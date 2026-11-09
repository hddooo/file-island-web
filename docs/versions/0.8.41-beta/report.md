# Verification

Chrome/Edge cover 320,390,768,1024,1440px, normal/company modes, decorator before/after progress mount, and repeated toggles. Actual chapter titles/descriptions are read from index.html, not shortened fixtures. Desktop scope text is single-line without overlap; mobile text wraps without clipping. Existing era progress/account and company-mode regressions run separately. No production user data was touched. Real iPhone and production login were not tested. CI/CD and runtime hashes are required separately.

Legacy company aggregates have environmental blockers: css-tree not installed in available test node_modules; test-company-mode also requires an untracked historical baseline/index.html. 22 company-mode assertions passed before that missing-baseline failure. These are not represented as a full aggregate pass. New real-display-mode browser coverage and the 19 account/progress tests pass.
