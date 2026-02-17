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
const TMDB_API_KEY = (process.env.TMDB_API_KEY || '')
  .replace(/^\uFEFF/, '')
  .trim();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function getKrOttByImdbId(imdbId) {
  if (!TMDB_API_KEY) {
    return {
      supported: false,
      message: 'TMDB_API_KEY가 없어 한국 OTT 정보를 표시할 수 없습니다.'
    };
  }

  if (!imdbId) {
    return {
      supported: true,
      message: '영화 ID가 없어 OTT 정보를 찾을 수 없습니다.',
      flatrate: [],
      rent: [],
      buy: [],
      link: ''
    };
  }

  try {
    const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
    const findResponse = await fetch(findUrl);
    const findData = await findResponse.json();
    const movieId = findData?.movie_results?.[0]?.id;

    if (!movieId) {
      return {
        supported: true,
        message: 'TMDB에서 해당 영화를 찾지 못했습니다.',
        flatrate: [],
        rent: [],
        buy: [],
        link: ''
      };
    }

    const providerUrl = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const providerResponse = await fetch(providerUrl);
    const providerData = await providerResponse.json();
    const kr = providerData?.results?.KR;

    if (!kr) {
      return {
        supported: true,
        message: '한국(대한민국) 기준 제공 OTT 정보가 없습니다.',
        flatrate: [],
        rent: [],
        buy: [],
        link: ''
      };
    }

    const uniqueNames = (items) => [...new Set((items || []).map((item) => item.provider_name))];

    return {
      supported: true,
      message: '',
      flatrate: uniqueNames(kr.flatrate),
      rent: uniqueNames(kr.rent),
      buy: uniqueNames(kr.buy),
      link: kr.link || ''
    };
  } catch (error) {
    return {
      supported: true,
      message: 'OTT 정보를 불러오는 중 오류가 발생했습니다.',
      flatrate: [],
      rent: [],
      buy: [],
      link: ''
    };
  }
}

app.get('/api/autocomplete', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    if (!OMDB_API_KEY) {
      return res.status(500).json({ error: '서버에 OMDB_API_KEY가 설정되지 않았습니다.' });
    }

    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(q)}&type=movie&page=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === 'False') {
      if ((data.Error || '').toLowerCase().includes('invalid api key')) {
        return res.status(401).json({
          error: 'OMDb API 키가 유효하지 않거나 아직 활성화되지 않았습니다. 키 확인 후 다시 시도해주세요.'
        });
      }

      return res.json({ suggestions: [] });
    }

    const suggestions = (data.Search || [])
      .slice(0, 8)
      .map((item) => ({
        title: item.Title,
        year: item.Year,
        imdbID: item.imdbID
      }));

    return res.json({ suggestions });
  } catch (error) {
    return res.status(500).json({ error: '자동완성 조회 중 서버 오류가 발생했습니다.' });
  }
});

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

    const pickFirstRating = (sources) => {
      for (const source of sources) {
        const value = pickRating(source);
        if (value !== 'N/A') return value;
      }
      return 'N/A';
    };

    const ott = await getKrOttByImdbId(data.imdbID);

    res.json({
      title: data.Title,
      year: data.Year,
      imdbID: data.imdbID || '',
      poster: data.Poster !== 'N/A' ? data.Poster : '',
      imdbRating: data.imdbRating || 'N/A',
      imdbVotes: data.imdbVotes || 'N/A',
      metacritic: data.Metascore && data.Metascore !== 'N/A' ? `${data.Metascore}/100` : pickRating('Metacritic'),
      rottenTomatoes: pickRating('Rotten Tomatoes'),
      rottenAudience: pickFirstRating([
        'Rotten Tomatoes Audience',
        'Rotten Tomatoes (Audience)',
        'Rotten Audience',
        'Popcornmeter'
      ]),
      plot: data.Plot || '',
      genre: data.Genre || '',
      ott
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
