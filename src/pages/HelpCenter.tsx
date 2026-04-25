import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, HelpCircle, Play, User, Shield, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const categories = [
    { icon: Play, title: 'Getting Started', desc: 'Learn how to use FlixLab and set up your account.' },
    { icon: User, title: 'Account & Profile', desc: 'Manage your profiles, settings, and preferences.' },
    { icon: Shield, title: 'Privacy & Security', desc: 'How we keep your data safe and secure.' },
  ];

  const faqs = [
    { 
      q: 'Is FlixLab really free?', 
      a: 'Yes! FlixLab is a free platform. We do not require any credit card information or subscription fees to enjoy our library of movies and TV shows.' 
    },
    { 
      q: 'How do I change my profile name?', 
      a: 'You can manage your profiles by clicking on your avatar in the top right corner and selecting "Manage Profiles". From there, you can edit names and icons.' 
    },
    { 
      q: 'Can I watch on multiple devices?', 
      a: 'Absolutely. Since FlixLab is web-based, you can log in and watch on any device with a modern web browser, including smartphones, tablets, and smart TVs.' 
    },
    { 
      q: 'How do I add movies to my Watchlist?', 
      a: 'Simply click on any movie or TV show to open its details page, then click the "Watchlist" button. You can access your saved items from the "Watchlist" link in the navigation bar.' 
    },
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">How can we help?</h1>
            <p className="text-muted-foreground text-lg">Search our help center for answers to your questions.</p>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-5 h-5" />
            <Input 
              className="w-full h-14 pl-12 bg-muted border-border text-foreground rounded-xl focus:ring-red-600 transition-all" 
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-card border border-border rounded-2xl hover:border-red-600 transition-all group cursor-pointer hover:bg-muted"
            >
              <cat.icon className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-foreground mb-2">{cat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-red-600" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground font-bold">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-border pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
