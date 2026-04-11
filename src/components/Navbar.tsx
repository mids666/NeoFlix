import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings, 
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { currentProfile, profiles, setCurrentProfile } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/browse/movie' },
    { name: 'TV Shows', path: '/browse/tv' },
    { name: 'Watchlist', path: '/watchlist' },
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 md:px-12 py-4 flex items-center justify-between ${
        isScrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-8">
        <Link to="/" className="text-3xl font-black tracking-tighter text-red-600">
          NEOFLIX
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-red-500 ${
                location.pathname === link.path ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Search */}
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                onSubmit={handleSearch}
                className="absolute right-0 mr-10"
              >
                <Input
                  autoFocus
                  placeholder="Titles, people, genres..."
                  className="bg-zinc-900/50 border-zinc-700 text-white h-9 focus:ring-red-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </motion.form>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-white hover:text-red-500 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <button className="hidden md:block text-white hover:text-red-500 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 group outline-none">
            <div className="w-8 h-8 rounded-md overflow-hidden border border-zinc-700 group-hover:border-white transition-all">
              <img src={currentProfile?.avatar || undefined} alt={currentProfile?.name} className="w-full h-full object-cover" />
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-all" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white w-56 mt-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Profiles</DropdownMenuLabel>
              {profiles.map((profile) => (
                <DropdownMenuItem 
                  key={profile.id}
                  className={`flex items-center gap-3 cursor-pointer ${profile.id === currentProfile?.id ? 'bg-zinc-800' : ''}`}
                  onClick={() => setCurrentProfile(profile)}
                >
                  <img src={profile.avatar || undefined} alt={profile.name} className="w-6 h-6 rounded-sm object-cover" />
                  <span>{profile.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentProfile(null)}>
                <PlusCircle className="w-6 h-6 text-zinc-500" />
                <span>Manage Profiles</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 cursor-pointer text-red-500 focus:text-red-400" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-[#0a0a0a] border-b border-zinc-800 p-6 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-lg font-medium ${
                  location.pathname === link.path ? 'text-red-600' : 'text-zinc-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
