/* 고대사 · 삼국 시대 / 남북국 시대 시기별 요약 — 교재 사실 목록·원래 요점·교재 핵심표가 실제 화면에 보이는가, 나라별 왕·업적·영토 흐름과 헷갈리는 짝,
 * 떠올리기 정답 숨김(장면 시작부터 · 위쪽 띠 포함)과 자동 공개, 계산한 재생 시간(늘리지 않음), 끝 장면 하나, 멈춤·가린 탭·모드·이동·다시 재생,
 * 메뉴·CBT 경로, 고려·조선·선사·고조선·백제 생성 덱과 원래 자료 그대로 (가짜 시계) */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict'), crypto = require('crypto');
const { JSDOM } = require(process.env.JSDOM_PATH || process.env.HANQ_JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const norm = s => String(s || '').replace(/[^0-9A-Za-zㄱ-ㆎ가-힣一-鿿]/g, '').toLowerCase();
const MEDIA = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards', 'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'period-reviews', 'review-player', 'review-menu'];
/* 기준판 front dev 7b4d45d에서 잰 값 */
const BEFORE = {
  goryeo: { deck: '189bb1052d3325fb05990aa12da668fd9b39573aef7c7f313472c93dd84093be', steps: 'b78e12116f8eb392bfa28c7ce82889ea4646f53db6b2d5679ce3f91506371a07', stepsFull: '16d3e2fe2d4a815fa71d7ed2f81a1698ae18c235f6d0e8198c72493de27f85b2', ms: 1049140 },
  joseon: { deck: '5cf815c505b03d0c29b2c1522a4d723aad723098a4ae0f103f8fcfcd6f9f70d0', steps: '85180fc0cec42cfbd7f657b5072646d5811ea7486df5a20b8d467780a8d497e4', stepsFull: '34d4d736e60487106fd672add4162386b2d72c9c2e0f066226a1efd8afca20b6', ms: 1189820 },
  prehistory: { deck: '581f325f5fc36572d3af5428aaea2591ad81b04c6903fa5795ec5afef4db9b88', steps: '4c36d457164834b7c220bc71ba43cd5cda28cbbde96dbe555bd481f6d4911f48', stepsFull: '8572290ae0866a6a129e05c6801eefdb3b9614ea809a204ccc17c2225c765993', ms: 269100 },
  gojoseon: { deck: '4754585624bf9da59fa8c600b1bfb706007de2366d6b39f7c1e49508484975a8', steps: 'e2bad01c7f7cd29db2fca9052f6e5881d651fbcd4807fad7282b8c088c5b2b32', stepsFull: '9e5c0fefa1d5db30c25aae6f8f6f5513e339aaae5d2e3bae05b81d1a2f5162e0', ms: 328910 },
  baekje: { deck: 'feb23c261923', ms: 165840 },
  cards: { samguk: { deck: '7e4f517c997d9e21c2565b3e71cbd078c97725d9ff2db862ba8edec50645f967', ms: 226076.66666666666, cards: 19 }, nambuk: { deck: '871df0bbc0b48ada5b532fb6f651ced3a16a9d6a18c8395c5115b779ae20dd79', ms: 190030, cards: 17 } },
  /* media/(period-reviews.js·review-menu.js 제외) + index.html + docs/exam-pool-map.json + docs/exam-reviews 파일 808개의 SHA256 묶음 */
  raw: { files: 808, digest: '850bb72553fa207f6b1b4b2bf4f1d661d747e98ec927129f7eb690f6468f6f9f' }
};

