import React from 'react';

interface KeralaMapProps {
  activeDistrictId: string | null;
}

// More organic, realistic approximation of Kerala's map divided into zones
const DISTRICT_PATHS: Record<string, string> = {
  // North (Kasargod, Kannur) - Top hook
  north: "M 32,10 C 45,5 55,15 56,25 C 58,30 52,35 50,38 L 46,45 C 38,48 34,42 28,40 C 20,35 25,20 32,10 Z",
  
  // Wayanad - The eastern bulge
  wayanad: "M 50,38 C 56,35 65,32 75,35 C 82,38 78,48 76,52 C 72,56 62,58 58,55 C 54,52 50,48 50,38 Z",
  
  // Malabar (Kozhikode, Malappuram) - West coast below North
  malabar: "M 28,40 C 34,42 46,45 46,45 L 50,38 C 50,48 58,55 58,55 C 58,65 52,75 50,80 C 42,85 32,75 28,70 C 24,60 24,50 28,40 Z",
  
  // Central (Thrissur, Palakkad, Ernakulam) - The middle bridge with Palakkad gap
  central: "M 28,70 C 32,75 42,85 50,80 C 56,78 65,75 75,72 C 85,70 90,80 85,90 C 80,100 68,105 62,110 C 52,115 38,110 32,105 C 28,95 26,80 28,70 Z",
  
  // Idukki - The large eastern mountain range
  idukki: "M 62,110 C 68,105 80,100 85,90 C 90,95 95,110 92,125 C 88,138 82,148 76,152 C 68,140 62,130 62,110 Z",
  
  // South (Kottayam, Alappuzha, Kollam, Trivandrum) - The tail
  south: "M 32,105 C 38,110 52,115 62,110 C 62,130 68,140 76,152 C 72,165 62,180 58,195 C 52,210 48,215 44,205 C 38,180 32,160 28,140 C 28,125 30,115 32,105 Z"
};

const KeralaMap: React.FC<KeralaMapProps> = ({ activeDistrictId }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[360px] pointer-events-none z-0 opacity-40 transition-opacity duration-500">
       <svg viewBox="0 0 120 220" className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]">
         {/* Render Outline Shadow/Glow for the whole map */}
         <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
         </filter>

         {Object.entries(DISTRICT_PATHS).map(([id, path]) => {
           const isActive = activeDistrictId === id;
           // If a district is active, others fade out more
           const opacity = activeDistrictId ? (isActive ? 1 : 0.1) : 0.3;
           
           return (
             <g key={id} className="transition-all duration-700 ease-in-out">
               <path 
                 d={path}
                 fill={isActive ? "rgba(6, 182, 212, 0.2)" : "rgba(20, 20, 20, 0.6)"} 
                 stroke={isActive ? "#22d3ee" : "#334155"} 
                 strokeWidth={isActive ? "1.5" : "0.5"}
                 className={`transition-all duration-500 ${isActive ? 'cursor-pointer' : ''}`}
                 style={{ 
                    opacity,
                    filter: isActive ? 'url(#glow)' : 'none'
                 }}
               />
               
               {/* Internal Nodes / Tech effect on active district */}
               {isActive && (
                 <>
                    <circle r="1" fill="#fff" className="animate-ping" style={{ offsetPath: `path('${path}')`, offsetDistance: '20%' }} />
                    <circle r="1" fill="#fff" className="animate-ping" style={{ offsetPath: `path('${path}')`, offsetDistance: '60%' }} />
                 </>
               )}
             </g>
           );
         })}
         
         {/* Global Grid Overlay tailored to map shape */}
         <defs>
            <pattern id="mapGrid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            </pattern>
            <clipPath id="mapClip">
                {Object.values(DISTRICT_PATHS).map((d, i) => <path key={i} d={d} />)}
            </clipPath>
         </defs>
         
         {/* Fill the map with a grid texture */}
         <rect width="100%" height="100%" fill="url(#mapGrid)" clipPath="url(#mapClip)" className="pointer-events-none" />
       </svg>
       
       {/* Geographic Coordinates Decoration */}
       <div className="absolute -right-8 top-10 flex flex-col gap-1 opacity-20">
          <div className="w-16 h-[1px] bg-white" />
          <span className="text-[6px] font-mono text-right">10.8505° N</span>
       </div>
       <div className="absolute -right-8 bottom-10 flex flex-col gap-1 opacity-20">
          <div className="w-16 h-[1px] bg-white" />
          <span className="text-[6px] font-mono text-right">76.2711° E</span>
       </div>
    </div>
  );
};

export default KeralaMap;