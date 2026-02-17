
import React, { useState, useEffect } from 'react';
import { CheckCircle2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export const SocialProofPopup = () => {
  const [visible, setVisible] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [realBookings, setRealBookings] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real bookings from Supabase via Secure RPC Function
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_social_proof_bookings');

        if (!error && data && data.length > 0) {
           const formatted = data.map((b: any) => ({
             name: b.customer_name ? `${b.customer_name.split(' ')[0]} ${b.customer_name.split(' ')[1]?.[0] || ''}.` : 'Guest',
             location: b.location || 'Dubai Marina',
             yacht: b.yacht_name || 'Luxury Yacht',
             time: b.created_at ? formatDistanceToNow(new Date(b.created_at), { addSuffix: true }).replace('about ', '') : 'recently'
           }));
           setRealBookings(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch social proof:', err);
      }
    };

    fetchBookings();

    // Show first popup shortly after load (only if data exists)
    const initialTimer = setTimeout(() => {
       showRandomBooking();
    }, 5000);

    // Loop interval
    const interval = setInterval(() => {
      showRandomBooking();
    }, 20000); 

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [realBookings.length]); // Depend on length only

  const showRandomBooking = () => {
    if (realBookings.length === 0) return;
    
    const randomBooking = realBookings[Math.floor(Math.random() * realBookings.length)];
    
    setBooking(randomBooking);
    setVisible(true);
    
    setTimeout(() => {
      setVisible(false);
    }, 5000);
  };

  if (!visible || !booking) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500 pointer-events-none">
      <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3 flex items-center gap-3 pr-6 max-w-sm pointer-events-auto">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0 relative">
           <User className="w-5 h-5 text-green-600" />
           <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
             <CheckCircle2 className="w-4 h-4 text-green-500 fill-white" />
           </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-800">
            <span className="font-bold">{booking.name}</span> from {booking.location}
          </p>
          <p className="text-[10px] text-slate-500">
            booked <span className="text-primary font-semibold">{booking.yacht}</span> • {booking.time}
          </p>
        </div>
      </div>
    </div>
  );
};
