# Movie Score Search

영화 제목을 검색하면 IMDb, Metacritic, Rotten Tomatoes(평론가/관객) 점수와 한국 OTT 제공처를 보여주는 웹앱입니다.

## 주요 기능
- 영화 제목 자동완성 검색
- IMDb / Metacritic / Rotten Tomatoes 점수 표시
- 한국(KR) 기준 OTT 제공처 표시(구독/대여/구매)

## 1) 준비
- Node.js 18+ 설치
- OMDb API Key 발급: https://www.omdbapi.com/apikey.aspx
- TMDB API Key 발급(OTT 표시용): https://www.themoviedb.org/settings/api

## 2) 로컬 실행
```bash
npm install
```

`.env` 파일 생성 후 아래 값 입력:
```env
OMDB_API_KEY=발급받은_OMDB_키
TMDB_API_KEY=발급받은_TMDB_키
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
5. Environment Variables에 아래 2개 추가
   - `OMDB_API_KEY`
   - `TMDB_API_KEY`
6. Deploy 클릭

배포 후 Render URL로 접속하면 됩니다.

## 참고
- `TMDB_API_KEY`가 없으면 OTT 영역은 안내 문구만 표시됩니다.
- Rotten Audience 점수는 데이터 소스에서 제공되는 경우에만 표시되며, 없으면 `N/A`로 보입니다.
