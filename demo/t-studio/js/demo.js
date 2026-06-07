/* ============================================================
   체험 데모 로직 — 화면 전환 / 상태 유지 / Driver.js 튜토리얼 제어
   ============================================================ */
(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 단계 간 이어지는 상태 (만든 시험지 등)
  const demoState = { student: null, exam: null };
  const ROW_COUNT = 4;

  /* ---------- 튜토리얼 스크롤 배치 정책 ----------
     Driver.js는 타깃 이동 시 element.scrollIntoView()를 호출한다. 이를 가로채
     (1) 타깃을 "가용 화면 높이(viewport − 하단 내비 바)"의 지정 위치에 배치하고
     (2) window.scrollTo로만 이동시켜 임베드 시 부모 프레임 연쇄 스크롤을 차단한다.
     기본: 타깃 세로 중심을 가용 높이의 40% 지점.
     예외(scrollPlan.mode==='top'): 타깃 상단을 가용 높이의 topRatio 지점(시험지 완성 등). */
  const EMBEDDED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  // 모바일(좁은 폭/coarse pointer) 판별. 모바일에서는 아래 커스텀 스크롤·키패드 보정을 전부 끄고
  // 브라우저/Driver.js 기본 동작에 맡긴다 — 키패드로 화면이 움직일 때 입력칸만 옮기고 말풍선·
  // 스포트라이트가 안 따라가 어긋나던 회귀를 차단. PC(>780px·fine pointer)는 기존 로직 전부 유지.
  function isMobileViewport() {
    return window.matchMedia('(max-width: 780px)').matches || window.matchMedia('(pointer: coarse)').matches;
  }
  // iOS(Safari/WebKit) 판별. iOS는 키보드가 떠도 layout viewport는 그대로고 visualViewport만 줄어
  // position:fixed인 Driver 오버레이/팝오버가 offsetTop만큼 어긋난다(=iOS 한정 증상). 안드로이드 Chrome도
  // visualViewport는 줄지만 fixed가 정상 추적돼 안 어긋나므로, 'visualViewport 축소'만으론 iOS를 가려낼 수
  // 없다 → 플랫폼 신호로 iOS만 게이트(버전 파싱 같은 취약한 UA 스니핑은 피함).
  const IS_IOS = (function () {
    const p = navigator.platform || '';
    const ua = navigator.userAgent || '';
    const iDevice = /iPad|iPhone|iPod/.test(p) || /iPad|iPhone|iPod/.test(ua);
    const iPadOS = p === 'MacIntel' && navigator.maxTouchPoints > 1; // iPadOS 13+는 Mac으로 위장
    return (iDevice || iPadOS) && !window.MSStream;
  })();
  let scrollPlan = { mode: 'ratio', ratio: 0.4 };
  let navScrolling = false; // 단계 전환 중: Driver 내부 즉시 scrollIntoView를 막고 smoothScrollSync가 smooth 스크롤을 단독 처리
  // 예시 입력칸 잠금(보고서 안내문 단계 등): 단계 동안 readonly로 만들어 예시 오염을 막고, 단계 이탈/종료 시 원복.
  let lockedInput = null;
  function restoreLockedInput() {
    if (lockedInput) { try { lockedInput.el.readOnly = lockedInput.prev; } catch (e) {} lockedInput = null; }
  }
  function lockInputEl(el) {
    if (!el || !('readOnly' in el)) return;
    lockedInput = { el: el, prev: el.readOnly };
    try { el.readOnly = true; } catch (e) {}
  }
  function navBarHeight() {
    const n = document.getElementById('stepNav');
    return (n && !n.hasAttribute('hidden')) ? Math.round(n.getBoundingClientRect().height) : 0;
  }
  function computeScrollY(el) {
    const se = document.scrollingElement || document.documentElement;
    const r = el.getBoundingClientRect();
    const absTop = r.top + se.scrollTop;
    const availH = Math.max(160, window.innerHeight - navBarHeight());
    let y = (scrollPlan.mode === 'top')
      ? absTop - availH * scrollPlan.topRatio
      : absTop + r.height / 2 - availH * scrollPlan.ratio;
    return Math.max(0, Math.min(y, se.scrollHeight - window.innerHeight));
  }
  // 포커스된 입력칸이 편안한 범위(중앙 50% 밴드)를 벗어날 때만 부드럽게 보정 — PC 전용.
  // 모바일에서는 동작하지 않음(브라우저 기본 스크롤에 맡김).
  function keepFieldInView(el) {
    if (!el || isMobileViewport()) return;
    const availH = Math.max(160, window.innerHeight - navBarHeight());
    const r = el.getBoundingClientRect();
    const c = r.top + r.height / 2;
    if (c < availH * 0.25 || c > availH * 0.75) {
      scrollPlan = { mode: 'ratio', ratio: 0.4 };
      window.scrollTo({ top: computeScrollY(el), left: 0, behavior: 'smooth' });
    }
  }
  // 스크롤 배치: PC는 computeScrollY로 직접 배치(임베드 시 부모 프레임 연쇄 차단), 모바일은 네이티브에 맡김.
  const nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (opts) {
    if (navScrolling) return; // 단계 전환 중엔 Driver(bringInView) 내부 즉시 스크롤을 막음 — smoothScrollSync가 단독 처리
    if (isMobileViewport()) { try { return nativeScrollIntoView.call(this, opts); } catch (e) { return; } }
    try {
      const behavior = (opts && typeof opts === 'object' && opts.behavior) || 'auto';
      window.scrollTo({ top: computeScrollY(this), left: 0, behavior: behavior });
    } catch (e) {}
  };
  // PC: focus()의 자동 스크롤이 배치를 흐트러뜨리므로 preventScroll. 모바일: 네이티브 focus(브라우저 기본).
  const nativeFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (opts) {
    if (isMobileViewport()) { try { return nativeFocus.call(this, opts); } catch (e) { return; } }
    try { return nativeFocus.call(this, Object.assign({ preventScroll: true }, opts || {})); }
    catch (e) { try { return nativeFocus.call(this); } catch (e2) {} }
  };

  /* ---------- 스테퍼 ---------- */
  function buildStepper() {
    const track = $('#stepperTrack');
    track.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
      const seg = document.createElement('span');
      seg.className = 'seg' + (i === 1 ? ' active' : '');
      track.appendChild(seg);
    }
  }
  function setStepper(phase, label) {
    $('#stepNo').textContent = phase + ' / 7';
    $('#stepTitle').textContent = label;
    $$('#stepperTrack .seg').forEach((seg, idx) => {
      seg.classList.toggle('active', idx === phase - 1);
      seg.classList.toggle('done', idx < phase - 1);
    });
    const nl = $('#navLabel'); if (nl) nl.textContent = phase + ' / 7';
    const np = $('#navPrev'), nx = $('#navNext');
    if (np) np.disabled = phase <= 1;
    if (nx) nx.disabled = phase >= maxPhaseNum();
  }

  /* ---------- 단계 이동 내비 ---------- */
  function maxPhaseNum() { return Math.max.apply(null, STEPS.map(s => s.phase)); }
  function phaseFirstIndex(phase) { return STEPS.findIndex(s => s.phase === phase); }
  function ensureStateForPhase(phase) {
    if (phase >= 2 && !demoState.exam) demoState.exam = { name: '김체험', date: '2026-06-04', total: 10, title: 'Daily Test' };
    if (phase >= 3 && !demoState.results) demoState.results = DEMO_EXAM_ITEMS.map((it, i) => ({ code: it.code, num: it.num, result: DEMO_RESULTS[i] }));
    if (phase >= 5 && !demoState.homework) demoState.homework = { name: '김체험', total: 92 };
  }
  function gotoPhase(phase) {
    phase = Math.max(1, Math.min(maxPhaseNum(), phase));
    ensureStateForPhase(phase);
    const idx = phaseFirstIndex(phase);
    if (idx >= 0 && drv) runStep(idx);
  }

  /* ---------- 출제 범위 표 ---------- */
  function emptyRow() {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="editable sep-right"><input type="text"></td>' +
      '<td class="editable"><input type="number"></td>' +
      '<td class="editable sep-right"><input type="number"></td>' +
      '<td class="editable"><input type="number" data-col="a"></td>' +
      '<td class="editable"><input type="number" data-col="b"></td>' +
      '<td class="editable sep-right"><input type="number" data-col="c"></td>' +
      '<td class="readonly"><input type="number" value="0" readonly></td>';
    return tr;
  }
  function buildTable() {
    const tb = $('#historyTableBody');
    tb.innerHTML = '';
    for (let i = 0; i < ROW_COUNT; i++) tb.appendChild(emptyRow());
    recalc();
  }
  function fillTable(rows) {
    const tb = $('#historyTableBody');
    tb.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'row-loaded';
      tr.innerHTML =
        '<td class="editable sep-right"><input type="text" value="' + r.code + '"></td>' +
        '<td class="editable"><input type="number" value="' + r.start + '"></td>' +
        '<td class="editable sep-right"><input type="number" value="' + r.end + '"></td>' +
        '<td class="editable"><input type="number" data-col="a" value="' + r.a + '"></td>' +
        '<td class="editable"><input type="number" data-col="b" value="' + r.b + '"></td>' +
        '<td class="editable sep-right"><input type="number" data-col="c" value="' + r.c + '"></td>' +
        '<td class="readonly"><input type="number" value="' + (r.a + r.b + r.c) + '" readonly></td>';
      tb.appendChild(tr);
    });
    for (let i = rows.length; i < ROW_COUNT; i++) tb.appendChild(emptyRow());
    recalc();
  }
  function recalc() {
    let A = 0, B = 0, C = 0;
    $$('#historyTableBody tr').forEach(tr => {
      const a = +(tr.querySelector('[data-col="a"]') ? tr.querySelector('[data-col="a"]').value : 0) || 0;
      const b = +(tr.querySelector('[data-col="b"]') ? tr.querySelector('[data-col="b"]').value : 0) || 0;
      const c = +(tr.querySelector('[data-col="c"]') ? tr.querySelector('[data-col="c"]').value : 0) || 0;
      const ro = tr.querySelector('.readonly input');
      if (ro) ro.value = a + b + c;
      A += a; B += b; C += c;
    });
    $('#total-a').textContent = A;
    $('#total-b').textContent = B;
    $('#total-c').textContent = C;
    $('#grand-total').textContent = A + B + C;
    return A + B + C;
  }
  // 불러오기 후: 첫 행을 비우고 입력할 값을 placeholder로 안내
  function primeFirstRow() {
    const tr = $('#historyTableBody tr:first-child');
    if (!tr) return;
    tr.classList.add('row-loaded');
    const ph = [DEMO_RANGE.code, DEMO_RANGE.start, DEMO_RANGE.end, DEMO_RANGE.a, DEMO_RANGE.b, DEMO_RANGE.c];
    [...tr.querySelectorAll('input')].forEach((inp, idx) => {
      if (idx < 6) { inp.value = ''; inp.placeholder = ph[idx]; }
    });
    recalc();
  }

  /* ---------- 화면 전환 (단계별 screen) ---------- */
  function showScreen(name) {
    [...document.querySelectorAll('.screen')].forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    if (name === 'result-input' && demoState.exam) {
      $('#rsltExamInfo').textContent =
        (demoState.exam.title || 'Daily Test') + ' · ' + (demoState.exam.name || '김체험') + ' · ' + fmtDate(demoState.exam.date);
    }
    if (name === 'tools') renderMultFormula();
  }

  /* ---------- 2단계: 시험 결과 입력 ---------- */
  function buildResultTable() {
    const tb = $('#resultTableBody');
    if (!tb) return;
    tb.innerHTML = '';
    DEMO_EXAM_ITEMS.forEach((it, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (i + 1) + '</td>' +
        '<td class="code">' + it.code + '</td>' +
        '<td>' + it.num + '</td>' +
        '<td><input class="rslt-result-input" maxlength="1" inputmode="numeric" data-ri="' + i + '" placeholder="' + DEMO_RESULTS[i] + '"></td>';
      tb.appendChild(tr);
    });
  }
  function resultInputs() { return [...document.querySelectorAll('.rslt-result-input')]; }
  function onResultInput(e) {
    const el = e.target;
    if (!el.classList || !el.classList.contains('rslt-result-input')) return;
    if (el.value) {
      const next = document.querySelector('.rslt-result-input[data-ri="' + (+el.dataset.ri + 1) + '"]');
      if (next) next.focus();
    }
    if (resultInputs().every(x => x.value.trim() !== '')) {
      document.dispatchEvent(new CustomEvent('demo:resultsFilled'));
    }
  }
  function saveResults() {
    const vals = resultInputs().map(x => x.value.trim());
    if (vals.some(v => v === '')) { toast('모든 문항 결과를 입력해 주세요'); return; }
    demoState.results = DEMO_EXAM_ITEMS.map((it, i) => ({ code: it.code, num: it.num, result: vals[i] }));
    $('#nextBar2').hidden = false;
    toast('채점 결과가 저장됐어요');
    document.dispatchEvent(new CustomEvent('demo:resultSaved'));
  }

  /* ---------- 3단계: 오답노트 ---------- */
  const MIN_WRONG_ROWS = 7;
  let wrongPreviewedOnce = false;
  function wrongItems() { return (demoState.results || []).filter(r => r.result === '0'); }
  function padWrongRows() {
    const tb = $('#wrongTableBody');
    [...tb.querySelectorAll('tr')].forEach((r, i) => { r.firstElementChild.textContent = i + 1; });
    let n = tb.querySelectorAll('tr').length;
    for (let i = n; i < MIN_WRONG_ROWS; i++) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      tr.innerHTML = '<td>' + (i + 1) + '</td><td></td><td></td><td></td>';
      tb.appendChild(tr);
    }
  }
  function buildWrongTable() {
    const tb = $('#wrongTableBody'); if (!tb) return;
    tb.innerHTML = '';
    wrongItems().forEach((it, i) => {
      const tr = document.createElement('tr');
      tr.dataset.num = it.num;
      tr.innerHTML = '<td>' + (i + 1) + '</td><td class="code">' + it.code + '</td><td>' + it.num +
        '</td><td><input type="checkbox" class="wrong-check" disabled></td>';
      tb.appendChild(tr);
    });
    padWrongRows(); // 빈 행으로 길이 확보
  }
  function loadWrong() {
    const name = $('#wrongStudentName').value.trim();
    if (!DEMO_STUDENTS[name]) { toast('체험판에서는 김체험, 이데모 학생만 불러올 수 있어요'); return; }
    if (!demoState.results) demoState.results = DEMO_EXAM_ITEMS.map((it, i) => ({ code: it.code, num: it.num, result: DEMO_RESULTS[i] }));
    buildWrongTable();
    $('#wrongInfo').textContent = name + ' · 2단계 결과의 오답 ' + wrongItems().length + '문항';
    toast(name + ' 학생의 오답을 불러왔어요');
    // 스크롤 연출은 하지 않음 — 다음 스텝(불러온 목록 확인)이 한 번만 부드럽게 배치
    document.dispatchEvent(new CustomEvent('demo:wrongLoaded'));
  }
  function cleanWrong() {
    const dataRows = [...document.querySelectorAll('#wrongTableBody tr')].filter(r => !r.classList.contains('empty-row'));
    const checked = dataRows.filter(r => { const c = r.querySelector('.wrong-check'); return c && c.checked; });
    if (checked.length === 0) { toast('정리할(고쳐온) 문항을 체크해 주세요'); return; }
    checked.forEach(r => r.remove());
    [...document.querySelectorAll('#wrongTableBody tr.empty-row')].forEach(r => r.remove());
    padWrongRows();
    toast('고쳐온 문항을 정리했어요');
    if (wrongPreviewedOnce) renderWrongNote(true); // 미리보기도 갱신
    document.dispatchEvent(new CustomEvent('demo:wrongCleaned'));
  }
  function renderWrongNote(silent) {
    const nums = [...document.querySelectorAll('#wrongTableBody tr')]
      .filter(r => !r.classList.contains('empty-row')).map(r => r.dataset.num);
    const items = DEMO_EXAM_ITEMS.filter(it => nums.includes(it.num))
      .map(it => ({ bookCode: it.code, problemNum: it.num, point: 2, text: it.text }));
    const area = $('#wrongPreviewArea');
    area.innerHTML = buildPaperHTML(items, '오답노트', (demoState.exam && demoState.exam.name) || '김체험', (demoState.exam && demoState.exam.date) || '2026-06-04');
    scalePaperIn(area);
    wrongPreviewedOnce = true;
    if (!silent) document.dispatchEvent(new CustomEvent('demo:wrongPreviewed'));
  }
  function saveWrong() {
    demoState.wrongNote = [...document.querySelectorAll('#wrongTableBody tr')]
      .filter(r => !r.classList.contains('empty-row')).map(r => r.dataset.num);
    const nb = $('#nextBar3'); if (nb) nb.hidden = false;
    toast('오답노트가 저장됐어요');
    document.dispatchEvent(new CustomEvent('demo:wrongSaved'));
  }

  /* ---------- 4단계: 숙제 입력 ---------- */
  function homeworkInputs() { return [...document.querySelectorAll('.hw-score')]; }
  function buildHomeworkTable() {
    const tb = $('#hwTableBody'); if (!tb) return;
    tb.innerHTML = '';
    const tr = document.createElement('tr');
    let html = '';
    DEMO_HOMEWORK.forEach((v, i) => {
      html += '<td><input class="hw-score" data-hi="' + i + '" maxlength="1" inputmode="numeric" placeholder="' + v + '"></td>';
    });
    html += '<td><input id="hwTotal" disabled></td>';
    tr.innerHTML = html;
    tb.appendChild(tr);
  }
  // 실제 input_result.js와 동일한 환산식: round(합계 / (입력수 × 5) × 100)
  function calcHomework() {
    let sum = 0, count = 0, err = false;
    homeworkInputs().forEach(inp => {
      const v = inp.value.trim();
      if (v !== '') { const n = Number(v); if (isNaN(n) || n < 0 || n > 5) err = true; else { sum += n; count++; } }
    });
    const t = $('#hwTotal'); if (!t) return;
    t.value = err ? '오류' : (count === 0 ? '' : Math.round(sum / (count * 5) * 100));
  }
  function onHomeworkInput(e) {
    const el = e.target;
    if (!el.classList || !el.classList.contains('hw-score')) return;
    calcHomework();
    if (el.value) {
      const next = document.querySelector('.hw-score[data-hi="' + (+el.dataset.hi + 1) + '"]');
      if (next) next.focus();
    }
    if (homeworkInputs().every(x => x.value.trim() !== '')) {
      document.dispatchEvent(new CustomEvent('demo:homeworkFilled'));
    }
  }
  function submitHomework() {
    const vals = homeworkInputs().map(x => x.value.trim());
    if (vals.some(v => v === '')) { toast('숙제 점수를 모두 입력해 주세요'); return; }
    calcHomework();
    demoState.homework = { name: $('#hwName').value.trim() || '김체험', date: $('#hwDate').value || '2026-06-04', scores: vals, total: $('#hwTotal').value };
    const nb = $('#nextBar4'); if (nb) nb.hidden = false;
    toast('숙제가 등록됐어요 (점수 ' + $('#hwTotal').value + '점)');
    document.dispatchEvent(new CustomEvent('demo:homeworkSubmitted'));
  }

  /* ---------- 5단계: 보고서 (월 평가서 + AI 코멘트 연출) ---------- */
  let reportChart = null;
  // 2단계 채점 결과의 정답률(%)을 이번 회차 테스트 점수로 사용
  function testScoreFromResults() {
    const r = demoState.results || DEMO_EXAM_ITEMS.map((it, i) => ({ result: DEMO_RESULTS[i] }));
    const correct = r.filter(x => x.result === '1').length;
    return Math.round(correct / r.length * 100);
  }
  function reportRows() {
    const cur = { date: '6/4', hw: (demoState.homework && +demoState.homework.total) || 90, test: testScoreFromResults() };
    return DEMO_REPORT_HISTORY.concat([cur]);
  }
  function buildReport() {
    const rows = reportRows();
    const avg = Math.round(rows.reduce((s, r) => s + r.test, 0) / rows.length);
    const dateTd = rows.map(r => '<td>' + r.date + '</td>').join('');
    const hwTd = rows.map(r => '<td>' + r.hw + '</td>').join('');
    const testTd = rows.map(r => '<td>' + r.test + '</td>').join('');
    const area = $('#reportArea');
    area.innerHTML =
      '<div class="paper-scale"><div class="paper report-paper" id="printableReport">' +
        '<div class="report-header"><div></div><div class="report-title">월 평가서</div><div class="report-name-box" id="repName">김체험</div></div>' +
        '<table class="report-table">' +
          '<thead><tr id="repDateRow"><th>수업 날짜</th>' + dateTd + '</tr></thead>' +
          '<tbody><tr id="repHwRow"><th>과제<br>완성도</th>' + hwTd + '</tr>' +
          '<tr id="repTestRow"><th>테스트<br>점수</th>' + testTd + '</tr></tbody>' +
        '</table>' +
        '<div class="report-chart-container"><canvas id="reportChart" width="660" height="300"></canvas></div>' +
        '<table class="rep-notice-table"><thead><tr>' +
          '<th class="rep-notice-h">안 내 사 항</th><th class="rep-avg-h">평균 점수</th></tr></thead>' +
          '<tbody><tr><td class="rep-notice-c" id="repNotice">입력된 안내 사항이 없습니다.</td>' +
          '<td class="rep-avg-c"><span id="repAvg">' + avg + '</span>점</td></tr></tbody></table>' +
        '<table class="rep-foot-table"><tr>' +
          '<td class="rep-foot-msg">문의 사항 있으시면 언제든 연락 주세요.<br>Teacher\'s Studio</td>' +
          '<td class="rep-foot-logo"><span class="rep-foot-brand">T-STUDIO</span></td>' +
        '</tr></table>' +
      '</div></div>';
    renderReportChart(rows);
    scalePaperIn(area);
  }
  function renderReportChart(rows) {
    const cv = $('#reportChart'); if (!cv || !window.Chart) return;
    if (reportChart) { reportChart.destroy(); reportChart = null; }
    reportChart = new Chart(cv.getContext('2d'), {
      type: 'bar',
      data: {
        labels: rows.map(r => r.date),
        datasets: [
          { type: 'line', label: '테스트 점수', data: rows.map(r => r.test),
            borderColor: '#8A83BD', backgroundColor: '#8A83BD', borderWidth: 2, pointRadius: 3.5, pointHoverRadius: 5, spanGaps: false, yAxisID: 'y' },
          { type: 'bar', label: '과제 완성도', data: rows.map(r => r.hw),
            backgroundColor: '#FCD2CB', borderColor: '#9A8D85', borderWidth: 1, barPercentage: 0.5, yAxisID: 'y' }
        ]
      },
      options: {
        responsive: false, animation: false,
        scales: { y: { beginAtZero: true, max: 100, grid: { color: '#e5e7eb' } } },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: false, padding: 18, font: { family: 'Pretendard', size: 13, weight: 'bold' }, color: '#9A8D85' } } }
      }
    });
  }
  function fetchReport() {
    const name = $('#repStudentName').value.trim();
    if (!DEMO_STUDENTS[name]) { toast('체험판에서는 김체험, 이데모 학생만 불러올 수 있어요'); return; }
    buildReport();
    toast(name + ' 학생의 평가서를 구성했어요');
    document.dispatchEvent(new CustomEvent('demo:reportBuilt'));
  }
  const AI_TYPE_SPEED = 16;
  let aiTyping = false;
  function aiAssist() {
    if (aiTyping) return;
    const ta = $('#commentInput'); if (!ta) return;
    if (!(ta.value || '').trim()) { toast('먼저 안내문을 짧게 적어주세요'); return; }
    const btn = $('#btnAiAssist'); const orig = btn.textContent;
    aiTyping = true; ta.disabled = true; btn.disabled = true; btn.textContent = '🤖 다듬는 중…';
    setTimeout(() => { // 잠깐 로딩 후, 사용자가 쓴 글을 다듬어진 버전으로 교체
      const text = DEMO_REPORT_COMMENT; let i = 0;
      ta.value = '';
      const tick = () => {
        ta.value = text.slice(0, i++); ta.scrollTop = ta.scrollHeight;
        if (i <= text.length) { setTimeout(tick, AI_TYPE_SPEED); }
        else {
          aiTyping = false; ta.disabled = false; btn.disabled = false; btn.textContent = orig;
          document.dispatchEvent(new CustomEvent('demo:aiCommentDone'));
        }
      };
      tick();
    }, 700);
  }
  function applyComment() {
    const txt = ($('#commentInput').value || '').trim();
    if (!txt) { toast('안내 사항을 먼저 작성해 주세요'); return; }
    const n = $('#repNotice'); if (n) n.textContent = txt;
    const nb = $('#nextBar5'); if (nb) nb.hidden = false;
    toast('안내 사항을 평가서에 반영했어요');
    document.dispatchEvent(new CustomEvent('demo:commentApplied'));
  }

  /* ---------- 6단계: 취약점 분석 ---------- */
  function wkRate(c, w) { const t = c + w; return t ? Math.round(c / t * 100) : 0; }
  function buildWeakness() {
    const W = DEMO_WEAKNESS;
    const item = (p, sub, red) =>
      '<div class="wk-item"><span class="wk-pnum wk-clickable" data-num="' + p.num + '">' + p.code + ' ' + p.num + '번 <em>(' + p.unit + ')</em></span>' +
      '<span class="wk-sub' + (red ? ' wk-red' : '') + '">' + sub + '</span></div>';
    const unitRows = W.units.map(u => {
      const r = wkRate(u.correct, u.wrong);
      return '<tr><td class="wk-uname">' + u.name + '</td><td class="wk-c">' + u.correct + '</td><td class="wk-w">' + u.wrong +
        '</td><td><div class="wk-bar" style="background:linear-gradient(to right,#fcd34d ' + r + '%,#f1f5f9 ' + r + '%)">' + r + '%</div></td></tr>';
    }).join('');
    const zeroRows = W.zero.map(p => item(p, p.tries + '번 도전')).join('');
    const lowRows = W.low.map(p => item(p, p.tries + '번 중 ' + p.corrects + '번 정답')).join('');
    const consecRows = W.consec.map(p => item(p, p.n + '연속 틀림', true)).join('');
    $('#wkResult').innerHTML =
      '<div class="wk-grid">' +
        '<div class="wk-col">' +
          '<div class="wk-card"><div class="wk-head">📚 교재별 정답률</div><div class="wk-body">' +
            '<table class="wk-table"><thead><tr><th class="wk-th-l">교재</th><th>정답</th><th>오답</th><th class="wk-th-rate">정답률</th></tr></thead><tbody>' + unitRows + '</tbody></table>' +
          '</div></div>' +
          '<div class="wk-card"><div class="wk-head">🚫 정답률 0% (완전 취약)</div><div class="wk-body">' + zeroRows + '</div></div>' +
        '</div>' +
        '<div class="wk-col">' +
          '<div class="wk-card" id="wkLowCard"><div class="wk-head">⚠️ 낮은 정답률 (50% 이하)</div><div class="wk-body">' + lowRows + '</div></div>' +
          '<div class="wk-card"><div class="wk-head">🔥 최근 연속 오답</div><div class="wk-body">' + consecRows + '</div></div>' +
        '</div>' +
        '<div class="wk-col">' +
          '<div class="wk-card wk-soon"><div class="wk-soon-ic">🛠️</div><div class="wk-soon-t">추가 분석 모듈 준비 중</div><p>단원별 취약도 등<br>다양한 통계가 추가될 예정입니다.</p></div>' +
        '</div>' +
        '<div class="wk-clinic" id="wkClinicNote">🛒 이렇게 찾아낸 <b>취약 문항</b>을 모아 1단계처럼 <b>맞춤 클리닉 시험지</b>를 바로 만들 수 있어요.</div>' +
      '</div>';
  }
  function analyzeWeakness() {
    const name = $('#wkStudentName').value.trim();
    if (!DEMO_STUDENTS[name]) { toast('체험판에서는 김체험, 이데모 학생만 분석할 수 있어요'); return; }
    buildWeakness();
    const nb = $('#nextBar6'); if (nb) nb.hidden = false;
    toast(name + ' 학생의 취약점을 분석했어요');
    document.dispatchEvent(new CustomEvent('demo:weaknessAnalyzed'));
  }
  // 취약 문항 클릭 → 문제 내용 미리보기 모달 (KaTeX)
  function openProblemModal(num) {
    const it = DEMO_EXAM_ITEMS.find(x => x.num === num);
    if (!it) return;
    $('#probTitle').textContent = it.code + ' ' + it.num + '번';
    const body = $('#probBody');
    body.innerHTML = '<div class="prob-q">' + it.text + '</div>';
    if (window.renderMathInElement) {
      try { renderMathInElement(body, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) {}
    }
    $('#probModal').hidden = false;
  }
  function closeProblemModal() {
    const m = $('#probModal'); if (!m || m.hidden) return;
    m.hidden = true;
    document.dispatchEvent(new CustomEvent('demo:problemViewed'));
  }

  /* ---------- 7단계: 추가 기능 (곱셈공식 랜덤 시험) ---------- */
  let mfOrder = DEMO_MULFORMULA.map((_, i) => i);
  let mfMode = 'q';
  function mfShuffle() {
    for (let i = mfOrder.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = mfOrder[i]; mfOrder[i] = mfOrder[j]; mfOrder[j] = t; }
  }
  function renderMultFormula() {
    const paper = $('#mfPaper'); if (!paper) return;
    const km = (latex) => { try { return window.katex ? katex.renderToString(latex, { throwOnError: false, displayMode: false }) : latex; } catch (e) { return latex; } };
    const items = mfOrder.map((idx, n) => {
      const it = DEMO_MULFORMULA[idx];
      const body = mfMode === 'q' ? km(it.q) : km(it.q + ' = ' + it.a);
      return '<li><span class="mf-n">' + (n + 1) + '.</span> ' + body + '</li>';
    }).join('');
    paper.innerHTML = '<div class="mf-paper-title">곱셈공식 Test</div><ol class="mf-list">' + items + '</ol>';
  }
  function finishDemo() {
    showScreen('done');
    restoreLockedInput(); // 투어 종료 시 잠갔던 예시 입력칸 원복
    if (drv) { try { drv.destroy(); } catch (e) {} }
    const sn = $('#stepNav'); if (sn) sn.hidden = true;
  }

  /* ---------- 토스트 ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => { t.hidden = true; }, 300);
    }, 2600);
  }

  /* ---------- 불러오기 ---------- */
  function loadStudent() {
    const name = $('#studentNameInput').value.trim();
    const data = DEMO_STUDENTS[name];
    if (!data) {
      toast('체험판에서는 김체험, 이데모 학생만 불러올 수 있어요');
      return;
    }
    demoState.student = name;
    primeFirstRow(); // 첫 행을 비우고 입력할 값을 placeholder로 안내 (직접 입력 유도)
    toast(name + ' 학생을 불러왔어요. 출제 범위를 한 항목씩 입력해볼까요?');
    document.dispatchEvent(new CustomEvent('demo:loaded'));
  }

  /* ---------- 시험지 자동 생성 ---------- */
  function createExam() {
    const total = recalc();
    if (total <= 0) { toast('출제 범위를 먼저 입력해 주세요'); return; }
    const name = demoState.student || $('#studentNameInput').value.trim() || '김체험';
    const date = $('#examDate').value || '2026-06-04';
    const title = ($('#examTitleInput').value || 'Daily Test').trim();
    demoState.exam = { name, date, total, title };
    renderPaper(demoState.exam);
    $('#nextBar').hidden = false;
    document.dispatchEvent(new CustomEvent('demo:created'));
  }

  // 날짜를 월/일 형식으로 (예: 2026-06-04 → 6/4)
  function fmtDate(v) {
    const m = (v || '').split('-');
    return m.length === 3 ? (+m[1]) + '/' + (+m[2]) : (v || '');
  }

  // 실제 T-Studio input_preview의 시험지 1페이지 양식을 더미로 재현
  const PAPER_NUMS = ['132', '045', '211', '088'];
  const PAPER_POINTS = [2, 2, 2, 2];
  function paperRowPair(left, right, isFirst, isLast) {
    const t = isFirst ? 'bt-thick' : '';
    const b = isLast ? 'bb-thick' : '';
    const box = q => (q && q.text)
      ? '<div class="demo-q">' + q.text + '</div>' : '';
    return `
      <tr style="height:5mm;">
        <td></td>
        <td class="f-code ${t}">${left.bookCode || ''}</td>
        <td class="f-numb ${t}">${left.problemNum || ''}</td>
        <td class="${t}"></td>
        <td class="f-scr br-thick ${t}">${left.point ? left.point + '점' : ''}</td>
        <td class="f-code ${t}">${right.bookCode || ''}</td>
        <td class="f-numb ${t}">${right.problemNum || ''}</td>
        <td class="${t}"></td>
        <td class="f-scr ${t}">${right.point ? right.point + '점' : ''}</td>
        <td></td>
      </tr>
      <tr style="height:115mm;">
        <td></td>
        <td colspan="4" class="merged br-thick ${b}" style="vertical-align:top;text-align:left;">${box(left)}</td>
        <td colspan="4" class="merged ${b}" style="vertical-align:top;text-align:left;">${box(right)}</td>
        <td></td>
      </tr>`;
  }
  // 시험지/오답노트 공용 1페이지 양식 HTML
  function buildPaperHTML(items, title, name, date) {
    const p = [0, 1, 2, 3].map(i => items[i] || {});
    const logo = '../../assets/t-studio/t-studio-logo.png';
    return `
      <div class="paper-scale"><div class="paper">
        <table class="excel-table border-thick-outer">
          <colgroup>
            <col style="width:6.8%"><col style="width:6.5%"><col style="width:19.7%"><col style="width:10%"><col style="width:7%">
            <col style="width:6.5%"><col style="width:10.5%"><col style="width:7%"><col style="width:18%"><col style="width:8%">
          </colgroup>
          <tr style="height:11mm;"><td colspan="10" class="merged"></td></tr>
          <tr style="height:6.75mm;">
            <td></td><td></td><td></td>
            <td rowspan="4" colspan="4" style="text-align:center;font-size:7mm!important;font-family:'Malgun Gothic',sans-serif;font-weight:bold;">${title}</td>
            <td></td><td rowspan="2" class="f-page-odd">1</td><td></td>
          </tr>
          <tr style="height:3.75mm;">
            <td></td>
            <td rowspan="4" colspan="2" class="merged" style="vertical-align:middle;text-align:center;padding:0;">
              <img src="${logo}" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">
            </td>
            <td></td><td></td>
          </tr>
          <tr style="height:2.5mm;"><td></td><td></td><td></td><td></td></tr>
          <tr style="height:8.5mm;">
            <td></td>
            <td style="text-align:right;font-size:4.5mm;font-weight:bold;vertical-align:middle;padding-right:2mm;">${fmtDate(date)}</td>
            <td style="text-align:left!important;font-size:4.5mm!important;font-weight:bold;">이름 : ${name}</td>
            <td></td>
          </tr>
          <tr style="height:5mm;"><td colspan="10"></td></tr>
          ${paperRowPair(p[0], p[2], true, false)}
          ${paperRowPair(p[1], p[3], false, true)}
          <tr style="height:8mm;"><td colspan="10" class="merged f-page-d">- 1 -</td></tr>
          <tr style="height:11mm;"><td colspan="10" class="merged"></td></tr>
        </table>
      </div></div>`;
  }
  // 미리보기 영역 폭에 맞춰 KaTeX 렌더 후 축소
  function scalePaperIn(area) {
    if (window.renderMathInElement) {
      try { renderMathInElement(area.querySelector('.paper'), { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) {}
    }
    const wrap = area.querySelector('.paper-scale');
    const paper = area.querySelector('.paper');
    const avail = area.clientWidth - 48;
    const scale = Math.min(1, avail / paper.offsetWidth);
    paper.style.transform = 'scale(' + scale + ')';
    wrap.style.width = (paper.offsetWidth * scale) + 'px';
    wrap.style.height = (paper.offsetHeight * scale) + 'px';
  }
  function renderPaper(exam) {
    const items = DEMO_PROBLEMS.slice(0, 4).map((text, i) => ({ bookCode: 'test', problemNum: PAPER_NUMS[i], point: PAPER_POINTS[i], text }));
    const area = $('#previewArea');
    area.innerHTML = buildPaperHTML(items, exam.title, exam.name, exam.date);
    scalePaperIn(area);
  }

  /* ---------- Driver.js 튜토리얼 (행동 기반 진행) ---------- */
  let drv = null;
  let stepIndex = 0;
  let followHandler = null;
  let pendingCleanup = null; // 현재 스텝의 완료 대기 리스너 해제 함수 (단계 점프 시 정리)
  function clearPending() { if (pendingCleanup) { pendingCleanup(); pendingCleanup = null; } }
  // 스크롤·레이아웃이 반영된 뒤 콜백 실행 — 자동 스크롤이 끝나기 전에 하이라이트가 옛 좌표로
  // 그려지는 것을 막는다. scrollend 지원 시 활용(스크롤 종료 정확), 미지원/즉시스크롤은 2중 rAF 폴백.
  // (콜백은 highlight/refresh 등 멱등 동작 전제 — 두 경로가 겹쳐 호출돼도 안전하도록 done 가드)
  function afterScrollSettled(cb) {
    let done = false;
    const run = () => { if (done) return; done = true; window.removeEventListener('scrollend', run); cb(); };
    if ('onscrollend' in window) window.addEventListener('scrollend', run, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(run));
  }
  // 단계 전환 화면 이동을 '부드럽게' — window를 behavior:'smooth'로 스크롤하고, 스크롤이 진행되는 동안
  // 스포트라이트가 타깃을 따라오도록 rAF 스로틀 drv.refresh()로 추적, 끝나면(scrollend 우선 + 스크롤
  // 멈춤 디바운스 + 안전 상한 폴백) 최종 정착. smooth 스크롤은 완료까지 시간이 걸려 2중 rAF로는 너무 일찍
  // 끝나므로(옛 좌표) scrollend/스크롤-멈춤을 기준으로 함. 레이아웃·스크롤 주체(window)는 불변.
  // ※ PC 전용 경로. 모바일은 input 자동 포커스 스크롤을 추적해 흔들리던 회귀(증상A) 때문에 사용하지 않음
  //   (runStep에서 모바일은 즉시 top:0 + afterScrollSettled 단일 refresh로 처리).
  function smoothScrollSync(targetY, onDone) {
    let done = false, raf = null, idle = null, max = null;
    const sync = () => { if (drv && drv.isActive && drv.isActive() && !kbHidden) { try { drv.refresh(); } catch (e) {} } };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = null; sync(); }); // 스크롤 중 스포트라이트 추적
      if (idle) clearTimeout(idle);
      idle = setTimeout(finish, 110); // 스크롤이 110ms 멈추면 정착으로 간주
    };
    function finish() {
      if (done) return; done = true;
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('scrollend', finish);
      if (raf) cancelAnimationFrame(raf);
      if (idle) clearTimeout(idle);
      if (max) clearTimeout(max);
      if (onDone) onDone();   // navScrolling=false (먼저 풀어, 아래 보정/최종 refresh가 정상 동작)
      // 도착 보장: smooth가 드롭/미완료로 목표에 못 간 경우 즉시 보정(안전망)
      if (Math.abs((window.scrollY || 0) - targetY) > 8) { try { window.scrollTo({ top: targetY, left: 0, behavior: 'auto' }); } catch (e) {} }
      sync();                 // 최종 좌표에 정확히 정착
    }
    window.addEventListener('scroll', onScroll, true);
    if ('onscrollend' in window) window.addEventListener('scrollend', finish);
    idle = setTimeout(finish, 160); // 스크롤이 아예 안 일어나면(이미 그 위치) 폴백
    max = setTimeout(finish, 900);  // 안전 상한
    try { window.scrollTo({ top: targetY, left: 0, behavior: 'smooth' }); }
    catch (e) { try { window.scrollTo(0, targetY); } catch (e2) {} finish(); }
  }
  // iOS 키보드 입력 중 투어 숨김 — '편집 요소 포커스'를 1차 신호, visualViewport를 보조(히스테리시스)로.
  //  - iOS: 입력 칸에 포커스가 있고 키보드가 떠 있으면 어긋난 스포트라이트/팝오버를 통째로 숨김.
  //    포커스가 칸 사이를 옮겨 다니는 동안(연속 입력)은 숨김을 '래치'로 유지 → 깜빡임 0(증상2),
  //    followFocus 없는 단계(숙제)도 포커스만으로 숨김(증상3). 칸에서 빠지고 키보드가 내려가면
  //    (디바운스+vv 확인) 해제하고 현재 포커스/타깃에 한 번에 복귀.
  //  - 그 외(안드로이드 등): 기존대로 vv 변화 시 위치만 재동기화(숨김 없음) — 회귀 방지.
  // 레이아웃·스크롤 주체는 불변(window 스크롤 그대로) — 표시 여부/위치만 다룸.
  let vvBound = false;
  const KB_ENTER_DELTA = 150;   // vv가 이 이상 줄면 키보드-업 '진입'(URL바 변동과 구분)
  const KB_EXIT_DELTA  = 80;    // 이 이하로 회복해야 '해제' — 이중 임계(히스테리시스)로 임계 근처 깜빡임 차단
  const KB_RELEASE_DELAY = 200; // 해제 디바운스(ms): 칸에서 빠지거나 키보드 내려간 뒤 잠깐 기다렸다 해제(재진입이면 취소)
  let kbHidden = false;         // 현재 숨김(class) 상태
  let kbLatched = false;        // 키보드-업 래치(편집 포커스 동안 유지)
  let releaseTimer = null;
  function isEditable(el) {
    if (!el) return false;
    const t = el.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || el.isContentEditable === true;
  }
  function vvDelta() { const vv = window.visualViewport; return vv ? (window.innerHeight - vv.height) : 0; }
  function tourOn() { return !!(drv && drv.isActive && drv.isActive()); }
  function applyHidden(hide) {
    if (hide === kbHidden) return;        // 상태 변화 없으면 무시 → 연속 입력 중 깜빡임 0
    kbHidden = hide;
    document.documentElement.classList.toggle('kb-hide-tour', hide);
    if (!hide && tourOn()) {              // 해제: 현재 포커스(followFocus면 그 칸)/타깃 기준 한 번에 복귀
      const s = STEPS[stepIndex], ae = document.activeElement;
      try {
        if (s && s.followFocus && ae && ae.classList && ae.classList.contains(s.followFocus)) {
          drv.highlight({ element: ae, popover: { title: s.popover.title || '', description: s.popover.description, showButtons: [] } });
        } else {
          drv.refresh();
        }
      } catch (e) {}
    }
  }
  // 포커스/vv 신호를 모아 래치를 갱신하고 숨김 여부 반영 (iOS 한정)
  function kbRecompute() {
    if (!tourOn() || !isMobileViewport()) return;
    const editable = isEditable(document.activeElement);
    const d = vvDelta();
    // 진입: vv가 확실히 줄었거나(>150), 칸 포커스 + vv가 어느 정도 줄었으면(>80, 짧은 숫자패드 대응) 키보드-업
    if (d > KB_ENTER_DELTA || (editable && d > KB_EXIT_DELTA)) kbLatched = true;
    // 해제: 칸도 안 잡혀 있고 vv도 충분히 회복(<80)됐을 때만 — 그 사이/편집 중이면 현 래치 유지(깜빡임 차단)
    else if (!editable && d < KB_EXIT_DELTA) kbLatched = false;
    applyHidden(kbLatched);
  }
  function scheduleRelease() {
    if (releaseTimer) clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => { releaseTimer = null; kbRecompute(); }, KB_RELEASE_DELAY);
  }
  function setupViewportRefresh() {
    if (vvBound) return;
    vvBound = true;
    if (!IS_IOS) {
      // 비-iOS(안드로이드 등): 기존 동작 그대로 — vv 변화 시 위치만 재동기화, 숨김 없음
      if (!window.visualViewport) return;
      let raf = null;
      const refresh = () => {
        if (!tourOn() || !isMobileViewport()) return;
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = null; try { drv.refresh(); } catch (e) {} });
      };
      window.visualViewport.addEventListener('resize', refresh);
      window.visualViewport.addEventListener('scroll', refresh);
      return;
    }
    // iOS: 1차 신호 = 편집 요소 포커스
    document.addEventListener('focusin', (e) => {
      if (!isEditable(e.target)) return;
      if (releaseTimer) { clearTimeout(releaseTimer); releaseTimer = null; } // 칸 재포커스 → 해제 취소(래치 유지)
      kbRecompute();
    }, true);
    document.addEventListener('focusout', (e) => {
      if (isEditable(e.target)) scheduleRelease(); // 칸에서 빠짐 → 디바운스 후 해제 판정
    }, true);
    // 보조 신호 = visualViewport(히스테리시스 진입/해제 보강)
    if (window.visualViewport) {
      let raf = null;
      const onVV = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = null; kbRecompute(); }); };
      window.visualViewport.addEventListener('resize', onVV);
      window.visualViewport.addEventListener('scroll', onVV);
    }
  }
  function startTour() {
    const D = window.driver && window.driver.js && window.driver.js.driver;
    if (!D) return; // CDN 미로딩 시: 튜토리얼 없이도 데모는 수동으로 동작
    drv = D({
      // 모바일: 연속 입력 시 하이라이트가 칸마다 즉시 스냅하도록 애니메이션 끔(칸→칸 ~400ms 잔상·지연 방지).
      // PC: 기존대로 부드러운 전환 유지(불변).
      animate: !isMobileViewport(),
      allowClose: false,
      overlayColor: 'rgba(17,24,39,.55)',
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: 'demo-popover',
      onNextClick: () => runStep(stepIndex + 1) // 안내(info) 스텝의 '다음 →' 버튼
    });
    setupViewportRefresh(); // iOS 키보드 대응 (모바일 한정)
    runStep(0);
  }
  function runStep(i) {
    if (!drv) return;
    if (followHandler) { document.removeEventListener('focusin', followHandler, true); followHandler = null; }
    clearPending(); // 이전 스텝의 대기 리스너 제거 (단계 이동 버튼으로 점프해도 꼬이지 않게)
    restoreLockedInput(); // 이전 스텝에서 잠갔던 예시 입력칸 원복 (단계 이탈/점프/종료 모두 커버)
    if (i >= STEPS.length) { drv.destroy(); return; }
    stepIndex = i;
    const s = STEPS[i];
    if (s.screen) showScreen(s.screen);
    setStepper(s.phase, s.phaseLabel);
    const el = document.querySelector(s.target);
    const isNext = s.done && s.done.type === 'next'; // 행동 없이 '다음'으로 넘기는 안내 스텝
    // 예시 입력칸 잠금: 이 단계 동안 readonly로 — 내용은 그대로 보이되 클릭/입력으로 예시가 오염되지 않게.
    // lockInput===true면 타깃을, 문자열이면 그 셀렉터를 잠근다(타깃이 입력칸이 아닌 단계용 — AI 유도 단계는 카드가 타깃이라 #commentInput을 직접 지정).
    if (s.lockInput) {
      const lockEl = (s.lockInput === true) ? el : document.querySelector(s.lockInput);
      if (lockEl) lockInputEl(lockEl);
    }
    // 안내 단계 진입 시 잔류 포커스(직전 단계에서 잠겨 있던 예시 입력칸 등) 해제 — readonly가 풀리는 찰나 포커스가 남아
    // iOS 키보드가 떠 투어(팝오버)가 가려지는 것 방지. readonly면 원래 키보드가 안 뜨지만 이중 안전망.
    if (s.blurOnEnter) { const ae = document.activeElement; if (isEditable(ae)) { try { ae.blur(); } catch (e) {} } }
    scrollPlan = s.scrollTop ? { mode: 'top', topRatio: (s.topRatio || 0.12) } : { mode: 'ratio', ratio: (s.ratio || 0.4) };
    const settle = () => afterScrollSettled(() => { if (drv && drv.isActive && drv.isActive()) { try { drv.refresh(); } catch (e) {} } });
    const highlight = () => drv.highlight({
      element: el || s.target,
      popover: {
        title: s.popover.title || '',
        description: s.popover.description,
        showButtons: isNext ? ['next'] : [],
        nextBtnText: '다음 →'
      }
    });
    if (isMobileViewport()) {
      if (kbHidden) {
        // iOS 키보드 숨김 중(1단계 칸 이동 등 — 칸마다 runStep 전환): 우리 쪽 스크롤을 일으키지 않는다.
        // scrollTo(top:0)로 맨 위로 튀었다가 직후 자동 포커스의 네이티브 스크롤이 칸으로 내려오며 생기던
        // 출렁임 제거(2단계 followHandler와 동일 원칙 — 위치는 iOS 네이티브 focus에 위임). 하이라이트는
        // (숨겨져 안 보이지만) 다음 칸으로 갱신만 하되 Driver 내부 bringInView의 즉시 scrollIntoView는
        // navScrolling으로 차단. settle(refresh)도 생략 — 키보드 내려가면 applyHidden(false)이 복귀시킨다.
        navScrolling = true;
        highlight();
        navScrolling = false;
      } else {
        // 평소(키보드 없음): 즉시 top:0(Bug1: sticky 진행바 아래 정렬) + 단일 refresh. smoothScrollSync 미사용
        // → input 자동 포커스 스크롤을 추적해 생기던 흔들림(증상A) 원천 제거. Driver bringInView 네이티브 스크롤 정상.
        navScrolling = false;
        try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (e) {}
        highlight();
        settle();
      }
    } else {
      // PC: 전환 스크롤을 부드럽게(smooth). 거리가 미미하면(<4px) 시퀀스 생략(무의미 추적 차단),
      // 있으면 smoothScrollSync로 smooth 이동 + 추적 + 끝난 뒤 정착(+ 미도달이면 즉시 보정). navScrolling은
      // smooth 동안만 true로 Driver 내부 즉시 scrollIntoView를 차단(경쟁/즉시 점프 방지).
      const targetY = el ? computeScrollY(el) : null;
      const needSmooth = (targetY !== null) && Math.abs((window.scrollY || 0) - targetY) >= 4;
      navScrolling = needSmooth;
      highlight();
      if (needSmooth) smoothScrollSync(targetY, () => { navScrolling = false; });
      else settle();
    }
    // 입력 칸이면 자동 포커스 — 사용자가 칸을 직접 고르지 않고 계속 입력만 하면 되게
    if (el && el.tagName === 'INPUT') {
      setTimeout(() => { try { el.focus(); } catch (e) {} }, 80);
    }
    // 표 등 컨테이너가 대상일 때 첫 입력칸 자동 포커스
    if (s.focusFirst) {
      setTimeout(() => { const fe = document.querySelector(s.focusFirst); if (fe) { try { fe.focus(); } catch (e) {} } }, 120);
    }
    // 카메라 팔로우: 활성 칸만 하이라이트하고, 칸이 화면 중앙 50% 밴드를 벗어날 때만
    // 최소한으로 부드럽게 스크롤(칸마다 화면이 튀지 않게)
    if (s.followFocus) {
      let lastIdx = el ? +el.dataset.ri : -1;
      followHandler = (ev) => {
        const t = ev.target;
        if (!t.classList || !t.classList.contains(s.followFocus)) return;
        const idx = +t.dataset.ri;
        if (idx === lastIdx) return;
        lastIdx = idx;
        const pop = { title: s.popover.title || '', description: s.popover.description, showButtons: [] };
        if (isMobileViewport()) {
          // 증상1: iOS 키보드-업으로 투어가 숨겨진 동안엔 스크롤·하이라이트를 생략한다 — 안 보이는 것에
          // scrollIntoView({block:'center'})를 걸면 iOS 네이티브 포커스 스크롤과 경쟁해 화면이 출렁임.
          // 위치 보정은 iOS 네이티브 focus에 위임하고, 키보드가 내려갈 때 applyHidden(false)이 현재 칸으로 복귀시킨다.
          if (kbHidden) return;
          // Bug2: 자동 포커스 이동 시, 먼저 다음 칸을 화면 중앙으로 스크롤하고(window 스크롤 유지),
          // 스크롤·레이아웃이 반영된 다음 프레임에 하이라이트 → 옛 좌표로 그려져 어긋나는 문제 해소.
          try { t.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
          afterScrollSettled(() => { if (drv && drv.isActive && drv.isActive()) drv.highlight({ element: t, popover: pop }); });
        } else {
          // PC: 기존 동작 그대로 — 즉시 하이라이트 + 밴드 벗어날 때만 보정
          drv.highlight({ element: t, popover: pop });
          keepFieldInView(t);
        }
      };
      document.addEventListener('focusin', followHandler, true);
    }
    // 체크박스 활성화 (정리 문항 선택 단계에서만)
    if (s.enableChecks) { [...document.querySelectorAll('.wrong-check')].forEach(c => { c.disabled = false; }); }
    if (!isNext) waitFor(s, () => runStep(i + 1));
  }
  function waitFor(s, next) {
    const done = s.done || {};
    if (done.type === 'input-value') {
      const inp = document.querySelector(done.selector);
      const norm = v => (v || '').trim().toLowerCase(); // 대소문자 무관 비교
      const h = () => {
        if (done.expect.some(e => norm(e) === norm(inp.value))) {
          inp.removeEventListener('input', h); pendingCleanup = null; next();
        }
      };
      inp.addEventListener('input', h);
      pendingCleanup = () => inp.removeEventListener('input', h);
    } else if (done.type === 'event') {
      const h = () => { document.removeEventListener(done.event, h); pendingCleanup = null; next(); };
      document.addEventListener(done.event, h);
      pendingCleanup = () => document.removeEventListener(done.event, h);
    } else if (done.type === 'input') {
      // 지정한 입력칸에 사용자가 입력/수정하면 다음 항목으로
      const inp = document.querySelector(done.selector);
      if (inp) {
        const h = () => { inp.removeEventListener('input', h); pendingCleanup = null; next(); };
        inp.addEventListener('input', h);
        pendingCleanup = () => inp.removeEventListener('input', h);
      }
    }
    // type === 'next' : 안내 스텝(다음 버튼) / type === 'none' : 마지막 단계
  }

  /* ---------- 초기화 ---------- */
  function init() {
    buildStepper();
    buildTable();
    $('#examDate').value = '2026-06-04';

    $('#loadBtn').addEventListener('click', loadStudent);
    $('#saveBtn').addEventListener('click', () => toast('체험판에서는 저장이 비활성화되어 있어요'));
    $('#createBtn').addEventListener('click', createExam);
    $('#nextStepBtn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('demo:next')));
    const printToast = () => toast('체험판에서는 인쇄가 비활성화되어 있어요');
    $('#printExamBtn').addEventListener('click', printToast);
    $('#printSheetBtn').addEventListener('click', printToast);
    $('#printWrongBtn').addEventListener('click', printToast);

    // 표 입력 시 합계 자동 갱신
    $('#historyTableBody').addEventListener('input', recalc);

    // 2단계: 결과 입력 표 구성 + 핸들러
    buildResultTable();
    $('#resultTableBody').addEventListener('input', onResultInput);
    $('#resultTableBody').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('rslt-result-input')) {
        e.preventDefault();
        const n = document.querySelector('.rslt-result-input[data-ri="' + (+e.target.dataset.ri + 1) + '"]');
        if (n) n.focus();
      }
    });
    $('#btnResultSave').addEventListener('click', saveResults);
    $('#nextStep2Btn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('demo:next')));

    // 3단계: 오답노트 핸들러
    $('#wrongTableBody').addEventListener('change', e => {
      if (e.target.classList && e.target.classList.contains('wrong-check') && e.target.checked) {
        document.dispatchEvent(new CustomEvent('demo:wrongChecked'));
      }
    });
    $('#btnWrongLoad').addEventListener('click', loadWrong);
    $('#btnCleanWrong').addEventListener('click', cleanWrong);
    $('#btnWrongPreview').addEventListener('click', () => renderWrongNote());
    $('#btnWrongSave').addEventListener('click', saveWrong);
    $('#nextStep3Btn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('demo:next')));

    // 4단계: 숙제 입력 핸들러
    buildHomeworkTable();
    $('#hwDate').value = '2026-06-04';
    $('#hwTableBody').addEventListener('input', onHomeworkInput);
    $('#hwTableBody').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('hw-score')) {
        e.preventDefault();
        const n = document.querySelector('.hw-score[data-hi="' + (+e.target.dataset.hi + 1) + '"]');
        if (n) n.focus();
      }
    });
    $('#btnHwSubmit').addEventListener('click', submitHomework);
    $('#nextStep4Btn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('demo:next')));

    // 5단계: 보고서 핸들러
    $('#commentInput').value = DEMO_REPORT_DRAFT; // 선생님이 쓴 거친 초안을 미리 채워둠 (AI가 다듬는 before/after 연출 · 빈칸 막힘 해소)
    $('#btnFetchData').addEventListener('click', fetchReport);
    $('#btnAiAssist').addEventListener('click', aiAssist);
    $('#btnApplyComment').addEventListener('click', applyComment);
    $('#btnSaveReport').addEventListener('click', () => toast('체험판에서는 저장이 비활성화되어 있어요'));
    $('#btnDownloadImg').addEventListener('click', () => toast('체험판에서는 다운로드가 비활성화되어 있어요'));
    $('#nextStep5Btn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('demo:next')));

    // 6단계: 약점 분석 핸들러
    $('#wkStart').value = '2026-05-01';
    $('#wkEnd').value = '2026-06-04';
    $('#btnWkAnalyze').addEventListener('click', analyzeWeakness);
    $('#wkResult').addEventListener('click', e => { const el = e.target.closest('.wk-clickable'); if (el) openProblemModal(el.dataset.num); });
    $('#probClose').addEventListener('click', closeProblemModal);
    $('#probModal').addEventListener('click', e => { if (e.target.id === 'probModal') closeProblemModal(); });
    $('#nextStep6Btn').addEventListener('click', () => document.dispatchEvent(new CustomEvent('demo:next')));

    // 7단계: 곱셈공식 랜덤 시험 + 완료 화면
    $('#btnShuffle').addEventListener('click', () => { mfShuffle(); renderMultFormula(); document.dispatchEvent(new CustomEvent('demo:shuffled')); });
    $('#mfToggle').addEventListener('click', e => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      mfMode = b.dataset.v;
      [...document.querySelectorAll('#mfToggle button')].forEach(x => x.classList.toggle('on', x === b));
      renderMultFormula();
    });
    $('#btnMfPrint').addEventListener('click', () => toast('체험판에서는 인쇄가 비활성화되어 있어요'));
    $('#btnFinish').addEventListener('click', finishDemo);
    $('#btnRestart').addEventListener('click', () => location.reload());

    $('#navPrev').addEventListener('click', () => gotoPhase(STEPS[stepIndex].phase - 1));
    $('#navNext').addEventListener('click', () => gotoPhase(STEPS[stepIndex].phase + 1));

    // (모바일 키패드용 visualViewport 재배치 핸들러는 회귀로 제거 — 모바일은 브라우저 기본 스크롤에 맡김)

    // 인트로의 '시작하기'를 눌러야 1단계 튜토리얼 시작
    $('#startBtn').addEventListener('click', () => {
      $('#intro').classList.add('hidden');
      $('#stepNav').hidden = false;
      startTour();
    });
  }

  init();
})();
