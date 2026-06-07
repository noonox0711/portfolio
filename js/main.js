const pad = n => String(n).padStart(2,'0');
const STATUS_CLASS = { '운영 중':'status-live', '개발 중':'status-dev', '프로토타입':'status-proto', '아이디어':'status-idea' };
const grid = document.getElementById('grid');

projects.forEach((p,i)=>{
  const c = document.createElement('div');
  c.className='cell card';
  const demoMark = p.demo ? `<span class="thumb-mark">체험 가능</span>` : '';
  const thumb   = p.image   ? `<div class="thumb">${demoMark}<img src="${p.image}" alt="${p.title} 미리보기" loading="lazy" onerror="this.closest('.thumb').remove()"></div>` : '';
  const offer = p.offer ? `<span class="badge badge-offer">${p.offer}</span>` : '';
  const note  = p.note  ? `<span class="badge-note">${p.note}</span>` : '';
  const statusClass = STATUS_CLASS[p.status] || '';
  c.innerHTML=`
    <div class="card-no"><span class="no">No. ${pad(i+1)}</span><span class="cat">${p.cat}</span></div>
    <h3>${p.title}</h3>
    <p class="short">${p.short}</p>
    ${thumb}
    <div class="badge-row"><span class="badge ${statusClass}">${p.status}</span>${offer}${note}</div>
    <span class="more">자세히 →</span>`;
  c.addEventListener('click',()=>open(i));
  grid.appendChild(c);
});

// 카드 수가 홀수면 필러 셀로 그리드 괘선을 닫는다
if(projects.length % 2 === 1){
  const f = document.createElement('div');
  f.className='cell filler';
  f.innerHTML='<span>more works, in progress —</span>';
  grid.appendChild(f);
}

const overlay=document.getElementById('overlay');
const modalBody=document.getElementById('modal-body');
const modal=document.getElementById('modal');

function open(i){
  const p=projects[i];
  const offer = p.offer ? `<span class="badge badge-offer">${p.offer}</span>` : '';
  const note  = p.note  ? `<span class="badge-note">${p.note}</span>` : '';
  const roadmap = (p.roadmap && p.roadmap.length)
    ? `<div class="block"><h4>Roadmap · 개발 예정</h4><ul class="roadmap-list">${p.roadmap.map(r=>`<li><b>${r.title}</b> — ${r.desc}</li>`).join('')}</ul></div>`
    : '';
  const statusClass = STATUS_CLASS[p.status] || '';
  let last;
  if(p.demo){
    last = `
    <div class="block demo-block">
      <h4>Demo · 체험</h4>
      <a class="demo-cta" href="${p.demo}" target="_blank" rel="noopener">새 탭에서 크게 보기 ↗</a>
      <div class="demo-narrow-note" hidden>화면이 좁아 체험이 작게 보여요. <b>새 탭에서 크게 보기</b>를 권장해요.</div>
      <div class="demo-frame" data-demo="${p.demo}" data-title="${p.title} 체험 데모"></div>
      ${p.url ? `<div class="demo-links"><a class="demo-newtab" href="${p.url}" target="_blank" rel="noopener">사이트 방문 →</a></div>` : ''}
      <p class="demo-disclaimer">본 체험판은 정해진 데이터로만 동작합니다. 실제 작동 체험을 원하시면 문의해 주세요.</p>
      <a class="visit-btn" href="https://open.kakao.com/o/skL5yp0h" target="_blank" rel="noopener">카카오톡으로 문의 →</a>
    </div>`;
  } else if(p.url){
    last = `<div class="block"><h4>Demo</h4><a class="visit-btn" href="${p.url}" target="_blank" rel="noopener">${p.urlLabel || '사이트 방문 →'}</a></div>`;
  } else {
    last = `<div class="block"><h4>Demo</h4><div class="demo-note">데모 영상·스크린샷은 준비 중입니다. 추가되면 이 자리에 들어갑니다.</div></div>`;
  }
  modal.classList.toggle('modal-demo', !!p.demo);
  modalBody.innerHTML=`
    <div class="m-no">No. ${pad(i+1)} · ${p.cat}</div>
    <h3>${p.title}</h3>
    <div class="m-badge badge-row"><span class="badge ${statusClass}">${p.status}</span>${offer}${note}</div>
    <div class="block"><h4>Problem</h4><p>${p.problem}</p></div>
    <div class="block"><h4>What I did</h4><p>${p.did}</p></div>
    ${roadmap}
    <div class="block"><h4>Stack</h4><div class="stack">${p.stack.map(s=>`<span>${s}</span>`).join('')}</div></div>
    ${last}`;
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  modalBody.scrollTop = 0;
  if(p.demo) setupDemoFrame();
}

