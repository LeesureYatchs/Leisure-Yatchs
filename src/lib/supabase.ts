import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Type definitions for our database
export interface Yacht {
  id: string;
  name: string;
  feet: number;
  capacity: number;
  cabins: number;
  bedrooms: number;
  restrooms: number;
  hourly_price: number;
  minimum_hours: number;
  description: string | null;
  amenities: string[];
  tour_details: string | null;
  images: string[];
  videos: string[];
  recreation_extras: string[];
  trip_itinerary_ids: string[];
  category: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface TripItinerary {
  id: string;
  duration_label: string;
  route_description: string;
  created_at: string;
}

export interface RecreationExtra {
  id: string;
  name: string;
  created_at: string;
}

export interface Offer {
  id: string;
  yacht_id: string;
  title: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  yacht_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  guests: number;
  event_type: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Amenity {
  id: string;
  name: string;
  created_at: string;
}

export interface YachtCategory {
  id: string;
  name: string;
  created_at: string;
}
