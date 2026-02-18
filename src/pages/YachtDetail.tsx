import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, Yacht, Offer, TripItinerary } from '@/lib/supabase';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { BookingForm } from '@/components/yacht/BookingForm';
import { SEO } from '@/components/SEO';
import { YachtCard } from '@/components/yacht/YachtCard';
import { CruiseRoutes } from '@/components/yacht/CruiseRoutes';
import { RouteMap } from '@/components/yacht/RouteMap';
import { ReviewsSection } from '@/components/yacht/ReviewsSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherWidget } from '@/components/yacht/WeatherWidget';
import {
  Users,
  Ruler,
  Home,
  Bath,
  ArrowLeft,
  ArrowRight,
  Check,
  Percent,
  Tag,
  Ship,
  Clock,
  Play,
  X,
} from 'lucide-react';
import ShipLoader from '@/components/ui/ShipLoader';
import { SocialProofPopup } from '@/components/ui/SocialProofPopup';
import { optimizeImage } from '@/lib/image-optimizer';

export default function YachtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [itineraries, setItineraries] = useState<TripItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [relatedYachts, setRelatedYachts] = useState<Yacht[]>([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [isOfferActive, setIsOfferActive] = useState(false);

  useEffect(() => {
    if (!offer) {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(async () => {
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

      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setIsOfferActive(false);
        setTimeLeft('Expired');
        clearInterval(timer);
        
        // Auto-deactivate in database if still marked active
        if (offer.status === 'active') {
          await (supabase as any)
            .from('offers')
            .update({ status: 'inactive' })
            .eq('id', offer.id);
        }
        return;
      }

      setIsOfferActive(true);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      setTimeLeft(d > 0 ? `Ends in ${d}d ${timeString}` : `Ends in ${timeString}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [offer]);
  /* 
   * Helper to check if a string is a valid UUID 
   */
  const isUUID = (str: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
  };

  useEffect(() => {
    if (id) {
      fetchYachtDetails();
    }
  }, [id]);

  useEffect(() => {
    if (!yacht?.id) return;

    // Enable Realtime Subscriptions for yacht detail using the resolved ID
    const channel = supabase
      .channel(`yacht-detail-realtime-${yacht.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts', filter: `id=eq.${yacht.id}` },
        () => fetchYachtDetails()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers', filter: `yacht_id=eq.${yacht.id}` },
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
  }, [yacht?.id]);
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
    if (!id) return;
    
    try {
      setLoading(true); // Ensure loading state is true when fetching starts
      
      let query = supabase.from('yachts').select('*, trip_itinerary_ids');
      
      if (isUUID(id)) {
        query = query.eq('id', id);
      } else {
        // Assume it's a name, decode it just in case although useParams usually decodes
        query = query.eq('name', decodeURIComponent(id));
      }

      const { data: yachtData, error: yachtError } = await query.eq('status', 'active').maybeSingle();

      if (yachtError) throw yachtError;
      const resolvedYacht = yachtData as Yacht | null;
      setYacht(resolvedYacht);

      if (resolvedYacht) {
        // Title handled by SEO component
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch offer using the RESOLVED yacht ID, not the URL param
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select('*')
          .eq('yacht_id', resolvedYacht.id)
          .eq('status', 'active')
          .gte('end_date', today)
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!offerError && offerData) {
          setOffer(offerData as Offer);
        }

        // Increment view count for analytics
        await (supabase as any).rpc('increment_yacht_views', { yacht_id: resolvedYacht.id });
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
      {yacht && (
        <SEO
          title={`${yacht.name} Rental Dubai | ${yacht.feet}ft Luxury Yacht`}
          description={`${yacht.name} - ${yacht.feet}ft luxury yacht available for charter in Dubai. Capacity: ${yacht.capacity} guests. Features: ${yacht.amenities?.slice(0, 3).join(', ')}. Book now from AED ${yacht.hourly_price}/hour.`}
          image={yacht.images?.[0]}
          url={`/yachts/${yacht.id}`}
        />
      )}
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
            <div className="w-full aspect-[16/10] lg:aspect-[16/9] rounded-2xl overflow-hidden shadow-sm bg-black">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                (() => {
                  const currentMedia = [...images, ...(yacht?.videos || [])][selectedImage];
                  const isVideo = yacht?.videos?.includes(currentMedia);
                  
                  if (isVideo) {
                    return (
                      <div 
                        className="w-full h-full relative group cursor-pointer"
                        onClick={() => setIsVideoModalOpen(true)}
                      >
                         {/* Video Thumbnail Placeholder (using yacht image as bg if available or black) */}
                         <div className="absolute inset-0 bg-black flex items-center justify-center">
                            <Play className="w-20 h-20 text-white opacity-80 group-hover:scale-110 transition-transform" />
                         </div>
                         {/* Use the first image as a background if available for better aesthetics */}
                         {images[0] && (
                           <img 
                              src={images[0]} 
                              className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" 
                              alt="Video Background"
                           />
                         )}
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                              <Play className="w-10 h-10 text-white fill-current ml-1" />
                            </div>
                         </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      className="w-full h-full cursor-zoom-in group relative"
                      onClick={() => setIsVideoModalOpen(true)}
                    >
                      <img
                        src={optimizeImage(currentMedia, 1200)}
                        alt={yacht?.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md p-3 rounded-full transition-opacity">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Media Modal (Images & Videos) */}
            <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
              <DialogContent className="max-w-full h-full p-0 bg-slate-950/98 border-none flex flex-col items-center justify-center">
                 {(() => {
                    const allMedia = [...images, ...(yacht?.videos || [])];
                    const currentMedia = allMedia[selectedImage];
                    const isVideo = yacht?.videos?.includes(currentMedia);
                    
                    return (
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        {/* Close Button */}
                        <button 
                          onClick={() => setIsVideoModalOpen(false)}
                          className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors"
                        >
                          <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Navigation: Previous */}
                        {allMedia.length > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage((prev) => (prev - 1 + allMedia.length) % allMedia.length);
                            }}
                            className="absolute left-6 z-50 p-4 bg-white/10 hover:bg-primary/80 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                          >
                            <ArrowLeft className="w-6 h-6" />
                          </button>
                        )}

                        {/* Navigation: Next */}
                        {allMedia.length > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage((prev) => (prev + 1) % allMedia.length);
                            }}
                            className="absolute right-6 z-50 p-4 bg-white/10 hover:bg-primary/80 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                          >
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        )}

                        {/* Content Body */}
                        <div className="w-full max-w-5xl max-h-[85vh] flex items-center justify-center">
                          {isVideo ? (
                             currentMedia.includes('youtube') || currentMedia.includes('youtu.be') ? (
                                <iframe
                                  key={currentMedia}
                                  src={`${currentMedia.replace('watch?v=', 'embed/')}?autoplay=1`}
                                  className="w-full aspect-video rounded-xl shadow-2xl"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                             ) : (
                                <video 
                                  key={currentMedia}
                                  controls 
                                  autoPlay
                                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                                >
                                  <source src={currentMedia} />
                                </video>
                             )
                          ) : (
                            <motion.img 
                              key={currentMedia}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              src={currentMedia} 
                              alt="Yacht Preview" 
                              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl shadow-primary/10"
                            />
                          )}
                        </div>

                        {/* Counter (Optional but clean) */}
                        <div className="absolute bottom-10 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/50 text-xs font-black tracking-widest uppercase">
                          {selectedImage + 1} / {allMedia.length}
                        </div>
                      </div>
                    );
                 })()}
              </DialogContent>
            </Dialog>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl" />
                ))
              ) : (
                [...images, ...(yacht?.videos || [])].map((media, index) => {
                  const isVideo = yacht?.videos?.includes(media);
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 transition-all snap-start relative ${
                        selectedImage === index
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-primary/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isVideo ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-80" />
                        </div>
                      ) : (
                        <img
                          src={optimizeImage(media, 400)}
                          alt={`${yacht?.name} ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Yacht Details */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Offer (Mobile: Hidden, showed in Sidebar; OR keep duplicate? No, sidebar moves to top) */}
              
              {/* ... Title Logic ... */}
              {/* Note: Title is inside Main Content. If we reverse main cols, Sidebar is Top. Title is in Main (Bottom). 
                  This puts Title BELOW the Booking Form. 
                  Is this desired? "check avalibily ... last ah iurkku ... atha mela kondu po".
                  Yes, usually Booking Form / Price is key.
                  But Name/Title is also key. 
                  If Sidebar is first, user sees "Book Now" before "Yacht Name". 
                  Ideally: Name -> Booking -> Description.
                  
                  Sidebar contains: WeatherWidget, BookingForm (with Price).
                  BookingForm has Price.
                  
                  If I move Sidebar to top:
                  Mobile:
                  1. Weather
                  2. Booking Form (Price + Button)
                  3. Main Content (Name, Specs, Description...)
                  
                  This seems acceptable for "Availability on top".
               */}

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
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bath className="w-5 h-5 text-primary" />
                        <span>{yacht?.restrooms} Restrooms</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {yacht?.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">About This Yacht</h2>
                  <p className="text-muted-foreground leading-relaxed text-justify">
                    {yacht.description}
                  </p>
                </div>
              )}

              {/* Interactive Route Map & Cruise Routes */}
              <div className="flex flex-col-reverse lg:block">
                 <CruiseRoutes />
                 <div className="mb-8 lg:mb-0 lg:mt-8">
                    <h2 className="text-xl font-semibold mb-4">Interactive Route Map</h2>
                    <div className="h-[400px] w-full rounded-2xl overflow-hidden">
                        <RouteMap />
                    </div>
                 </div>
              </div>

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

                  {/* Reviews Section */}
              {yacht && <ReviewsSection yachtId={yacht.id} />}
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                
                <WeatherWidget />

                {/* Dynamic Offer Countdown Timer */}
                {offer && isOfferActive && (
                   <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl p-3 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700 mb-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 animate-pulse" />
                            <span className="font-bold text-sm">Limited Time Offer!</span>
                         </div>
                         <div className="font-mono font-bold text-lg tracking-wider">
                           {timeLeft}
                         </div>
                      </div>
                      <p className="text-[10px] text-white/90 mt-1 text-center">
                         Book now to save {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `AED ${offer.discount_value}`}
                      </p>
                   </div>
                )}

                {/* Demand Notification - Randomized based on Yacht ID */}
                {(() => {
                   // Generate a consistent random number (2-8) based on yacht ID
                   const viewerCount = yacht ? (yacht.id.charCodeAt(0) % 7) + 2 : 3;
                   const isHot = viewerCount > 5;
                   
                   return (
                    <div className={`border rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 ${
                       isHot ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <div className="relative">
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                             isHot ? 'bg-red-500' : 'bg-amber-500'
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                             isHot ? 'bg-red-600' : 'bg-amber-600'
                          }`}></span>
                        </span>
                        <Users className={`w-5 h-5 ${isHot ? 'text-red-600' : 'text-amber-600'}`} />
                      </div>
                      <p className="text-xs font-medium">
                        <span className="font-bold">{isHot ? 'High Demand!' : 'Popular!'}</span> {viewerCount} people are looking at this yacht right now.
                      </p>
                    </div>
                   );
                })()}
                
                <div className="bg-white border rounded-2xl p-6 shadow-lg relative overflow-hidden">
                  <div className="mb-6">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    
                    <div className="flex items-baseline gap-2">
                      {loading ? (
                        <Skeleton className="h-10 w-32" />
                      ) : (offer && isOfferActive) ? (
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
                        (offer && isOfferActive)
                          ? offer.discount_type === 'percentage'
                            ? yacht.hourly_price * (1 - offer.discount_value / 100)
                            : Math.max(0, yacht.hourly_price - offer.discount_value)
                          : yacht.hourly_price
                      }
                      originalPrice={(offer && isOfferActive) ? yacht.hourly_price : undefined}
                      maxCapacity={yacht.capacity}
                      minimumHours={yacht.minimum_hours || 2}
                      onCancel={() => setShowBookingForm(false)}
                    />
                  ) : (
                    <Button
                      onClick={() => setShowBookingForm(true)}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                      disabled={!yacht}
                      size="lg"
                    >
                      Check Availability
                    </Button>
                  )}
                  
                  {/* Payment icons removed as per user request (Cash/Pay later model) */}
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
                <div key={relatedYacht.id} className="group perspective-1000">
                  <div className="transition-transform duration-500 transform group-hover:rotate-y-2 group-hover:scale-105 preserve-3d">
                    <YachtCard yacht={relatedYacht} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof Notification */}
      <SocialProofPopup />
    </PublicLayout>
  );
}
