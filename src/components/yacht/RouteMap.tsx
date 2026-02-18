import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, MapPin, Play, RefreshCw, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default marker icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Yacht Icon
const yachtIcon = L.divIcon({
  html: `<div class="bg-primary p-2 rounded-full shadow-2xl border-2 border-white transform -rotate-45 animate-pulse">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H2v18z"></path></svg>
         </div>`,
  className: 'custom-yacht-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

interface Landmark {
  name: string;
  position: [number, number];
  description: string;
  image?: string;
}

const DUBAI_CENTER: [number, number] = [25.11, 55.15];

const LANDMARKS: Landmark[] = [
  {
    name: "Dubai Marina",
    position: [25.0768, 55.1413],
    description: "Start your journey at the stunning Dubai Marina canal.",
    image: "/dubai-marina-canal.jpeg"
  },
  {
    name: "Ain Dubai",
    position: [25.0796, 55.1225],
    description: "Sail past the world's largest observation wheel.",
    image: "/Blue-Water-Island.jpeg"
  },
  {
    name: "Palm Jumeirah",
    position: [25.1124, 55.1373],
    description: "Navigate through the iconic man-made islands.",
    image: "/Atlantis.jpeg"
  },
  {
    name: "Burj Al Arab",
    position: [25.1412, 55.1853],
    description: "The ultimate 7-star landmark on the horizon.",
    image: "/burj-al-arab.jpeg"
  }
];

const ROUTE_PATH: [number, number][] = [
    [25.0768, 55.1413], 
    [25.0790, 55.1320], 
    [25.0796, 55.1225], 
    [25.0850, 55.1150],
    [25.1000, 55.1100], 
    [25.1124, 55.1373],
    [25.1304, 55.1171], 
    [25.1380, 55.1500],
    [25.1412, 55.1853], 
    [25.1350, 55.1800],
    [25.1050, 55.1500],
    [25.0768, 55.1413]
];

// Map Hook to handle view resets
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function RouteMap() {
    const [animatedPath, setAnimatedPath] = useState<[number, number][]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [yachtPosition, setYachtPosition] = useState<[number, number]>(ROUTE_PATH[0]);

    const startTour = () => {
        setIsAnimating(true);
        setAnimatedPath([]);
        let index = 0;
        
        const interval = setInterval(() => {
            if (index < ROUTE_PATH.length) {
                const nextPoint = ROUTE_PATH[index];
                setAnimatedPath(prev => [...prev, nextPoint]);
                setYachtPosition(nextPoint);
                index++;
            } else {
                clearInterval(interval);
                setIsAnimating(false);
            }
        }, 800);
    };

    useEffect(() => {
        startTour();
    }, []);

    return (
        <Card className="overflow-hidden border-2 border-primary/10 shadow-2xl rounded-[2rem] h-[600px] w-full relative group">
            <div className="absolute top-6 left-6 z-[400] flex flex-col gap-3">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-primary/10 max-w-[240px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-5 h-5 text-primary" />
                        <h4 className="font-black text-foreground uppercase tracking-wider text-xs">Live Route Plotter</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Visualizing the <span className="text-primary font-bold">Dubai Marina & Palm</span> circuit. Experience the iconic Dubai skyline from the ocean.
                    </p>
                    <Button 
                        onClick={startTour} 
                        size="sm" 
                        disabled={isAnimating}
                        className="w-full mt-4 bg-primary text-white rounded-xl h-10 font-bold text-[10px] uppercase tracking-widest"
                    >
                        {isAnimating ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                        {isAnimating ? 'Navigating...' : 'Restart Tour'}
                    </Button>
                </div>
            </div>

            <MapContainer 
                center={DUBAI_CENTER} 
                zoom={12} 
                scrollWheelZoom={false} 
                className="h-full w-full grayscale-[0.2]"
                style={{ zIndex: 0 }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController center={DUBAI_CENTER} zoom={12} />

                {/* Main Animated Path */}
                <Polyline 
                    positions={animatedPath} 
                    pathOptions={{ 
                        color: '#0ea5e9', 
                        weight: 5, 
                        opacity: 0.8, 
                        lineCap: 'round',
                        lineJoin: 'round'
                    }} 
                />

                {/* Shadow/Track Path */}
                <Polyline 
                    positions={ROUTE_PATH} 
                    pathOptions={{ 
                        color: '#0284c7', 
                        weight: 2, 
                        opacity: 0.1, 
                        dashArray: '5, 10'
                    }} 
                />

                {/* Traveling Yacht Marker */}
                <Marker position={yachtPosition} icon={yachtIcon}>
                    <Popup className="premium-popup">
                        <div className="text-center p-1">
                            <Ship className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Yacht</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Iconic Landmarks */}
                {LANDMARKS.map((landmark, idx) => (
                    <Marker 
                        key={idx} 
                        position={landmark.position}
                    >
                        <Popup className="premium-popup">
                            <div className="w-48 overflow-hidden rounded-lg">
                                {landmark.image && (
                                    <div className="h-24 w-full bg-muted overflow-hidden">
                                        <img src={landmark.image} alt={landmark.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-3 text-center">
                                    <h3 className="font-black text-primary uppercase text-xs tracking-tight mb-1">{landmark.name}</h3>
                                    <p className="text-[10px] leading-tight text-muted-foreground">{landmark.description}</p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Bottom Floating Stats */}
            <div className="absolute bottom-6 right-6 z-[400] bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-6">
                <div className="text-center border-r border-white/10 pr-6">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1">Duration</p>
                    <p className="text-white font-bold text-sm">2 - 4 Hours</p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1">Stops</p>
                    <p className="text-white font-bold text-sm">4 Major Sites</p>
                </div>
            </div>
        </Card>
    );
}


