import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, Wind, Thermometer } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 28,
    condition: 'Sunny',
    windSpeed: 12
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated weather fetch for Dubai
    const timer = setTimeout(() => {
      const hour = new Date().getHours();
      const mockWeather = {
        temp: hour > 10 && hour < 17 ? 32 : 26,
        condition: 'Clear Sky',
        windSpeed: 8 + Math.floor(Math.random() * 10)
      };
      setWeather(mockWeather);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-24 bg-primary/5 animate-pulse rounded-2xl border border-primary/10" />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-primary/5 border border-primary/10 rounded-2xl p-5 backdrop-blur-sm group transition-all hover:shadow-lg hover:border-primary/20"
    >
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-colors" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Dubai Live Weather</p>
          <div className="flex items-center gap-2">
            <h4 className="text-2xl font-black text-slate-900">{weather.temp}°C</h4>
            <span className="text-sm font-medium text-slate-500">{weather.condition}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 border-l border-primary/10 pl-4">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ x: [0, 2, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Wind className="w-5 h-5 text-blue-500 mb-0.5" />
            </motion.div>
            <span className="text-[10px] font-bold text-slate-600">{weather.windSpeed} knt</span>
          </div>
          <div className="p-2 bg-white/50 rounded-xl shadow-sm">
            {weather.temp > 25 ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <Sun className="w-8 h-8 text-amber-500" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Cloud className="w-8 h-8 text-blue-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
        <Thermometer className="w-3 h-3" />
        Perfect conditions for sailing today
      </div>
    </motion.div>
  );
}