/* 묶음별 기대값: 내용 검사(정규식), 떠올리기 정답, 기출 수치(글자 대조) */
const SPEC = {
  samguk: {
    pages: ['outline', 'period', 'period', 'period', 'period', 'period', 'period', 'recap'],
    timeline: ['고구려', '백제', '신라 · 가야', '7세기 통일 전쟁'],
    asks: [['진대법 — 고국천왕'], ['소수림왕'], ['광개토왕'], ['근초고왕'], ['지증왕'], ['법흥왕'], ['진흥왕'], ['화백회의'], ['나당 동맹 → 백제 멸망(660) → 고구려 멸망(668) → 매소성·기벌포(675·676)']],
    leak: [['진대법', '고국천왕'], ['소수림왕'], ['광개토'], ['근초고'], ['지증왕'], ['법흥왕'], ['진흥왕'], ['화백'], ['660', '668', '675']],
    exam: { questions: 38, keywords: 138, visible: 131, missing: ['exam-74-06 외사정', 'exam-74-06 감은사', 'exam-74-06 대왕암', 'exam-75-03 천마도', 'exam-77-04 금 장식', 'exam-79-03 삼근왕', 'exam-79-06 정림사지 오층 석탑'] },
    facts: { total: 57, visible: 52, mapped: 2, excluded: 3 }, core: 45,
    content: T => [
      [/4세기 백제[^|]*근초고왕[^|]*5세기 고구려[^|]*광개토왕[^|]*장수왕[^|]*6세기 신라[^|]*진흥왕/.test(T[0]), '흐름지도: 4세기 백제 근초고왕 → 5세기 고구려 광개토·장수왕 → 6세기 신라 진흥왕'],
      [/같은 시기에 나란히 — 전성기 순서는 나라가 바뀐 순서가 아님/.test(T[0]) && /한강의 주인 백제 → 고구려 → 신라/.test(T[0]), '세 나라는 나란히 · 한강의 주인 백제 → 고구려 → 신라'],
      [['유리왕', '졸본 → 국내성', '고국천왕', '진대법', '을파소', '동천왕', '관구검', '환도성', '미천왕', '서안평', '낙랑군', '고국원왕', '소수림왕', '순도', '광개토왕', '영락', '호우명 그릇', '장수왕', '평양으로 천도', '개로왕 죽음'].every(x => T[1].includes(x)) && ['진대법 봄에', '관구검 · 환도성 위의', '미천왕이 서안평', '고국원왕 백제 근초고왕과', '소수림왕 · 율령 · 태학 · 불교 법', '광개토왕 · 영락 독자', '장수왕 · 평양 평양으로'].every((x, i, l) => T[1].indexOf(x) >= 0 && (i === 0 || T[1].indexOf(x) > T[1].indexOf(l[i - 1]))), '고구려: 유리왕 국내성 → 고국천왕 진대법 → 동천왕 관구검·환도성 → 미천왕 낙랑·서안평 → 고국원왕 전사 → 소수림왕 → 광개토왕 → 장수왕'],
      [['온조', '고이왕', '근초고왕', '마한', '서기', '칠지도', '침류왕', '마라난타', '개로왕', '북위', '한성 함락', '문주왕', '웅진', '동성왕', '소지 마립간과 혼인 동맹', '무령왕', '22담로', '남조', '벽돌무덤', '성왕', '사비', '남부여'].every(x => T[2].includes(x)) && T[2].indexOf('근초고왕') < T[2].indexOf('침류왕') && T[2].indexOf('개로왕') < T[2].indexOf('문주왕') && T[2].indexOf('무령왕') < T[2].indexOf('성왕 · 사비'), '백제: 온조·고이왕 → 근초고왕 → 침류왕 → 개로왕 → 문주왕·동성왕 → 무령왕 → 성왕(한 번만 짧게)'],
      [/요서 진출은 학계 견해가 엇갈림/.test(T[2]) && /하사·헌상 등 해석이 엇갈림/.test(T[2]), '근초고왕 해외 진출·칠지도는 공식 자료의 견해 차이를 함께 표시'],
      [['내물 마립간', '눌지', '소지', '지증왕', '이사부', '법흥왕', '이차돈', '건원', '진흥왕', '신주', '관산성', '대가야', '수로왕', '금관가야', '(532)', '(562)', '철 수출'].every(x => T[3].includes(x)) && T[3].indexOf('지증왕') < T[3].indexOf('법흥왕') && T[3].indexOf('법흥왕') < T[3].indexOf('진흥왕 · 화랑') && /한강 하류 차지 → 신주 설치 → 관산성 전투[^→]*→ 대가야 정복/.test(T[3]), '신라: 내물·눌지·소지 → 지증왕 → 법흥왕 → 진흥왕(한강 하류 → 신주 → 관산성 → 대가야) · 가야 532·562'],
      [/나제 연합 수복: 백제 하류 · 신라 상류 → 신라가 한강 하류 차지 → 신주 설치/.test(T[3]) && /단양 적성비/.test(T[6]) && /창녕척경비/.test(T[6]) && /기마인물형토기/.test(T[6]), '나제 연합 수복의 상류·하류와 뒤의 신라 하류 장악 구별 · 비석·유물 이름 표시'],
      [/살수대첩[^]*?천리장성[^]*?연개소문[^]*?안시성/.test(T[4]) && /선덕여왕[^]*?김춘추[^]*?계백[^]*?660[^]*?복신[^]*?도침[^]*?부여풍[^]*?흑치상지[^]*?백강[^]*?검모잠[^]*?안승[^]*?고연무[^]*?668[^]*?매소성 675[^]*?기벌포 676/.test(T[4]), '7세기: 수 살수 → 당 천리장성·연개소문·안시성 → 나당 동맹 → 660 백제 · 부흥 운동 모든 인물 → 668 고구려 · 부흥 운동 → 매소성 675 · 기벌포 676'],
      [/두 천리장성 고구려: 당에 대비 · 연개소문 \/ 고려: 거란과 전쟁 뒤 국경에/.test(T[7]) && /나제 동맹\(신라·백제\) ≠ 나당 동맹\(신라·당\)/.test(T[7]) && /수 → 살수대첩\(을지문덕\) \/ 당 → 천리장성/.test(T[7]), '헷갈리는 짝: 두 천리장성 · 나제 ≠ 나당 · 수 vs 당'],
      [/장군총\(장수왕 무덤으로 추정\)/.test(T[6]) && !/장군총은 장수왕/.test(T.join(' ')), '장군총은 장수왕 무덤 ‘추정’으로만'],
      [['욕살', '처려근지', '태학', '경당', '부경', '정사암', '6좌평', '부여씨', '좌관대식기', '골품', '화백', '국선', '제가회의'].every(x => T[5].includes(x)), '제도·사회: 세 나라 지방관·회의·신분·교육·경제'],
      [['광개토대왕릉비', '연가 7년명', '사신도', '장군총', '쌍영총', '정림사지 5층 석탑', '금동대향로', '산수무늬 벽돌', '미륵사지 석탑', '송산리', '능산리', '임신서기석', '세속 5계', '황룡사 9층 목탑', '분황사', '거칠부', '천마총'].every(x => T[6].includes(x)), '문화: 나라별 불교·도교·유교·역사서·무덤·유물(이름과 특징)'],
      [T.slice(1).join(' ').split('백제 웅진·사비 왕 비교').length === 1 && (T.join(' ').match(/22담로/g) || []).length <= 3, '백제 왕 비교 범위 4쪽을 다시 싣지 않음(22담로는 백제 쪽·헷갈리는 짝에만)']
    ]
  },
  nambuk: {
    pages: ['outline', 'period', 'period', 'period', 'period', 'period', 'recap'],
    timeline: ['통일 신라 전기', '발해(같은 시기 북쪽)', '신라 하대', '후삼국 → 고려'],
    asks: [['신문왕'], ['성덕왕'], ['경덕왕'], ['원성왕 — 독서삼품과'], ['무왕'], ['문왕'], ['선왕 — 해동성국'], ['장보고 — 청해진 · 법화원'], ['최치원'], ['공산 → 고창 → 일리천']],
    leak: [['신문왕'], ['성덕왕'], ['경덕왕'], ['원성왕', '독서삼품과'], ['무왕'], ['문왕'], ['선왕', '해동성국'], ['장보고', '청해진'], ['최치원'], []],
    exam: { questions: 30, keywords: 105, visible: 93, missing: ['exam-71-07 불국사 삼층 석탑', 'exam-71-07 정림사지 오층 석탑', 'exam-71-30 처용무', 'exam-71-30 처용', 'exam-72-08 위홍', 'exam-73-08 6좌평', 'exam-74-08 가지산문', 'exam-76-08 대봉예', 'exam-76-09 원종·애노', 'exam-78-08 흥덕왕', 'exam-78-09 황제국 체제', 'exam-79-08 박사·조교'] },
    facts: { total: 49, visible: 46, mapped: 0, excluded: 3 }, core: 31,
    content: T => [
      [/남쪽 통일 신라[^]*?북쪽 발해[^]*?발해는 신라 다음 나라가 아니라 같은 시기 북쪽/.test(T[0]) && /혜공왕 피살 → 김헌창의 난 → 장보고 → 진성여왕/.test(T[0]) && /왕건 고려 건국\(918\) → 후삼국 통일\(936\)/.test(T[0]), '흐름지도: 남쪽 통일 신라 · 북쪽 발해 나란히 → 신라 하대 → 후삼국 → 고려(918 · 936)'],
      [['문무왕 삼국 통일', '외사정', '신문왕 · 김흠돌', '진골 세력 숙청', '관료전 지급, 녹읍 폐지', '국학', '9주 5소경', '9서당 10정', '고구려·백제·말갈인', '감은사', '만파식적', '집사부', '14부', '위화부', '영객부', '상수리', '성덕왕 · 정전', '누각', '경덕왕 녹읍 부활', '김대성', '서시', '남시', '울산항', '아라비아 상인', '당항성', '영암'].every(x => T[1].includes(x)) && ['문무왕 삼국', '신문왕 · 김흠돌', '성덕왕 · 정전', '경덕왕 녹읍 부활'].every((x, i, l) => i === 0 || T[1].indexOf(x) > T[1].indexOf(l[i - 1])), '통일 신라 전기: 문무왕 외사정 → 신문왕 김흠돌·관료전·녹읍 폐지·국학·9주 5소경·9서당 10정 → 성덕왕 정전 → 경덕왕 녹읍 부활 · 14부·상수리·시장·무역항'],
      [/관료전·녹읍 폐지 → 정전 → 경덕왕 녹읍 부활/.test(T[1]) && /외사정은 문무왕 · 9주 5소경·9서당 10정은 신문왕 · 정전은 성덕왕/.test(T[1]), '토지 관료전 → 정전 → 녹읍 부활 · 누가 무엇을 만들었나'],
      [['대조영 동모산에서 건국 (처음 국호 진국)', '고구려 유민과 말갈인', '천문령', '태백산 남쪽', '고왕', '무왕 · 장문휴 당의 등주를 공격 (연호 인안)', '자사 위준', '문왕 당과 친선, 제도 정비 (대흥 · 상경 · 신라도)', '선왕 · 해동성국', '건흥', '5경 15부 62주 지방 행정 구역 (선왕)'].every(x => T[2].includes(x)) && ['대조영 동모산', '무왕 · 장문휴', '문왕 당과', '선왕 · 해동성국'].every((x, i, l) => i === 0 || T[2].indexOf(x) > T[2].indexOf(l[i - 1])), '발해: 대조영(고구려 유민·말갈, 진국) → 무왕(장문휴 등주·인안) → 문왕(대흥·상경·신라도) → 선왕(해동성국·건흥·5경 15부 62주 — 문왕 완성으로 쓰지 않음)'],
      [['3성 6부', '당 관제', '독자적', '정당성의 대내상이 국정 총괄', '좌·우사정', '중정대', '주자감', '국립 대학', '문적원', '솔빈부', '발해 5도', '거란도', '영주도', '926', '정혜공주묘', '모줄임 천장', '돌사자상', '온돌', '고려 국왕', '정효공주묘', '유교 수준', '벽돌로 쌓은 벽(당 양식) + 고구려식 천장', '영광탑', '이불병좌상', '석등'].every(x => T[2].includes(x)), '발해 제도·교역·멸망(926) · 고구려 계승(정혜공주묘·온돌) vs 당 양식(정효공주묘 벽돌)'],
      [['원효', '무애가', '일심', '화쟁', '금강삼매경론', '대승기신론소', '일체유심조', '의상', '화엄일승법계도', '부석사', '관음 신앙', '혜초', '왕오천축국전', '설총', '화왕계', '이두', '강수', '청방인문표', '원측', '해심밀경소', '최치원', '격황소서', '계원필경', '무구정광대다라니경', '불국사 3층 석탑(석가탑)', '다보탑', '석굴암', '감은사지 3층 석탑', '진전사지', '구황동 금제여래좌상', '9산 선문', '승탑', '쌍봉사 철감선사탑', '도선', '송악명당기', '촌락문서', '쇼소인', '서원경', '네 개 촌락', '삼대목'].every(x => T[3].includes(x)) && !/금동여래좌상|대승기론소/.test(T.join(' ')), '문화: 원효 vs 의상 vs 혜초 · 6두품 강수·설총·최치원·원측 · 탑과 인쇄물 · 선종·풍수 · 기록(교재 오기·오타는 고쳐 적음)'],
      [['각간 대공의 난(96각간의 난)', '혜공왕 피살', '원성왕 · 독서삼품과', '헌덕왕 때 김헌창의 난', '김주원', '웅천주', '청해진', '적산 법화원', '원종과 애노', '사벌주', '시무 10여 조', '양길'].every(x => T[4].includes(x)) && ['혜공왕 각간', '원성왕 · 독서삼품과', '김헌창의 난 혜공왕', '장보고 · 청해진', '원종과 애노'].every((x, i, l) => i === 0 || T[4].indexOf(x) > T[4].indexOf(l[i - 1])), '신라 하대: 혜공왕(대공의 난·피살) → 원성왕 독서삼품과 → 김헌창(김주원·웅천주) → 장보고 → 진성여왕 원종·애노·최치원 · 호족'],
      [['견훤', '완산주', '후당·오월', '검교태보', '궁예', '광평성', '송악 → 철원', '후고구려 → 마진 → 태봉', '왕건', '고려(918)', '경애왕', '신숭겸', '금산사', '투항', '경순왕', '사심관', '(935)', '김부', '일리천', '(936)'].every(x => T[5].includes(x)) && ['경애왕 죽음', '공산 전투(견훤 승', '고창 전투(왕건 승)', '금산사', '경순왕: 고려에 항복', '고려가 후삼국 통일 (936)'].every((x, i, l) => i === 0 || T[5].indexOf(x) > T[5].indexOf(l[i - 1])), '후삼국: 견훤 vs 궁예 → 왕건 고려(918) → 경애왕 → 공산 → 고창 → 금산사·투항 → 경순왕 항복(935) → 일리천 → 통일(936)'],
      [/관료전·녹읍 폐지 → 정전 → 녹읍 부활 \(신문왕 → 성덕왕 → 경덕왕\)/.test(T[6]) && /무왕 등주 공격\(인안\) → 문왕 친선·상경·신라도\(대흥\) → 선왕 해동성국\(건흥\)/.test(T[6]) && /공산: 견훤 승 · 신숭겸 전사 \/ 고창: 왕건 승/.test(T[6]), '헷갈리는 짝: 신문·성덕·경덕 토지 · 무왕·문왕·선왕 · 공산 vs 고창']
    ]
  }
};

