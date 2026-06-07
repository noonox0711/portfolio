/* ============================================================
   체험 데모 데이터 + 단계(steps) 정의
   ⚠️ 실제 학생 데이터 사용 금지 — 김체험·이데모 더미만 사용.
   점수·문항 수치는 임의값(추후 교체 예정).
   ============================================================ */

// 체험판에서 불러올 수 있는 더미 학생 (이 2명만 허용)
const DEMO_STUDENTS = {
  "김체험": {
    rows: [
      { code: "개념원리 수학(상)", start: 1,  end: 48, a: 4, b: 4, c: 2 },
      { code: "쎈 수학(상)",       start: 1,  end: 80, a: 5, b: 3, c: 2 },
      { code: "블랙라벨 수학(상)",  start: 1,  end: 30, a: 0, b: 3, c: 3 }
    ]
  },
  "이데모": {
    rows: [
      { code: "개념원리 수학(하)", start: 1,  end: 52, a: 5, b: 3, c: 2 },
      { code: "마플 수학(하)",     start: 1,  end: 60, a: 4, b: 4, c: 2 }
    ]
  }
};

// 생성되는 더미 시험지 문항 (임의값 — 추후 교체)
const DEMO_PROBLEMS = [
  "이차방정식 $x^2 + 3x - 1 = 0$ 의 두 근의 합을 구하시오.",
  "함수 $f(x) = 2x^2 - 5x + 3$ 의 최솟값을 구하시오.",
  "다음 식을 인수분해하시오.  $x^2 - 7x + 12$",
  "직선 $y = 2x + 1$ 과 평행하고 점 (1, 4)를 지나는 직선의 방정식을 구하시오.",
  "두 수 $a$, $b$ 에 대하여 $a + b = 5$, $ab = 6$ 일 때 $a^2 + b^2$ 의 값을 구하시오.",
  "부등식 $x^2 - 4x + 3 < 0$ 의 해를 구하시오."
];

// 항목별 입력 체인에서 사용자가 입력해야 하는 값 (정확히 입력해야 다음으로 진행)
const DEMO_RANGE = { code: "test", start: "1", end: "230", a: "4", b: "4", c: "2" };

// 1단계에서 만든 시험의 전체 문항(10문항) — 2단계 채점 대상 + 이후 단계 연결
const DEMO_EXAM_ITEMS = [
  { code: "test", num: "132", text: "이차방정식 $x^2 + 3x - 1 = 0$ 의 두 근의 합을 구하시오." },
  { code: "test", num: "045", text: "함수 $f(x) = 2x^2 - 5x + 3$ 의 최솟값을 구하시오." },
  { code: "test", num: "211", text: "다음 식을 인수분해하시오.  $x^2 - 7x + 12$" },
  { code: "test", num: "088", text: "직선 $y = 2x + 1$ 과 평행하고 점 (1, 4)를 지나는 직선의 방정식을 구하시오." },
  { code: "test", num: "176", text: "두 수 $a$, $b$ 에 대하여 $a + b = 5$, $ab = 6$ 일 때 $a^2 + b^2$ 의 값을 구하시오." },
  { code: "test", num: "203", text: "부등식 $x^2 - 4x + 3 < 0$ 의 해를 구하시오." },
  { code: "test", num: "054", text: "$\\sqrt{50} - \\sqrt{8}$ 을 간단히 하시오." },
  { code: "test", num: "119", text: "등차수열 $2,\\ 5,\\ 8,\\ \\dots$ 의 제10항을 구하시오." },
  { code: "test", num: "097", text: "$\\log_2 8 + \\log_3 9$ 의 값을 구하시오." },
  { code: "test", num: "162", text: "원 $x^2 + y^2 = 25$ 위의 점 (3, 4)에서의 접선의 방정식을 구하시오." }
];
// 2단계 예시 채점 결과 (0 틀림 / 1 맞음) — 0인 문항이 3단계 오답노트로 이어짐
const DEMO_RESULTS = ["1", "1", "0", "1", "1", "0", "1", "1", "0", "1"];

