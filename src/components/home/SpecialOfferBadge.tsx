import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, Offer, Yacht } from '@/lib/supabase';
import { Sparkles, X, ChevronRight, Percent, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SpecialOfferBadge() {
  const [offers, setOffers] = useState<(Offer & { yacht: Yacht })[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  const fetchActiveOffers = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('offers')
      .select('*, yacht:yachts(*)')
      .eq('status', 'active')
      .gte('end_date', today)
      .limit(3);

    if (data) {
      setOffers(data as (Offer & { yacht: Yacht })[]);
    }
  };

  if (offers.length === 0 || !isVisible) return null;

  const topOffer = offers[0];

  return (
    <section className="py-12 ocean-gradient overflow-hidden relative border-y border-primary/10">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: 3D Ribbon Logo/Badge Area */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex flex-col items-center">
              <div className="absolute -top-1 w-[120%] flex justify-between px-2">
                <div className="w-4 h-3 bg-red-900 [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                <div className="w-4 h-3 bg-red-900 [clip-path:polygon(0_0,0_100%,100%_100%)]" />
              </div>
              
              <div className="bg-[#e31e24] text-white px-8 py-4 rounded-2xl shadow-2xl flex flex-col items-center border border-white/20 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-90">Exclusive</span>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="text-2xl font-black tracking-tighter">OFFERS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Offers Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-2 leading-tight">
              {topOffer.title} <span className="text-primary">- Save {topOffer.discount_type === 'percentage' ? `${topOffer.discount_value}%` : `AED ${topOffer.discount_value}`}</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg font-medium max-w-xl">
              Special booking deal for <span className="text-primary font-bold">{topOffer.yacht.name}</span>. Experience luxury for an unbeatable price.
            </p>
          </div>

          {/* Right: CTA */}
          <div className="flex flex-col items-center gap-4">
            <Link 
              to={`/yachts/${encodeURIComponent(topOffer.yacht.name)}`}
              className="bg-primary text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all transform hover:scale-105 shadow-xl shadow-primary/20 group flex items-center gap-3"
            >
              Claim This Deal
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {offers.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                  + {offers.length - 1} more offers waiting
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
