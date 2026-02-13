import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  useEffect(() => {
    document.title = "Contact LeisureYatchs | Book Your Yacht Charter in Dubai";
  }, []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('enquiries').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          status: 'pending'
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: 'Thank you for contacting us. Our team will get back to you shortly.',
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 ocean-gradient">
        <div className="container mx-auto px-4 text-center">
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-foreground">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions or ready to book your luxury yacht experience?
            We're here to help you plan the perfect charter.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card border rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
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
                    <Label htmlFor="email">Email</Label>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+]/g, '');
                        setFormData({ ...formData, phone: val });
                      }}
                      className="mt-1.5"
                      placeholder="+971..."
                      minLength={7}
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="mt-1.5"
                      required
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1.5"
                    rows={5}
                    required
                    minLength={10}
                    maxLength={1000}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-8">
                  Visit us at our Dubai Marina location or reach out through any of
                  the channels below. Our team is ready to assist you.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Our Location</h3>
                    <p className="text-muted-foreground">
                      Dubai Marina, Pier 7<br />
                      Dubai, United Arab Emirates
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-muted-foreground">+971 54 570 6788</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground">info.leisureyatchs@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Working Hours</h3>
                    <p className="text-muted-foreground">
                      Daily: 8:00 AM - 10:00 PM<br />
                      Charters: 24/7 Available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
