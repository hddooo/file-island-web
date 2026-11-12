# 0.10.30-beta report

The live Opening controller returns application/json; charset=utf-8. The former exact Blob.type comparison rejected this valid response as script_json_type before source rendering. The fix splits MIME parameters and normalizes the base type only; neither JSON contents nor validation pins change. HTML, application/jsonp and altered source bytes remain rejected.

An independent investigator ran the actual production Opening service/controller through an isolated loopback Express response under read-only access: the old transport failed, and this same two-check fix loaded 17 tables, 118 questions and 119 fields. No production authentication, route, source or account data was changed. Local Chromium/WebKit fetch-to-Blob checks passed at desktop/mobile widths; WebKit may strip the charset in Blob.type while Chromium preserves it. Both paths are covered along with malformed MIME and tampered bundles. Opening app lifecycle and other-era routes remain unchanged.

No user Chrome or private external upload was used. This commit changes no visual layout, grader, API or saved records. Exact official CI/CD and live version/asset checks are required after commit; local tests alone are not a deployment claim.
