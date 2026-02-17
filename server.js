const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OMDB_API_KEY = (process.env.OMDB_API_KEY || '')
  .replace(/^\uFEFF/, '')
  .trim();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  try {
    const title = (req.query.title || '').trim();

    if (!title) {
      return res.status(400).json({ error: '영화 제목을 입력해주세요.' });
    }

    if (!OMDB_API_KEY) {
      return res.status(500).json({ error: '서버에 OMDB_API_KEY가 설정되지 않았습니다.' });
    }

    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === 'False') {
      if ((data.Error || '').toLowerCase().includes('invalid api key')) {
        return res.status(401).json({
          error: 'OMDb API 키가 유효하지 않거나 아직 활성화되지 않았습니다. 키 확인 후 다시 시도해주세요.'
        });
      }

      return res.status(404).json({ error: data.Error || '영화를 찾을 수 없습니다.' });
    }

    const pickRating = (source) => {
      const match = (data.Ratings || []).find((r) => r.Source === source);
      return match ? match.Value : 'N/A';
    };

    res.json({
      title: data.Title,
      year: data.Year,
      poster: data.Poster !== 'N/A' ? data.Poster : '',
      imdbRating: data.imdbRating || 'N/A',
      imdbVotes: data.imdbVotes || 'N/A',
      metacritic: data.Metascore && data.Metascore !== 'N/A' ? `${data.Metascore}/100` : pickRating('Metacritic'),
      rottenTomatoes: pickRating('Rotten Tomatoes'),
      plot: data.Plot || '',
      genre: data.Genre || ''
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
