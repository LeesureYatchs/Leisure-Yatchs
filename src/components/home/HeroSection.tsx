import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, ChevronDown } from 'lucide-react';

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section ref={containerRef} className="relative h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1920&q=80"
        >
          <source
            src="https://player.vimeo.com/external/434045526.sd.mp4?s=e4f7c34d0c8e1f1f4b6f8a2b8b8b8b8b&profile_id=165"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4"
      >
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-sm md:text-base font-medium tracking-widest uppercase mb-4 text-white/80">
            Dubai, UAE
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Luxury Yacht
            <br />
            <span className="text-primary">Experiences</span> in Dubai
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Discover the Arabian Gulf aboard our premium fleet of luxury yachts. 
            Unforgettable memories await with world-class service and breathtaking views.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
            >
              <Link to="/yachts">View Our Yachts</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-foreground px-8 py-6 text-lg bg-transparent"
            >
              <Link to="/yachts" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Book Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-float"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </motion.div>
    </section>
  );
}