// 데모 iframe: 모달이 열린 뒤 실제 폭을 재서 충분히 넓을 때만 iframe을 넣는다.
// 좁으면(특히 모바일) iframe 대신 새 탭 안내를 우선 노출 — 내부 스크롤로 튜토리얼
// 스포트라이트가 틀어지는 것을 막기 위함.
function setupDemoFrame(){
  const fr = modalBody.querySelector('.demo-frame');
  const note = modalBody.querySelector('.demo-narrow-note');
  if(!fr) return;
  requestAnimationFrame(()=>{
    // 빈 .demo-frame은 :empty로 숨겨져 폭이 0이므로, 부모 블록의 폭으로 측정
    const block = fr.closest('.demo-block') || fr.parentElement;
    const w = Math.round((block || fr).clientWidth);
    fr.dataset.measured = w;        // 검증용: iframe이 차지할 실제 폭
    const mobile = w < 560;         // iframe 대신 안내 + 새 탭만
    const narrow = w < 780;         // 2단 분기 미달 → 새 탭 권장 안내 노출
    if(note) note.hidden = !narrow;
    if(!mobile && !fr.querySelector('iframe')){
      const f = document.createElement('iframe');
      f.src = fr.dataset.demo;
      f.title = fr.dataset.title;
      f.loading = 'lazy';
      fr.appendChild(f);          // iframe이 들어가면 :empty 해제되어 표시됨
    }
  });
}
function close(){overlay.classList.remove('open');document.body.style.overflow=''}
document.getElementById('close').addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});

/* ---- Services 안내 모달 (프로젝트 모달 인프라 재사용) ---- */
const SERVICES = {
  tstudio: {
    cat: '프로젝트 이용 안내',
    title: '프로젝트 이용 안내',
    blocks: [
      ['What', '<p>T-Studio 도입을 도와드립니다. 학생 데이터 세팅, 문제은행 구축 지원, 사용법 안내까지 함께 진행합니다.</p>'],
      ['For', '<p>학원 원장·강사, 개인 과외 선생님</p>'],
      ['How', '<p>카카오톡 문의 → 사용 환경 상담 → 시범 사용 → 도입·세팅</p>']
    ]
  },
  aiworkspace: {
    cat: 'AI 워크스페이스 안내',
    title: 'AI 워크스페이스 안내',
    blocks: [
      ['What', '<p>업무에 맞춰, 예를 들면:</p><ul class="svc-list"><li>블로그 자동 생성 — 홍보 글 작성 자동화</li><li>학원 철학·커리큘럼 구조화 — AI로 문서 정리</li><li>휴대폰 하나로 AI 개발·업무를 진행하는 환경 세팅</li><li>그 외 반복 업무 자동화 상담</li></ul>'],
      ['Proof', '<p>저는 개발 전 과정을 핸드폰 하나로 진행하고, 제가 쓰는 관리 도구도 직접 만들어 사용합니다. 같은 방식의 작업 환경을 그대로 세팅해 드립니다.</p>'],
      ['How', '<p>현황 파악 → 환경 설계 → 세팅 + 사용법 교육</p>']
    ]
  }
};
function openService(key){
  const s = SERVICES[key];
  if(!s) return;
  modal.classList.remove('modal-demo');
  modalBody.innerHTML = `
    <div class="m-no">Service · ${s.cat}</div>
    <h3>${s.title}</h3>
    ${s.blocks.map(b=>`<div class="block"><h4>${b[0]}</h4>${b[1]}</div>`).join('')}
    <div class="block"><a class="visit-btn" href="https://open.kakao.com/o/skL5yp0h" target="_blank" rel="noopener">카카오톡으로 문의 →</a></div>`;
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  modalBody.scrollTop = 0;
}
document.querySelectorAll('.svc-btn').forEach(btn=>{
  btn.addEventListener('click',()=>openService(btn.dataset.svc));
});
