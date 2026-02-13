import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

// Import local assets
import Atlantis from "@/assets/Atlantis.jpeg";
import BlueWaterIsland from "@/assets/Blue-Water-Island.jpeg";
import BurjAlArab from "@/assets/burj-al-arab.jpeg";
import DubaiHarbor from "@/assets/dubai-harbor.jpeg";
import DubaiMarinaCanal from "@/assets/dubai-marina-canal.jpeg";
import JBR from "@/assets/JBR.jpeg";

export function CruiseRoutes() {
  const routes = [
    { 
      name: "Dubai Harbor", 
      image: DubaiHarbor 
    },
    { 
      name: "JBR", 
      image: JBR 
    },
    { 
      name: "Blue Water Island", 
      image: BlueWaterIsland 
    },
    { 
      name: "Dubai Marina Canal", 
      image: DubaiMarinaCanal 
    },
    { 
      name: "Atlantis", 
      image: Atlantis 
    },
    { 
      name: "Burj Al Arab", 
      image: BurjAlArab 
    },
  ];

  return (
    <div className="py-6">
      <h3 className="text-2xl font-bold mb-6 text-foreground">Cruise Routes & Iconic Sights</h3>
      <div className="bg-ocean-light/50 rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap justify-center md:justify-between gap-6">
          {routes.map((route, index) => (
            <motion.div 
              key={index} 
              className="flex flex-col items-center gap-3 group cursor-pointer"
              whileHover={{ y: -5 }}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-md transition-all duration-300 group-hover:border-primary group-hover:shadow-lg">
                <img
                  src={route.image}
                  alt={route.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <span className="text-sm font-bold text-center text-foreground/80 max-w-[100px] leading-tight group-hover:text-primary transition-colors">
                {route.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
