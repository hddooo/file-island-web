# Published request learning integration

Prepared frontend only; parent coordinates release after matching backend tests/deployment.

TOEIC: new audioPath must equal /collections/{collectionId}/audio/{encodeURIComponent(groupId)}. It is an identity reference, never a public URL. Cards and playlists call the existing authenticated toeicCbtAudio helper. MP3/WAV blobs bounded20MiB, account epoch/mount lifecycle checks, AbortSignal, blob revocation. Existing HTTPS/legacy source URLs and existing IDs remain unchanged. A missing authenticated file loader cannot fall back to unauthenticated fetch for private tracks. No ZIP download button is reintroduced.

History: /inquiries/published-history.html reads JWT /api/v1/published-history with authenticated-members visibility. It displays member clean assets only through the scoped binary helper. Existing quizProgress and submitAttempt grade/store history; stable submission UUID is retained across uncertain outcomes, with no client-correct answer prediction. Server-grade response identity must match question/version/option before display. Existing QC catalog, attempts and progress selection are untouched. Parent should add the entry link in the normal learning navigation.

Tests: new synthetic private audio/history test passed; existing Practice playlist45 and player17 checks passed. Chrome synthetic history grading rendered375/1280px without overflow. Legacy audio export test core/ZIP checks ran, but its removed ZIP UI expectation times out (user already requested removal). No production data or production writes. Real backend integration and real device audio remain parent release gates.
