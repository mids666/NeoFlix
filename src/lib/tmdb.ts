import axios from 'axios';

const TMDB_API_KEY = '26f2931a4085cca0519d862cbd1c85e2';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const getImageUrl = (path: string | null | undefined, size: 'w500' | 'original' | 'w185' = 'w500') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const tmdbService = {
  getTrending: async (type: 'movie' | 'tv' | 'all' = 'all') => {
    const { data } = await tmdb.get(`/trending/${type}/week`);
    return data.results;
  },
  getPopular: async (type: 'movie' | 'tv') => {
    const { data } = await tmdb.get(`/${type}/popular`);
    return data.results;
  },
  getTopRated: async (type: 'movie' | 'tv') => {
    const { data } = await tmdb.get(`/${type}/top_rated`);
    return data.results;
  },
  getDetails: async (type: 'movie' | 'tv', id: string) => {
    const { data } = await tmdb.get(`/${type}/${id}`, {
      params: { append_to_response: 'videos,recommendations,credits' },
    });
    return data;
  },
  search: async (query: string) => {
    const { data } = await tmdb.get('/search/multi', {
      params: { query },
    });
    return data.results;
  },
  getGenres: async (type: 'movie' | 'tv') => {
    const { data } = await tmdb.get(`/genre/${type}/list`);
    return data.genres;
  },
  getDiscover: async (type: 'movie' | 'tv', genreId?: string, sortBy: string = 'popularity.desc') => {
    const { data } = await tmdb.get(`/discover/${type}`, {
      params: { 
        with_genres: genreId,
        sort_by: sortBy,
        'vote_count.gte': sortBy === 'vote_average.desc' ? 100 : undefined // Filter for quality when sorting by top rated
      },
    });
    return data.results;
  },
  getTVShowEpisodes: async (id: string, season: number) => {
    const { data } = await tmdb.get(`/tv/${id}/season/${season}`);
    return data.episodes;
  },
};
