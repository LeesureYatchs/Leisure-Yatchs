import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Ship, Tag, Calendar, DollarSign, Users, 
  ArrowUpRight, ShoppingBag, PieChart as LucidePieChart, 
  ChevronRight, Sparkles, Clock
} from 'lucide-react';
import { 
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar
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
  statusDistribution: { name: string; value: number }[];
  topViewedYachts: { name: string; views: number }[];
  eventTypePopularity: { name: string; count: number }[];
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
    statusDistribution: [],
    topViewedYachts: [],
    eventTypePopularity: [],
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

    // Enable 3-second polling as requested for live data
    const pollingInterval = setInterval(() => {
      fetchStats();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
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
        (supabase as any).rpc('get_yachts_with_views'), // Using fallback to standard select if rpc fails below
        (supabase as any)
          .from('offers')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),
        (supabase as any)
          .from('bookings')
          .select('id, status, total_amount, booking_date, customer_name, yacht_id, created_at, event_type')
          .order('created_at', { ascending: false }),
      ]);

      // Fallback for yachts if RPC isn't applied yet
      let yachtsData = (yachtsRes.data || []) as any[];
      if (!yachtsRes.data) {
        const { data } = await (supabase as any).from('yachts').select('id, name, views_count');
        yachtsData = (data || []) as any[];
      }

      const bookings = (bookingsRes.data || []) as any[];
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
      
      const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      // Status Distribution
      const statusCounts: Record<string, number> = {};
      bookings.forEach(b => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }));

      // Event Type Popularity
      const eventCounts: Record<string, number> = {};
      bookings.forEach(b => {
        if (b.event_type) {
          eventCounts[b.event_type] = (eventCounts[b.event_type] || 0) + 1;
        }
      });
      const eventTypePopularity = Object.entries(eventCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top Viewed Yachts
      const topViewedYachts = [...yachtsData]
        .map(y => ({ name: y.name, views: y.views_count || 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

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
      })).sort((a, b) => b.total - a.total).slice(0, 5);

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
        totalYachts: yachtsData.length,
        activeOffers: offersRes.count || 0,
        pendingBookings,
        totalBookings,
        totalRevenue,
        todayRevenue,
        thisYearRevenue,
        monthlyRevenue,
        revenueByYacht,
        recentBookings,
        statusDistribution,
        topViewedYachts,
        eventTypePopularity,
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
          {/* Main Chart Area */}
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

          {/* Booking Status Distribution */}
          <Card className="col-span-3 border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                   <LucidePieChart className="w-5 h-5 text-primary" />
                   Booking Status
                </CardTitle>
                <CardDescription>Current state of all requests</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-0">
               <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
               <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  {stats.statusDistribution.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                       <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'][i % 4] }} />
                       {s.name} ({s.value})
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7 mt-8">
           {/* Event Popularity */}
           <Card className="col-span-3 border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader>
               <CardTitle className="text-xl font-bold">Popular Events</CardTitle>
               <CardDescription>Most requested trip types</CardDescription>
            </CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.eventTypePopularity} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </CardContent>
           </Card>

           {/* Top Viewed Yachts */}
           <Card className="col-span-4 border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                     <Users className="w-5 h-5 text-primary" />
                     Popularity Track
                  </CardTitle>
                  <CardDescription>Most visited yacht pages</CardDescription>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                   Live Views
                </div>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                   {stats.topViewedYachts.map((yacht, i) => (
                     <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                           #{i+1}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold text-slate-700">{yacht.name}</span>
                              <span className="text-xs font-black text-slate-900">{yacht.views} views</span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary/70" 
                                style={{ width: `${(yacht.views / (stats.topViewedYachts[0]?.views || 1)) * 100}%` }}
                              />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Revenue by Yacht */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Ship className="w-5 h-5 text-primary" />
                  Value by Yacht
                </CardTitle>
                <CardDescription>Vessel performance by total income</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
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
                      <h4 className="font-bold text-slate-800 truncate text-sm">{yacht.name}</h4>
                      <p className="text-xl font-black text-slate-900">AED {yacht.total.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
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

        {/* Recent Activity Table (Moved to bottom) */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden mt-8">
           <CardHeader>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">Recent Bookings</CardTitle>
                    <CardDescription>Latest customer requests summary</CardDescription>
                 </div>
                 <Button variant="outline" size="sm" className="font-bold">View List</Button>
              </div>
           </CardHeader>
           <CardContent>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead>
                       <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 px-2">Customer</th>
                          <th className="pb-3 px-2">Yacht</th>
                          <th className="pb-3 px-2">Date</th>
                          <th className="pb-3 px-2">Total</th>
                          <th className="pb-3 px-2">Status</th>
                       </tr>
                    </thead>
                    <tbody>
                       {stats.recentBookings.map((b, i) => (
                         <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                            <td className="py-4 px-2 font-bold text-slate-700">{b.customer_name}</td>
                            <td className="py-4 px-2 text-slate-600 font-medium">{b.yachtName}</td>
                            <td className="py-4 px-2 text-slate-500 font-mono text-xs">{format(new Date(b.booking_date), 'MMM d, yyyy')}</td>
                            <td className="py-4 px-2 font-black text-slate-900">AED {b.total_amount}</td>
                            <td className="py-4 px-2">
                               <span className={cn(
                                 "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                 b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                 b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                 'bg-amber-100 text-amber-700'
                               )}>
                                  {b.status}
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
