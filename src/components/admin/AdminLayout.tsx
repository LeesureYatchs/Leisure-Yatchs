import { ReactNode, useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Bell,
  Sparkles,
  Search,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ShipLoader from '@/components/ui/ShipLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

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
  const currentNavItem = navItems.find(item => item.href === location.pathname) || navItems[0];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingEnquiriesCount, setPendingEnquiriesCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingCounts();
    fetchLogs();
    handleDailyGreeting();

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

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setLogs(data);
  };

  const handleDailyGreeting = async () => {
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';
    
    if (hours < 12) greeting = 'Good Morning';
    else if (hours < 17) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';

    const todayStr = format(now, 'yyyy-MM-dd');
    
    // Check if we already sent a greeting today
    const { data: existing } = await supabase
      .from('system_logs')
      .select('*')
      .eq('type', 'greeting')
      .gte('created_at', `${todayStr}T00:00:00Z`)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Send greeting to DB to keep it alive
      await (supabase as any).from('system_logs').insert({
        type: 'greeting',
        message: `${greeting} Admin! System sync successful.`,
      });
      fetchLogs();
    }
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
        <div className="h-24 px-6 border-b hidden lg:flex items-center">
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
        {/* Top Header for Desktop */}
        <header className="hidden lg:flex h-24 bg-white border-b items-center justify-between px-8 gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/10 shadow-sm">
              <currentNavItem.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentNavItem.label}
              </h2>
              <p className="text-xs text-slate-400 font-medium"> Admin Portal / {currentNavItem.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider tabular-nums">
              Sync Active
            </span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors relative group"
            >
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-30"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border z-40 overflow-hidden"
                  >
                    <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                      <h4 className="font-bold text-sm">Notifications</h4>
                      <Badge variant="outline" className="text-[10px]">Recent Activity</Badge>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <div key={log.id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                log.type === 'greeting' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                              )}>
                                {log.type === 'greeting' ? <Sparkles className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-800 leading-tight">
                                  {log.message}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {format(new Date(log.created_at), 'HH:mm • d MMM')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400">
                          <p className="text-xs">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 text-center border-t">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        System Active & Healthy
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">Administrator</p>
              <p className="text-[10px] text-slate-500">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
