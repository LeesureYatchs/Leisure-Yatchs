import { motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: "How much does it cost to rent a yacht in Dubai?",
    answer: "Yacht rental prices in Dubai vary depending on the size of the vessel and duration. Generally, affordable yacht rentals start from AED 300 per hour for smaller boats, while luxury yachts can range from AED 1,000 to over AED 5,000 per hour. We offer competitive packages for all budgets."
  },
  {
    question: "What is included in a private yacht charter?",
    answer: "Our private yacht bookings include a professional captain and crew, bottled water, ice, and soft drinks. You also get access to all onboard facilities like the music system, kitchen, and sun deck. Premium add-ons like catering, decorations for birthday parties, and water sports can be arranged upon request."
  },
  {
    question: "Where do the yacht trips start from in Dubai?",
    answer: "Most of our yacht charters depart from Dubai Marina, one of the most prestigious locations in the city. Other departure points like Jumeirah or Dubai Harbour can be arranged depending on the yacht's availability and your preference."
  },
  {
    question: "Can we have a birthday party on a yacht?",
    answer: "Absolutely! We specialized in birthday yacht party experiences. We can provide cake, balloons, decorations, and a red carpet entry to make your celebration truly special and memorable."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
             <span className="text-primary font-medium tracking-wider uppercase text-sm mb-4 block">
                FAQ
             </span>
             <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-sans">
                Frequently Asked <span className="text-primary">Questions</span>
             </h2>
             <p className="text-muted-foreground text-lg italic">
                Everything you need to know before stepping on board.
             </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <button
                  className="w-full flex items-center justify-between p-8 text-left focus:outline-none group"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    openIndex === index ? "bg-primary text-white rotate-180" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                  )}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openIndex === index ? 'auto' : 0, opacity: openIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-8 pt-0 text-muted-foreground leading-relaxed text-lg border-t border-slate-50 font-light">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
