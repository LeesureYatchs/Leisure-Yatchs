import { useEffect, useState } from 'react';
import { supabase, Yacht, Amenity, RecreationExtra, TripItinerary } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Ship, Eye, EyeOff, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediaUpload } from '@/components/admin/MediaUpload';
import ShipLoader from '@/components/ui/ShipLoader';

type YachtStatus = 'active' | 'inactive';

interface YachtFormData {
  name: string;
  feet: number;
  capacity: number;
  cabins: number;
  hourly_price: number;
  description: string;
  amenities: string[];
  recreation_extras: string[];
  trip_itinerary_ids: string[];
  tour_details: string;
  images: string[];
  videos: string[];
  status: YachtStatus;
  category?: string;
}

const defaultFormData: YachtFormData = {
  name: '',
  feet: 50,
  capacity: 10,
  cabins: 2,
  hourly_price: 500,
  description: '',
  amenities: [],
  recreation_extras: [],
  trip_itinerary_ids: [],
  tour_details: '',
  images: [],
  videos: [],
  status: 'active',
  category: 'Luxury',
};

export default function AdminYachts() {
  const { toast } = useToast();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [recreationExtras, setRecreationExtras] = useState<RecreationExtra[]>([]);
  const [tripItineraries, setTripItineraries] = useState<TripItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [formData, setFormData] = useState<YachtFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [newRecreationExtra, setNewRecreationExtra] = useState('');
  const [addingAmenity, setAddingAmenity] = useState(false);
  const [addingRecreationExtra, setAddingRecreationExtra] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchYachts();
    fetchAmenities();
    fetchRecreationExtras();
    fetchTripItineraries();

    // Enable Realtime Subscriptions
    const channel = supabase
      .channel('admin-yachts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts' },
        () => fetchYachts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'amenities' },
        () => fetchAmenities()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recreation_extras' },
        () => fetchRecreationExtras()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_itineraries' },
        () => fetchTripItineraries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await (supabase
        .from('amenities' as any)
        .select('*')
        .order('name')) as any;
      
      if (error) throw error;
      setAmenities(data as Amenity[] || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast({
        title: 'Error fetching amenities',
        variant: 'destructive',
      });
    }
  };

  const fetchRecreationExtras = async () => {
    try {
      const { data, error } = await (supabase
        .from('recreation_extras' as any)
        .select('*')
        .order('name')) as any;
      
      if (error) throw error;
      setRecreationExtras(data as RecreationExtra[] || []);
    } catch (error) {
      console.error('Error fetching recreation extras:', error);
      toast({
        title: 'Error fetching recreation extras',
        variant: 'destructive',
      });
    }
  };

  const fetchTripItineraries = async () => {
    try {
      const { data, error } = await (supabase
        .from('trip_itineraries' as any)
        .select('*')
        .order('duration_label')) as any;
      
      if (error) throw error;
      setTripItineraries(data as TripItinerary[] || []);
    } catch (error) {
      console.error('Error fetching trip itineraries:', error);
      toast({
        title: 'Error fetching trip itineraries',
        variant: 'destructive',
      });
    }
  };

  const fetchYachts = async () => {
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setYachts(data as Yacht[] || []);
    } catch (error) {
      console.error('Error fetching yachts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (yacht?: Yacht) => {
    if (yacht) {
      setEditingYacht(yacht);
      setFormData({
        name: yacht.name,
        feet: yacht.feet,
        capacity: yacht.capacity,
        cabins: yacht.cabins,
        hourly_price: yacht.hourly_price,
        description: yacht.description || '',
        amenities: yacht.amenities || [],
        recreation_extras: yacht.recreation_extras || [],
        trip_itinerary_ids: yacht.trip_itinerary_ids || [],
        tour_details: yacht.tour_details || '',
        images: yacht.images || [],
        videos: yacht.videos || [],
        status: yacht.status,
        category: yacht.category || 'Luxury',
      });
    } else {
      setEditingYacht(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleAddAmenity = async () => {
    if (!newAmenity.trim()) return;
    setAddingAmenity(true);
    try {
      const { data, error } = await (supabase
        .from('amenities' as any)
        .insert({ name: newAmenity.trim() })
        .select()
        .single()) as any;

      if (error) throw error;

      setAmenities([...amenities, data as Amenity]);
      setNewAmenity('');
      toast({ title: 'Amenity added successfully' });
    } catch (error) {
      console.error('Error adding amenity:', error);
      toast({
        title: 'Error adding amenity',
        description: 'It might already exist.',
        variant: 'destructive',
      });
    } finally {
      setAddingAmenity(false);
    }
  };

  const handleAddRecreationExtra = async () => {
    if (!newRecreationExtra.trim()) return;
    setAddingRecreationExtra(true);
    try {
      const { data, error } = await (supabase
        .from('recreation_extras' as any)
        .insert({ name: newRecreationExtra.trim() })
        .select()
        .single()) as any;

      if (error) throw error;

      setRecreationExtras([...recreationExtras, data as RecreationExtra]);
      setNewRecreationExtra('');
      toast({ title: 'Extra added successfully' });
    } catch (error) {
      console.error('Error adding extra:', error);
      toast({
        title: 'Error adding extra',
        description: 'It might already exist.',
        variant: 'destructive',
      });
    } finally {
      setAddingRecreationExtra(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const yachtData = {
        name: formData.name,
        feet: formData.feet,
        capacity: formData.capacity,
        cabins: formData.cabins,
        hourly_price: formData.hourly_price,
        description: formData.description || null,
        amenities: formData.amenities,
        recreation_extras: formData.recreation_extras,
        trip_itinerary_ids: formData.trip_itinerary_ids,
        tour_details: formData.tour_details || null,
        images: formData.images,
        videos: formData.videos,
        status: formData.status,
        category: formData.category,
      };

      if (editingYacht) {
        const { error } = await supabase
          .from('yachts')
          .update(yachtData)
          .eq('id', editingYacht.id);

        if (error) throw error;
        toast({ title: 'Yacht updated successfully' });
      } else {
        const { error } = await supabase.from('yachts').insert(yachtData);

        if (error) throw error;
        toast({ title: 'Yacht created successfully' });
      }

      setDialogOpen(false);
      fetchYachts();
    } catch (error) {
      console.error('Error saving yacht:', error);
      toast({
        title: 'Error saving yacht',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this yacht?')) return;

    try {
      const { error } = await supabase.from('yachts').delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Yacht deleted successfully' });
      fetchYachts();
    } catch (error) {
      console.error('Error deleting yacht:', error);
      toast({
        title: 'Error deleting yacht',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (yacht: Yacht) => {
    const newStatus = yacht.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this yacht?`)) return;

    try {
      const { error } = await supabase
        .from('yachts')
        .update({ status: newStatus })
        .eq('id', yacht.id);

      if (error) throw error;
      
      toast({ title: `Yacht ${action}d successfully` });
      fetchYachts();
    } catch (error) {
      console.error(`Error updating yacht status:`, error);
      toast({
        title: `Error updating yacht status`,
        variant: 'destructive',
      });
    }
  };
  
  const toggleAmenity = (amenityName: string) => {
    setFormData((prev) => {
      const current = prev.amenities || [];
      const updated = current.includes(amenityName)
        ? current.filter((a) => a !== amenityName)
        : [...current, amenityName];
      return { ...prev, amenities: updated };
    });
  };

  const toggleRecreationExtra = (extraName: string) => {
    setFormData((prev) => {
      const current = prev.recreation_extras || [];
      const updated = current.includes(extraName)
        ? current.filter((a) => a !== extraName)
        : [...current, extraName];
      return { ...prev, recreation_extras: updated };
    });
  };

  const toggleTripItinerary = (itineraryId: string) => {
    setFormData((prev) => {
      const current = prev.trip_itinerary_ids || [];
      const updated = current.includes(itineraryId)
        ? current.filter((id) => id !== itineraryId)
        : [...current, itineraryId];
      return { ...prev, trip_itinerary_ids: updated };
    });
  };
  
  const filteredYachts = yachts.filter((yacht) =>
    yacht.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Yachts</h1>
            <p className="text-muted-foreground">Manage your yacht fleet</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search yacht name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Yacht
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-[600px] w-full p-0">
                <ScrollArea className="h-full px-6 py-6">
                  <SheetHeader className="mb-6">
                    <SheetTitle>
                      {editingYacht ? 'Edit Yacht' : 'Add New Yacht'}
                    </SheetTitle>
                  </SheetHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Yacht Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="feet">Feet</Label>
                        <Input
                          id="feet"
                          type="number"
                          value={formData.feet}
                          onChange={(e) =>
                            setFormData({ ...formData, feet: Number(e.target.value) })
                          }
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              capacity: Number(e.target.value),
                            })
                          }
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cabins">Cabins</Label>
                        <Input
                          id="cabins"
                          type="number"
                          value={formData.cabins}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cabins: Number(e.target.value),
                            })
                          }
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hourly_price">Hourly Price (AED)</Label>
                          <Input
                            id="hourly_price"
                            type="number"
                            value={formData.hourly_price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                hourly_price: Number(e.target.value),
                              })
                            }
                            className="mt-1.5"
                            required
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData({ ...formData, category: value })
                            }
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Luxury">Luxury</SelectItem>
                              <SelectItem value="Premium">Premium</SelectItem>
                              <SelectItem value="Super">Super</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="mt-1.5"
                        rows={3}
                      />
                    </div>
                    
                    {/* Amenities Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Amenities</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add new amenity" 
                            className="h-8 w-[200px]" 
                            value={newAmenity}
                            onChange={(e) => setNewAmenity(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAmenity();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={handleAddAmenity}
                            disabled={addingAmenity || !newAmenity.trim()}
                          >
                            {addingAmenity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-[200px] overflow-y-auto">
                        {amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`amenity-${amenity.id}`}
                              checked={formData.amenities.includes(amenity.name)}
                              onCheckedChange={() => toggleAmenity(amenity.name)}
                            />
                            <Label
                              htmlFor={`amenity-${amenity.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {amenity.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recreation & Extras Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Recreation & Optional Extras</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add new extra" 
                            className="h-8 w-[200px]" 
                            value={newRecreationExtra}
                            onChange={(e) => setNewRecreationExtra(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddRecreationExtra();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={handleAddRecreationExtra}
                            disabled={addingRecreationExtra || !newRecreationExtra.trim()}
                          >
                            {addingRecreationExtra ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-[200px] overflow-y-auto">
                        {recreationExtras.map((extra) => (
                          <div key={extra.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`extra-${extra.id}`}
                              checked={formData.recreation_extras?.includes(extra.name)}
                              onCheckedChange={() => toggleRecreationExtra(extra.name)}
                            />
                            <Label
                              htmlFor={`extra-${extra.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {extra.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trip Itineraries Selection */}
                    <div>
                      <Label className="mb-2 block">Standard Trip Itineraries</Label>
                      <p className="text-sm text-muted-foreground mb-3">Select the standard trip routes available for this yacht.</p>
                      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg max-h-[200px] overflow-y-auto">
                        {tripItineraries.map((itinerary) => (
                          <div key={itinerary.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`itinerary-${itinerary.id}`}
                              checked={formData.trip_itinerary_ids?.includes(itinerary.id)}
                              onCheckedChange={() => toggleTripItinerary(itinerary.id)}
                            />
                            <div className="grid gap-0.5">
                                <Label
                                  htmlFor={`itinerary-${itinerary.id}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {itinerary.duration_label}
                                </Label>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{itinerary.route_description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tour_details">Tour Details</Label>
                      <Textarea
                        id="tour_details"
                        value={formData.tour_details}
                        onChange={(e) =>
                          setFormData({ ...formData, tour_details: e.target.value })
                        }
                        className="mt-1.5"
                        rows={2}
                      />
                    </div>
                    <MediaUpload
                      bucket="yacht-media"
                      folder="images"
                      accept="image/*"
                      label="Images"
                      existingUrls={formData.images}
                      onChange={(urls) => setFormData({ ...formData, images: urls })}
                      icon="image"
                    />
                    <MediaUpload
                      bucket="yacht-media"
                      folder="videos"
                      accept="video/*"
                      label="Videos"
                      existingUrls={formData.videos}
                      onChange={(urls) => setFormData({ ...formData, videos: urls })}
                      icon="video"
                    />
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: YachtStatus) =>
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
                    <div className="gap-2 pt-4 border-t flex justify-end">
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
                        {editingYacht ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <ShipLoader />
          </div>
        ) : filteredYachts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredYachts.map((yacht) => (
              <Card key={yacht.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={
                      yacht.images?.[0] ||
                      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={yacht.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{yacht.name}</h3>
                    <Badge
                      variant={yacht.status === 'active' ? 'default' : 'secondary'}
                    >
                      {yacht.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {yacht.feet} ft • {yacht.capacity} guests • AED{' '}
                    {yacht.hourly_price}/hr
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog(yacht)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={yacht.status === 'active' ? "text-primary hover:text-primary" : "text-muted-foreground"}
                      onClick={() => handleToggleStatus(yacht)}
                    >
                      {yacht.status === 'active' ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(yacht.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-muted-foreground/30">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-1">No results for "{searchTerm}"</h3>
            <p className="text-muted-foreground mb-4">Try checking for typos or searching a different name.</p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Ship className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Yachts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first yacht to get started
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Yacht
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
