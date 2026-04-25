import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Check, Info, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TMDBItem } from '../types';
import { getImageUrl } from '../lib/tmdb';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { useSettings } from '../hooks/useSettings';

interface MovieCardProps {
  item: TMDBItem;
  onSelect?: (item: TMDBItem) => void;
  onRemove?: (item: TMDBItem) => void;
  className?: string;
  key?: React.Key;
}

export default function MovieCard({ item, onSelect, onRemove, className }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const { user, currentProfile, setShowAuthModal } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'w-[100px] md:w-[150px]',
    medium: 'w-[140px] md:w-[200px]',
    large: 'w-[180px] md:w-[260px]'
  };

  useEffect(() => {
    if (!user || !currentProfile) return;

    const watchlistRef = collection(db, 'users', user.uid, 'profiles', currentProfile.id, 'watchlist');
    const q = query(watchlistRef, where('tmdbId', '==', item.id.toString()));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsInWatchlist(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [user, currentProfile, item.id]);

  const handleSelect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    navigate(`/watch/${type}/${item.id}`);
    if (onSelect) onSelect(item);
  };

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !currentProfile) {
      setShowAuthModal(true);
      return;
    }

    const watchlistRef = doc(db, 'users', user.uid, 'profiles', currentProfile.id, 'watchlist', item.id.toString());

    try {
      if (isInWatchlist) {
        await deleteDoc(watchlistRef);
        toast.success('Removed from watchlist');
      } else {
        await setDoc(watchlistRef, {
          tmdbId: item.id.toString(),
          type: item.media_type || (item.title ? 'movie' : 'tv'),
          title: item.title || item.name,
          posterPath: item.poster_path,
          addedAt: new Date().toISOString(),
        });
        toast.success('Added to watchlist');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getQuality = () => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return 'FHD';

    const date = new Date(releaseDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (item.media_type === 'tv' || !item.title) {
      return 'FHD';
    }

    if (diffDays < 45) return null; // Don't show CAM
    return 'FHD';
  };

  const quality = getQuality();

  return (
    <div 
      className={`relative flex-none aspect-[2/3] cursor-pointer group transition-all duration-300 ${sizeClasses[settings.cardSize]} ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => handleSelect()}
    >
      <img 
        src={getImageUrl(item.poster_path) || undefined} 
        alt={item.title || item.name}
        className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />

      {/* Quality Badge */}
      {quality && (
        <div className="absolute top-2 left-2 z-20">
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-lg bg-green-600 text-white">
            {quality}
          </span>
        </div>
      )}
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-10 bg-black/70 rounded-md p-4 flex flex-col justify-end gap-3 backdrop-blur-sm"
          >
            <h3 className="text-sm md:text-base font-bold line-clamp-2 text-white">
              {item.title || item.name}
            </h3>
            
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-3 h-3 fill-current" />
                <span>{item.vote_average.toFixed(1)}</span>
              </div>
              <span className="text-white/70 capitalize">
                {item.media_type || (item.title ? 'movie' : 'tv')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200"
                onClick={handleSelect}
              >
                <Play className="w-4 h-4 fill-current" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                className="w-8 h-8 rounded-full border-white/20 text-white hover:bg-white/10"
                onClick={toggleWatchlist}
              >
                {isInWatchlist ? <Check className="w-4 h-4 text-red-500" /> : <Plus className="w-4 h-4" />}
              </Button>
              {onRemove ? (
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-8 h-8 rounded-full border-white/20 hover:border-red-500 hover:text-red-500 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item);
                  }}
                >
                   <Trash2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-8 h-8 rounded-full border-white/20 hover:border-white text-white ml-auto"
                >
                  <Info className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
