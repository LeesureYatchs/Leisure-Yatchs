import { useEffect, useState } from 'react';
import { supabase, Offer, Yacht } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Tag, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShipLoader from '@/components/ui/ShipLoader';
import { format } from 'date-fns';

type OfferStatus = 'active' | 'inactive';
type DiscountType = 'percentage' | 'fixed';

interface OfferFormData {
  yacht_id: string;
  title: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: OfferStatus;
}

const defaultFormData: OfferFormData = {
  yacht_id: '',
  title: '',
  discount_type: 'percentage',
  discount_value: 10,
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  start_time: '',
  end_time: '',
  status: 'active',
};

export default function AdminOffers() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<(Offer & { yacht?: Yacht })[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();

    // Enable Realtime Subscriptions
    const channel = supabase
      .channel('admin-offers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [offersRes, yachtsRes] = await Promise.all([
        supabase.from('offers').select('*').order('created_at', { ascending: false }),
        supabase.from('yachts').select('*').order('name'),
      ]);

      if (offersRes.error) throw offersRes.error;
      if (yachtsRes.error) throw yachtsRes.error;

      const yachtsData = yachtsRes.data as Yacht[] || [];
      setYachts(yachtsData);

      const offersWithYachts = (offersRes.data as Offer[] || []).map((offer) => ({
        ...offer,
        yacht: yachtsData.find((y) => y.id === offer.yacht_id),
      }));

      setOffers(offersWithYachts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        yacht_id: offer.yacht_id,
        title: offer.title,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        start_date: offer.start_date,
        end_date: offer.end_date,
        start_time: offer.start_time || '',
        end_time: offer.end_time || '',
        status: offer.status,
      });
    } else {
      setEditingOffer(null);
      setFormData({
        ...defaultFormData,
        yacht_id: yachts[0]?.id || '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const offerData = {
        yacht_id: formData.yacht_id,
        title: formData.title,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time || '00:00:00',
        end_time: formData.end_time || '23:59:59',
        status: formData.status,
      };

      if (editingOffer) {
        const { error } = await (supabase as any)
          .from('offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        toast({ title: 'Offer updated successfully' });
      } else {
        const { error } = await (supabase as any).from('offers').insert(offerData);

        if (error) throw error;
        toast({ title: 'Offer created successfully' });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: 'Error saving offer',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Offer deleted successfully' });
      fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Error deleting offer',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this offer?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offer.id);

      if (error) throw error;

      toast({ title: `Offer ${action}d successfully` });
      fetchData();
    } catch (error) {
      console.error(`Error updating offer status:`, error);
      toast({
        title: `Error updating offer status`,
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Offers</h1>
            <p className="text-muted-foreground">Manage special offers and promotions</p>
          </div>
          <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Offer
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[500px] w-full p-0">
             <ScrollArea className="h-full px-6 py-6">
                <SheetHeader className="mb-6">
                    <SheetTitle>
                    {editingOffer ? 'Edit Offer' : 'Add New Offer'}
                    </SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                    <div>
                    <Label>Select Yacht</Label>
                    <Select
                        value={formData.yacht_id}
                        onValueChange={(value) =>
                        setFormData({ ...formData, yacht_id: value })
                        }
                    >
                        <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a yacht" />
                        </SelectTrigger>
                        <SelectContent>
                        {yachts.map((yacht) => (
                            <SelectItem key={yacht.id} value={yacht.id}>
                            {yacht.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>
                    <div>
                    <Label htmlFor="title">Offer Title</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                        }
                        className="mt-1.5"
                        required
                        placeholder="e.g. Summer Special"
                    />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Discount Type</Label>
                        <Select
                        value={formData.discount_type}
                        onValueChange={(value: 'percentage' | 'fixed') =>
                            setFormData({ ...formData, discount_type: value })
                        }
                        >
                        <SelectTrigger className="mt-1.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="discount_value">Discount Value</Label>
                        <Input
                        id="discount_value"
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            discount_value: Number(e.target.value),
                            })
                        }
                        className="mt-1.5"
                        required
                        />
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                            setFormData({ ...formData, start_date: e.target.value })
                        }
                        className="mt-1.5"
                        required
                        />
                    </div>
                    <div>
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                            setFormData({ ...formData, end_date: e.target.value })
                        }
                        className="mt-1.5"
                        required
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="start_time">Start Time (Optional)</Label>
                        <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) =>
                            setFormData({ ...formData, start_time: e.target.value })
                        }
                        className="mt-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 text-primary">Leave empty for 12:00 AM</p>
                    </div>
                    <div>
                        <Label htmlFor="end_time">End Time (Optional)</Label>
                        <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) =>
                            setFormData({ ...formData, end_time: e.target.value })
                        }
                        className="mt-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 text-destructive">Leave empty for 11:59 PM</p>
                    </div>
                    </div>
                    <div>
                    <Label>Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value: OfferStatus) =>
                        setFormData({ ...formData, status: value })
                        }
                    >
                        <SelectTrigger className="mt-1.5">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="flex gap-2 justify-end pt-4 border-t sticky bottom-0 bg-background">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {editingOffer ? 'Update' : 'Create'}
                    </Button>
                    </div>
                </form>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <ShipLoader />
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <Badge
                      variant={offer.status === 'active' ? 'default' : 'secondary'}
                    >
                      {offer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Yacht: {offer.yacht?.name || 'Unknown'}
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {offer.discount_type === 'percentage'
                        ? `${offer.discount_value}% OFF`
                        : `AED ${offer.discount_value} OFF`}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(offer.start_date), 'MMM d, yyyy')} -{' '}
                      {format(new Date(offer.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog(offer)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={offer.status === 'active' ? "text-primary hover:text-primary" : "text-muted-foreground"}
                      onClick={() => handleToggleStatus(offer)}
                    >
                      {offer.status === 'active' ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(offer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Offers Yet</h3>
            <p className="text-muted-foreground mb-4">
              {yachts.length === 0
                ? 'Add yachts first before creating offers'
                : 'Create your first offer to attract customers'}
            </p>
            {yachts.length > 0 && (
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Offer
              </Button>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