function setup(skip) {
  const dom = new JSDOM('<main id="h"></main>', { runScripts: 'outside-only', url: 'http://127.0.0.1:8791', pretendToBeVisual: true }), w = dom.window;
  let now = 0, seq = 0, writes = 0, fetches = 0, hidden = false;
  const timers = new Map();
  w.setTimeout = (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + ms }); return id; };
  w.clearTimeout = id => { timers.delete(id); };
  w.performance.now = () => now;
  w.requestAnimationFrame = () => 0;
  w.Storage.prototype.getItem = () => '1'; // Retain the existing 1x catalog timing regression.
  w.Storage.prototype.setItem = () => { writes++; };
  w.fetch = () => { fetches++; throw Error('no API'); };
  Object.defineProperty(w.document, 'hidden', { get: () => hidden });
  const advance = ms => { const end = now + ms; for (;;) { let id = null, t = null; timers.forEach((v, k) => { if (v.at <= end && (!t || v.at < t.at)) { id = k; t = v; } }); if (!t) break; timers.delete(id); now = t.at; t.fn(); } now = end; };
  for (const f of MEDIA) if (f !== skip) w.eval(fs.readFileSync(path.join(ROOT, 'media', f + '.js'), 'utf8'));
  require('./fixtures/preserved-review-player.cjs')(w);
  const h = w.document.querySelector('#h');
  return { dom, w, h, advance, timers, now: () => now, writes: () => writes, fetches: () => fetches,
    setHidden: v => { hidden = v; w.document.dispatchEvent(new w.Event('visibilitychange')); },
    btn: i => h.querySelectorAll('.memory-controls button')[i] };
}
function visibleText(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || node.hidden) return '';
  return [...node.childNodes].map(visibleText).join('');
}
const rowText = r => r.head + ' ' + r.items.map(i => i.t).join(' ');
const pageText = p => p.title + ' ' + p.period + ' | ' + p.scenes.map(s => s.title + ' ' + s.rows.map(rowText).join(' ')).join(' | ');
const visScenes = x => [...x.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden);

