import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';

// Fix for default marker icon issues in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for landmarks
const createCustomIcon = (imageUrl: string) => {
  return new L.Icon({
    iconUrl: imageUrl,
    iconSize: [40, 40],
    className: 'rounded-full border-2 border-white shadow-lg object-cover',
  });
};

interface Landmark {
  name: string;
  position: [number, number];
  description: string;
  image?: string;
}

const DUBAI_CENTER: [number, number] = [25.11, 55.15]; // Near Palm Jumeirah

const LANDMARKS: Landmark[] = [
  {
    name: "Dubai Marina",
    position: [25.0768, 55.1413],
    description: "Start your journey at the stunning Dubai Marina.",
    image: "/dubai-marina-canal.jpeg"
  },
  {
    name: "Ain Dubai (Blue Waters)",
    position: [25.0796, 55.1225],
    description: "The world's largest observation wheel.",
    image: "/Blue-Water-Island.jpeg"
  },
  {
    name: "Atlantis The Palm",
    position: [25.1304, 55.1171],
    description: "Iconic luxury hotel on the Palm.",
    image: "/Atlantis.jpeg"
  },
  {
    name: "Burj Al Arab",
    position: [25.1412, 55.1853],
    description: "The world's only 7-star hotel.",
    image: "/burj-al-arab.jpeg"
  },
  {
    name: "Lagoon / Palm Jumeirah",
    position: [25.11, 55.13],
    description: "Relax in the calm waters of the Palm Lagoon.",
  }
];

// Sample route path (approximate coordinates)
const ROUTE_PATH: [number, number][] = [
    [25.0768, 55.1413], // Marina
    [25.0775, 55.1380], // Marina Exit
    [25.0796, 55.1225], // Blue Waters
    [25.0900, 55.1200], // Up the coast
    [25.1100, 55.1100], // Palm West Crescent
    [25.1304, 55.1171], // Atlantis
    [25.1350, 55.1400], // Palm East Crescent
    [25.1412, 55.1853], // Burj Al Arab
    [25.1300, 55.1600], // Return path
    [25.1000, 55.1450],
    [25.0768, 55.1413]  // Back to Marina
];

export function RouteMap() {
    const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);

    return (
        <Card className="overflow-hidden border-2 border-primary/10 shadow-xl rounded-2xl h-[500px] w-full relative z-0">
             <MapContainer 
                center={DUBAI_CENTER} 
                zoom={11} 
                scrollWheelZoom={false} 
                className="h-full w-full"
                style={{ zIndex: 0 }}
             >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Standard OSM
                    // Use a darker/more premium looking map tile if possible, or stick to standard.
                    // For premium: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" (CartoDB Positron)
                />
                
                {/* Route Line */}
                <Polyline 
                    positions={ROUTE_PATH} 
                    pathOptions={{ 
                        color: '#0077be', 
                        weight: 4, 
                        opacity: 0.7, 
                        dashArray: '10, 10', 
                        lineCap: 'round' 
                    }} 
                />

                {/* Landmarks */}
                {LANDMARKS.map((landmark, idx) => (
                    <Marker 
                        key={idx} 
                        position={landmark.position}
                        eventHandlers={{
                            click: () => setActiveLandmark(landmark),
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="text-center p-1">
                                <h3 className="font-bold text-primary">{landmark.name}</h3>
                                <p className="text-sm text-muted-foreground">{landmark.description}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
             </MapContainer>
             
             {/* Overlay Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg z-[400] max-w-[200px]">
                <h4 className="font-bold text-primary mb-2 text-sm">Tour Highlights</h4>
                <ul className="text-xs space-y-1">
                    {LANDMARKS.map(l => (
                        <li key={l.name} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {l.name}
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}

