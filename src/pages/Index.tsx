import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { BrandShowcase } from '@/components/home/BrandShowcase';
import { FeaturedYachts } from '@/components/home/FeaturedYachts';
import { MoreYachts } from '@/components/home/MoreYachts';
import { CTASection } from '@/components/home/CTASection';

import { SEO } from '@/components/SEO';

const Index = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  return (
    <PublicLayout>
      <SEO 
        title="Luxury Yacht Rental Dubai | Private Chater & Party Yachts"
        description="Book premium luxury yachts in Dubai Marina. Best price guarantee for private yacht charters, birthday parties, corporate events & sunset cruises. "
      />
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
        <MoreYachts />
      </motion.div>

      <motion.div {...fadeIn}>
        <CTASection />
      </motion.div>
    </PublicLayout>
  );
};

export default Index;