const t = setup();
const P = t.w.HANQ_PERIOD_REVIEWS, player = t.w.HanqReviewPlayer;
const COV = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.json'), 'utf8'));
const GROUPS = Object.keys(SPEC).filter(g => P.enabled.includes(g));

/* ---------- 1. 그대로인 것 ---------- */
for (const g of ['goryeo', 'joseon', 'prehistory', 'gojoseon']) ok(sha(JSON.stringify(P.decks[g])) === BEFORE[g].deck && sha(JSON.stringify(player.periodSteps(P.decks[g], true))) === BEFORE[g].steps && sha(JSON.stringify(player.periodSteps(P.decks[g], false))) === BEFORE[g].stepsFull && player.estimate(P.decks[g]) === BEFORE[g].ms, g + ' 생성 덱·두 모드 재생 걸음·시간 그대로');
ok(sha(JSON.stringify(P.decks.baekje)).startsWith(BEFORE.baekje.deck) && player.estimate(P.decks.baekje) === BEFORE.baekje.ms, '백제 왕 비교 덱·시간 그대로');
for (const [k, b] of Object.entries(BEFORE.cards)) { const d = t.w.HANQ_MEMORY_REVIEWS[k]; ok(sha(JSON.stringify(d)) === b.deck && player.estimate(d) === b.ms && d.cards.length === b.cards, '원래 ' + k + ' 카드 덱 그대로(고대사 전체에서 계속 씀)'); }
{ const walk = d => fs.readdirSync(d, { withFileTypes: true }).filter(e => e.name !== '.DS_Store').flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const rel = f => path.relative(ROOT, f);
  // The owner-review feature intentionally changes these UI files and adds only these verified assets.
  // Reviewed CBT text lives in a separate display-only data asset; original manuscripts and exam pool stay frozen.
  // Reconstruct the original aggregate with baseline hashes; every other original file remains byte-identical.
  const authorizedBaselineHashes={"media/formal-exams.js":"a0ffe5fe8312e1cfdbd5aa2acf508f5baa441c48b0aca38e3aa012ca634f6d9a","media/summary-overview.css":"faff211474a9d13e314dc91ec758f09039339b1d7c8b5e4479abcd9810b866d4","media/summary-overview.js":"bab6acc65a9f5559dd986bbe355b9c0422a2e4253c3c730edb969e75e3fd98dc","media/comic-scenes.js":"97785f0e95a82b5ea060252b9ebc6b5734e715d6971cd227b9d26331bf0d1388","index.html": "253a9df2686d313ab653ce81ef85c70c4dda9c45c54c75007c9f0f2f8ebcc3da", "media/api-client.js": "5bc51d8c97899494905f808d30646371a6efadc62a1b4b254ce4f165f705176b", "media/account-ui.js": "09c474b9bb658e9009ab64a4d65c8d580b75eca8b9043e84d33c8d47e880361a", "media/account-ui.css": "74440775ec855b17e748f06b72dba43b7f06df8d075d9fa331d7e22c08f9c4da", "media/review-player.js": "e14b806f89c59200599e1f53c7fc71429c8de2f31455f692a7274c38010f04d5", "media/review-menu.css": "bd7cdacb3a304930aa86e53945789b337f8c4fb4de6a253552baa2a010ffce7b"};
  const added=new Set(["media/cbt-explanation-data.js","media/cbt-explanations.js","media/summary-ruler-groups.js","media/era-full-summary-data.js","media/joseon-full-summary-data.js","media/joseon-full-summary.js","media/joseon-full-summary.css","media/exam-brief-core.js","media/reviewed-quiz.js","media/reviewed-quiz-integration.js","media/confusion-review-data.js","media/confusion-review.js","media/confusion-review.css","media/quiz-brief-feedback.js","media/unified-quiz-selection.js","media/era-study-review.js","media/quiz-resources.js","media/quiz-resources.css","media/era-culture.css","media/era-culture.js","media/era-recall-quiz.js","media/era-recall-integration.js","media/cbt-results.css","media/integrated-blank-bank.js","media/integrated-blank-practice.js","media/integrated-blank-practice.css","media/goryeo-joseon-comparison.css","media/goryeo-joseon-comparison.js","media/joseon-core-review.css","media/mixed-review-quiz.css","media/mixed-review-bank.js","media/mixed-review-quiz.js","media/cbt-classifications.js","media/cbt-classification79.js","media/cbt-result-analysis.js","media/shared-core-review.js","media/joseon-core-review.js","media/study-summary.js","media/study-supplements.json","media/study-enrichment.css","media/culture-gallery.json","media/culture-gallery.js","media/exam-book/68-05.webp", "media/exam-book/67-04.webp", "media/exam-book/69-01.webp", "media/exam-book/66-08.webp", "media/exam-book/69-06.webp", "media/exam-book/65-04.webp", "media/review-focus/balhae-cues.webp", "media/review-focus/cheolgam.webp", "media/review-focus/dao-cues.webp", "media/review-focus/comb-pottery.webp", "media/review-focus/bunhwang.webp", "media/review-focus/hou.webp", "media/review-focus/yeonga.webp", "media/review-focus/gameunsa.webp", "media/review-focus/jeonghye.webp", "media/focused-review.js"]);
  const files=walk(path.join(ROOT,'media')).map(rel).filter(f=>!/period-reviews\.js$|review-menu\.js$/.test(f)&&!added.has(f)&&!/^media\/cbt-originals\//.test(f)&&!/^media\/review-focus\/goryeo-/.test(f)&&!/^media\/culture-photos\//.test(f)).concat(['index.html','docs/exam-pool-map.json'],walk(path.join(ROOT,'docs','exam-reviews')).map(rel)).sort();
  const h=crypto.createHash('sha256');for(const f of files)h.update(f+'\0'+(authorizedBaselineHashes[f]||sha(/-comic\.html$/.test(f)?fs.readFileSync(path.join(ROOT,f),'utf8').replace(/<!--STUDY-ENRICHMENT-->[\s\S]*?<!--END-STUDY-ENRICHMENT-->/g,''):fs.readFileSync(path.join(ROOT,f))))+'\n');
  ok(files.length===BEFORE.raw.files&&h.digest('hex')===BEFORE.raw.digest,'original catalog, decks, progress and source files unchanged apart from explicit owner-review UI files');
}
ok(P.route('ancient', 'all') === null && GROUPS.every(g => P.route('ancient', g).format === 'period' && P.forEra(g).cards.length === P.decks[g].cards.length), '고대사 전체는 기존 카드(null) · ' + GROUPS.join('·') + ' 범위와 CBT 경로는 새 요약');

for (const g of GROUPS) {
  const D = P.decks[g], X = SPEC[g], fin = D.cards[D.cards.length - 1];
  const T = D.cards.map(pageText);
  /* ---------- 2. 구조 · 내용 ---------- */
  ok(JSON.stringify(D.cards.map(p => p.kind)) === JSON.stringify(X.pages) && JSON.stringify(D.timeline.map(x => x.name)) === JSON.stringify(X.timeline) && D.timeline.every(x => x.weight === 1 && x.from === undefined) && D.finishScene === 'last', g + ' ' + D.cards.length + '쪽 · 위쪽 띠 ' + X.timeline.join(' · ') + ' · 끝 장면 하나');
  ok(D.cards.every(p => p.scenes.every(s => s.rows.length >= 1 && s.rows.length <= 3)), g + ' 장면당 1~3줄');
  for (const [v, name] of X.content(T.map(x => x.split(' | ').slice(1).join(' | ')))) ok(v, g + ' ' + name);
  ok(!/빈출|자주 나오|★|오답/.test(T.join(' ')) && !/pdf:|tb:|samguk#|nambuk#|<표|PDF \d/.test(T.join(' ')), g + ' ‘빈출’·별표·검수용 표시 없음');
  const asks = fin.scenes.map((s, si) => ({ s, si })).filter(x => x.s.rows.some(r => r.kind === 'ask'));
  ok(asks.length === X.asks.length && asks.length >= 6 && asks.length <= 10 && asks.every((x, i) => x.s.rows.length === 1 && x.s.title === '떠올리기 ' + (i + 1) + ' / ' + asks.length && x.s.rows[0].items.length === 1 && x.s.rows[0].items[0].t === X.asks[i][0]), g + ' 떠올리기 ' + asks.length + '개 · 장면마다 질문 하나 · 정답 하나');
  asks.forEach((x, i) => { if (i < asks.length - 1 || !/순서/.test(x.s.rows[0].head)) ok(X.leak[i].every(k => !x.s.rows[0].head.includes(k) && !x.s.title.includes(k) && !fin.title.includes(k) && !fin.period.includes(k)), g + ' 질문 ' + (i + 1) + ' 글·제목에 정답 없음'); });
  const close = fin.scenes[fin.scenes.length - 1];
  ok(close.title === '정답 확인 · 한눈에' && close.rows.length === 3 && asks[asks.length - 1].si === fin.scenes.length - 2, g + ' 마지막은 정답 확인 3줄');

  /* ---------- 3. 원래 요점 · 교재 핵심표 · 교재 사실 목록: 전체 보기로 끝까지 재생하며 실제로 보인 글 ---------- */
  const c = setup();
  c.w.HanqReviewMenu.mount(c.h, {}, 'ancient', g);
  c.btn(3).click();
  const seenPage = D.cards.map(() => '');
  for (let n = 0; c.btn(1).textContent !== '다시 재생'; n++) { const idx = Number(/^(\d+)/.exec(c.h.querySelector('.memory-count').textContent)[1]) - 1; seenPage[idx] += '|' + norm(visibleText(c.h.querySelector('.pr-page'))); c.advance(500); assert(n < 20000); }
  c.w.HanqReviewMenu.stop(); c.dom.window.close();
  const seen = seenPage.join('|');
  const src = t.w.HANQ_MEMORY_REVIEWS[g], facts = COV.facts.filter(f => f.group === g);
  let vis = 0, map = 0, exc = 0;
  src.cards.forEach((cd, ci) => cd.points.forEach((pt, pi) => {
    const f = facts.find(x => x.id === g + '#' + ci + ':' + pi);
    ok(f && f.text === pt, g + ' 요점 기록 ' + ci + ':' + pi);
    if (f.status === 'excluded') { exc++; ok(/^목차/.test(f.reason) && ci === 0, g + ' 제외는 목차 카드뿐 ' + ci + ':' + pi); return; }
    if (f.status === 'visible') { vis++; ok(seen.includes(norm(pt)), g + ' 원래 요점 그대로 보임 ' + ci + ':' + pi); return; }
    map++; ok(f.status === 'mapped' && f.shortened.every(s => s.text.split(' / ').every(x => seen.includes(norm(x)))) && Math.max(...f.shortened.map(s => s.overlap)) >= 0.5, g + ' 줄인 글 보임 ' + ci + ':' + pi + ' ' + pt);
  }));
  ok(vis === X.facts.visible && map === X.facts.mapped && exc === X.facts.excluded && vis + map + exc === X.facts.total && COV.summary[g].factsMissing === 0, g + ' 원래 요점 ' + X.facts.total + ' = 그대로 ' + vis + ' + 줄인 글 ' + map + ' + 목차 제외 ' + exc);
  const words = s => String(s).split(/[\s·,/()=→+:~—–-]+/).map(norm).filter(x => Array.from(x).length >= 2).map(w => { const y = w.replace(/(으로|에게|에서|까지|부터|이다|하여|했다|였다|[을를이가은는의에로와과도만])$/, ''); return Array.from(y).length >= 2 ? y : w; });
  const termsOf = s => String(s).replace(/(\d)·(\d)/g, '$1\u0001$2').split(/\s*(?:·|\/|,|\(|\)|=|→|\+|:)\s*/).map(x => x.replace(/\u0001/g, '·').trim()).filter(x => Array.from(x).length >= 2);
  let core = 0;
  t.w.HANQ_TEXTBOOK[g].core.forEach((grp, gi) => grp.rows.forEach(([term, desc], ri) => { core++; ok(seenPage.some(pt => termsOf(term).every(x => pt.includes(norm(x))) && (pt.includes(norm(desc)) || words(desc).filter(x => pt.includes(x)).length / words(desc).length >= 0.7)), g + ' 교재 핵심표 용어+뜻 ' + gi + ':' + ri + ' ' + term); }));
  ok(core === X.core && COV.summary[g].coreTermAndMeaning === core && COV.summary[g].coreRows === core, g + ' 교재 핵심표 ' + core + '행 모두');
  const INV = COV.snSource.inventory[g];
  for (const r of INV.rows) {
    if (r.status === 'excluded') { ok(r.reason && r.reason.length >= 8, g + ' 교재 목록 제외 이유 PDF ' + r.pdf + ' ' + r.item); continue; }
    ok(r.status === 'visible' && r.show.every(w => seen.includes(norm(w))), g + ' 교재 사실 화면에 보임 PDF ' + r.pdf + ' ' + r.item);
  }
  ok(INV.rows.filter(r => r.status === 'excluded').every(r => /여담|말장난|지시|별표|강조|사진|그림|지도|오타|공식 자료|확인 문제|전설|안내/.test(r.reason)), g + ' 교재 목록 제외는 여담·지시·그림·오타·공식 자료 정정·문제지·안내뿐');
  const EX = COV.exam[g];
  ok(EX.questions === X.exam.questions && EX.keywords === X.exam.keywords && EX.visible === X.exam.visible && JSON.stringify(EX.missing) === JSON.stringify(X.exam.missing), g + ' 기출 ' + EX.questions + '문항 mem 낱말 ' + EX.visible + '/' + EX.keywords + '(글자 대조만 · 빠진 낱말 고정)');
  const off = COV.snSource.official[g];
  for (const y of (T.join(' ').match(/(?<![0-9])[5-9][0-9]{2}(?![0-9])/g) || [])) ok(Object.values(off).some(o => o.facts.includes(y) && /^https:\/\/encykorea\.aks\.ac\.kr\//.test(o.url)), g + ' 연도 ' + y + ' 공식 자료 확인');

  /* ---------- 4. 재생 시간 · 메뉴 ---------- */
  { const S = player.periodSteps(D, true), est = player.estimate(D);
    ok(est === S.reduce((a, x) => a + x.ms, 0) && D.pace.msPerChar === 90 && D.pace.recallMs === 3500 && est === COV.summary[g].timing.defaultMs && S.filter(x => x.phase === 'recall').every(x => x.ms === 3500) && est <= 1200000, g + ' 기본 재생 ' + est + 'ms(글자당 90ms · 떠올리기 3.5초 · 하한으로 늘리지 않음)');
    const m = setup(); m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', null);
    const opt = [...m.h.querySelectorAll('option')].find(o => o.value === g);
    ok(!m.h.querySelector('.hanq-rm__select'),'고대사 내부 범위 선택 제거');
    ok(m.h.querySelector('.memory-count').textContent === '1 / 54', '고대사 기본(전체)은 기존 54장 카드');
    m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', g);
    ok(m.h.querySelector('.memory-count').textContent === '1 / ' + D.cards.length + ' 쪽' && m.h.querySelector('.pr-tl').getAttribute('aria-label').endsWith('시기 구분'), g + ' 범위를 열면 새 요약 1쪽 · 위쪽 띠');
    m.w.HanqReviewMenu.stop(); ok(m.timers.size === 0 && m.writes() === 0 && m.fetches() === 0, g + ' 메뉴 정리 · 기록 없음'); m.dom.window.close(); }

  /* ---------- 5. 재생: 정답이 장면 시작부터(위쪽 띠 포함) 숨었다가 3.5초 뒤 자동 공개 · 끝 장면 하나 ---------- */
  const a = setup();
  a.w.HANQ_MEMORY_REVIEWS['period_ancient_' + g] = a.w.HANQ_PERIOD_REVIEWS.route('ancient', g);
  const hd = a.w.HanqReviewPlayer.mount(a.h, 'period_ancient_' + g, D.title);
  let n = 0, leaks = 0, seenQ = 0, revealed = 0, one = true, tlBack = 0;
  for (;;) {
    const st = hd.state();
    if (st.ended) break;
    if (visScenes(a).length !== 1) one = false;
    const qi = st.page === D.cards.length - 1 ? asks.findIndex(x => x.si === st.scene) : -1;
    if (qi >= 0) {
      const text = visibleText(a.h.querySelector('.pr-page')).replace(asks[qi].s.rows[0].head, '');
      if (st.phase === 'scene' || st.phase === 'read' || st.phase === 'recall') { seenQ++; if (X.asks[qi].some(k => text.includes(k)) || !a.h.querySelector('.pr-tl').hidden) leaks++; }
      if (st.phase === 'reveal') { revealed++; ok(text.includes(X.asks[qi][0]), g + ' 질문 ' + (qi + 1) + ' 자동 공개'); }
    } else if (!a.h.querySelector('.pr-tl').hidden) tlBack++;
    a.advance(st.clock.remaining);
    assert(++n < 5000);
  }
  ok(one && leaks === 0 && seenQ >= asks.length * 3 && revealed >= asks.length && tlBack > 0, g + ' 장면 시작·읽기·떠올리기 동안 정답·위쪽 띠 숨김 · 질문 밖에서는 띠 다시 보임 · 장면 하나씩');
  const vs = visScenes(a);
  ok(a.now() === player.estimate(D) && vs.length === 1 && /정답 확인 · 한눈에/.test(vs[0].textContent) && vs[0].querySelectorAll('.pr-row').length === 3 && a.btn(1).textContent === '다시 재생' && a.timers.size === 0, g + ' 계산한 시각에 끝 · 정답 확인 장면(3줄) 하나만');
  a.btn(0).click();
  ok(hd.state().clock.paused && visScenes(a).length === 1 && hd.state().index === D.cards.length - 2 && hd.state().scene === 0, g + ' 끝난 뒤 이전 쪽: 첫 장면에서 멈춘 채');
  a.btn(2).click();
  ok(hd.state().clock.paused && hd.state().index === D.cards.length - 1 && visScenes(a).length === 1, g + ' 다음 쪽(최종 정리)도 첫 장면에서 멈춤');
  a.w.HanqReviewPlayer.stop();
  const b = setup();
  b.w.HANQ_MEMORY_REVIEWS['period_ancient_' + g] = b.w.HANQ_PERIOD_REVIEWS.route('ancient', g);
  const hb = b.w.HanqReviewPlayer.mount(b.h, 'period_ancient_' + g, D.title);
  for (let k = 0; !(hb.state().page === D.cards.length - 1 && hb.state().phase === 'recall' && asks[0].si === hb.state().scene); k++) { b.advance(hb.state().clock.remaining); assert(k < 5000); }
  const at = hb.state().step, left = hb.state().clock.remaining, key = X.asks[0][0];
  b.btn(1).click(); b.advance(600000);
  ok(hb.state().step === at && !visibleText(b.h.querySelector('.pr-page')).replace(asks[0].s.rows[0].head, '').includes(key) && b.h.querySelector('.pr-tl').hidden, g + ' 떠올리기 중 멈추면 10분 지나도 정답·띠 안 보임');
  b.btn(1).click(); b.advance(left - 1); ok(hb.state().step === at, g + ' 다시 재생: 남은 생각 시간부터');
  b.advance(1); ok(hb.state().phase === 'reveal' && visibleText(b.h.querySelector('.pr-page')).includes(key) && !b.h.querySelector('.pr-tl').hidden, g + ' 남은 시간 뒤 자동 공개 · 띠 다시');
  b.setHidden(true); const hs = hb.state().step; b.advance(300000); ok(hb.state().step === hs && hb.state().clock.paused, g + ' 가린 탭 멈춤'); b.setHidden(false);
  b.btn(3).click(); ok(!hb.state().blank && visScenes(b).length === 1, g + ' 전체 보기로 바꿔도 장면 하나'); b.btn(3).click(); ok(hb.state().blank, g + ' 빈칸 모드로 돌아옴');
  for (let k = 0; !hb.state().ended; k++) { b.advance(hb.state().clock.remaining); assert(k < 5000); }
  b.btn(1).click(); ok(hb.state().step === 0 && hb.state().clock.active, g + ' 다시 재생은 처음부터');
  b.w.HanqReviewPlayer.stop();
  ok(a.writes() + b.writes() + a.fetches() + b.fetches() === 0 && b.timers.size === 0, g + ' 저장소·서버 기록 없음 · 타이머 정리');
  [a, b].forEach(x => x.dom.window.close());
}

/* ---------- 6. 대체 경로 · 문서 · 생성 파일 ---------- */
{ const f = setup('period-reviews');
  for (const g of GROUPS) { f.w.HanqReviewMenu.mount(f.h, {}, 'ancient', g); ok(f.h.querySelector('.memory-count').textContent === '1 / ' + t.w.HANQ_MEMORY_REVIEWS[g].cards.length && !f.h.querySelector('.pr-page'), g + ' 요약 파일이 없으면 기존 카드로(빈 화면 없음)'); }
  f.w.HanqReviewMenu.stop(); f.dom.window.close(); }
const doc = fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.md'), 'utf8');
for (const g of GROUPS) ok(doc.includes('## 고대사 · ' + P.decks[g].title + ' (전달)') && doc.includes('#reviews/ancient/' + g) && /기출 범위를 모두 다룬다는 뜻이 아니며/.test(doc), g + ' 문서: 경로 · 기출 한계 · 제외 이유');
ok(doc.endsWith('\n') && !doc.endsWith('\n\n'), '문서 끝 빈 줄 없음');
const built = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_period_reviews.cjs'), '--check'], { encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, { HANQ_TEXTBOOK_LAYOUT: '' }) });
ok(built.status === 0, '생성 파일 일치(build --check)');
t.dom.window.close();
console.log('Samguk·Nambuk learning ' + checks + ' PASS · ' + GROUPS.map(g => g + ' ' + P.decks[g].cards.length + '쪽 ' + P.decks[g].cards.reduce((a, p) => a + p.scenes.length, 0) + '장면 ' + player.estimate(P.decks[g]) + 'ms').join(' · '));
