# 0.10.22-beta report

The user clarified the overlapping70% boundary as amber and all values below70 as red. No-answer0% remains neutral. Normal mode uses darker accessible amber on the light study page; company mode uses brighter amber on its dark background. Only accuracy colors change. Both O/X overlays remain red.

Each current question shows its section and the same current index as the number list and bottom controls. Source IDs, canonical text/answers and progress data are unchanged. The original source instruction stays visible in smaller type below the heading. Long titles can wrap without clipping on mobile.

Verification before release: 145 functional assertions (including 0/69/70/79/80/100% boundaries), 697 actual source questions / 2,837 assertions, and 24 Chromium/WebKit actual-reader layouts passed. Independent review identified the initial amber caption at 4.426:1; it was darkened to #805800 so small text meets 4.5:1 on the study-page background. Section titles remain in accessible names and the original source instructions remain available. No production account, private source data, API, or security settings were changed. Physical device keyboards were not tested.

Implementation and local verification are complete. Exact-commit official CI/CD and production verification occur after this commit; this document does not claim an unverified deployment.
