import { Ship } from 'lucide-react';

export default function ShipLoader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Animated Ship */}
        <Ship className="w-12 h-12 text-blue-500 animate-pulse" />
        {/* Simple Waves using CSS borders */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 border-b-2 border-blue-300 rounded-full animate-bounce delay-100" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-2 border-b-2 border-blue-400 rounded-full animate-bounce" />
      </div>
      <p className="text-sm text-gray-500 font-medium tracking-wider animate-pulse">Loading...</p>
    </div>
  );
}
