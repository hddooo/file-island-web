# Verification

- Chrome and Edge: 320/390/1440px, three mode cycles each; source image identity, original geometry/text restored; pending, failed and dynamically inserted figure wrappers have zero height in company mode; no image label or horizontal overflow. Synthetic fixtures, no account/data APIs. Screenshot inspected.
- Company/history/directories assertion bodies passed; aggregate retains three pre-existing test harness failures reproduced unchanged on baseline 753fa89 (JSDOM close microtasks and old flex/grid fixture). Main company-mode suite also requires an absent historical baseline/index.html. Not a full suite pass.
- Grade-feedback/storage regression tests passed. JS syntax checked.
- CI and production verification pending. Real iPhone Safari not tested. No API/auth/data change.
