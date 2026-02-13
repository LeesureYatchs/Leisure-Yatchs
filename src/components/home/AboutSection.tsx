import { Anchor, Award, Users, Clock } from 'lucide-react';

const features = [
  {
    icon: Anchor,
    title: 'Premium Fleet',
    description: 'Our yachts are maintained to the highest standards for your comfort and safety.',
  },
  {
    icon: Award,
    title: 'Expert Crew',
    description: 'Professional, experienced crew dedicated to making your experience exceptional.',
  },
  {
    icon: Users,
    title: 'Custom Experiences',
    description: 'Tailored packages for celebrations, corporate events, and private getaways.',
  },
  {
    icon: Clock,
    title: 'Flexible Booking',
    description: 'Easy booking process with flexible schedules to fit your needs.',
  },
];

export function AboutSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            About Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-foreground">
            Experience the Pinnacle of
            <br />
            <span className="text-primary">Luxury Yachting</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            LeisureYatchs brings you Dubai's finest yacht charter experience. 
            Whether you're celebrating a special occasion, hosting a corporate event, 
            or simply seeking a memorable day on the water, we deliver unmatched 
            service and unforgettable moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group text-center p-8 rounded-2xl bg-ocean-light hover:bg-primary transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary group-hover:bg-white mb-6 transition-colors">
                <feature.icon className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground group-hover:text-white/90 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
