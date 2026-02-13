import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ShipLoader from "@/components/ui/ShipLoader";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Yachts = lazy(() => import("./pages/Yachts"));
const YachtDetail = lazy(() => import("./pages/YachtDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminYachts = lazy(() => import("./pages/admin/AdminYachts"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminTripItineraries = lazy(() => import("./pages/admin/AdminTripItineraries"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <ShipLoader />
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/yachts" element={<Yachts />} />
              <Route path="/yachts/:id" element={<YachtDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/yachts" element={<AdminYachts />} />
              <Route path="/admin/offers" element={<AdminOffers />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/trip-itineraries" element={<AdminTripItineraries />} />
              <Route path="/admin/enquiries" element={<AdminEnquiries />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
