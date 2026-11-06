# 0.5.0-beta verification

## Source

Base main: 7843d20a24894c3f9b24e1de61136f8ddc750776. Company mode is a browser-wide display preference in its own key. Toggling does not remount the app, change the current route, replace source text or submit answers. Default theme and all source/answer data remain intact. All 15 runtime HTML entry documents load the opt-in presentation.

## Checks before publication

- Synthetic DOM cases cover persistence, blocked storage, cross-tab changes, repeated switches, existing node/input/listener preservation, route lists, renamed map hosts, async renders, all HTML entries and map startup suppression.
- Existing MyPage and account suites: 7 and 45 checks pass. App-version build validation passes. JavaScript syntax is checked.
- Whole-repository exact-SHA static build and production deployment must be checked through the existing main workflows.

## Verification limits

Local Chromium is unavailable in this executor. A local preview navigation was rejected by the cloud browser URL policy. No local rendering pass is claimed. After publication, the live desktop/mobile layout, MyPage switch, navigation, reload, normal-mode restoration and standalone pages are to be checked in the permitted production browser.

Required question/source figures remain available because removing them would change learning content. The interface is quieter; it is not a guarantee that another person cannot recognize study content. No live answer, XP, purchase, account or inquiry writes are used for QA. Actual Safari/iPhone and live multiplayer state are not validated by synthetic DOM tests.
