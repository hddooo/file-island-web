# History81 workspace local integration checkpoint

Base b60a358 preserves cd94b93 and the separate style release 44e4ecc. API contract: 2062b84b2c7f86de701cc757a23c113fa11e4c09. This is local only; no production gate or index script inclusion is enabled.

The shared adapter binds era, PDF/Script digest, model version, response groups and ordered slots. It reuses the unchanged 79 source quiz renderer for inline inputs, blur/Enter grading, answer feedback, review, pause/resume, batched saves and recovery. Script sessions accept an explicit workspaceFactory for local integration. Practice reuses a retained workspace DOM across internal tab switches; existing study/exam/printed-answer content is unchanged.

Observed local tests: real private models render 172 Joseon +104 Goryeo physical inputs at 320/390/1440. Synthetic persistence confirms draft save, pause, review/resume, re-mount restore and teardown. Actual index synthetic API confirms both era routes, internal tab draft retention, logout removal and no legacy79 workspace requests. Existing mode/session regression passed. The synthetic fixture does not test actual server grading or database writes.

Remaining before activation: connect reviewed API deployment capability and app-level prepareLeave to external route transitions; verify conflict, failed-save, aborted PUT/late ACK, account replacement and real API contract together. The adapter exposes prepareLeave but the app has not yet wired it; do not release this checkpoint or claim complete 79 functionality. Physical device/VoiceOver/real member sessions unverified. Opening unchanged. No private model/source/image/QA capture included in Git.
