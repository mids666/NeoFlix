import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { tmdbService, getImageUrl } from '../lib/tmdb';
import { TMDBItem } from '../types';
import { 
  Play, 
  Search as SearchIcon, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  ChevronLeft,
  X,
  User,
  Film,
  Compass,
  ArrowLeft,
  Plus,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useSettings } from '../hooks/useSettings';

export default function Discover() {
  const navigate = useNavigate();
  const { user, currentProfile, setShowAuthModal } = useAuth();
  const { settings } = useSettings();
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [trailers, setTrailers] = useState<Record<number, string | null>>({});
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trending = await tmdbService.getTrending('all');
        setItems(trending);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      }
    };
    fetchData();
  }, []);

  const fetchTrailer = useCallback(async (item: TMDBItem) => {
    if (trailers[item.id] !== undefined) return;
    
    try {
      const type = item.media_type || (item.title ? 'movie' : 'tv');
      const details = await tmdbService.getDetails(type as any, item.id.toString());
      const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      setTrailers(prev => ({ ...prev, [item.id]: trailer?.key || null }));
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
      setTrailers(prev => ({ ...prev, [item.id]: null }));
    }
  }, [trailers]);

  useEffect(() => {
    if (items.length > 0) {
      fetchTrailer(items[currentIndex]);
      // Pre-fetch next
      if (currentIndex + 1 < items.length) {
        fetchTrailer(items[currentIndex + 1]);
      }
    }
  }, [currentIndex, items, fetchTrailer]);

  useEffect(() => {
    const currentItem = items[currentIndex];
    if (!user || !currentProfile || !currentItem) {
      setIsInWatchlist(false);
      return;
    }

    const id = currentItem.id.toString();
    const watchlistRef = collection(db, 'users', user.uid, 'profiles', currentProfile.id, 'watchlist');
    const q = query(watchlistRef, where('tmdbId', '==', id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsInWatchlist(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [user, currentProfile, currentIndex, items]);

  const toggleWatchlist = async () => {
    const currentItem = items[currentIndex];
    if (!user || !currentProfile) {
      setShowAuthModal(true);
      return;
    }

    if (!currentItem) return;

    const id = currentItem.id.toString();
    const watchlistRef = doc(db, 'users', user.uid, 'profiles', currentProfile.id, 'watchlist', id);

    try {
      if (isInWatchlist) {
        await deleteDoc(watchlistRef);
        toast.success('Removed from watchlist');
      } else {
        const type = currentItem.media_type || (currentItem.title ? 'movie' : 'tv');
        await setDoc(watchlistRef, {
          tmdbId: id,
          type,
          title: currentItem.title || currentItem.name,
          posterPath: currentItem.poster_path,
          addedAt: new Date().toISOString(),
        });
        toast.success('Added to watchlist');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      // Reset to trending if search cleared
      setLoading(true);
      const trending = await tmdbService.getTrending('all');
      setItems(trending);
      setCurrentIndex(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const data = await tmdbService.search(searchQuery);
      const results = data.results.filter((i: any) => (i.poster_path || i.profile_path));

      // If the first result is exactly a person, and we didn't search specifically for a movie
      // checking if the top result is highly relevant person
      if (results.length > 0 && results[0].media_type === 'person') {
        const person = results[0];
        // Short delay to allow user to see it's searching
        setTimeout(() => navigate(`/person/${person.id}`), 500);
        return;
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextItem = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePlay = (item: TMDBItem) => {
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    navigate(`/watch/${type}/${item.id}`);
  };

  const renderContent = () => {
    if (loading && items.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <Skeleton className="w-full h-full bg-zinc-900" />
        </div>
      );
    }

    const gridClasses = {
      small: 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
      medium: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8',
      large: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
    };

    if (isSearching) {
      return (
        <div className="absolute inset-0 pt-24 pb-safe overflow-y-auto bg-background transition-colors duration-300 overscroll-contain" style={{ touchAction: 'pan-y' }}>
          <div className={`p-4 grid ${gridClasses[settings.cardSize]} gap-4 md:gap-6`}>
            {searchResults.map((item: any) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group bg-card border border-border"
              onClick={() => {
                if (item.media_type === 'person') {
                  navigate(`/person/${item.id}`);
                } else {
                  handlePlay(item);
                }
              }}
            >
              <img 
                src={getImageUrl(item.poster_path || item.profile_path, 'w500') || ''} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt={item.title || item.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="font-bold text-sm truncate text-white">{item.title || item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">{item.media_type}</span>
                  {item.vote_average > 0 && (
                    <span className="text-[10px] text-yellow-500 font-bold">★ {item.vote_average.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {searchResults.length === 0 && !loading && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
               <SearchIcon className="w-16 h-16 text-muted-foreground/20 mb-6" />
               <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">No Results Found</h3>
               <p className="text-muted-foreground mt-2">Try searching for a different movie, series, or actor.</p>
               <Button 
                variant="outline" 
                className="mt-8 border-border hover:bg-muted"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
               >
                 Clear Search
               </Button>
             </div>
          )}
        </div>
      </div>
    );
  }

    const currentItem = items[currentIndex];
    if (!currentItem) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-zinc-950">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
            <Compass className="w-10 h-10 text-zinc-700 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Finding content...</h2>
          <p className="text-zinc-500 max-w-xs">We couldn't find any swipeable content for your search. Try a different title or actor.</p>
          <Button 
            className="mt-8 bg-white text-black hover:bg-zinc-200"
            onClick={() => {
              setSearchQuery('');
              handleSearch(); // Triggers reset to trending
            }}
          >
            Reset Discover
          </Button>
        </div>
      );
    }

    const trailerKey = trailers[currentItem.id];

    return (
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentItem.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            {trailerKey && settings.autoplay ? (
              <div className="relative w-full h-full">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=0&mute=1&loop=1&playlist=${trailerKey}&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&disablekb=1&fs=0&autohide=1`}
                  className="w-full h-full pointer-events-none scale-150 grayscale-[0.3]"
                  allow="autoplay"
                  frameBorder="0"
                />
                <motion.div 
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="absolute inset-0 bg-black z-10 pointer-events-none"
                />
              </div>
            ) : (
              <img 
                src={getImageUrl(currentItem.backdrop_path, 'original') || ''}
                className="w-full h-full object-cover opacity-60"
                alt=""
              />
            )}
            <div className="absolute inset-0 bg-black/60 transition-colors duration-300" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-background transition-colors duration-500" />
        </div>

        {/* Swipe Control Layer */}
        <motion.div
          drag={isPortrait ? "y" : "x"}
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            const threshold = 50;
            if (isPortrait) {
              if (info.offset.y < -threshold) nextItem();
              else if (info.offset.y > threshold) prevItem();
            } else {
              if (info.offset.x < -threshold) nextItem();
              else if (info.offset.x > threshold) prevItem();
            }
          }}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />

        <div className="relative z-20 w-full h-full p-4 lg:p-12 pb-24 pointer-events-none text-left flex flex-col justify-end">
          <div className="w-full max-w-4xl mx-auto">
            <motion.div
              key={`info-${currentItem.id}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-4 md:space-y-6 pointer-events-auto"
            >
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                 <span className="px-3 py-1 bg-red-600 text-[10px] font-black uppercase rounded-full tracking-tight whitespace-nowrap text-white">
                   {currentItem.media_type === 'tv' ? 'Trending Series' : 'Trending Movie'}
                 </span>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                   <span className="text-yellow-500 font-black">★</span>
                   <span className="text-sm font-black text-white">{currentItem.vote_average?.toFixed(1)}</span>
                 </div>
                 <span className="text-white/80 text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                   {new Date(currentItem.release_date || currentItem.first_air_date || '').getFullYear()}
                 </span>
              </div>

              <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-white uppercase leading-[0.9] drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                {currentItem.title || currentItem.name}
              </h2>

              <p className="text-white/80 text-xs md:text-base max-w-xl leading-relaxed line-clamp-3 md:line-clamp-4 drop-shadow-lg font-medium">
                {currentItem.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button 
                  size="lg"
                  className="bg-red-600 text-white dark:bg-white dark:text-black hover:bg-red-700 dark:hover:bg-zinc-200 h-10 md:h-12 px-6 md:px-8 rounded-xl font-black uppercase tracking-tighter gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(currentItem);
                  }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  Play
                </Button>

                <Button 
                  size="lg"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchlist();
                  }}
                  className={`h-10 md:h-12 px-5 md:px-6 rounded-xl font-black uppercase tracking-tighter gap-2 transition-all backdrop-blur-md border-border active:scale-95 transition-colors ${
                    isInWatchlist ? 'bg-red-600 border-red-600 text-white' : 'bg-muted/40 text-foreground hover:bg-muted/60'
                  }`}
                >
                  {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isInWatchlist ? 'Saved' : 'Watchlist'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Navigation Indicators */}
        {!isSearching && (
          <>
            {/* Previous Button */}
            {currentIndex > 0 && (
              <div 
                className={`absolute z-20 transition-all ${
                  isPortrait 
                    ? 'top-24 left-1/2 -translate-x-1/2' 
                    : 'left-4 top-1/2 -translate-y-1/2 lg:left-12'
                }`}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-12 h-12 md:w-14 md:h-14 bg-muted/40 hover:bg-red-600 hover:scale-110 active:scale-95 text-foreground hover:text-white backdrop-blur-md transition-all border border-border"
                    onClick={prevItem}
                  >
                    {isPortrait ? <ChevronUp className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Next Button */}
            {currentIndex < items.length - 1 && (
              <div 
                className={`absolute z-20 transition-all ${
                  isPortrait 
                    ? 'bottom-8 left-1/2 -translate-x-1/2' 
                    : 'right-4 top-1/2 -translate-y-1/2 lg:right-12'
                }`}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-12 h-12 md:w-14 md:h-14 bg-muted/40 hover:bg-red-600 hover:scale-110 active:scale-95 text-foreground hover:text-white backdrop-blur-md transition-all border border-border shadow-2xl"
                    onClick={nextItem}
                  >
                    {isPortrait ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Pagination Dots (Landscape only for secondary indicator) */}
            {!isPortrait && (
                  <div className="absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 mt-20 flex flex-col gap-3 z-10 opacity-40">
                    {items.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, i) => {
                      const globalIdx = Math.max(0, currentIndex - 2) + i;
                      return (
                        <div 
                          key={globalIdx}
                          className={`w-1 rounded-full transition-all duration-500 ${
                            globalIdx === currentIndex ? 'h-6 bg-red-600' : 'h-1 bg-muted-foreground'
                          }`}
                        />
                      );
                    })}
                  </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background text-foreground h-screen overflow-hidden flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 lg:px-12 flex items-center gap-4 z-[110] bg-gradient-to-b from-background via-background/50 to-transparent">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-muted"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <form 
          className="flex-1 relative group max-w-2xl mx-auto"
          onSubmit={handleSearch}
        >
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
          <Input 
            placeholder="Search titles, series, or actors..."
            className="bg-muted/80 border-border pl-10 h-10 w-full focus:ring-red-600 rounded-full transition-all focus:bg-muted text-foreground"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setIsSearching(false);
            }}
          />
          {searchQuery && (
             <button 
               type="button"
               onClick={() => {
                 setSearchQuery('');
                 setIsSearching(false);
               }}
               className="absolute right-3 top-1/2 -translate-y-1/2"
             >
               <X className="w-4 h-4 text-muted-foreground" />
             </button>
          )}
        </form>
      </div>

      {/* Main Experience */}
      <div className="flex-1 relative">
        {renderContent()}
      </div>
    </div>
  );
}
