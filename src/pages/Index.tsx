import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { BrandShowcase } from '@/components/home/BrandShowcase';
import { FeaturedYachts } from '@/components/home/FeaturedYachts';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  useEffect(() => {
    document.title = "LeisureYatchs | Luxury Yacht Rental Dubai | Private Yacht Charter";
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  return (
    <PublicLayout>
      <HeroSection />
      
      <motion.div {...fadeIn}>
        <AboutSection />
      </motion.div>

      <motion.div {...fadeIn}>
        <BrandShowcase />
      </motion.div>

      <motion.div {...fadeIn}>
        <FeaturedYachts />
      </motion.div>

      <motion.div {...fadeIn}>
        <CTASection />
      </motion.div>
    </PublicLayout>
  );
};

export default Index;
