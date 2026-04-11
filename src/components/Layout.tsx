import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-600 selection:text-white">
      <Navbar />
      <main className="pt-0">
        {children}
      </main>
      <footer className="py-12 px-4 md:px-12 border-t border-zinc-900 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-red-600 font-black tracking-tighter text-2xl">NEOFLIX</h3>
            <p className="text-zinc-500 text-sm">
              The ultimate streaming experience. Unlimited movies, TV shows, and more.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold">Platform</h4>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Browse</a></li>
              <li><a href="#" className="hover:text-white transition-colors">New Releases</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Top Rated</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold">Support</h4>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold">Connect</h4>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-xs">
          © {new Date().getFullYear()} NeoFlix. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
