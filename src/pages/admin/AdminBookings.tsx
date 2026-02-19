import { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { supabase, Booking, Yacht } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Mail, Phone, User, Ship, Clock, Users, Tag, DollarSign, ChevronDown, CheckCircle2, XCircle, ClockIcon, Pencil, Search } from 'lucide-react';
import ShipLoader from '@/components/ui/ShipLoader';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export default function AdminBookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<(Booking & { yacht?: Yacht })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<(Booking & { yacht?: Yacht }) | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    guests: 0,
    duration_hours: 0,
    total_amount: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    fetchBookings();

    // Enable Realtime Subscriptions
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchBookings()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts' },
        () => fetchBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await (supabase as any)
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (bookingsData && bookingsData.length > 0) {
        const yachtIds = [...new Set((bookingsData as any[]).map((b) => b.yacht_id))];
        const { data: yachtsData, error: yachtsError } = await supabase
          .from('yachts')
          .select('*')
          .in('id', yachtIds);

        if (yachtsError) throw yachtsError;

        const sortedBookings = [...(bookingsData as any[])].sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const bookingsWithYachts = sortedBookings.map((booking) => ({
          ...booking,
          yacht: (yachtsData as any[] | null)?.find((y: any) => y.id === (booking as any).yacht_id) as Yacht | undefined,
        }));

        setBookings(bookingsWithYachts as (Booking & { yacht?: Yacht })[]);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: BookingStatus, booking?: Booking & { yacht?: Yacht }) => {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: `Booking ${status}` });

      // Send email to customer and admin if confirmed
      if (status === 'confirmed' && booking) {
        // Payload for email
        const emailParams = {
          to_email: booking.customer_email, // Explicitly for customer
          admin_email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@leisureyachts.com',
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          yacht_name: booking.yacht?.name || 'Leisure Yacht',
          booking_date: format(new Date(booking.booking_date), 'MMM d, yyyy'),
          start_time: booking.start_time,
          end_time: booking.end_time,
          duration_hours: booking.duration_hours,
          guests: booking.guests,
          total_amount: Number(booking.total_amount).toLocaleString(),
        };

        // 1. Send to Customer
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID,
            { ...emailParams, to_email: booking.customer_email },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          );
          console.log('Confirmation email sent to customer');
        } catch (error) {
          console.error('Error sending to customer:', error);
        }

        // 2. Send to Admin (copy)
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID,
            { ...emailParams, to_email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@leisureyachts.com' },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          );
          console.log('Confirmation copy sent to admin');
        } catch (error) {
          console.error('Error sending to admin:', error);
        }
      }

      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({ title: 'Error updating booking', variant: 'destructive' });
    }
  };

  const getStatusStyles = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      
      let duration = (endH + endM/60) - (startH + startM/60);
      if (duration < 0) duration += 24; // Handle overnight bookings
      return Number(duration.toFixed(1));
    } catch (e) {
      return 0;
    }
  };

  const calculateEndTime = (start: string, duration: number) => {
    try {
      const [startH, startM] = start.split(':').map(Number);
      let endTotalMinutes = (startH * 60) + startM + (duration * 60);
      
      let endH = Math.floor(endTotalMinutes / 60) % 24;
      let endM = Math.round(endTotalMinutes % 60);
      
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch (e) {
      return start;
    }
  };

  const openEditDialog = (booking: Booking & { yacht?: Yacht }) => {
    setEditingBooking(booking);
    setEditFormData({
      booking_date: booking.booking_date,
      start_time: booking.start_time.substring(0, 5),
      end_time: booking.end_time.substring(0, 5),
      guests: booking.guests,
      duration_hours: Number(booking.duration_hours),
      total_amount: Number(booking.total_amount)
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = (field: string, value: any) => {
    let newData = { ...editFormData, [field]: value };
    
    // If Duration changes, update End Time
    if (field === 'duration_hours') {
      const newEndTime = calculateEndTime(newData.start_time, Number(value));
      newData.end_time = newEndTime;
    }
    
    // If Start Time changes, update End Time based on existing Duration
    if (field === 'start_time') {
      const newEndTime = calculateEndTime(value, newData.duration_hours);
      newData.end_time = newEndTime;
    }

    // If End Time changes manually, recalculate Duration
    if (field === 'end_time') {
      newData.duration_hours = calculateDuration(newData.start_time, value);
    }
    
    // Always recalculate amount based on final duration
    if (editingBooking?.yacht?.hourly_price) {
      newData.total_amount = newData.duration_hours * Number(editingBooking.yacht.hourly_price);
    }
    
    setEditFormData(newData);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    
    setUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({
          booking_date: editFormData.booking_date,
          start_time: editFormData.start_time,
          end_time: editFormData.end_time,
          duration_hours: editFormData.duration_hours,
          guests: editFormData.guests,
          total_amount: editFormData.total_amount,
        })
        .eq('id', editingBooking.id);

      if (error) throw error;
      
      toast({ title: 'Booking updated successfully' });
      setEditDialogOpen(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({ title: 'Error saving changes', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    const customerMatch = booking.customer_name.toLowerCase().includes(searchLower);
    const yachtMatch = booking.yacht?.name?.toLowerCase().includes(searchLower);
    const dateMatch = format(new Date(booking.booking_date), 'MMM d, yyyy').toLowerCase().includes(searchLower);
    
    return customerMatch || yachtMatch || dateMatch;
  });

  // Calculate pagination
  const totalEntries = filteredBookings.length;
  const totalPages = Math.ceil(totalEntries / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalEntries);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage booking requests</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search customer, yacht, date..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-muted/60"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <ShipLoader />
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-muted/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[200px] font-bold">CUSTOMER</TableHead>
                    <TableHead className="w-[180px] font-bold">YACHT</TableHead>
                    <TableHead className="w-[180px] font-bold">DATE & TIME</TableHead>
                    <TableHead className="w-[120px] font-bold">GUESTS</TableHead>
                    <TableHead className="w-[150px] font-bold">TOTAL AMOUNT</TableHead>
                    <TableHead className="w-[150px] font-bold text-center">STATUS</TableHead>
                    <TableHead className="w-[120px] text-right font-bold">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => (
                    <TableRow key={booking.id} className={cn(
                      "group hover:bg-muted/20 transition-colors",
                      booking.status === 'pending' ? "bg-amber-50/30" : ""
                    )}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate">{booking.customer_name}</span>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span className="truncate">{booking.customer_phone}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4 text-primary/70 shrink-0" />
                          <span className="text-sm font-medium">{booking.yacht?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{booking.event_type}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {booking.start_time} - {booking.end_time} ({booking.duration_hours}h)
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Users className="w-4 h-4 text-primary/70 shrink-0" />
                            {booking.guests} People
                          </div>
                          {booking.event_type.includes('Sharing') && booking.message?.includes('Adults:') && (
                            <div className="text-[10px] text-muted-foreground bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 inline-block w-fit">
                              {(() => {
                                const adultsMatch = booking.message.match(/Adults: (\d+)/);
                                const kidsMatch = booking.message.match(/Kids: (\d+)/);
                                const adults = adultsMatch ? adultsMatch[1] : '0';
                                const kids = kidsMatch ? kidsMatch[1] : '0';
                                return `${adults} A • ${kids} K`;
                              })()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="font-bold text-sm">AED {Number(booking.total_amount).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "h-7 gap-1.5 border px-3 rounded-full text-[10px] font-black transition-all",
                                getStatusStyles(booking.status)
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {booking.status.toUpperCase()}
                              <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px] p-1">
                            <DropdownMenuItem 
                              onClick={() => updateStatus(booking.id, 'pending', booking)}
                              className="gap-2 cursor-pointer text-amber-700 focus:text-amber-700 focus:bg-amber-50 rounded-md"
                            >
                              <ClockIcon className="w-4 h-4" />
                              <span className="text-xs font-semibold">Set Pending</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatus(booking.id, 'confirmed', booking)}
                              className="gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 rounded-md"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-semibold">Confirm Booking</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatus(booking.id, 'cancelled', booking)}
                              className="gap-2 cursor-pointer text-rose-700 focus:text-rose-700 focus:bg-rose-50 rounded-md"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs font-semibold">Cancel Booking</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatus(booking.id, 'completed', booking)}
                              className="gap-2 cursor-pointer text-blue-700 focus:text-blue-700 focus:bg-blue-50 rounded-md"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-semibold">Set Completed</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {booking.status === 'pending' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => openEditDialog(booking)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="w-8 h-8 inline-block" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/5">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{totalEntries > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-foreground">{endIndex}</span> of <span className="font-semibold text-foreground">{totalEntries}</span> entries
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-4 rounded-lg bg-white"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "h-9 w-9 rounded-lg p-0",
                        currentPage === page ? "bg-primary text-primary-foreground shadow-md" : "bg-white"
                      )}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-9 px-4 rounded-lg bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-muted/60 shadow-sm">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Bookings Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No results for "${searchTerm}"` : "New booking requests will appear here."}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSearchTerm('')} 
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
      <Sheet open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <SheetContent className="sm:max-w-[450px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Pencil className="w-6 h-6 text-primary" />
              Edit Booking
            </SheetTitle>
          </SheetHeader>
          
          <form onSubmit={handleUpdateBooking} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Booking Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={editFormData.booking_date}
                  onChange={(e) => handleEditChange('booking_date', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="duration">Duration (Hours)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Input 
                    id="duration" 
                    type="number" 
                    step="0.5"
                    min="1"
                    value={editFormData.duration_hours}
                    onChange={(e) => handleEditChange('duration_hours', Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-2 rounded-md">
                    {editFormData.duration_hours}h Cruise
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime" 
                    type="time" 
                    value={editFormData.start_time}
                    onChange={(e) => handleEditChange('start_time', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time (Auto)</Label>
                  <Input 
                    id="endTime" 
                    type="time" 
                    value={editFormData.end_time}
                    onChange={(e) => handleEditChange('end_time', e.target.value)}
                    className="mt-1 bg-muted/30"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input 
                  id="guests" 
                  type="number" 
                  value={editFormData.guests}
                  onChange={(e) => handleEditChange('guests', Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="pt-4 border-t mt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Updated Amount</p>
                    <p className="text-2xl font-bold text-primary">AED {editFormData.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Rate</p>
                    <p className="font-semibold">{editFormData.duration_hours}h @ AED {editingBooking?.yacht?.hourly_price}/hr</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-background">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={updating}
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
