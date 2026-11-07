# Private question requests and reviewed publication

Users enter via /inquiries/question-requests.html. ADMIN entry pages are /ops/members.html and /ops/questions.html; splitting navigation does not change account permissions.

Photo-first local OCR proposes subject, part, number, stem and choices. English part headings and number ranges are candidates, not verified classifications. Highlighted blocks are preferred; missing highlights, mixed parts and uncertain detection are warned. Answers are always manually entered. Optional source labels default to the filename. Part2 accepts audio and ABC. Part1 supports a proposed image rectangle that the user must explicitly confirm; cropping preserves source pixels and never removes highlights or invents image content. Original photos remain private staging assets.

OCR runs in the browser using same-origin Tesseract and English/Korean models. No external OCR transmission. Review includes comparing against originals, administrator explanations and a second normal-image/audio review. Explicit uploader consent to authenticated-member publication is required. Older requests without consent cannot publish until their owner revises them.

The publisher is append-only: it creates new learning content without replacing existing collections, progress or attempts. Preview validates clean images, real group mapping and required audio/passage data. Only ready_for_publish requests with consent and matching revision can publish. API enforces administrator authorization; the frontend never substitutes a public media URL. Published English audio and Korean-history content are fetched through authenticated APIs.

Correct answers retain user-entered-admin-reviewed provenance, not official-answer verification. Server grading is honored for this explicit provenance only; existing AI reference answers retain their separate ungraded treatment.

There is no automatic dot invocation or background explanation generation. An administrator must review and publish. Real textbook-camera accuracy and mobile Safari remain unverified. Synthetic Chrome OCR, Korean/English candidates, manual-answer preservation, crop pixel checks, ownership isolation and isolated backend publication/grading were tested. No production user questions were used as test data or published during validation.

Backend publisher release: a44bfe845e7c3be6734cc2c6acb334fe71965e0a. Existing migration057 and strict manifest remain intact; this publisher adds no database migration or permission grant. Whole-site login and signup approval are a separately coordinated release.