// 4단계 숙제 점수(항목당 0~5점, 5개) — 합계 23 → round(23/25*100)=92점
// (5개 만점 25점이라 정확히 90은 불가, 90점대 유지로 92 사용)
const DEMO_HOMEWORK = ["5", "4", "5", "4", "5"];

// 5단계 보고서용 김체험 더미 과거 회차 (날짜 m/d · 과제 완성도 · 테스트 점수)
// 마지막(6/4) 회차는 이번 시험·숙제 결과로 렌더 시점에 계산해 붙임
const DEMO_REPORT_HISTORY = [
  { date: "5/7",  hw: 75, test: 70 },
  { date: "5/14", hw: 80, test: 76 },
  { date: "5/21", hw: 85, test: 80 },
  { date: "5/28", hw: 80, test: 78 },
  { date: "6/2",  hw: 85, test: 82 }
];
// 5단계 안내문: 선생님이 거칠게 쓴 초안(미리 채워둠) → AI가 '다듬은' 버전으로 교체하는 연출
const DEMO_REPORT_DRAFT = "이번달 성실하게 잘했어요. 다음달에도 지금처럼 하면 됩니다";
// 🤖 AI 도움받기로 '다듬어지는' 결과 더미 (실제 API 호출 없음 — 타이핑 연출용)
const DEMO_REPORT_COMMENT = "이번 달도 성실하게 학습에 임해 주었습니다. 꾸준함이 좋은 결과로 이어지고 있으니, 다음 달에도 지금의 태도를 유지한다면 충분히 기대할 만합니다.";

// 6단계 취약점 분석 더미 (보고서 코멘트와 일관 — 인수분해·로그가 약점)
const DEMO_WEAKNESS = {
  units: [ // 교재별 정답률
    { name: "개념원리 수학(상)", correct: 20, wrong: 4 },
    { name: "쎈 수학(상)",       correct: 24, wrong: 11 },
    { name: "블랙라벨 수학(상)",  correct: 5,  wrong: 8 },
    { name: "마플 수학(상)",     correct: 16, wrong: 6 }
  ],
  zero:   [ // 정답률 0% (완전 취약)
    { code: "test", num: "211", unit: "인수분해", tries: 3 },
    { code: "test", num: "097", unit: "로그",     tries: 4 }
  ],
  low:    [ // 낮은 정답률
    { code: "test", num: "045", unit: "이차함수 최솟값", tries: 4, corrects: 1 },
    { code: "test", num: "162", unit: "원의 접선",       tries: 3, corrects: 1 }
  ],
  consec: [ // 연속 오답
    { code: "test", num: "097", unit: "로그",     n: 3 },
    { code: "test", num: "211", unit: "인수분해", n: 2 }
  ]
};

// 7단계 곱셈공식 랜덤 시험 더미 (실제 mult_formula_test.html 발췌, LaTeX)
const DEMO_MULFORMULA = [
  { q: "(a+b)^2", a: "a^2+2ab+b^2" },
  { q: "(a-b)^2", a: "a^2-2ab+b^2" },
  { q: "(a+b)(a-b)", a: "a^2-b^2" },
  { q: "(x+a)(x+b)", a: "x^2+(a+b)x+ab" },
  { q: "(a+b)^3", a: "a^3+3a^2b+3ab^2+b^3" },
  { q: "(a-b)^3", a: "a^3-3a^2b+3ab^2-b^3" },
  { q: "(a+b)(a^2-ab+b^2)", a: "a^3+b^3" },
  { q: "(a-b)(a^2+ab+b^2)", a: "a^3-b^3" },
  { q: "(a+b+c)^2", a: "a^2+b^2+c^2+2ab+2bc+2ca" },
  { q: "(x+a)(x+b)(x+c)", a: "x^3+(a+b+c)x^2+(ab+bc+ca)x+abc" }
];

