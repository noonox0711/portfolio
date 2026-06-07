# 안원우 · AI 교육 시스템 포트폴리오

AI 교육 시스템(5개 모듈)을 소개하는 정적 포트폴리오 사이트.

## 로컬에서 보기
빌드 필요 없음. `index.html`을 브라우저로 열면 끝.

```bash
# 또는 간단한 로컬 서버로
python3 -m http.server 8000
# http://localhost:8000 접속
```

## GitHub Pages 배포
1. GitHub에 새 repo 생성 (예: `portfolio`)
2. 이 폴더를 push
   ```bash
   git init
   git add .
   git commit -m "init portfolio"
   git branch -M main
   git remote add origin https://github.com/<사용자명>/portfolio.git
   git push -u origin main
   ```
3. repo > **Settings > Pages** > Source를 `main` 브랜치 / `/ (root)`로 지정
4. 몇 분 뒤 `https://<사용자명>.github.io/portfolio/` 에서 공개됨

### 커스텀 도메인 (선택)
도메인 구매 후(가비아/Namecheap 등) Settings > Pages > Custom domain에 입력하고,
도메인 DNS에 CNAME 레코드 추가하면 `yourname.com`으로 연결됩니다.

## 수정 포인트
- 프로젝트 내용: `index.html` 하단 `<script>`의 `projects` 배열
- 연락처: footer의 카카오톡 링크 / `namukua`
- 색상: `:root`의 CSS 변수 (`--accent-1` ~ `--accent-5`)