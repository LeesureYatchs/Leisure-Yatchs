import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, Yacht, Offer } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Ruler, Bath, ArrowRight, Percent, Tag, Crown, Star, Gem, Anchor, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YachtCardProps {
  yacht: Yacht;
}

export function YachtCard({ yacht }: YachtCardProps) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isOfferActive, setIsOfferActive] = useState(false);
  const defaultImage = 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80';
  const imageUrl = yacht.images && yacht.images.length > 0 ? yacht.images[0] : defaultImage;

  useEffect(() => {
    fetchOffer();
  }, [yacht.id]);

  useEffect(() => {
    if (!offer) return;

    const calculateTimeLeft = () => {
      const [year, month, day] = offer.end_date.split('-').map(Number);
      const [sYear, sMonth, sDay] = offer.start_date.split('-').map(Number);
      
      const now = new Date();
      
      // Parse start time/date
      const start = new Date(sYear, sMonth - 1, sDay);
      if (offer.start_time) {
        const [hours, minutes] = offer.start_time.split(':').map(Number);
        start.setHours(hours, minutes, 0);
      } else {
        start.setHours(0, 0, 0);
      }

      // Parse end time/date
      const end = new Date(year, month - 1, day);
      if (offer.end_time) {
        const [hours, minutes] = offer.end_time.split(':').map(Number);
        end.setHours(hours, minutes, 59);
      } else {
        end.setHours(23, 59, 59);
      }

      // Not started yet
      if (now < start) {
        setIsOfferActive(false);
        const diff = start.getTime() - now.getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setTimeLeft(d > 0 ? `Starts in ${d}d ${timeString}` : `Starts in ${timeString}`);
        return;
      }

      setIsOfferActive(true);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      setTimeLeft(d > 0 ? `Ends in ${d}d ${timeString}` : `Ends in ${timeString}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [offer]);

  const fetchOffer = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('yacht_id', yacht.id)
      .eq('status', 'active')
      .gte('end_date', today) // Show if it hasn't ended yet
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      setOffer(data as Offer);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={yacht.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {offer && (
            <div className="absolute top-0 right-4 z-30 pointer-events-none drop-shadow-xl">
              {/* The 3D Ribbon Container */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative"
              >
                {/* Ribbon Side Ears (3D Effect) */}
                <div className="absolute -left-2 top-0 w-2 h-4 bg-[#8b0000] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
                <div className="absolute -right-2 top-0 w-2 h-4 bg-[#8b0000] [clip-path:polygon(0_0,100%_0,0_100%)]" />
                
                {/* Ribbon Main Body */}
                <div className="bg-[#e31e24] text-white px-4 py-2 flex flex-col items-center min-w-[120px] rounded-b-2xl shadow-lg border-x border-b border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90 leading-none mb-1">
                    {offer.title || 'Special Offer'}
                  </span>
                  
                  <div className="flex items-center gap-1 my-0.5">
                    <span className="text-xl font-black leading-none tracking-tight">
                      {offer.discount_type === 'percentage'
                        ? `${offer.discount_value}%`
                        : `AED ${offer.discount_value}`}
                    </span>
                    <span className="text-[10px] font-bold uppercase">OFF</span>
                  </div>

                  {timeLeft && (
                    <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-white/20 w-full justify-center">
                      <Clock className="w-2.5 h-2.5 text-white/80 animate-pulse" />
                      <span className="text-[9px] font-mono font-bold tracking-tighter">
                        {timeLeft}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Center Notch/Curve Shadow (Optional for extra depth) */}
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-red-800/30 blur-sm rounded-full" />
              </motion.div>
            </div>
          )}

          {yacht.category && (
            <div className="absolute top-4 left-4 z-20">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden group/badge",
                  yacht.category === 'Premium' ? "bg-gradient-to-r from-amber-400/90 to-amber-600/90 text-amber-950" :
                  yacht.category === 'Super' ? "bg-gradient-to-r from-slate-800/90 to-black/90 text-white" :
                  yacht.category === 'Luxury' ? "bg-gradient-to-r from-emerald-500/90 to-emerald-700/90 text-white" :
                  "bg-gradient-to-r from-blue-500/90 to-blue-700/90 text-white"
                )}
              >
                {/* Animated Shine Effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/badge:animate-[shimmer_1.5s_infinite] transition-transform pointer-events-none" />
                
                {/* Specific Icons */}
                {yacht.category === 'Premium' && <Crown className="w-3.5 h-3.5" />}
                {yacht.category === 'Super' && <Star className="w-3.5 h-3.5 fill-current" />}
                {yacht.category === 'Luxury' && <Gem className="w-3.5 h-3.5" />}
                {(!yacht.category || yacht.category === 'Standard') && <Anchor className="w-3.5 h-3.5" />}
                
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {yacht.category}
                </span>
              </motion.div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 transform group-hover:translate-y-[-4px] transition-transform duration-300">
            <h3 className="text-white text-xl font-bold mb-0.5 drop-shadow-md">{yacht.name}</h3>
            <p className="text-white/90 text-xs font-medium uppercase tracking-wider">{yacht.feet} ft • {yacht.category || 'Luxury'}</p>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-primary/5 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground bg-primary/5 px-2 py-1 rounded-md shrink-0">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold">{yacht.capacity} Guests</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-primary/5 px-2 py-1 rounded-md shrink-0">
              <Ruler className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold">{yacht.feet} ft</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-primary/5 px-2 py-1 rounded-md shrink-0">
              <Bath className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold">{yacht.restrooms || 1} Bath</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Starting Hourly</span>
              {offer && isOfferActive ? (
                <div className="flex flex-col">
                  <p className="text-lg font-black text-primary">
                    AED {(
                      offer.discount_type === 'percentage'
                        ? yacht.hourly_price * (1 - offer.discount_value / 100)
                        : Math.max(0, yacht.hourly_price - offer.discount_value)
                    ).toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">/hr</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground line-through decoration-destructive/50">
                    AED {yacht.hourly_price.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-xl font-black text-primary">
                  AED {yacht.hourly_price.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/hr</span>
                </p>
              )}
            </div>
            <Button asChild variant="default" size="sm" className="rounded-full shadow-md hover:shadow-lg transition-all group/btn">
              <Link to={`/yachts/${encodeURIComponent(yacht.name)}`} className="flex items-center gap-2">
                <span className="text-xs font-bold">Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
