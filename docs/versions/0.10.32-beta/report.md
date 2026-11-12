# 0.10.32-beta report

The normal era menu keeps its original completion contract and displays the saved full-question, floored percentage only for complete records. A current incomplete draft does not acquire a score/time label or an invented completion check. Timestamp formatting accepts valid ISO timestamps with a timezone and validates calendar dates; absent, invalid and impossible dates are omitted. The visible label is recent save, with Korea time, because workspace updatedAt is not a submission-completion field. Existing records and their raw data are untouched.

The Uigeumbu menu now has exactly one exam-wrong section heading: 시대별 학습 - 오답 기출 문제. It is added after the existing blank-wrong section, with no question or grading changes.

Independent implementation covered 80 Chromium/WebKit combinations across 320/390/768/1024/1440px, tall/short viewports, normal/company themes and mode switching. No horizontal overflow or control identity changes were found. Integration repeated the focused calculations, no-record/errors, account/late-response and eight-era wrong-review tests. Screenshots at 320px and 1440px were inspected. No user Chrome or production account writes. Local test success is separate from the subsequent exact official deployment and live checks.
