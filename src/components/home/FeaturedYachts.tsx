import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Yacht } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { YachtCard } from '@/components/yacht/YachtCard';
import { ArrowRight, Loader2 } from 'lucide-react';

export function FeaturedYachts() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedYachts();
  }, []);

  const fetchFeaturedYachts = async () => {
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      
      if (data) {
        // Shuffle and take top 3
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setYachts(shuffled.slice(0, 3) as Yacht[]);
      }
    } catch (error) {
      console.error('Error fetching yachts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 ocean-gradient">
      <div className="container mx-auto px-4">
        <div className="relative mb-16 flex flex-col md:flex-row items-center justify-center md:justify-between gap-8">
          {/* Spacer for desktop symmetry */}
          <div className="hidden md:block w-[180px]" />
          
          <div className="text-center">
            <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm">
              Our Fleet
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold mt-3 text-foreground tracking-tight">
              Featured Yachts
            </h2>
            <div className="w-20 h-1.5 bg-primary mx-auto mt-6 rounded-full opacity-80" />
          </div>

          <div className="md:w-[180px] flex justify-center md:justify-end">
            <Button asChild variant="outline" className="group rounded-full px-8 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
              <Link to="/yachts" className="flex items-center gap-2">
                View All Yachts
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : yachts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {yachts.map((yacht) => (
              <YachtCard key={yacht.id} yacht={yacht} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No yachts available at the moment. Check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
