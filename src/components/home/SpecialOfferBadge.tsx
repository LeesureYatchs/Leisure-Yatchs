import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, Offer, Yacht } from '@/lib/supabase';
import { Sparkles, X, ChevronRight, Percent, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';

export function SpecialOfferBadge() {
  const [offers, setOffers] = useState<(Offer & { yacht: Yacht })[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  useEffect(() => {
    if (offers.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [offers]);

  const fetchActiveOffers = async () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const { data } = await supabase
      .from('offers')
      .select('*, yacht:yachts(*)')
      .eq('status', 'active')
      .gte('end_date', today)
      .limit(10);

    if (data) {
      // Precise filtering in frontend
      const activeOffers = (data as (Offer & { yacht: Yacht })[]).filter(offer => {
        const [year, month, day] = offer.end_date.split('-').map(Number);
        const end = new Date(year, month - 1, day);
        
        if (offer.end_time) {
          const [hours, minutes] = offer.end_time.split(':').map(Number);
          end.setHours(hours, minutes, 59);
        } else {
          end.setHours(23, 59, 59);
        }
        
        const isNotExpired = now < end;

        // Auto-deactivate if expired
        if (!isNotExpired && offer.status === 'active') {
          (supabase as any)
            .from('offers')
            .update({ status: 'inactive' })
            .eq('id', offer.id)
            .then(); // Fire and forget
        }

        return isNotExpired;
      });

      setOffers(activeOffers.slice(0, 5));
    }
  };

  if (offers.length === 0 || !isVisible) return null;

  const currentOffer = offers[activeIndex];
  const yachtImage = optimizeImage(currentOffer.yacht.images?.[0], 1200, 80);

  return (
    <section className="py-20 relative overflow-hidden bg-white">
      {/* Background Aesthetic */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 [clip-path:polygon(20%_0%,100%_0%,100%_100%,0%_100%)] hidden lg:block" />
      
      <div className="container mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentOffer.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
          >
            
            {/* Left Side: Featured Image & Ribbon */}
            <div className="relative w-full lg:w-1/2">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] bg-gray-100">
                <motion.img 
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5 }}
                  src={yachtImage} 
                  alt={currentOffer.yacht.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* The 3D Ribbon - Integrated naturally onto the image corner */}
              <div className="absolute -top-4 -right-4 z-20">
                <motion.div 
                  initial={{ scale: 0, rotate: 15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="relative"
                >
                  {/* Ribbon 3D Ears */}
                  <div className="absolute -left-2 top-0 w-2 h-4 bg-[#8b0000] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
                  <div className="absolute -right-2 top-0 w-2 h-4 bg-[#8b0000] [clip-path:polygon(0_0,100%_0,0_100%)]" />
                  
                  <div className="bg-[#e31e24] text-white px-6 py-3 rounded-b-xl shadow-xl flex flex-col items-center border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90">Hot Offer</span>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-black">
                        {currentOffer.discount_type === 'percentage' 
                          ? `${currentOffer.discount_value}%` 
                          : `AED ${currentOffer.discount_value}`}
                      </span>
                      <span className="text-xs font-bold uppercase">OFF</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="space-y-2">
                <span className="text-primary font-bold tracking-widest uppercase text-sm block">Limited Time Deal</span>
                <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight italic">
                  {currentOffer.title}
                </h2>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Experience the breathtaking <span className="text-foreground font-bold">{currentOffer.yacht.name}</span> at an exclusive rate. Whether it's a sunset cruise or a private party, this is your moment to sail in luxury.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                <Button asChild className="rounded-full px-10 py-7 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all group">
                  <Link to={`/yachts/${encodeURIComponent(currentOffer.yacht.name)}`} className="flex items-center gap-3">
                    Check Availability
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                {offers.length > 1 && (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {offers.map((_, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            idx === activeIndex ? "w-8 bg-primary" : "w-1.5 bg-gray-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {activeIndex + 1} of {offers.length} Deals
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Button({ className, asChild, children, ...props }: any) {
  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
