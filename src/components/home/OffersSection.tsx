import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Offer, Yacht } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent, Tag, ArrowRight, Loader2 } from 'lucide-react';

interface OfferWithYacht extends Offer {
  yacht?: Yacht;
}

export function OffersSection() {
  const [offers, setOffers] = useState<OfferWithYacht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  const fetchActiveOffers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(3);

      if (offersError) throw offersError;

      if (offersData && offersData.length > 0) {
        const yachtIds = offersData.map(o => o.yacht_id);
        const { data: yachtsData, error: yachtsError } = await supabase
          .from('yachts')
          .select('*')
          .in('id', yachtIds);

        if (yachtsError) throw yachtsError;

        const offersWithYachts = offersData.map(offer => ({
          ...offer,
          yacht: yachtsData?.find(y => y.id === offer.yacht_id) as Yacht | undefined,
        }));

        setOffers(offersWithYachts as OfferWithYacht[]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            Special Deals
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 text-foreground">
            Exclusive Offers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="group overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    {offer.discount_type === 'percentage' ? (
                      <Percent className="w-3 h-3 mr-1" />
                    ) : (
                      <Tag className="w-3 h-3 mr-1" />
                    )}
                    {offer.discount_type === 'percentage'
                      ? `${offer.discount_value}% OFF`
                      : `AED ${offer.discount_value} OFF`}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {offer.title}
                </h3>
                {offer.yacht && (
                  <p className="text-muted-foreground text-sm mb-4">
                    On {offer.yacht.name}
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="w-full group">
                  <Link to={offer.yacht ? `/yachts/${encodeURIComponent(offer.yacht.name)}` : '/yachts'}>
                    View Offer
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
