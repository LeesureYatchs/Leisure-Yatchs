import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Yacht } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { YachtCard } from '@/components/yacht/YachtCard';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function MoreYachts() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoreYachts();
  }, []);

  const fetchMoreYachts = async () => {
    try {
      // Fetch the next 3 yachts (offset by 3) to show different ones
      const { data, error } = await supabase
        .from('yachts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true }) // Different order to see different yachts
        .limit(3);

      if (error) throw error;
      setYachts(data as Yacht[] || []);
    } catch (error) {
      console.error('Error fetching more yachts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-ocean-light/30">
      <div className="container mx-auto px-4">
        <div className="relative mb-16 flex flex-col md:flex-row items-center justify-center md:justify-between gap-8">
          <div className="hidden md:block w-[180px]" />
          
          <div className="text-center">
            <span className="text-teal font-bold tracking-widest uppercase text-xs md:text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Luxury Selection
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold mt-3 text-foreground tracking-tight">
              Trending Destinations
            </h2>
            <div className="w-20 h-1.5 bg-teal mx-auto mt-6 rounded-full opacity-80" />
          </div>

          <div className="md:w-[180px] flex justify-center md:justify-end">
            <Button asChild variant="outline" className="group rounded-full px-8 border-teal/20 hover:border-teal/50 hover:bg-teal/5">
              <Link to="/yachts" className="flex items-center gap-2">
                Explore All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal" />
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
              Check out our full collection for more options!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
