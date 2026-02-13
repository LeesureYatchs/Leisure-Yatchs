import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Yacht, Offer, TripItinerary } from '@/lib/supabase';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { BookingForm } from '@/components/yacht/BookingForm';
import { YachtCard } from '@/components/yacht/YachtCard';
import { CruiseRoutes } from '@/components/yacht/CruiseRoutes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherWidget } from '@/components/yacht/WeatherWidget';
import {
  Users,
  Ruler,
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
  Percent,
  Tag,
  Ship,
  Clock,
} from 'lucide-react';

export default function YachtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [itineraries, setItineraries] = useState<TripItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [relatedYachts, setRelatedYachts] = useState<Yacht[]>([]);

  useEffect(() => {
    if (id) {
      fetchYachtDetails();

      // Enable Realtime Subscriptions for yacht detail
      const channel = supabase
        .channel(`yacht-detail-realtime-${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'yachts', filter: `id=eq.${id}` },
          () => fetchYachtDetails()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'offers', filter: `yacht_id=eq.${id}` },
          () => fetchYachtDetails()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trip_itineraries' },
          () => fetchYachtDetails()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  useEffect(() => {
    if (yacht?.category) {
      fetchRelatedYachts(yacht.category, yacht.id);
    }
  }, [yacht]);

  useEffect(() => {
    if (yacht?.trip_itinerary_ids && yacht.trip_itinerary_ids.length > 0) {
      fetchItineraries(yacht.trip_itinerary_ids);
    }
  }, [yacht]);

  const fetchItineraries = async (ids: string[]) => {
    try {
      const { data, error } = await supabase
        .from('trip_itineraries')
        .select('*')
        .in('id', ids)
        .order('duration_label');

      if (error) throw error;
      setItineraries(data as TripItinerary[] || []);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    }
  };

  const fetchYachtDetails = async () => {
    try {
      const { data: yachtData, error: yachtError } = await supabase
        .from('yachts')
        .select('*, trip_itinerary_ids') // Ensure trip_itinerary_ids is selected
        .eq('id', id)
        .eq('status', 'active')
        .maybeSingle();

      if (yachtError) throw yachtError;
      setYacht(yachtData as Yacht | null);

      if (yachtData) {
        document.title = `${yachtData.name} | Luxury Yacht Rental Dubai | LeisureYatchs`;
        const today = new Date().toISOString().split('T')[0];
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select('*')
          .eq('yacht_id', id)
          .eq('status', 'active')
          .lte('start_date', today)
          .gte('end_date', today)
          .maybeSingle();

        if (!offerError && offerData) {
          setOffer(offerData as Offer);
        }
      }
    } catch (error) {
      console.error('Error fetching yacht:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedYachts = async (category: string, currentId: string) => {
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .neq('id', currentId)
        .limit(4);

      if (error) throw error;
      setRelatedYachts(data as Yacht[] || []);
    } catch (error) {
      console.error('Error fetching related yachts:', error);
    }
  };

  const defaultImages = [
    'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1200&q=80',
  ];

  const images = yacht?.images && yacht.images.length > 0 ? yacht.images : defaultImages;

  if (!loading && !yacht) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Yacht Not Found</h1>
          <Button asChild>
            <Link to="/yachts">Back to Yachts</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Back Button */}
      <div className="pt-24 pb-4 bg-ocean-light">
        <div className="container mx-auto px-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/yachts" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Yachts
            </Link>
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="bg-ocean-light pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-[16/10] lg:aspect-[16/9] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <img
                  src={images[selectedImage]}
                  alt={yacht?.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl" />
                ))
              ) : (
                images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                      selectedImage === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${yacht?.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Yacht Details */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Offer */}
              <div>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-3/4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {yacht?.category && (
                        <Badge variant="outline" className="border-primary text-primary">
                          {yacht.category} Yacht
                        </Badge>
                      )}
                      {offer && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          {offer.discount_type === 'percentage' ? (
                            <Percent className="w-3 h-3 mr-1" />
                          ) : (
                            <Tag className="w-3 h-3 mr-1" />
                          )}
                          {offer.title} -{' '}
                          {offer.discount_type === 'percentage'
                            ? `${offer.discount_value}% OFF`
                            : `AED ${offer.discount_value} OFF`}
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {yacht?.name}
                    </h1>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ruler className="w-5 h-5 text-primary" />
                        <span>{yacht?.feet} ft</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-5 h-5 text-primary" />
                        <span>{yacht?.capacity} Guests</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="w-5 h-5 text-primary" />
                        <span>{yacht?.cabins} Cabins</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {yacht?.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">About This Yacht</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {yacht.description}
                  </p>
                </div>
              )}

              {/* Cruise Routes */}
              <CruiseRoutes />

              {/* Trip Itineraries */}
              {itineraries.length > 0 && (
                <div className="pt-8 border-t space-y-4">
                  <h2 className="text-2xl font-bold mb-4">Hourly Trip Routes</h2>
                  <div className="space-y-4">
                    {itineraries.map((itinerary) => (
                      <div key={itinerary.id} className="p-4 bg-muted/30 rounded-lg border">
                         <div className="flex items-center gap-2 mb-3">
                           <Clock className="w-5 h-5 text-primary" />
                           <h3 className="font-semibold text-lg text-primary">{itinerary.duration_label}</h3>
                         </div>
                         <div className="flex flex-wrap items-center gap-2 text-sm md:text-base leading-relaxed text-muted-foreground">
                            {itinerary.route_description.split(' → ').map((location, index, array) => (
                              <div key={index} className="flex items-center">
                                <span className={index === 0 || index === array.length - 1 ? "font-medium text-foreground" : ""}>
                                  {location}
                                </span>
                                {index < array.length - 1 && (
                                  <Ship className="w-4 h-4 mx-2 text-primary/60" />
                                )}
                              </div>
                            ))}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {yacht?.amenities && yacht.amenities.length > 0 && (
                <div className="pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-6">Features And Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                    {yacht.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-foreground/80 font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recreation & Extras */}
              {yacht?.recreation_extras && yacht.recreation_extras.length > 0 && (
                <div className="pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-6">Recreation & Optional Extras</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                    {yacht.recreation_extras.map((extra, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-foreground/80 font-medium">{extra}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tour Details */}
              {yacht?.tour_details && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tour Details</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {yacht.tour_details}
                  </p>
                </div>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <WeatherWidget />
                
                <div className="bg-white border rounded-2xl p-6 shadow-lg">
                  <div className="mb-6">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <div className="flex items-baseline gap-2">
                      {loading ? (
                        <Skeleton className="h-10 w-32" />
                      ) : offer ? (
                          <>
                          <p className="text-3xl font-bold text-primary">
                            AED {
                              (offer.discount_type === 'percentage'
                                ? (yacht?.hourly_price ?? 0) * (1 - offer.discount_value / 100)
                                : Math.max(0, (yacht?.hourly_price ?? 0) - offer.discount_value)
                              ).toLocaleString()
                            }
                            <span className="text-base font-normal text-muted-foreground">
                              /hour
                            </span>
                          </p>
                          <p className="text-lg text-muted-foreground line-through decoration-red-500">
                            AED {yacht?.hourly_price.toLocaleString()}
                          </p>
                          </>
                      ) : (
                        <p className="text-3xl font-bold text-primary">
                          AED {yacht?.hourly_price.toLocaleString()}
                          <span className="text-base font-normal text-muted-foreground">
                            /hour
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : showBookingForm && yacht ? (
                    <BookingForm
                      yachtId={yacht.id}
                      yachtName={yacht.name}
                      hourlyPrice={
                        offer
                          ? offer.discount_type === 'percentage'
                            ? yacht.hourly_price * (1 - offer.discount_value / 100)
                            : Math.max(0, yacht.hourly_price - offer.discount_value)
                          : yacht.hourly_price
                      }
                      originalPrice={offer ? yacht.hourly_price : undefined}
                      maxCapacity={yacht.capacity}
                      onCancel={() => setShowBookingForm(false)}
                    />
                  ) : (
                    <Button
                      onClick={() => setShowBookingForm(true)}
                      className="w-full"
                      disabled={!yacht}
                      size="lg"
                    >
                      Check Availability
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Yachts Section */}
      {relatedYachts.length > 0 && (
        <section className="py-16 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  View Other {yacht.category} Yachts In Dubai
                </h2>
                <p className="text-muted-foreground">
                  Explore similar luxury experiences in our {yacht.category} collection
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/yachts" className="flex items-center gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedYachts.map((relatedYacht) => (
                <YachtCard key={relatedYacht.id} yacht={relatedYacht} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
