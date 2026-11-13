# Opening-era tooltip expansion (2026-11-13)

## Scope
- Add 28 concise, source-linked definitions: solar calendar, Geonyang era name, central/local modern troops, Donghak concepts, treaties, reforms, civil rights institutions and modern culture.
- Preserve the existing 184 definitions verbatim; extend opening-era page coverage only where aliases occur in the private source.
- Plain-text activation is opt-in per audited definition and source/page guarded. Quiz answer data and source files are unchanged.
- Private source pages 89–107 reviewed locally; no private textbook text/assets are included in this commit.

## Sources
- [Eulmi reform](https://contents.history.go.kr/front/tg/view.do?levelId=tg_004_0720)
- [Military institutions](https://encykorea.aks.ac.kr/Article/E0006714)
- [Donghak peasant movement](https://contents.history.go.kr/front/tg/view.do?ganada=&levelId=tg_004_0950&pageUnit=10&treeId=0200)
- [Donghak chronology](https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_i401500)
- [Hanseong and Tianjin treaties](https://contents.history.go.kr/front/hm/print.do?levelId=hm_115_0070&treeId=010701)
- [Triple intervention](https://contents.history.go.kr/mobile/tg/view.do?ganada=&levelId=tg_004_0410&pageUnit=10&subjectCode=tg_ty_040&tabId=02)
- [Gabo reforms](https://contents.history.go.kr/front/ta/view.do?levelId=ta_h71_0040_0050_0020_0050)
- [Independence Club](https://encykorea.aks.ac.kr/Article/E0015993)
- [Modern culture](https://contents.history.go.kr/front/ta/view.do?levelId=ta_m62_0060_0030)
- [Geomundo and leased territories](https://contents.history.go.kr/front/ta/print.do?levelId=ta_m71_0080_0030_0010_0010&whereStr=)
- [Judicial sovereignty, Giyu memorandum](https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_n401800)
- [105-person incident and press repression](https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_i400100)
- [Daejeon hoetong](https://encykorea.aks.ac.kr/Article/E0014749)
- [Gwanghyewon/Jejungwon](https://contents.history.go.kr/mobile/km/view.do?levelId=km_004_0060_0040_0010)

## Reproducible checks
- `test-opening-plain-glossary.cjs`, `test-history81-glossary-boundaries.cjs`, `test-history81-glossary.cjs`: existing source boundaries/restoration.
- `test-opening-expanded-tooltips.cjs PRIVATE_OPENING_INPUT_DIR`: isolated browser, 320/390/1440, normal/company modes; keyboard/click and viewport checks; actual source reader views.
- Browser uses an isolated local route, not the user's browser. Images and authenticated production sessions are not validated by this fixture.
- Static release builder requires a clean committed runtime; build is run after commit.
