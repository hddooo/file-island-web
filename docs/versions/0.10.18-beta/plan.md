# 0.10.18-beta plan

## Goal
Apply the additional user-requested history-reader label, emphasis and ordering improvements without modifying or publishing private textbook source data.

## Requests
- Format the Injo restoration event with a parenthetical explanation and emphasize the requested event.
- Shorten and emphasize the Yeongjeong-law label, keeping its existing explanatory numbers and meaning in the requested parenthetical layout.
- Emphasize the Samjeondo monument term and remove only its requested preceding display marker.
- Move the existing policy-debate comparison to the bottom of its local Injo list.
- Move the existing Yi Injwa revolt item above the Tangpyeong and stream-work items within its Yeongjo section.

## Preservation and checks
- Use existing public term IDs and transformations of already-rendered text. No private source passage constants in public code or tests.
- Preserve source bytes, node identity on teardown, tooltip definitions/triggers, IDs and blank/quiz answers and records.
- Verify the actual private-source structure and exact changed-file hash with a private fixture outside the repository.
- Run focused boundary and existing regression checks plus separate headless browser rendering without user Chrome.
- Commit and deploy only after checks pass; verify exact CI/CD SHA and deployed manifest, and retain member-only access.
