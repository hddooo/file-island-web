# 0.10.17-beta report

The display layer wraps the two requested complete event lines in emphasis while retaining existing text, parentheses, tooltip triggers and exact original node restoration. The public code contains only existing term IDs, context guards and structural matching; no textbook passages or private bundle bytes are added to the repository.

Synthetic functional, regression and six-view WebKit visual checks passed. The actual bundle structure was independently found to contain each complete requested line in a single list item. The exact changed file (Git blob `c118faea5372361c13520436fa80e6adf6ea0149`, SHA-256 `0434801f713dbaf096eb0101532ec5780219e9b82ced36aa1b609c3376d2196d`) passed 165 assertions with the actual private bundle. Across 20 views, only the two target list items gained whole-line strong wrappers. All other DOM, text, TOC and IDs matched the baseline after removing those wrappers. Both existing tooltips passed click/Enter/Escape; eight concept/exam views restored original HTML and node identity after stop, including remount and duplicate stop. Bundle hash remained unchanged.

Actual-bundle verification was DOM-based. Its cloud Chromium process could not open a socket, so it is not claimed as actual-source pixel verification. The six separately rendered synthetic WebKit views remain the visual evidence. No user Chrome, actual account session or protected production reader was used.

The auth redesign remains the previously deployed 0.10.16-beta implementation. No auth, account, source-data, credential or access-rule changes are included. Production login retention remains unsupported until the server declares the capability; this patch does not change that condition.

This file is not deployment evidence until the exact commit, CI/CD and production result are recorded in the November 12 work log.
