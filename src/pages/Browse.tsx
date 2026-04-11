import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tmdbService } from '../lib/tmdb';
import { TMDBItem, Genre } from '../types';
import MovieCard from '../components/MovieCard';
import MoviePlayer from '../components/MoviePlayer';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Browse() {
  const { type } = useParams<{ type: 'movie' | 'tv' }>();
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TMDBItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      if (!type) return;
      const genresData = await tmdbService.getGenres(type);
      setGenres(genresData);
    };
    fetchGenres();
  }, [type]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!type) return;
      setLoading(true);
      
      let finalSortBy = sortBy;
      if (sortBy === 'newest') {
        finalSortBy = type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
      }

      const data = await tmdbService.getDiscover(type, selectedGenre?.toString(), finalSortBy);
      setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, [type, selectedGenre, sortBy]);

  const handleSelect = (item: TMDBItem) => {
    setSelectedItem(item);
    setIsPlayerOpen(true);
  };

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white capitalize">
            {type === 'movie' ? 'Movies' : 'TV Shows'}
          </h1>
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-400">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-400">
                <SelectItem value="popularity.desc">Popular</SelectItem>
                <SelectItem value="vote_average.desc">Top Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedGenre === null 
                ? 'bg-red-600 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            All Genres
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedGenre === genre.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] bg-zinc-900 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} onSelect={handleSelect} />
          ))}
        </div>
      )}

      <MoviePlayer 
        item={selectedItem} 
        isOpen={isPlayerOpen} 
        onClose={() => setIsPlayerOpen(false)} 
      />
    </div>
  );
}
