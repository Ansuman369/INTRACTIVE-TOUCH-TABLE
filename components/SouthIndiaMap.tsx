import React from 'react';

interface SouthIndiaMapProps {
  activeStateId: string | null; // 'karnataka', 'tamilnadu', etc.
}

const STATE_PATHS: Record<string, string> = {
  maharashtra: "M 30,10 C 50,5 90,5 110,20 C 115,30 110,40 100,45 L 60,50 C 40,50 30,40 20,30 L 25,20 Z",
  goa: "M 25,55 C 28,55 28,58 25,58 C 22,58 22,55 25,55 Z",
  karnataka: "M 30,50 C 50,45 80,45 90,60 C 95,80 85,110 70,120 C 50,115 40,100 30,80 C 25,70 25,60 30,50 Z",
  telangana: "M 90,40 C 110,35 130,40 135,55 C 130,75 110,80 95,70 C 90,60 90,50 90,40 Z",
  andhra: "M 135,55 C 145,65 130,100 110,110 C 100,100 95,80 95,70 C 110,80 130,75 135,55 Z",
  kerala: "M 55,125 C 60,120 65,130 65,145 C 60,160 55,150 50,140 C 50,130 52,128 55,125 Z",
  tamilnadu: "M 70,120 C 90,110 110,110 115,130 C 110,150 90,165 75,160 C 70,150 75,130 70,120 Z"
};

const SouthIndiaMap: React.FC<SouthIndiaMapProps> = ({ activeStateId }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] pointer-events-none z-0 opacity-40 transition-opacity duration-500">
       <svg viewBox="0 0 160 180" className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(6,182,212,0.1)]">
         <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
         </filter>

         {Object.entries(STATE_PATHS).map(([id, path]) => {
           const isActive = activeStateId === id;
           const opacity = activeStateId ? (isActive ? 1 : 0.2) : 0.4;
           
           return (
             <g key={id} className="transition-all duration-700">
               <path 
                 d={path}
                 fill={isActive ? "rgba(34, 197, 94, 0.2)" : "rgba(30, 41, 59, 0.5)"} 
                 stroke={isActive ? "#4ade80" : "#475569"} 
                 strokeWidth={isActive ? "1" : "0.5"}
                 className="transition-all duration-500"
                 style={{ opacity, filter: isActive ? 'url(#glow)' : 'none' }}
               />
               {isActive && (
                 <circle r="1.5" fill="white" className="animate-ping" style={{ offsetPath: `path('${path}')`, offsetDistance: '50%' }} />
               )}
             </g>
           );
         })}
         
         <defs>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
               <rect width="0.5" height="0.5" fill="rgba(255,255,255,0.1)" />
            </pattern>
         </defs>
         <rect width="100%" height="100%" fill="url(#grid)" style={{ mask: 'url(#mask)' }} className="pointer-events-none opacity-20" />
       </svg>
    </div>
  );
};

export default SouthIndiaMap;
