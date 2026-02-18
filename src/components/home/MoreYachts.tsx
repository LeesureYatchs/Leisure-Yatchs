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
      const { data, error } = await supabase
        .from('yachts')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      
      const yachtData = (data as Yacht[]) || [];
      if (yachtData.length > 0) {
        // Group by category and pick one random from each
        const luxury = yachtData.filter(y => y.category === 'Luxury').sort(() => 0.5 - Math.random())[0];
        const premium = yachtData.filter(y => y.category === 'Premium').sort(() => 0.5 - Math.random())[0];
        const superY = yachtData.filter(y => y.category === 'Super').sort(() => 0.5 - Math.random())[0];

        // Combine only the ones that exist
        const selected = [luxury, premium, superY].filter(Boolean) as Yacht[];
        
        // If we have fewer than 3 (categories might be empty), fill with other random active yachts
        if (selected.length < 3) {
          const remaining = yachtData.filter(y => !selected.find(s => s.id === y.id))
            .sort(() => 0.5 - Math.random());
          selected.push(...remaining.slice(0, 3 - selected.length));
        }

        setYachts(selected);
      }
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
