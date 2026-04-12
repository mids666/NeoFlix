import { useState, useEffect } from 'react';
import { tmdbService, getImageUrl } from '../lib/tmdb';
import { TMDBItem } from '../types';
import MovieRow from '../components/MovieRow';
import MoviePlayer from '../components/MoviePlayer';
import { Button } from '@/components/ui/button';
import { Play, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [trending, setTrending] = useState<TMDBItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBItem[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBItem[]>([]);
  const [topRated, setTopRated] = useState<TMDBItem[]>([]);
  const [featured, setFeatured] = useState<TMDBItem | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<TMDBItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [trendingData, moviesData, tvData, topData] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getPopular('movie'),
        tmdbService.getPopular('tv'),
        tmdbService.getTopRated('movie'),
      ]);

      setTrending(trendingData);
      setPopularMovies(moviesData);
      setPopularTV(tvData);
      setTopRated(topData);
      
      if (trendingData.length > 0) {
        setFeatured(trendingData[0]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;

    const interval = setInterval(() => {
      setFeaturedIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % trending.length;
        setFeatured(trending[nextIndex]);
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [trending]);

  const handleSelect = (item: TMDBItem) => {
    setSelectedItem(item);
    setIsPlayerOpen(true);
  };

  return (
    <div className="relative pb-20">
      {/* Hero Section */}
      <AnimatePresence mode="wait">
        {featured && (
          <motion.div 
            key={featured.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-[80vh] md:h-[95vh] w-full overflow-hidden"
          >
            <div className="absolute inset-0">
              <img 
                src={getImageUrl(featured.backdrop_path, 'original') || undefined} 
                alt={featured.title || featured.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 md:p-12 md:pb-32 space-y-6 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold">
                    <Star className="w-5 h-5 fill-current" />
                    <span>{featured.vote_average.toFixed(1)}</span>
                  </div>
                  <span className="text-zinc-300 font-medium">
                    {new Date(featured.release_date || featured.first_air_date || '').getFullYear()}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-800/80 rounded text-xs font-bold text-white uppercase tracking-wider">
                    {featured.media_type || 'trending'}
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-none">
                  {featured.title || featured.name}
                </h1>
                
                <p className="text-lg text-zinc-300 line-clamp-3 md:line-clamp-4 max-w-2xl leading-relaxed">
                  {featured.overview}
                </p>

                <div className="flex items-center gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-zinc-200 h-14 px-8 rounded-full text-lg font-bold gap-2"
                    onClick={() => handleSelect(featured)}
                  >
                    <Play className="w-6 h-6 fill-current" />
                    Play Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-zinc-900/40 backdrop-blur-md border-zinc-700 hover:bg-zinc-800 h-14 px-8 rounded-full text-lg font-bold gap-2 text-white"
                    onClick={() => handleSelect(featured)}
                  >
                    <Info className="w-6 h-6" />
                    More Info
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Rows */}
      <div className="space-y-8 -mt-20 md:-mt-32 relative z-10">
        <MovieRow title="Trending Now" items={trending} onSelect={handleSelect} />
        <MovieRow title="Popular Movies" items={popularMovies} onSelect={handleSelect} />
        <MovieRow title="Popular TV Shows" items={popularTV} onSelect={handleSelect} />
        <MovieRow title="Top Rated" items={topRated} onSelect={handleSelect} />
      </div>

      <MoviePlayer 
        item={selectedItem} 
        isOpen={isPlayerOpen} 
        onClose={() => setIsPlayerOpen(false)} 
      />
    </div>
  );
}
