# 0.5.0-beta verification

## Source

Base main: 7843d20a24894c3f9b24e1de61136f8ddc750776. Company mode is a browser-wide display preference in its own key. Toggling does not remount the app, change the current route, replace source text or submit answers. Default theme and all source/answer data remain intact. All 15 runtime HTML entry documents load the opt-in presentation.

## Checks before publication

- Synthetic DOM cases cover persistence, blocked storage, cross-tab changes, repeated switches, existing node/input/listener preservation, route lists, renamed map hosts, async renders, all HTML entries and map startup suppression.
- Existing MyPage and account suites: 7 and 45 checks pass. App-version build validation passes. JavaScript syntax is checked.
- Whole-repository exact-SHA static build and production deployment must be checked through the existing main workflows.

## Verification limits

Local Chromium is unavailable in this executor. A local preview navigation was rejected by the cloud browser URL policy. No local rendering pass is claimed. After publication, the live desktop/mobile layout, MyPage switch, navigation, reload, normal-mode restoration and standalone pages are to be checked in the permitted production browser.

Per the later user request, history views are text-only in company mode, including question/source images and standalone readers. Existing alt text is reused; otherwise a neutral image-omitted note is shown. Sources, media URLs, and normal-mode images are preserved. Image-dependent questions may require normal mode to answer; no invented visual descriptions are supplied. TOEIC question images are retained. The interface is quieter; it is not a guarantee that another person cannot recognize study content. No live answer, XP, purchase, account or inquiry writes are used for QA. Actual Safari/iPhone and live multiplayer state are not validated by synthetic DOM tests.

## Production follow-up

Initial release 1149c75650185daa23796330499fc86ad2b6f961 and contrast follow-up 0b0459264b8f1f164952baf9643cc230c8500e6f both passed exact-SHA build and atomic production deployment. The production browser confirmed the latter SHA, company preference surviving reload, world-map host remaining empty (zero canvas), text directory navigation, saved prehistory answers, TOEIC vocabulary and Part 5 question controls, and Goryeo theory/blank views. Real rendering exposed legacy important CSS overrides; the follow-up corrected button chrome, reader backgrounds and fonts.

The next refinement compacts legacy span/div text and quiz gutters and implements the later history-image requirement. Synthetic company-mode cases: 20 pass. Its exact-SHA CI/deploy and final visual checks still need verification after publication. History document iframes are preserved; only media inside their independently themed documents is hidden. A dedicated regression case prevents hiding the full text document. Actual browser widths used: 1180 and 500 CSS pixels. Native browser emulation was unavailable; 320/390, Safari/iPhone, live grading, live multiplayer and every historical modal state are not claimed as tested.

## Tooltip contrast correction

The previous company release 2fa45bb25046bed8025fff3eaf42534881fb2b65 passed build/deploy and live SHA verification. A subsequent user report exposed a separate painted-text rule: the history tooltip retained `-webkit-text-fill-color: #182f24` over company background `#161b22`, about 1.21:1 contrast even though computed `color` was light. The popup itself opened and positioned normally.

The correction uses the requested light-gray `#d1d5db` tooltip surface with dark `#111827` text and resets independent WebKit text fill. It also resets the same legacy fill/caret override on history blank inputs. All changes are scoped to company mode; tooltip interaction code and normal-mode colors are unchanged. Company checks: 22 pass. Existing tooltip interaction tests pass for mouse, touch-style events, keyboard, dismissal, replacement and cleanup. Exact-SHA production validation follows publication.
