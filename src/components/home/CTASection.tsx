import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1920&q=80"
          alt="Luxury yacht at sunset"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to Set Sail?
        </h2>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
          Book your luxury yacht experience today and create memories that last a lifetime. 
          Our team is ready to help you plan the perfect charter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8"
          >
            <Link to="/yachts">Browse Yachts</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-foreground bg-transparent"
          >
            <a href="tel:+971545706788" className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call Us Now
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
