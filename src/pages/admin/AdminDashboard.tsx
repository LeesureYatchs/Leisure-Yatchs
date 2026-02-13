import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Ship, Tag, Calendar, DollarSign, Users, 
  ArrowUpRight, ShoppingBag, PieChart, 
  ChevronRight, Sparkles, Clock
} from 'lucide-react';
import { 
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, 
  CartesianGrid
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import ShipLoader from '@/components/ui/ShipLoader';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalYachts: number;
  activeOffers: number;
  pendingBookings: number;
  totalBookings: number;
  totalRevenue: number;
  todayRevenue: number;
  thisYearRevenue: number;
  monthlyRevenue: { name: string; total: number }[];
  revenueByYacht: { name: string; total: number }[];
  recentBookings: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalYachts: 0,
    activeOffers: 0,
    pendingBookings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    thisYearRevenue: 0,
    monthlyRevenue: [],
    revenueByYacht: [],
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchStats();
    updateGreeting();

    // Enable Realtime Subscriptions
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const fetchStats = async () => {
    try {
      const [yachtsRes, offersRes, bookingsRes] = await Promise.all([
        supabase.from('yachts').select('id, name', { count: 'exact' }),
        supabase
          .from('offers')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),
        supabase
          .from('bookings')
          .select('id, status, total_amount, booking_date, customer_name, yacht_id, created_at')
          .order('created_at', { ascending: false }),
      ]);

      const bookings = bookingsRes.data || [];
      const yachtsData = yachtsRes.data || [];
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
      
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayRevenue = completedBookings
        .filter(b => b.booking_date === todayStr)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const thisYear = new Date().getFullYear();
      const thisYearRevenue = completedBookings
        .filter(b => new Date(b.booking_date).getFullYear() === thisYear)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const yachtRevenueMap: Record<string, number> = {};
      yachtsData.forEach(y => yachtRevenueMap[y.id] = 0);
      completedBookings.forEach(b => {
        if (yachtRevenueMap[b.yacht_id] !== undefined) {
          yachtRevenueMap[b.yacht_id] += (b.total_amount || 0);
        }
      });

      const revenueByYacht = yachtsData.map(y => ({
        name: y.name,
        total: yachtRevenueMap[y.id] || 0
      })).sort((a, b) => b.total - a.total);

      const today = new Date();
      const sixMonthsAgo = subMonths(today, 5);
      const monthsToCheck = eachMonthOfInterval({
        start: startOfMonth(sixMonthsAgo),
        end: endOfMonth(today)
      });

      const monthlyRevenue = monthsToCheck.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthlyTotal = completedBookings
          .filter(b => {
            const bookingDate = new Date(b.booking_date);
            return bookingDate >= monthStart && 
                   bookingDate <= monthEnd;
          })
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        return {
          name: format(month, 'MMM'),
          total: monthlyTotal
        };
      });

      const recentBookings = bookings.slice(0, 5).map(booking => {
         const yacht = yachtsData.find(y => y.id === booking.yacht_id);
         return {
           ...booking,
           yachtName: yacht?.name || 'Unknown Yacht'
         };
      });

      setStats({
        totalYachts: yachtsRes.count || 0,
        activeOffers: offersRes.count || 0,
        pendingBookings,
        totalBookings,
        totalRevenue,
        todayRevenue,
        thisYearRevenue,
        monthlyRevenue,
        revenueByYacht,
        recentBookings,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `AED ${stats.totalRevenue.toLocaleString()}`,
      description: 'Confirmed realized income',
      icon: DollarSign,
      gradient: 'from-blue-600 to-indigo-700',
      iconBg: 'bg-white/20',
      percentage: '+12.5%',
      isPositive: true
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      description: `${stats.pendingBookings} awaiting approval`,
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-teal-700',
      iconBg: 'bg-white/20',
      percentage: '+8.2%',
      isPositive: true
    },
    {
      title: 'Active Fleet',
      value: stats.totalYachts,
      description: 'Yachts ready for booking',
      icon: Ship,
      gradient: 'from-violet-500 to-purple-700',
      iconBg: 'bg-white/20',
      percentage: '+2',
      isPositive: true
    },
    {
      title: 'Active Offers',
      value: stats.activeOffers,
      description: 'Promotions running live',
      icon: Tag,
      gradient: 'from-amber-400 to-orange-600',
      iconBg: 'bg-white/20',
      percentage: 'Live',
      isPositive: true
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <ShipLoader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 relative pb-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest">{greeting}</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 ml-1">
              Admin Overview
            </h2>
            <p className="text-muted-foreground ml-1">
              Real-time analytics and performance tracking
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border rounded-full px-4 py-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {format(new Date(), 'EEEE, MMMM do')}
          </div>
        </div>
        
        {/* Main Metric Cards (Original) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="group relative overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-100", stat.gradient)} />
              <CardContent className="relative p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-3 rounded-2xl backdrop-blur-md shadow-inner", stat.iconBg)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.percentage}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-3xl font-black">{stat.value}</h3>
                  <p className="text-xs text-white/60 font-medium">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Extra: Financial Insights (New) */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold px-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Financial Insights (Today / Year)
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-none shadow-lg bg-white/60 border-slate-100 backdrop-blur-md p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Revenue</p>
                  <h4 className="text-2xl font-black text-slate-900">AED {stats.todayRevenue.toLocaleString()}</h4>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-lg bg-white/60 border-slate-100 backdrop-blur-md p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Month to Date</p>
                  <h4 className="text-2xl font-black text-slate-900">AED {(stats.monthlyRevenue[stats.monthlyRevenue.length - 1]?.total || 0).toLocaleString()}</h4>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-lg bg-white/60 border-slate-100 backdrop-blur-md p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Annual Revenue ({new Date().getFullYear()})</p>
                  <h4 className="text-2xl font-black text-slate-900">AED {stats.thisYearRevenue.toLocaleString()}</h4>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Main Chart Area (Original) */}
          <Card className="col-span-4 border-none shadow-2xl bg-white/80 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Revenue Growth
                </CardTitle>
                <CardDescription>Monthly realized earnings overview</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-muted/50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary" />
                LAST 6 MONTHS
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stats.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `AED ${value > 999 ? value/1000 + 'k' : value}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-2xl border-none bg-slate-900 p-4 shadow-2xl text-white">
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">{payload[0].payload.name}</p>
                            <p className="text-lg font-black text-white">
                              AED {Number(payload[0].value).toLocaleString()}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Social / Recent Events (Original) */}
          <Card className="col-span-3 border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                  <CardDescription>Latest customer bookings</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary gap-1 font-bold">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.recentBookings.length === 0 ? (
                  <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                     <p className="text-sm text-muted-foreground">No recent bookings</p>
                  </div>
                ) : (
                  stats.recentBookings.map((booking, i) => (
                    <div key={booking.id} className="group flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-white shadow-sm flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
                          <span className="text-lg font-black text-slate-700">
                            {booking.customer_name?.[0] || 'C'}
                          </span>
                        </div>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          booking.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-800">{booking.customer_name || 'Guest User'}</p>
                        <p className="text-xs text-muted-foreground truncate font-medium">
                          {booking.yachtName} • {format(new Date(booking.booking_date), 'MMM d')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900">AED {booking.total_amount}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{booking.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extra: Revenue by Yacht (New) */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Ship className="w-5 h-5 text-primary" />
                  Yatch Based Revenue
                </CardTitle>
                <CardDescription>Breakdown of earnings by vessel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.revenueByYacht.length === 0 ? (
                <div className="col-span-full text-center py-10 bg-muted/10 rounded-xl border border-dashed">
                  <p className="text-sm text-muted-foreground">No yacht revenue data available</p>
                </div>
              ) : (
                stats.revenueByYacht.map((yacht, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Ship className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-full">
                        TOP {i + 1}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 truncate">{yacht.name}</h4>
                      <p className="text-2xl font-black text-slate-900">AED {yacht.total.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(yacht.total / (stats.revenueByYacht[0]?.total || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
