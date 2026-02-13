import { useState, useMemo, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const EVENT_TYPES = [
  'Corporate Event',
  'F1 Grand Prix',
  "New Year's Eve",
  'Fishing Trip',
  'Watersports Activities',
  'Marriage Proposal',
  'Birthday Celebration',
  'Anniversary Cruise',
  'Romantic Dinner',
  'General Event',
];

interface BookingFormProps {
  yachtId: string;
  yachtName: string;
  hourlyPrice: number;
  originalPrice?: number;
  maxCapacity: number;
  minimumHours: number;
  onCancel: () => void;
}

export function BookingForm({ yachtId, yachtName, hourlyPrice, originalPrice, maxCapacity, minimumHours, onCancel }: BookingFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'check' | 'form' | 'success'>('check');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [durationHours, setDurationHours] = useState(minimumHours);
  const [startTime, setStartTime] = useState('10:00');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 1,
    eventType: 'General Event',
    message: '',
  });
  const [dateBookings, setDateBookings] = useState<{ start_time: string; end_time: string }[]>([]);

  useEffect(() => {
    if (date) {
      fetchDateBookings();

      const channel = supabase
        .channel(`yacht-daily-availability-${yachtId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `yacht_id=eq.${yachtId}` },
          () => fetchDateBookings()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setDateBookings([]);
    }
  }, [date]);

  const fetchDateBookings = async () => {
    if (!date) return;
    try {
      const bookingDate = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('yacht_id', yachtId)
        .eq('booking_date', bookingDate)
        .in('status', ['confirmed', 'pending'])
        .order('start_time');

      if (!error && data) {
        setDateBookings(data);
      }
    } catch (error) {
      console.error('Error fetching day bookings:', error);
    }
  };

  const endTime = useMemo(() => {
    const [h, m] = startTime.split(':').map(Number);
    const endH = (h + durationHours) % 24;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, [startTime, durationHours]);

  const totalAmount = hourlyPrice * durationHours;
  const originalTotal = originalPrice ? originalPrice * durationHours : null;

  const checkAvailability = async () => {
    if (!date) {
      toast({ title: 'Please select a date', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const bookingDate = format(date, 'yyyy-MM-dd');
      // Fetch both confirmed and pending bookings to be safe
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('yacht_id', yachtId)
        .eq('booking_date', bookingDate)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      // Find the specific conflicting booking
      const conflict = existingBookings?.find((booking) => {
        return startTime < booking.end_time && endTime > booking.start_time;
      });

      if (conflict) {
        // Calculate a suggestion (1 hour after the current booking ends for preparation/cleaning)
        const [hours, minutes] = conflict.end_time.split(':').map(Number);
        const suggestedH = (hours + 1) % 24;
        const suggestion = `${String(suggestedH).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        toast({
          title: 'Time slot unavailable',
          description: `This yacht is already booked from ${conflict.start_time} to ${conflict.end_time}. To allow for cleaning and preparation, we suggest booking from ${suggestion} onwards.`,
          variant: 'destructive',
          duration: 7000,
        });
      } else {
        setStep('form');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast({ title: 'Error checking availability', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !formData.name || !formData.email || !formData.phone) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (formData.guests > maxCapacity) {
      toast({ title: `Maximum ${maxCapacity} guests allowed`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        yacht_id: yachtId,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        message: formData.message || null,
        booking_date: format(date, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        duration_hours: durationHours,
        total_amount: totalAmount,
        guests: formData.guests,
        event_type: formData.eventType,
        status: 'pending',
      });

      if (error) throw error;

      setStep('success');
      
      // Send email notification to Admin
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID, // Admin Template
          {
            to_email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@leisureyachts.com',
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone,
            yacht_name: yachtName,
            booking_date: format(date, 'PPP'),
            start_time: startTime,
            end_time: endTime,
            duration_hours: durationHours,
            guests: formData.guests,
            total_amount: totalAmount,
            event_type: formData.eventType,
            message: formData.message || 'No additional message',
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (adminEmailError) {
        console.error('Failed to send admin email:', adminEmailError);
      }

      // Send email notification to Customer
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID, // Customer Template
          {
            to_email: formData.email,
            customer_name: formData.name,
            yacht_name: yachtName,
            booking_date: format(date, 'PPP'),
            start_time: startTime,
            end_time: endTime,
            duration_hours: durationHours,
            total_amount: totalAmount,
            guests: formData.guests,
            event_type: formData.eventType,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (emailError) {
        console.error('Failed to send customer email:', emailError);
      }

      toast({
        title: 'Booking request submitted!',
        description: 'Our team will contact you shortly. Once we confirm your booking, you will receive a confirmation email.',
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({ title: 'Error submitting booking', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Booking Request Sent!</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Our team will contact you shortly. Thank you for choosing {yachtName}. Once your request is confirmed, a confirmation email will be sent to your inbox.
        </p>
        <Button variant="outline" onClick={onCancel}>Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {step === 'check' ? 'Check Availability' : 'Complete Booking'}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 'check' && (
        <div className="space-y-4">
          <div>
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal mt-1.5', !date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (Hours)</Label>
            <Select value={String(durationHours)} onValueChange={(v) => setDurationHours(Number(v))}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 - minimumHours + 1 }, (_, i) => i + minimumHours).map((h) => (
                  <SelectItem key={h} value={String(h)}>{h} {h === 1 ? 'hour' : 'hours'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">End Time:</span>
            <span className="font-medium">{endTime}</span>
          </div>

          {date && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Already Booked Slots</Label>
              <div className="flex flex-wrap gap-2">
                {dateBookings.length > 0 ? (
                  dateBookings.map((b, i) => (
                    <div key={i} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-medium">
                      {b.start_time} - {b.end_time}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-green-600 font-medium">Full day available</div>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">AED {totalAmount.toLocaleString()}</span>
                {originalTotal && (
                  <span className="text-sm text-muted-foreground line-through decoration-red-500">
                    AED {originalTotal.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AED {hourlyPrice.toLocaleString()}/hr × {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
            </p>
          </div>

          <Button onClick={checkAvailability} className="w-full" disabled={loading || !date}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Check Availability
          </Button>
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-primary/5 rounded-lg text-sm">
            <p className="font-medium text-primary">Available!</p>
            <p className="text-muted-foreground">
              {date && format(date, 'PPP')} • {startTime} - {endTime} ({durationHours}h)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-semibold text-primary">Total: AED {totalAmount.toLocaleString()}</span>
              {originalTotal && (
                <span className="text-sm text-muted-foreground line-through decoration-red-500">
                  AED {originalTotal.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value.replace(/[0-9]/g, '');
                setFormData({ ...formData, name: val });
              }}
              className="mt-1.5"
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1.5"
              required
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9+]/g, '');
                setFormData({ ...formData, phone: val });
              }}
              className="mt-1.5"
              required
              minLength={7}
              maxLength={15}
              placeholder="+971..."
            />
          </div>

          <div>
            <Label htmlFor="guests">Number of Guests * (max {maxCapacity})</Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={maxCapacity}
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: Math.min(Number(e.target.value), maxCapacity) })}
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label>Event Type *</Label>
            <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="mt-1.5"
              rows={3}
              placeholder="Special requests or questions..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('check')} className="flex-1">
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
