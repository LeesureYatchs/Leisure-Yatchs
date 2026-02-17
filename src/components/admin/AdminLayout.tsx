import { ReactNode, useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Anchor,
  LayoutDashboard,
  Ship,
  Tag,
  Calendar,
  LogOut,
  Loader2,
  Menu,
  X,
  Route,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ShipLoader from '@/components/ui/ShipLoader';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/yachts', label: 'Yachts', icon: Ship },
  { href: '/admin/trip-itineraries', label: 'Trip Itineraries', icon: Route },
  { href: '/admin/offers', label: 'Offers', icon: Tag },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/enquiries', label: 'Enquiries', icon: Mail },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingEnquiriesCount, setPendingEnquiriesCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  useEffect(() => {
    fetchPendingCounts();

    // Subscribe to booking, enquiry, and review changes
    const bookingsChannel = supabase
      .channel('bookings-count-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchPendingCounts()
      )
      .subscribe();

    const enquiriesChannel = supabase
      .channel('enquiries-count-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries' },
        () => fetchPendingCounts()
      )
      .subscribe();

    const reviewsChannel = supabase
      .channel('reviews-count-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => fetchPendingCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(enquiriesChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, []);

  const fetchPendingCounts = async () => {
    // Fetch bookings count
    const { count: bCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingBookingsCount(bCount || 0);

    // Fetch enquiries count
    const { count: eCount } = await supabase
      .from('enquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingEnquiriesCount(eCount || 0);

    // Fetch reviews count
    const { count: rCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingReviewsCount(rCount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ShipLoader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access the admin portal.
        </p>
        <Button asChild>
          <Link to="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img src="/leisureyatch.png" alt="LeisureYatchs" className="h-8 w-auto object-contain" />
          <span className="font-bold text-lg">Admin</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white border-r z-40 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b hidden lg:block">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <img src="/leisureyatch.png" alt="LeisureYatchs" className="h-10 w-auto object-contain" />
            <span className="font-bold text-xl">LeisureYatchs</span>
          </Link>
        </div>

        <nav className="p-4 mt-16 lg:mt-0 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Bookings' && pendingBookingsCount > 0 && (
                <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">
                   {pendingBookingsCount}
                </span>
              )}
              {item.label === 'Enquiries' && pendingEnquiriesCount > 0 && (
                <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">
                   {pendingEnquiriesCount}
                </span>
              )}
              {item.label === 'Reviews' && pendingReviewsCount > 0 && (
                <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">
                   {pendingReviewsCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t text-center">
          <Button
            variant="outline"
            className="w-full justify-start text-slate-600 border-slate-200 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all duration-300 group shadow-sm"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Sign Out</span>
          </Button>
          <p className="text-xs text-muted-foreground/50 mt-2">Version 1.0</p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
