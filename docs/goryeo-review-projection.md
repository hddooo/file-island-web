# Goryeo practice and answer projection

The immutable bundle previously passed page extraction metadata through practice/answer segments, and the first answer page rendered six independent panels as generic comparison tables. Review rendering now consumes only pinned question prompts, subprompts, option banks, section titles and answer-value spans. The prepared display segments contain no raw practice/answer projection. Each span is checked against the locked source before rendering; mismatches fail closed.

Eight section panels contain exactly 100 existing question identities, 103 temporary fields and 100 numbered answers. Answers use independent ordered lists, not comparison tables. PDF58 culture questions 8–21 remain in practice; answers stay hidden until reveal. No source, bundle, figure, canonical progress data, Joseon code or API pin changes.

Validation: test-goryeo-review-projection compares all 100 questions and answers in all three topic selections (300 + 300 exact text/emphasis comparisons, including option banks, nested strong/u and source colors). It checks nine views, zero extraction metadata in the complete mounted DOM and aria labels, eight answer lists, no answer tables, empty fields, preserved study-topic return and a corrupted review-span rejection. Stage1/2/3, Goryeo session/transport and actual-index 320/390 synthetic QA pass. The legacy stage1 answer-count assertion was updated from six Markdown table headers to 100 explicit answer IDs, eight panels and zero tables.

Private evidence: review-projection-320 and review-projection-390 contain actual-index screenshots and metrics, including compound military responses, invasion options, culture questions8/21 and final answers. Original raw, bundle and PNG inputs remain private. Earlier 235 auth/progress results and the separately unresolved JSDOM progress-recovery crash remain as documented in goryeo-reader-wording.md. No real-device, VoiceOver or production-session verification is claimed; independent full453/540 review remains pending.

Local only: no push, main/CD or production API transition.
