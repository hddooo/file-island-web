# 0.10.17-beta plan

## Goal
Emphasize the two user-requested Joseon event lines in the existing source reader without adding private textbook passages to the public repository.

## Scope
Use the existing Sampo and Yangjae term IDs to find only complete, already-rendered matching lines. Preserve the existing parentheticals, source text, term tooltips, colors, node identity and teardown. Guard the era, source and royal-row context; leave unrelated lines unchanged.

## Acceptance
- Synthetic boundaries, controls, styles, tooltip interactions and exact restoration tests.
- Existing term-form, supplemental and royal-note regressions.
- Independent WebKit visual checks at 320/390/1440px in ordinary/company themes.
- Read-only actual private-bundle comparison with the exact changed public-file hash. No source publication.
- Separate commit and existing CI/CD deployment, exact production SHA verification, with protected runtime asset verification through the installed deployment controller. No account credentials or access-policy changes.
