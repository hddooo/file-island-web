# Progress

Implemented client-side pagination after existing owner-scoped fetch. Pages retain server order; duplicate IDs continue to be rejected. Opening a row uses the absolute era index; returning retains the list page. Era changes reset to page one. Full review pool and PDF era parameters unchanged.

Passed node syntax, existing Hongmungwan and PDF tests, and qa-hong-pagination.cjs at Chromium Edge widths 320/390/1440. Synthetic fixture: 25 same-era items plus one other-era item. Verified unique coverage, boundary disabling, page retention, full review/PDF scope, owner cleanup and zero writes during listing. Screenshot inspected at 320px. Actual iPhone and real-member mutation not tested.

## 2026-11-10 deployment copy recovery

The successful build for pagination commit 944ca3e09d320b3b818059d27ad8d1529ac4b4fe did not deploy: the installed controller failed while copying from the Windows bind mount (`cp: read error: Out of memory`). Production remained on c27264bd787238b64df820cf310cae67547e641b.

Replaced only the controller copy primitive with bounded 64 KiB `dd` reads. Artifact verification, post-copy SHA-256 verification, deployment lock, atomic release switch, health checks, old-asset retention and rollback are unchanged. The reviewed controller was installed after explicit approval; its SHA-256 is 6d706cd90692e69396da47b05ea3e9ca8445973663f6468e3d41f591f815c67b. The previous controller was backed up. No permissions, credentials or application data changed.

Validation: controller Node tests passed 15/15 runnable tests; the Linux-only symlink case was skipped on Windows. The pinned production image passed the isolated integration suite: bootstrap refusal, corrupted-copy rejection, post-switch health rollback, atomic success and old assets, stale-run refusal, concurrent lock, interrupted rollback, and idempotent redeploy. Publication and actual domain verification remain pending for the recovery commit.
