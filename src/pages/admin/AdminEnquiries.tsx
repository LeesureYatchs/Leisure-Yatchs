import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Phone, 
  User, 
  Search, 
  Clock, 
  CheckCircle2, 
  ChevronDown,
  Trash2,
  Archive,
  MessageSquare
} from 'lucide-react';
import ShipLoader from '@/components/ui/ShipLoader';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type EnquiryStatus = 'pending' | 'read' | 'archived';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

export default function AdminEnquiries() {
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchEnquiries();

    const channel = supabase
      .channel('admin-enquiries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries' },
        () => fetchEnquiries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEnquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast({ title: 'Error fetching enquiries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: EnquiryStatus) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Enquiry marked as ${status}` });
      fetchEnquiries();
    } catch (error) {
      console.error('Error updating enquiry:', error);
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      const { error } = await supabase
        .from('enquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Enquiry deleted' });
      fetchEnquiries();
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast({ title: 'Error deleting enquiry', variant: 'destructive' });
    }
  };

  const getStatusStyles = (status: EnquiryStatus) => {
    switch (status) {
      case 'read': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'archived': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      enquiry.name.toLowerCase().includes(searchLower) ||
      enquiry.email.toLowerCase().includes(searchLower) ||
      enquiry.subject.toLowerCase().includes(searchLower)
    );
  });

  const totalEntries = filteredEnquiries.length;
  const totalPages = Math.ceil(totalEntries / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalEntries);
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Contact Enquiries</h1>
            <p className="text-muted-foreground">Manage messages from the contact form</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, subject..." 
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
        ) : filteredEnquiries.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-muted/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[200px] font-bold">SENDER</TableHead>
                    <TableHead className="w-[180px] font-bold">SUBJECT</TableHead>
                    <TableHead className="w-[300px] font-bold">MESSAGE</TableHead>
                    <TableHead className="w-[150px] font-bold">DATE</TableHead>
                    <TableHead className="w-[120px] font-bold text-center">STATUS</TableHead>
                    <TableHead className="w-[100px] text-right font-bold">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEnquiries.map((enquiry) => (
                    <TableRow key={enquiry.id} className={cn(
                      "group hover:bg-muted/20 transition-colors",
                      enquiry.status === 'pending' ? "bg-amber-50/30" : ""
                    )}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate">{enquiry.name}</span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{enquiry.email}</span>
                              </div>
                              {enquiry.phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{enquiry.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm font-medium">{enquiry.subject}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-600 line-clamp-2 italic">
                            "{enquiry.message}"
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(enquiry.created_at), 'MMM d, h:mm a')}
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
                                getStatusStyles(enquiry.status)
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {enquiry.status.toUpperCase()}
                              <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px] p-1">
                            <DropdownMenuItem 
                              onClick={() => updateStatus(enquiry.id, 'pending')}
                              className="gap-2 cursor-pointer text-amber-700 focus:text-amber-700 focus:bg-amber-50 rounded-md"
                            >
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-semibold">Mark Pending</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatus(enquiry.id, 'read')}
                              className="gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 rounded-md"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-semibold">Mark as Read</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatus(enquiry.id, 'archived')}
                              className="gap-2 cursor-pointer text-slate-700 focus:text-slate-700 focus:bg-slate-50 rounded-md"
                            >
                              <Archive className="w-4 h-4" />
                              <span className="text-xs font-semibold">Archive enquiry</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          onClick={() => deleteEnquiry(enquiry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/5">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-muted/60 shadow-sm">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Enquiries Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No results for "${searchTerm}"` : "New messages from the contact form will appear here."}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