/* 단계 정의 (steps) — 화면 id / 하이라이트 대상 / 말풍선 / 완료 조건.
   phase = 매크로 단계(1~7, 상단 스테퍼), 이번엔 1단계 흐름만 정의.
   done.type: input-value | input | event | next | none  */
const STEPS = [
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#studentNameInput",
    popover: {
      title: "학생 불러오기",
      description: "먼저 학생을 불러올까요? 이름칸에 <b>김체험</b>을 입력해 보세요!"
    },
    done: { type: "input-value", selector: "#studentNameInput", expect: ["김체험", "이데모"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#loadBtn",
    popover: {
      title: "진도 불러오기",
      description: "좋아요! 이제 <b>📂 불러오기</b>를 눌러 학생의 진도를 가져와 봅시다."
    },
    done: { type: "event", event: "demo:loaded" }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#historyTableBody tr:first-child td:nth-child(1) input",
    popover: {
      title: "① 교재 코드",
      description: "교재 코드 칸에 <b>test</b> 를 입력하세요. (대소문자는 상관없어요)"
    },
    done: { type: "input-value", selector: "#historyTableBody tr:first-child td:nth-child(1) input", expect: ["test"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#historyTableBody tr:first-child td:nth-child(2) input",
    popover: {
      title: "② 시작 번호",
      description: "출제 범위의 <b>시작 번호</b>로 <b>1</b> 을 입력하세요."
    },
    done: { type: "input-value", selector: "#historyTableBody tr:first-child td:nth-child(2) input", expect: ["1"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#historyTableBody tr:first-child td:nth-child(3) input",
    popover: {
      title: "③ 끝 번호",
      description: "범위의 <b>끝 번호</b>로 <b>230</b> 을 입력하세요. (시작~끝 사이 다른 범위 문제도 함께 출제돼요)"
    },
    done: { type: "input-value", selector: "#historyTableBody tr:first-child td:nth-child(3) input", expect: ["230"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#historyTableBody tr:first-child td:nth-child(4) input",
    popover: {
      title: "④ A단계 문제 수",
      description: "<b>A단계(기초)</b> 문제 수로 <b>4</b> 를 입력하세요."
    },
    done: { type: "input-value", selector: "#historyTableBody tr:first-child td:nth-child(4) input", expect: ["4"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#historyTableBody tr:first-child td:nth-child(5) input",
    popover: {
      title: "⑤ B단계 문제 수",
      description: "<b>B단계(중급)</b> 문제 수로 <b>4</b> 를 입력하세요."
    },
    done: { type: "input-value", selector: "#historyTableBody tr:first-child td:nth-child(5) input", expect: ["4"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#historyTableBody tr:first-child td:nth-child(6) input",
    popover: {
      title: "⑥ C단계 문제 수",
      description: "<b>C단계(심화)</b> 문제 수로 <b>2</b> 를 입력하세요."
    },
    done: { type: "input-value", selector: "#historyTableBody tr:first-child td:nth-child(6) input", expect: ["2"] }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#grand-total",
    popover: {
      title: "⑦ 총 문제 수",
      description: "입력한 <b>A + B + C</b>가 자동으로 합산돼요. 총 문제 수를 확인하고 넘어가세요."
    },
    done: { type: "next" }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#createBtn",
    popover: {
      title: "⑧ 시험지 만들기",
      description: "준비 끝! <b>✨ 시험지 자동 생성</b>을 눌러 시험지를 만들어 보세요."
    },
    done: { type: "event", event: "demo:created" }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#previewArea",
    scrollTop: true, topRatio: 0.12,
    popover: {
      title: "시험지가 완성됐어요",
      description: "오른쪽에 학생 맞춤 시험지가 자동으로 만들어졌어요. 한 장씩 직접 만들 필요가 없습니다."
    },
    done: { type: "next" }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#printBtns",
    scrollTop: true, topRatio: 0.08,
    popover: {
      title: "그대로 인쇄까지",
      description: "실제 T-Studio에서는 <b>시험지·답지 인쇄</b> 버튼으로 바로 출력됩니다. (체험판에서는 인쇄가 비활성화되어 있어요)"
    },
    done: { type: "next" }
  },
  {
    phase: 1, phaseLabel: "시험지 만들기", screen: "make-exam",
    target: "#nextStepBtn",
    popover: {
      title: "1단계 완료! 🎉",
      description: "시험지가 만들어졌어요. <b>다음 단계로 (결과 입력)</b> 버튼을 눌러 채점으로 넘어가요."
    },
    done: { type: "event", event: "demo:next" }
  },

  // ===== 2단계: 시험 결과 입력 =====
  {
    phase: 2, phaseLabel: "시험 결과 입력", screen: "result-input",
    target: '.rslt-info',
    popover: {
      title: "2단계 · 채점 결과 입력",
      description: "채점 결과를 입력하는 화면이에요. 방금 <b>1단계에서 만든 그 시험</b>(Daily Test · 김체험)이 채점 대상입니다."
    },
    done: { type: "next" }
  },
  {
    phase: 2, phaseLabel: "시험 결과 입력", screen: "result-input",
    target: '.rslt-result-input[data-ri="0"]',
    followFocus: "rslt-result-input",
    popover: {
      title: "결과 입력",
      description: "각 문항 결과를 입력해요. <b>0 = 틀림 / 1 = 맞음</b>. 칸을 채우면 커서가 자동으로 다음 칸으로 이동합니다. (회색 예시대로 넣어보세요)"
    },
    done: { type: "event", event: "demo:resultsFilled" }
  },
  {
    phase: 2, phaseLabel: "시험 결과 입력", screen: "result-input",
    target: "#btnResultSave",
    popover: {
      title: "결과 저장",
      description: "<b>결과 저장</b>을 눌러 채점을 저장하세요. 저장하면 통계·오답노트에 반영됩니다."
    },
    done: { type: "event", event: "demo:resultSaved" }
  },
  {
    phase: 2, phaseLabel: "시험 결과 입력", screen: "result-input",
    target: "#nextStep2Btn",
    popover: {
      title: "2단계 완료! ✅",
      description: "채점 결과가 저장됐어요. <b>다음 단계로 (오답노트)</b> 버튼을 눌러요. 틀린 문항이 오답노트가 됩니다."
    },
    done: { type: "event", event: "demo:next" }
  },

  // ===== 3단계: 오답노트 =====
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#wrongStudentName",
    popover: {
      title: "3단계 · 오답노트",
      description: "오답노트를 만들 학생 이름을 입력하세요. <b>김체험</b> 이라고 적어보세요."
    },
    done: { type: "input-value", selector: "#wrongStudentName", expect: ["김체험", "이데모"] }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#btnWrongLoad",
    popover: {
      title: "불러오기",
      description: "<b>불러오기</b>를 눌러 2단계 채점 결과의 오답 문항을 가져와요."
    },
    done: { type: "event", event: "demo:wrongLoaded" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#wrongTableBody",
    popover: {
      title: "오답 문항을 불러왔어요",
      description: "방금 채점에서 <b>틀린 문항</b>만 모았어요. 이 목록으로 오답노트를 만들 거예요."
    },
    done: { type: "next" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#btnWrongPreview",
    popover: {
      title: "오답노트 생성",
      description: "<b>✨ 오답노트 미리보기 생성</b>을 눌러 오른쪽에 오답노트를 만들어요."
    },
    done: { type: "event", event: "demo:wrongPreviewed" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#wrongPreviewArea",
    scrollTop: true,
    popover: {
      title: "오답노트가 만들어졌어요",
      description: "오른쪽에 학생이 <b>틀린 문항만 모은 오답노트</b>가 자동으로 생성됐어요. 한 장씩 만들 필요가 없습니다."
    },
    done: { type: "next" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#wrongPrintBtns",
    popover: {
      title: "그대로 인쇄까지",
      description: "시험지처럼 <b>오답노트도 바로 인쇄</b>해서 학생에게 줄 수 있어요. (체험판에서는 인쇄가 비활성화되어 있어요)"
    },
    done: { type: "next" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#wrongTableBody",
    popover: {
      title: "학생이 풀어온 것 정리",
      description: "오답 문항이 모였어요. 이제 <b>학생이 다시 풀어온(고쳐온) 문항</b>을 정리해볼까요?"
    },
    done: { type: "next" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: '#wrongTableBody tr:nth-child(2) .wrong-check',
    enableChecks: true,
    popover: {
      title: "정리할 문항 선택",
      description: "학생이 다시 맞힌(고쳐온) 문항을 체크하세요. <b>203번</b> 체크박스를 눌러보세요."
    },
    done: { type: "event", event: "demo:wrongChecked" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#btnCleanWrong",
    popover: {
      title: "문항 정리",
      description: "<b>문항 정리</b>를 눌러 체크한(고쳐온) 문항을 오답노트에서 빼요. (오른쪽 미리보기도 갱신돼요)"
    },
    done: { type: "event", event: "demo:wrongCleaned" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#wrongTableBody",
    popover: {
      title: "정리된 결과 확인",
      description: "고쳐온 문항이 빠지고 <b>남은 오답만</b> 정리됐어요. 오른쪽 미리보기도 함께 갱신됐어요. 이대로 저장하면 돼요."
    },
    done: { type: "next" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#btnWrongSave",
    popover: {
      title: "오답노트 저장",
      description: "<b>저장</b>을 눌러 정리된 오답노트를 저장하세요."
    },
    done: { type: "event", event: "demo:wrongSaved" }
  },
  {
    phase: 3, phaseLabel: "오답노트", screen: "wrong-note",
    target: "#nextStep3Btn",
    popover: {
      title: "3단계 완료! ✅",
      description: "오답노트가 저장됐어요. <b>다음 단계로 (숙제 입력)</b> 버튼을 눌러요."
    },
    done: { type: "event", event: "demo:next" }
  },

  // ===== 4단계: 숙제 입력 =====
  {
    phase: 4, phaseLabel: "숙제 입력", screen: "homework",
    target: "#hwName",
    popover: {
      title: "4단계 · 숙제 입력",
      description: "이번엔 숙제 수행도를 기록해요. 학생 이름 <b>김체험</b>을 입력하세요."
    },
    done: { type: "input-value", selector: "#hwName", expect: ["김체험", "이데모"] }
  },
  {
    phase: 4, phaseLabel: "숙제 입력", screen: "homework",
    target: '.hw-tbl',
    focusFirst: '.hw-score[data-hi="0"]',
    popover: {
      title: "항목별 0~5점 입력",
      description: "숙제 5개 항목을 각각 <b>0~5점</b>으로 채점해요. 칸을 채우면 자동으로 다음 칸으로 이동합니다. (회색 예시대로 넣어보세요)"
    },
    done: { type: "event", event: "demo:homeworkFilled" }
  },
  {
    phase: 4, phaseLabel: "숙제 입력", screen: "homework",
    target: "#hwTotal",
    popover: {
      title: "점수 자동 환산",
      description: "입력한 점수가 <b>100점 만점으로 자동 환산</b>돼요. (합계 ÷ (항목수×5) × 100)"
    },
    done: { type: "next" }
  },
  {
    phase: 4, phaseLabel: "숙제 입력", screen: "homework",
    target: "#btnHwSubmit",
    popover: {
      title: "숙제 등록",
      description: "<b>숙제 등록</b>을 눌러 저장하세요. 이 기록은 5단계 보고서에 반영됩니다."
    },
    done: { type: "event", event: "demo:homeworkSubmitted" }
  },
  {
    phase: 4, phaseLabel: "숙제 입력", screen: "homework",
    target: "#nextStep4Btn",
    popover: {
      title: "4단계 완료! ✅",
      description: "숙제 점수가 기록됐어요. 시험·오답·숙제 데이터가 모두 모였어요. <b>다음 단계로 (보고서)</b>를 눌러요."
    },
    done: { type: "event", event: "demo:next" }
  },

  // ===== 5단계: 보고서 (AI 코멘트 연출) =====
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#repStudentName",
    popover: {
      title: "5단계 · 월 평가서",
      description: "한 달 데이터를 모아 학부모용 평가서를 만들어요. 학생 이름 <b>김체험</b>을 입력하세요."
    },
    done: { type: "input-value", selector: "#repStudentName", expect: ["김체험", "이데모"] }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#btnFetchData",
    popover: {
      title: "데이터 불러오기",
      description: "<b>📊 데이터 불러오기</b>를 누르면 그동안의 시험·숙제 기록으로 평가서가 자동 구성돼요."
    },
    done: { type: "event", event: "demo:reportBuilt" }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#printableReport",
    scrollTop: true,
    popover: {
      title: "평가서가 만들어졌어요",
      description: "회차별 <b>과제 완성도·테스트 점수</b>가 표와 차트로 한눈에 정리됐어요."
    },
    done: { type: "next" }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#commentInput",
    lockInput: true, // 예시 안내문 — 이 단계 동안 readonly로 잠가 클릭/입력 오염 방지(다음 단계로 가면 원복)
    popover: {
      title: "선생님이 쓴 안내문이에요",
      description: "학부모에게 전하려고 <b>선생님이 직접 쓴 안내문</b>이에요. (예시로 미리 채워뒀어요) 말투가 조금 거칠죠? 다 봤으면 <b>다음</b>을 눌러요."
    },
    done: { type: "next" }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    // 스포트라이트를 안내문 카드(textarea+버튼) 전체로 → 생성되는 글이 팝오버에 안 가리고 딤도 안 됨
    target: "#repCommentCard",
    // 안내문 예시가 계속 보이는 단계 — textarea를 readonly로 잠가 사용자 수정/추가를 막고(AI 출력은 프로그램적이라 정상),
    // iOS는 readonly면 포커스돼도 키보드가 안 떠 진입 즉시 유도 팝오버가 보임. blurOnEnter로 잔류 포커스도 해제(이중 안전).
    lockInput: "#commentInput",
    blurOnEnter: true,
    popover: {
      title: "🤖 이 글을 다듬어줘요",
      description: "<b>AI 도움받기</b>를 누르면 위 안내문을 더 정중하고 매끄럽게 <b>다듬어</b>줘요. (데이터로 새로 쓰는 게 아니라, 쓴 글을 손봐주는 기능이에요) 한 번 눌러보세요!"
    },
    done: { type: "event", event: "demo:aiCommentDone" }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#btnApplyComment",
    popover: {
      title: "코멘트 적용",
      description: "내용을 확인하고 <b>적용하기</b>를 눌러 평가서에 코멘트를 넣어요. (직접 수정도 가능해요)"
    },
    done: { type: "event", event: "demo:commentApplied" }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#repSaveRow",
    popover: {
      title: "저장 · 다운로드",
      description: "완성한 평가서를 <b>DB 저장</b>하거나 <b>이미지로 다운로드</b>해 학부모에게 보낼 수 있어요."
    },
    done: { type: "next" }
  },
  {
    phase: 5, phaseLabel: "보고서", screen: "report",
    target: "#nextStep5Btn",
    popover: {
      title: "5단계 완료! ✅",
      description: "평가서가 완성됐어요. <b>다음 단계로 (약점 분석)</b> 버튼을 눌러요."
    },
    done: { type: "event", event: "demo:next" }
  },

  // ===== 6단계: 약점 분석 =====
  {
    phase: 6, phaseLabel: "약점 분석", screen: "weakness",
    target: "#wkStudentName",
    popover: {
      title: "6단계 · 취약점 분석",
      description: "그동안 쌓인 채점 데이터로 학생의 약점을 찾아내요. 학생 이름 <b>김체험</b>을 입력하세요."
    },
    done: { type: "input-value", selector: "#wkStudentName", expect: ["김체험", "이데모"] }
  },
  {
    phase: 6, phaseLabel: "약점 분석", screen: "weakness",
    target: "#btnWkAnalyze",
    popover: {
      title: "조회",
      description: "<b>🔍 조회</b>를 누르면 기간 동안 자주 틀린 문항·낮은 정답률 단원을 자동으로 찾아내요."
    },
    done: { type: "event", event: "demo:weaknessAnalyzed" }
  },
  {
    phase: 6, phaseLabel: "약점 분석", screen: "weakness",
    target: "#wkResult",
    popover: {
      title: "약점이 한눈에",
      description: "<b>교재별 정답률</b>과 <b>완전 취약·낮은 정답률·연속 오답</b> 문항이 한 화면에 정리됐어요. 인수분해·로그가 약하네요."
    },
    done: { type: "next" }
  },
  {
    phase: 6, phaseLabel: "약점 분석", screen: "weakness",
    target: "#wkLowCard",
    popover: {
      title: "문제 미리보기",
      description: "<b>낮은 정답률</b> 목록의 문제를 눌러 어떤 문제인지 확인해 보세요. (창을 닫으면 계속돼요)"
    },
    done: { type: "event", event: "demo:problemViewed" }
  },
  {
    phase: 6, phaseLabel: "약점 분석", screen: "weakness",
    target: "#wkClinicNote",
    popover: {
      title: "약점을 시험지로",
      description: "찾아낸 취약 문항을 모아 <b>1단계처럼 맞춤 클리닉 시험지</b>로 바로 만들 수 있어요."
    },
    done: { type: "next" }
  },
  {
    phase: 6, phaseLabel: "약점 분석", screen: "weakness",
    target: "#nextStep6Btn",
    popover: {
      title: "6단계 완료! ✅",
      description: "약점 분석까지 끝났어요. <b>다음 단계로 (추가 기능)</b> 버튼을 눌러요."
    },
    done: { type: "event", event: "demo:next" }
  },

  // ===== 7단계: 추가 기능 (곱셈공식 랜덤 시험) =====
  {
    phase: 7, phaseLabel: "추가 기능", screen: "tools",
    target: ".mf-toolbar",
    popover: {
      title: "7단계 · 수업용 도구",
      description: "T-Studio엔 수업·설명용 도구도 있어요. 그중 <b>곱셈공식 랜덤 시험</b>을 만들어 볼게요."
    },
    done: { type: "next" }
  },
  {
    phase: 7, phaseLabel: "추가 기능", screen: "tools",
    target: "#btnShuffle",
    popover: {
      title: "🔀 랜덤 섞기",
      description: "<b>랜덤 섞기</b>를 누를 때마다 문제 순서가 바뀌어요. 학생마다 다른 시험지를 즉석에서 만들 수 있죠. 한 번 눌러보세요!"
    },
    done: { type: "event", event: "demo:shuffled" }
  },
  {
    phase: 7, phaseLabel: "추가 기능", screen: "tools",
    target: "#mfToggle",
    popover: {
      title: "문제 ↔ 정답",
      description: "<b>문제 보기 / 정답 보기</b>로 즉시 전환돼요. 칠판·빔에 띄워 바로 채점할 수 있어요."
    },
    done: { type: "next" }
  },
  {
    phase: 7, phaseLabel: "추가 기능", screen: "tools",
    target: "#btnFinish",
    popover: {
      title: "체험의 마지막! 🎉",
      description: "여기까지가 T-Studio의 전체 흐름이에요. <b>🎉 체험 완료</b>를 눌러 마무리해요."
    },
    done: { type: "none" }
  }
];
