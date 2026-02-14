import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ProjectNodeProps, ContentType } from '../types';
import { 
  Info, 
  Image as ImageIcon, 
  MapPin, 
  Loader2, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { COASTER_RADIUS_PX } from '../constants';

// Radius configuration - Adjusted for 65mm compact size
const TEXT_RING_RADIUS = COASTER_RADIUS_PX + 20; 
const TRIANGLE_RADIUS = COASTER_RADIUS_PX + 55; 

// --- GEOMETRY HELPERS ---
const getCentroid = (pointers: Map<number, {x: number, y: number}>) => {
    const pts = Array.from(pointers.values());
    if (pts.length === 0) return { x: 0, y: 0 };
    const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    return { x: cx, y: cy };
};

const getDistance = (p1: {x:number,y:number}, p2: {x:number,y:number}) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
const getAngle = (p1: {x:number,y:number}, p2: {x:number,y:number}) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;


const ProjectNode: React.FC<ProjectNodeProps> = ({ 
  project, 
  instanceId,
  x, 
  y, 
  rotation,
  geminiContent, 
  isLoadingGemini,
  onActiveContentChange 
}) => {
  const [activeContent, setActiveContent] = useState<ContentType>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  
  // Image Transformation State
  const [imgScale, setImgScale] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);
  
  // Window Position State (Acts as the container for Image AND Controls)
  const [windowPos, setWindowPos] = useState<{x: number, y: number} | null>(null);
  
  // Gesture Refs
  const galleryPointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const prevCentroid = useRef<{x: number, y: number} | null>(null);
  
  const initialPinchDist = useRef<number>(0);
  const initialScale = useRef<number>(1);
  const initialAngle = useRef<number>(0);
  const initialImgRotation = useRef<number>(0);
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync window position with coaster if not dragged yet
  useEffect(() => {
      if (activeContent === 'images' && windowPos === null && currentImageIndex !== null) {
          // Calculate default satellite position
          // Adjusted distance for smaller coaster
          const galleryDist = TRIANGLE_RADIUS + 180; 
          const galleryAngleRad = (rotation + 120 - 90) * (Math.PI / 180);
          
          let gx = x + galleryDist * Math.cos(galleryAngleRad);
          let gy = y + galleryDist * Math.sin(galleryAngleRad);

          // CLAMP TO SCREEN BOUNDS
          const margin = 20;
          const width = 400; 
          const height = 260; 

          gx = Math.max(width/2 + margin, Math.min(window.innerWidth - width/2 - margin, gx));
          gy = Math.max(height/2 + margin, Math.min(window.innerHeight - height/2 - margin, gy));

          setWindowPos({ x: gx, y: gy });
      }
  }, [x, y, rotation, activeContent, currentImageIndex]);

  const handleTrigger = (e: React.PointerEvent | React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action(); 
  };

  const handleContentToggle = (type: ContentType) => {
    const newContent = activeContent === type ? null : type;
    setActiveContent(newContent);
    if (newContent === null) {
        setWindowPos(null); 
        setCurrentImageIndex(null);
    }
    if (onActiveContentChange) {
      onActiveContentChange(newContent);
    }
  };

  // --- GALLERY GESTURE LOGIC (Unified Physics) ---
  const handleGalleryPointerDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      galleryPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Reset centroid tracking to avoid jumps on new finger
      prevCentroid.current = getCentroid(galleryPointers.current);

      const pts: {x: number, y: number}[] = Array.from(galleryPointers.current.values());
      const count = pts.length;

      if (count === 1) {
          swipeStartX.current = e.clientX;
      } else if (count >= 2) {
          // Initialize 2-finger transform stats
          initialPinchDist.current = getDistance(pts[0], pts[1]);
          initialScale.current = imgScale;
          initialAngle.current = getAngle(pts[0], pts[1]);
          initialImgRotation.current = imgRotation;
      }
  };

  const handleGalleryPointerMove = (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!galleryPointers.current.has(e.pointerId)) return;
      
      galleryPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      const currentCentroid = getCentroid(galleryPointers.current);
      const pointerCount = galleryPointers.current.size;

      if (prevCentroid.current) {
          // 1. GLOBAL TRANSLATION (Applied to WindowPos)
          // Moves Image AND Controls together
          const dx = currentCentroid.x - prevCentroid.current.x;
          const dy = currentCentroid.y - prevCentroid.current.y;

          if (pointerCount >= 1) {
              if (pointerCount >= 2) {
                  setWindowPos(prev => prev ? ({ x: prev.x + dx, y: prev.y + dy }) : null);
              }
          }

          // 2. IMAGE TRANSFORMATION (Applied to Image Only)
          // Controls stay upright and unscaled relative to window center
          if (pointerCount === 2) {
             const pts: {x: number, y: number}[] = Array.from(galleryPointers.current.values());
             
             // Zoom
             const dist = getDistance(pts[0], pts[1]);
             const scaleRatio = dist / initialPinchDist.current;
             setImgScale(Math.min(Math.max(initialScale.current * scaleRatio, 0.5), 6));
             
             // Rotate
             const angle = getAngle(pts[0], pts[1]);
             const rotationDelta = angle - initialAngle.current;
             setImgRotation(initialImgRotation.current + rotationDelta);
          }
      }

      prevCentroid.current = currentCentroid;
  };

  const handleGalleryPointerUp = (e: React.PointerEvent) => {
      e.stopPropagation();
      galleryPointers.current.delete(e.pointerId);
      
      // Reset centroid so we don't jump when a finger lifts
      prevCentroid.current = getCentroid(galleryPointers.current);
      
      // Handle Swipe only if 1 finger was used without zooming
      if (galleryPointers.current.size === 0 && imgScale === 1 && swipeStartX.current !== null) {
          const diff = e.clientX - swipeStartX.current;
          // Only swipe if moved significantly and not just a tap
          if (Math.abs(diff) > 50 && Math.abs(diff) < 300) { 
              changeImage(diff > 0 ? -1 : 1);
          }
      }
  };
  
  const changeImage = (dir: number) => {
      if (currentImageIndex === null) return;
      const len = project.galleryImages.length;
      let newIndex = currentImageIndex + dir;
      if (newIndex < 0) newIndex = len - 1;
      if (newIndex >= len) newIndex = 0;
      setCurrentImageIndex(newIndex);
      // Reset Transform on change
      setImgScale(1); 
      setImgRotation(0);
  };

  // HELPER: Generate Repeated Radial Text
  const radialString = `${project.name} - ${project.touchPoints} PTS`.toUpperCase();
  const radialText = Array(3).fill(radialString).join("  •  ");

  // CALCULATE GEOMETRY
  const cx = 250;
  const cy = 250;
  
  const getVertex = (angleDeg: number, r: number) => {
      const rad = (angleDeg - 90) * (Math.PI / 180);
      return {
          x: cx + r * Math.cos(rad),
          y: cy + r * Math.sin(rad)
      };
  };

  const v1 = getVertex(0, TRIANGLE_RADIUS);
  const v2 = getVertex(120, TRIANGLE_RADIUS);
  const v3 = getVertex(240, TRIANGLE_RADIUS);
  const trianglePath = `M ${v1.x},${v1.y} L ${v2.x},${v2.y} L ${v3.x},${v3.y} Z`;

  return (
    <>
    <div
      className="absolute pointer-events-none flex items-center justify-center transition-all duration-300 ease-out"
      style={{ 
        left: x, 
        top: y,
        transform: `translate(-50%, -50%)`, 
        zIndex: 50
      }}
    >
      {/* ROTATING CONTAINER */}
      <div 
         className={`relative transition-all duration-700 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50 rotate-45'}`}
         style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* SVG UI LAYER */}
        <svg width="500" height="500" viewBox="0 0 500 500" className="overflow-visible pointer-events-none">
           <defs>
             <path id={`textCircle-${instanceId}`} d={`M ${cx}, ${cy} m -${TEXT_RING_RADIUS}, 0 a ${TEXT_RING_RADIUS},${TEXT_RING_RADIUS} 0 1,1 ${TEXT_RING_RADIUS * 2},0 a ${TEXT_RING_RADIUS},${TEXT_RING_RADIUS} 0 1,1 -${TEXT_RING_RADIUS * 2},0`} />
           </defs>
           
           <g className="animate-[spin_20s_linear_infinite]" style={{ transformOrigin: '250px 250px' }}>
              <text fill={project.color} className="opacity-90">
                <textPath href={`#textCircle-${instanceId}`} startOffset="0%" className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase fill-current">
                    {radialText}
                </textPath>
              </text>
           </g>

           <path 
             d={trianglePath} 
             fill="none" 
             stroke={project.color} 
             strokeWidth="1"
             className="opacity-50 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
           />
           
           <circle cx={cx} cy={cy} r={COASTER_RADIUS_PX} stroke={project.color} strokeWidth="1" opacity="0.2" fill="none" />
           
           {/* Connector Line to Gallery if open */}
           {currentImageIndex !== null && windowPos && (
             <line 
                x1={v2.x} y1={v2.y} 
                x2={v2.x + 100} y2={v2.y} 
                stroke={project.color}
                strokeWidth="1"
                strokeDasharray="4 4"
                className="opacity-50"
             />
           )}
        </svg>

        {/* INTERACTIVE BUTTONS - High Z-index */}
        <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-[60]" style={{ top: v1.y, left: v1.x }}>
            <MenuButton icon={<Info size={18} />} label="INFO" color={project.color} active={activeContent === 'info'} onTrigger={(e) => handleTrigger(e, () => handleContentToggle('info'))} />
        </div>

        <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-[60]" style={{ top: v2.y, left: v2.x }}>
             <MenuButton icon={<ImageIcon size={18} />} label="VISUALS" color={project.color} active={activeContent === 'images'} onTrigger={(e) => handleTrigger(e, () => handleContentToggle('images'))} />
        </div>

        <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-[60]" style={{ top: v3.y, left: v3.x }}>
             <MenuButton icon={<MapPin size={18} />} label="ORIGIN" color={project.color} active={activeContent === 'location'} onTrigger={(e) => handleTrigger(e, () => handleContentToggle('location'))} />
        </div>
      </div>


      {/* POPUP CONTENT (Rotates with UI) */}
      <div style={{ transform: `rotate(${rotation}deg)` }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* INFO POPUP */}
        {activeContent === 'info' && (
            <div 
                className="absolute w-64 bg-black/90 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300 z-[70]"
                style={{ top: v1.y - 210, left: v1.x - 128 }} 
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="absolute -bottom-8 left-1/2 w-px h-8 bg-gradient-to-b from-white/50 to-transparent" />
                <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase">{project.name}</h3>
                    <span className="text-[10px] font-mono" style={{ color: project.color }}>{project.subtitle}</span>
                </div>
                {isLoadingGemini ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                        <Loader2 className="animate-spin text-cyan-400" size={16} />
                        <span className="text-xs text-cyan-400">ANALYZING...</span>
                    </div>
                ) : (
                    <div className="space-y-2 text-xs text-gray-300 font-light">
                        <p><strong className="text-white">Summary:</strong> {geminiContent?.summary || project.description}</p>
                        <p><strong className="text-white">Innovation:</strong> {geminiContent?.innovationPoint || "---"}</p>
                    </div>
                )}
            </div>
        )}

        {/* VISUALS POPUP (Mini Grid) */}
        {activeContent === 'images' && (
            <div 
                className="absolute w-56 bg-black/90 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-300 z-[70]"
                style={{ top: v2.y + 25, left: v2.x + 25 }} 
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-4 -left-4 w-4 h-4 border-l border-t border-white/30" />
                <h3 className="text-[10px] font-mono text-orange-400 mb-2 uppercase tracking-widest">GALLERY ACCESS</h3>
                <div className="grid grid-cols-3 gap-1">
                    {project.galleryImages.slice(0, 9).map((src, i) => (
                        <div 
                            key={i} 
                            className="aspect-square bg-white/5 border border-white/10 hover:border-orange-400 cursor-pointer overflow-hidden relative group"
                            onPointerDown={(e) => handleTrigger(e, () => {
                                setCurrentImageIndex(i); 
                                setImgScale(1); setImgRotation(0);
                            })}
                        >
                            <img src={src} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* LOCATION POPUP */}
        {activeContent === 'location' && (
            <div 
                className="absolute w-48 bg-black/90 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-2xl pointer-events-auto text-right animate-in fade-in slide-in-from-right-4 duration-300 z-[70]"
                style={{ top: v3.y + 25, right: 500 - v3.x + 25 }} 
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-4 -right-4 w-4 h-4 border-r border-t border-white/30" />
                <h3 className="text-[10px] font-mono text-emerald-400 mb-2 uppercase tracking-widest">ORIGIN POINT</h3>
                <div className="text-xs text-white mb-1">{project.locationState.toUpperCase()}</div>
                <div className="text-[10px] text-gray-400 font-mono">{geminiContent?.locationContext || "Southern Zone"}</div>
            </div>
        )}
      </div>
    </div>

    {/* SATELLITE GALLERY VIEWER - PORTALED to BODY to break out of transforms */}
    {currentImageIndex !== null && windowPos && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-auto select-none"
            style={{ 
                top: 0, 
                left: 0,
                transform: `translate3d(${windowPos.x}px, ${windowPos.y}px, 0) translate(-50%, -50%)`,
                width: '400px',
                height: '260px',
                touchAction: 'none'
            }} 
        >
             <div 
               className="relative w-full h-full overflow-visible animate-in zoom-in-95 duration-300 bg-transparent"
               onPointerDown={(e) => e.stopPropagation()} /* Stop dragging propagation to app */
             >
                {/* Image Container - REMOVED OVERFLOW HIDDEN */}
                <div 
                    className="w-full h-full flex items-center justify-center relative touch-none cursor-move"
                    onPointerDown={handleGalleryPointerDown}
                    onPointerMove={handleGalleryPointerMove}
                    onPointerUp={handleGalleryPointerUp}
                    onPointerCancel={handleGalleryPointerUp}
                >
                    <img 
                        src={project.galleryImages[currentImageIndex]} 
                        className="max-w-none max-h-none object-contain pointer-events-none select-none touch-none shadow-[0_0_50px_rgba(0,0,0,0.5)] drop-shadow-2xl"
                        style={{ 
                            // TRANSFORMATION IS NOW ONLY ROTATE AND SCALE
                            // TRANSLATION IS HANDLED BY PARENT (WINDOWPOS)
                            transform: `rotate(${imgRotation}deg) scale(${imgScale})`, 
                            transition: galleryPointers.current.size === 0 ? 'transform 0.2s' : 'none',
                            width: '100%',
                            height: '100%'
                        }}
                    />
                    
                    {/* Gesture Hint Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 px-2 py-1 rounded text-[10px] text-white/50 backdrop-blur-sm pointer-events-none">
                            2 FINGER: DRAG/ROTATE/ZOOM
                        </div>
                    </div>
                </div>
                
                {/* Controls - FLOATING ICONS (Attached to Window/Container) */}
                <button 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-black/40 hover:bg-black/70 text-white/80 hover:text-white p-3 rounded-full backdrop-blur-sm pointer-events-auto transition-all active:scale-95 border border-white/10 z-[100]"
                    onPointerDown={(e) => handleTrigger(e, () => changeImage(-1))}
                >
                    <ChevronLeft size={24} />
                </button>
                
                <button 
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-black/40 hover:bg-black/70 text-white/80 hover:text-white p-3 rounded-full backdrop-blur-sm pointer-events-auto transition-all active:scale-95 border border-white/10 z-[100]"
                    onPointerDown={(e) => handleTrigger(e, () => changeImage(1))}
                >
                    <ChevronRight size={24} />
                </button>

                <div className="absolute -top-4 -right-4 z-[100]">
                    <button 
                        onPointerDown={(e) => handleTrigger(e, () => setCurrentImageIndex(null))}
                        className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors pointer-events-auto active:scale-95"
                    >
                        <X size={16} />
                    </button>
                </div>
                
                {/* Decor */}
                <div className="absolute top-0 left-0 p-2 pointer-events-none z-[100]">
                    <span className="text-[10px] font-mono text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                        {currentImageIndex + 1} / {project.galleryImages.length}
                    </span>
                </div>
             </div>
        </div>,
        document.body
    )}
    </>
  );
};

// --- COMPONENT: MENU BUTTON ---
const MenuButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    color: string; 
    active: boolean;
    onTrigger: (e: React.PointerEvent) => void; 
}> = ({ icon, label, color, active, onTrigger }) => (
    <div 
      className={`flex flex-col items-center gap-1 cursor-pointer group select-none pointer-events-auto`}
      onPointerDown={onTrigger} 
    >
        <div 
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300
            ${active 
                ? 'bg-white text-black border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.5)]' 
                : 'bg-black/60 text-white/70 border-white/30 backdrop-blur-md hover:scale-110 hover:border-white hover:text-white hover:bg-black/80'}
          `}
          style={{ boxShadow: active ? `0 0 20px ${color}` : '' }}
        >
            {icon}
        </div>
        <span className={`
            text-[9px] font-bold font-mono tracking-widest px-2 py-0.5 rounded transition-colors
            ${active ? 'bg-white text-black' : 'bg-black/50 text-white border border-white/10'}
        `}>
            {label}
        </span>
    </div>
);

export default ProjectNode;