import React from 'react';

interface IndiaMapProps {
  activeStateId: string | null;
}

// Simplified high-quality path of India
// Note: This is an artistic approximation for the background
const INDIA_PATH = "M 245,35 L 260,40 L 275,30 L 290,35 L 305,50 L 320,55 L 330,65 L 340,60 L 350,70 L 350,80 L 330,85 L 325,95 L 315,100 L 315,115 L 300,125 L 305,135 L 295,145 L 300,165 L 290,175 L 290,195 L 280,210 L 270,230 L 260,260 L 250,280 L 240,300 L 230,310 L 220,330 L 210,310 L 200,290 L 190,270 L 180,250 L 175,230 L 160,210 L 150,200 L 140,190 L 145,170 L 130,165 L 120,150 L 110,140 L 100,135 L 90,135 L 80,125 L 70,125 L 60,115 L 50,115 L 45,105 L 55,95 L 65,95 L 75,90 L 80,80 L 90,75 L 100,75 L 110,65 L 120,55 L 130,50 L 140,40 L 150,35 L 165,30 L 180,25 L 200,20 L 220,25 L 245,35 Z";

const IndiaMap: React.FC<IndiaMapProps> = ({ activeStateId }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[700px] pointer-events-none z-0 opacity-30 transition-opacity duration-500">
       <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible drop-shadow-[0_0_30px_rgba(6,182,212,0.15)]">
         <defs>
            <filter id="glow-map">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <pattern id="grid-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
               <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
               <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
         </defs>

         <path 
           d={INDIA_PATH}
           fill="url(#mapGradient)"
           stroke={activeStateId ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.1)"}
           strokeWidth="1"
           filter="url(#glow-map)"
           className="transition-all duration-700"
         />
         
         {/* Overlay Grid */}
         <path 
           d={INDIA_PATH}
           fill="url(#grid-pattern)"
           className="pointer-events-none opacity-40"
         />

         {/* Decorative Markers based on request for futuristic feel */}
         {activeStateId === 'karnataka' && (
             <circle cx="160" cy="250" r="30" fill="none" stroke="#22c55e" strokeWidth="0.5" className="animate-ping opacity-20" />
         )}

       </svg>
    </div>
  );
};

export default IndiaMap;
