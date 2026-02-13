import { useEffect, useState } from 'react';
import { supabase, TripItinerary } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Loader2, Route, X, Ship } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShipLoader from '@/components/ui/ShipLoader';

export default function AdminTripItineraries() {
  const { toast } = useToast();
  const [itineraries, setItineraries] = useState<TripItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<TripItinerary | null>(null);
  
  const [durationLabel, setDurationLabel] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItineraries();

    // Enable Realtime Subscriptions
    const channel = supabase
      .channel('admin-itineraries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_itineraries' },
        () => fetchItineraries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchItineraries = async () => {
    try {
      const { data, error } = await (supabase
        .from('trip_itineraries' as any)
        .select('*')
        .order('duration_label')) as any;
      
      if (error) throw error;
      setItineraries(data as TripItinerary[] || []);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast({
        title: 'Error fetching itineraries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (itinerary?: TripItinerary) => {
    if (itinerary) {
      setEditingItinerary(itinerary);
      setDurationLabel(itinerary.duration_label);
      // Split by ' → ' to get locations, or just use the string as one item if no arrow found
      setLocations(itinerary.route_description ? itinerary.route_description.split(' → ') : []);
    } else {
      setEditingItinerary(null);
      setDurationLabel('');
      setLocations([]);
    }
    setNewLocation('');
    setDialogOpen(true);
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locations.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one location to the route.',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    
    const routeDescription = locations.join(' → ');
    const formData = {
      duration_label: durationLabel,
      route_description: routeDescription,
    };

    try {
      if (editingItinerary) {
        const { error } = await (supabase
          .from('trip_itineraries' as any)
          .update(formData)
          .eq('id', editingItinerary.id)) as any;

        if (error) throw error;
        toast({ title: 'Itinerary updated successfully' });
      } else {
        const { error } = await (supabase
          .from('trip_itineraries' as any)
          .insert(formData)
          .select()) as any;

        if (error) throw error;
        toast({ title: 'Itinerary added successfully' });
      }

      setDialogOpen(false);
      fetchItineraries();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast({
        title: 'Error saving itinerary',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      const { error } = await (supabase
        .from('trip_itineraries' as any)
        .delete()
        .eq('id', id)) as any;

      if (error) throw error;
      toast({ title: 'Itinerary deleted successfully' });
      fetchItineraries();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast({
        title: 'Error deleting itinerary',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trip Itineraries</h1>
            <p className="text-muted-foreground">Manage standard hourly trip routes</p>
          </div>
          <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Itinerary
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[500px] w-full p-0">
               <ScrollArea className="h-full px-6 py-6">
                <SheetHeader className="mb-6">
                    <SheetTitle>
                    {editingItinerary ? 'Edit Itinerary' : 'Add New Itinerary'}
                    </SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                    <div>
                    <Label htmlFor="duration_label">Duration Label</Label>
                    <Input
                        id="duration_label"
                        value={durationLabel}
                        onChange={(e) => setDurationLabel(e.target.value)}
                        className="mt-1.5"
                        required
                        placeholder='e.g. "2 Hours"'
                    />
                    </div>
                    
                    <div>
                    <Label>Route Locations</Label>
                    <div className="space-y-2 mt-1.5">
                        {locations.map((loc, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <span className="flex-1 text-sm font-medium">{loc}</span>
                            {index < locations.length - 1 && (
                                <Ship className="w-3 h-3 text-muted-foreground mx-1" />
                            )}
                            <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveLocation(index)}
                            >
                            <X className="w-4 h-4" />
                            </Button>
                        </div>
                        ))}
                        
                        <div className="flex gap-2 mt-2">
                            <Input
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                                placeholder="Add next location..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLocation();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddLocation} disabled={!newLocation.trim()}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Add locations in order. They will be connected marked with a ship icon.
                        </p>
                    </div>
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
                        {editingItinerary ? 'Update' : 'Create'}
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
        ) : itineraries.length > 0 ? (
          <div className="grid gap-4">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-lg">{itinerary.duration_label}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {itinerary.route_description.split(' → ').map((loc, i, arr) => (
                          <div key={i} className="flex items-center">
                              <span className={i === 0 || i === arr.length - 1 ? "font-medium text-foreground" : ""}>
                                  {loc}
                              </span>
                              {i < arr.length - 1 && (
                                  <Ship className="w-3 h-3 mx-2 text-primary/60" />
                              )}
                          </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(itinerary)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(itinerary.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Route className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Itineraries Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add commonly used trip routes to select them for yachts.
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Itinerary
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
