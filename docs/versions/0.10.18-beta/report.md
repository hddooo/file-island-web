# 0.10.18-beta report

## Changes
The requested Injo event labels use the clearer parenthetical format. The requested event and law/monument names are emphasized; only the specified preceding display marker is removed. The existing policy-debate item is last in its local war list, and the requested Yeongjo revolt precedes the related policy items. All operations are restricted to verified source/royal context and use existing term IDs and rendered text; private textbook passages are not added to public files.

## Verified code
Final `media/history81-terms.js` SHA-256: `f296c890cccbccf5fa8bcfa608260ff1851e6a760167d7b6c4fa0639915a3195`.

- 56 focused synthetic cases passed. Existing 32 event-emphasis cases, 451 term forms/396 IDs, glossary, boundary and tooltip interaction regressions passed.
- Actual private bundle: 20 views, 218 assertions passed. Only five requested changes occur in the relevant concept view; the other 19 views are identical. Source bytes and data object remain unchanged.
- Blank counts 45/73/66/78 and 172 quiz slots remain unchanged. IDs, TOC, 24 tooltip checks, exact original-node/HTML restoration, remount and mode transitions pass.
- Chromium/WebKit: 64 browser conditions passed, split into 32 synthetic and 32 actual private-fragment conditions. Tested 320×780, 390×844, 1440×1000 and 844×320, normal/company themes and normal/reduced motion. Exact requested strings, list order, pointer/keyboard tooltips, colors, viewport bounds, no page overflow/errors and restoration passed.
- Desktop/mobile actual-fragment overview screenshots directly inspected. Private evidence stays outside the repository and is not published.
- JavaScript syntax, standalone auth-generation freshness and whitespace checks passed.

## Boundaries
Actual-source visual verification uses isolated minimal fragments with reconstructed wrappers and screenshot-only rowspans normalized to retained rows. It is not an authenticated production-reader or real-device test. Existing 320px table-internal horizontal scrolling remains; no new document or tooltip overflow was introduced. No user Chrome, account credentials, source-data write, auth change or access-policy change was used.

The existing `test-history81-tooltip-layout.cjs` color-string assertion fails identically on baseline 4b344fc under this jsdom version (hex versus equivalent rgb serialization); it was not weakened. Actual two-browser color checks passed. The Mac's `test-history81-term-source.cjs` lacked the private bundle path, so exact-source evidence comes from the independent 20-view/218-assertion private-bundle check instead.

## Release evidence
The exact commit artifact, successful CI/CD, live app-version identity and installed-controller manifest are recorded after deployment in the November 12 work log. Local implementation verification alone is not a claim of production completion. Member-only history assets must remain protected.
