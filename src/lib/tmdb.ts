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

export const getImageUrl = (path: string | null | undefined, size: 'w500' | 'original' | 'w185' | 'w300' | 'h632' | 'w342' = 'w500') => {
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
  search: async (query: string, page: number = 1) => {
    const { data } = await tmdb.get('/search/multi', {
      params: { query, page },
    });
    return {
      results: data.results,
      total_pages: data.total_pages
    };
  },
  getGenres: async (type: 'movie' | 'tv') => {
    const { data } = await tmdb.get(`/genre/${type}/list`);
    return data.genres;
  },
  getDiscover: async (type: 'movie' | 'tv', genreId?: string, sortBy: string = 'popularity.desc', page: number = 1) => {
    const { data } = await tmdb.get(`/discover/${type}`, {
      params: { 
        with_genres: genreId,
        sort_by: sortBy,
        page,
        'vote_count.gte': sortBy === 'vote_average.desc' ? 100 : undefined // Filter for quality when sorting by top rated
      },
    });
    return {
      results: data.results,
      total_pages: data.total_pages
    };
  },
  getByProvider: async (providerId: string, page: number = 1) => {
    const commonParams = {
      with_watch_providers: providerId,
      watch_region: 'US',
      with_watch_monetization_types: 'flatrate|free|ads',
      page 
    };

    const [{ data: movieData }, { data: tvData }] = await Promise.all([
      tmdb.get('/discover/movie', { params: commonParams }),
      tmdb.get('/discover/tv', { params: commonParams })
    ]);
    
    return {
      results: [...movieData.results, ...tvData.results].sort((a, b) => b.popularity - a.popularity),
      total_pages: Math.max(movieData.total_pages, tvData.total_pages)
    };
  },
  getTVShowEpisodes: async (id: string, season: number) => {
    const { data } = await tmdb.get(`/tv/${id}/season/${season}`);
    return data.episodes;
  },
  getRecommendations: async (type: 'movie' | 'tv', id: string) => {
    const { data } = await tmdb.get(`/${type}/${id}/recommendations`);
    return data.results;
  },
  getUpcoming: async () => {
    const { data } = await tmdb.get('/movie/upcoming');
    return data.results;
  },
  searchPeople: async (query: string, page: number = 1) => {
    const { data } = await tmdb.get('/search/person', {
      params: { query, page },
    });
    return {
      results: data.results,
      total_pages: data.total_pages
    };
  },
  getPersonDetails: async (id: number) => {
    const { data } = await tmdb.get(`/person/${id}`, {
      params: { append_to_response: 'combined_credits,images' },
    });
    return data;
  },
};
