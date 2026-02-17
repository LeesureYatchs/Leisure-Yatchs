import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Check, 
  X, 
  MoreHorizontal, 
  Search, 
  Trash2, 
  Loader2,
  Filter,
  Star,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  yacht: {
    name: string;
  };
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel('admin-reviews-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => fetchReviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          yacht:yachts(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string,  newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Optimistically update local state
      setReviews(prev => prev.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));

      toast({
        title: "Status Updated",
        description: `Review markes as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setReviews(prev => prev.filter(r => r.id !== id));

      toast({
        title: "Review Deleted",
        description: "The review has been permanently removed.",
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive"
      });
    }
  };

  const filteredReviews = reviews.filter(review => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      review.customer_name.toLowerCase().includes(searchLower) ||
      review.comment.toLowerCase().includes(searchLower) ||
      (review.yacht?.name || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
            <p className="text-muted-foreground">
              Manage and moderate customer reviews
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="md:w-48">
             <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <select 
                   className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 appearance-none"
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                   <option value="all">All Status</option>
                   <option value="pending">Pending</option>
                   <option value="approved">Approved</option>
                   <option value="rejected">Rejected</option>
                </select>
             </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Yacht</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                    No reviews found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.customer_name}</TableCell>
                    <TableCell>{review.yacht?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                       <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                          <p className="line-clamp-2 text-sm text-muted-foreground" title={review.comment}>
                             {review.comment}
                          </p>
                       </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {review.status === 'pending' && (
                             <>
                                <DropdownMenuItem onClick={() => updateStatus(review.id, 'approved')} className="text-green-600 focus:text-green-700">
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(review.id, 'rejected')} className="text-red-600 focus:text-red-700">
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                             </>
                          )}
                          {review.status === 'rejected' && (
                             <DropdownMenuItem onClick={() => updateStatus(review.id, 'approved')} className="text-green-600 focus:text-green-700">
                               <Check className="mr-2 h-4 w-4" />
                               Approve
                             </DropdownMenuItem>
                          )}
                          {review.status === 'approved' && (
                             <DropdownMenuItem onClick={() => updateStatus(review.id, 'rejected')} className="text-red-600 focus:text-red-700">
                               <X className="mr-2 h-4 w-4" />
                               Reject
                             </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => deleteReview(review.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
