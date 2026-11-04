# Default theme bootstrap recovery

Runtime behavior already always selects terminal in display-mode.js. Previously HTML had no theme attribute, so a failure of that external script left all html[data-hanq-theme=terminal] rules inactive. This is independent of S3, textbook sources, authentication and saved progress.

Baseline isolated actual-index tests at390px, with only display-mode.js blocked, reproduced a missing theme on subjects/history/toeic-map, body background rgb(247,245,240) instead of rgb(8,30,41), and inherited global-nav ink rgb(24,33,47) instead of rgb(244,247,245). The theme script's network failure on the user's phone is not independently established. Synthetic confirmed-member header portraits remained visible in this reproduction; do not claim this alone proves the reported missing portrait cause.

The runtime fix is one HTML attribute: data-hanq-theme="terminal". The existing script continues handling its normal preference API. No retry, account/progress change, security setting, bucket, URL or S3 connection change is introduced.

scripts/qa-theme-bootstrap.cjs tests actual index with synthetic API/session only, normal and blocked display-mode.js, subjects/history/toeic-map, widths320/390 and Chromium/WebKit. It compares body/nav styles, frame radius and header picture geometry, checks no horizontal overflow, JS errors or progress-marker change, and permits no synthetic writes except the fixture's initial auth refresh. Evidence is ignored under evidence/theme-bootstrap. WebKit is not physical iOS Safari; production authenticated account verification remains unavailable.
