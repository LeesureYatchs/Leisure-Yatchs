import { useEffect } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SEO } from '@/components/SEO';
import { Anchor, Award, Users, MapPin } from 'lucide-react';

export default function AboutPage() {
  // Title handled by SEO component

  return (
    <PublicLayout>
      <SEO 
        title="About Us | Trusted Yacht Charter Company in Dubai"
        description="Learn about LeisureYacht, Dubai's premier luxury yacht charter company. Over 10 years of creating unforgettable maritime experiences with a diverse fleet."
        url="/about"
      />
      {/* Hero */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1920&q=80"
            alt="Luxury yacht"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            About LeisureYatchs
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Dubai's premier luxury yacht charter company, delivering exceptional
            maritime experiences since our inception.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Redefining Luxury on the
                <span className="text-primary"> Arabian Waters</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-justify">
                <p>
                  LeisureYatchs was born from a passion for the sea and a commitment
                  to delivering unparalleled luxury experiences. Based in the heart of
                  Dubai Marina, we've become the go-to destination for discerning
                  clients seeking the finest yacht charters in the UAE.
                </p>
                <p>
                  Our fleet features meticulously maintained vessels ranging from
                  intimate cruisers to grand superyachts, each equipped with world-class
                  amenities and staffed by professional crews dedicated to your comfort.
                </p>
                <p>
                  Whether you're planning a romantic sunset cruise, a corporate event,
                  or a celebration with family and friends, we transform ordinary moments
                  into extraordinary memories on the stunning waters of the Arabian Gulf.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=800&q=80"
                alt="Yacht experience"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary text-white p-6 rounded-xl shadow-lg">
                <p className="text-4xl font-bold">10+</p>
                <p className="text-sm">Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 ocean-gradient">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Anchor,
                title: 'Excellence',
                description: 'We maintain the highest standards in every aspect of our service.',
              },
              {
                icon: Award,
                title: 'Quality',
                description: 'Premium vessels and world-class amenities for every charter.',
              },
              {
                icon: Users,
                title: 'Service',
                description: 'Dedicated crew committed to exceeding your expectations.',
              },
              {
                icon: MapPin,
                title: 'Experience',
                description: 'Creating unforgettable memories on the Arabian Gulf.',
              },
            ].map((value) => (
              <div
                key={value.title}
                className="text-center p-6 bg-white rounded-2xl shadow-sm"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
