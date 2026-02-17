# Movie Score Search

영화 제목을 검색하면 IMDb, Metacritic, Rotten Tomatoes 지표를 간단히 보여주는 웹앱입니다.

## 1) 준비
- Node.js 18+ 설치
- OMDb API Key 발급: https://www.omdbapi.com/apikey.aspx

## 2) 로컬 실행
```bash
npm install
```

`.env` 파일 생성 후 아래 값 입력:
```env
OMDB_API_KEY=발급받은키
```

실행:
```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속

## 3) GitHub 업로드
```bash
git init
git add .
git commit -m "init: movie score search app"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 4) Render 배포
1. Render에서 `New +` -> `Web Service`
2. GitHub 레포 연결
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables에 `OMDB_API_KEY` 추가
6. Deploy 클릭

배포 후 Render URL로 접속하면 됩니다.
