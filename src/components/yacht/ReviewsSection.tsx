import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star, StarHalf, Loader2, User, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsSectionProps {
  yachtId: string;
}

export function ReviewsSection({ yachtId }: ReviewsSectionProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  
  // Form State
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [yachtId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('yacht_id', yachtId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          yacht_id: yachtId,
          customer_name: name,
          rating,
          comment,
          status: 'pending' // Reviews require approval
        });

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review will be visible once approved.",
      });

      // Reset form
      setName('');
      setRating(5);
      setComment('');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="bg-muted/30 p-6 rounded-xl border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">{review.customer_name}</h4>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {renderStars(review.rating)}
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed text-sm">
        "{review.comment}"
      </p>
    </div>
  );

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'positive') return review.rating >= 3;
    if (filter === 'negative') return review.rating < 3;
    return true;
  });

  return (
    <div className="py-8 border-t">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold">Guest Reviews</h2>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs h-8"
          >
            All
          </Button>
          <Button
            variant={filter === 'positive' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('positive')}
            className="text-xs h-8 text-green-600"
          >
            Positive
          </Button>
          <Button
            variant={filter === 'negative' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('negative')}
            className="text-xs h-8 text-red-600"
          >
            Negative
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Reviews List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredReviews.length > 0 ? (
            <>
              {/* Show only first 3 filtered reviews */}
              {filteredReviews.slice(0, 3).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              
              {/* View More Button */}
              {filteredReviews.length > 3 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      View all {filteredReviews.length} reviews
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>All {filter !== 'all' ? filter : ''} Reviews ({filteredReviews.length})</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {filteredReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} reviews found.</p>
            </div>
          )}
        </div>

        {/* Review Form */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit sticky top-28">
          <h3 className="text-xl font-bold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="John Doe"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Your Experience</Label>
              <Textarea 
                id="comment" 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Tell us about your trip..."
                required
                className="mt-1.5"
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
