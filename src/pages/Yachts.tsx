import { useEffect, useState } from 'react';
import { supabase, Yacht } from '@/lib/supabase';
import { SEO } from '@/components/SEO';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { YachtCard } from '@/components/yacht/YachtCard';
import { Loader2, Ship, Search, Filter } from 'lucide-react';
import ShipLoader from '@/components/ui/ShipLoader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function YachtsPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minCapacity, setMinCapacity] = useState('');

  useEffect(() => {
    fetchYachts();
    fetchCategories();

    // Enable Realtime Subscriptions for public fleet list
    const channel = supabase
      .channel('public-yachts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yachts' },
        () => fetchYachts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'yacht_categories' },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const fetchYachts = async () => {
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      
      // Shuffle the data for a fresh order on every refresh
      const randomizedData = data ? shuffleArray(data) : [];
      setYachts(randomizedData as Yacht[]);
    } catch (error) {
      console.error('Error fetching yachts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('yacht_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredYachts = yachts.filter((yacht) => {
    const matchesSearch = yacht.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (yacht.category &&
        yacht.category.toLowerCase() === selectedCategory.toLowerCase()) ||
      (!yacht.category && selectedCategory === 'Luxury'); // Default to Luxury if null
    const matchesCapacity =
      !minCapacity || yacht.capacity >= Number(minCapacity);

    return matchesSearch && matchesCategory && matchesCapacity;
  });

  return (
    <PublicLayout>
      <SEO 
        title="Our Fleet | Luxury Yachts for Rent in Dubai"
        description="Browse our exclusive fleet of luxury yachts available for rent in Dubai Marina. From 40ft cruisers to 150ft superyachts. Live availability & instant booking."
        url="/yachts"
      />
      {/* Hero */}
      <section className="relative pt-32 pb-20 ocean-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-primary font-medium tracking-wider uppercase text-sm">
              Our Dubai Fleet
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-foreground leading-tight">
              Luxury Yacht Rental Dubai
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore our premium selection of yachts in Dubai Marina. From private cruisers to luxury superyachts, find the perfect vessel for your Arabian Gulf adventure.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-8 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                Search Yacht
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Majesty 56"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name} Yachts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                Min Capacity
              </label>
              <Input
                type="number"
                placeholder="Guests"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                min="1"
              />
            </div>

            <div>
               <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setMinCapacity('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Yachts Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center flex-grow items-center">
              <ShipLoader />
            </div>
          ) : filteredYachts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredYachts.map((yacht) => (
                <YachtCard key={yacht.id} yacht={yacht} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Ship className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Yachts Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search filters to find what you're looking for.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setMinCapacity('');
                }}
                className="mt-2 text-primary"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
