import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PROJECTS, PX_PER_MM, COASTER_RADIUS_PX } from './constants';
import ProjectNode from './components/Coaster'; 
import IndiaMap from './components/IndiaMap';
import ConnectionLayer from './components/ConnectionLayer';
import { fetchProjectDetails } from './services/geminiService';
import { GeneratedContent, PlacedItem, ContentType } from './types';
import { RotateCcw, Bug } from 'lucide-react';

// SETTINGS
// We use the radius from constants to determine clustering.
// 2.5x radius is a safe diameter search area.
const CLUSTER_RADIUS = COASTER_RADIUS_PX; 
const FLICKER_BUFFER_MS = 2000; // 2 seconds memory (Very stable)
const ROTATION_SMOOTHING = 0.2; 
const POSITION_SMOOTHING = 0.15; // Lower = smoother, heavier feel
const MOVEMENT_THRESHOLD = 2; 

interface TrackedObject {
  id: string; // The product ID
  instanceId: string; // Session ID
  x: number;
  y: number;
  rotation: number;
  touchCount: number;
  lastSeen: number; // Timestamp
  status: 'active' | 'ghost'; 
}

const App: React.FC = () => {
  const physicsState = useRef<Map<string, TrackedObject>>(new Map());
  const [renderItems, setRenderItems] = useState<PlacedItem[]>([]);
  
  const [projectData, setProjectData] = useState<Record<string, GeneratedContent>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeOriginInstanceId, setActiveOriginInstanceId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const rawPointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const [debugMode, setDebugMode] = useState(false);
  
  // For Debug Rendering only
  const [debugPoints, setDebugPoints] = useState<{x:number, y:number, id:number}[]>([]); 

  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      const handleKey = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'd') {
          setDebugMode(prev => !prev);
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, []);

  useEffect(() => {
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const loop = () => {
    processClusters();
    rafRef.current = requestAnimationFrame(loop);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    rawPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (rawPointers.current.has(e.pointerId)) {
        rawPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    rawPointers.current.delete(e.pointerId);
  };

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const lerpAngle = (start: number, end: number, factor: number) => {
    const d = end - start;
    const delta = (d + 180) % 360 - 180; 
    return start + delta * factor;
  };

  const processClusters = () => {
     const now = Date.now();
     // Convert to array for easier processing
     let points = Array.from(rawPointers.current.entries()).map(([id, p]) => ({ id, x: p.x, y: p.y }));
     
     // Update debug state if active
     if (debugMode) {
         setDebugPoints([...points]);
     }

     const detectedGroups: {x: number, y: number, count: number, angle: number}[] = [];

     // A. STRICT SEGMENTATION
     // We consume points so they can't belong to two clusters
     while (points.length > 0) {
         const p0 = points.pop(); // Take one point
         if (!p0) break;

         const group = [p0];
         // Find all neighbors iteratively
         for (let i = points.length - 1; i >= 0; i--) {
             const pTest = points[i];
             // Check distance to ANY point in the current group (chaining)
             // Using Cluster Radius to determine if points belong to the same object
             const dist = Math.hypot(p0.x - pTest.x, p0.y - pTest.y);
             
             // Diameter check: Is it within the size of our coaster?
             if (dist < CLUSTER_RADIUS * 2.2) { 
                 group.push(pTest);
                 points.splice(i, 1); // Remove from pool
             }
         }

         // Only consider groups that match our minimum coaster specs (at least 3 points, though lowest project is 4)
         if (group.length >= 3) { 
             const centroid = group.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {x:0, y:0});
             centroid.x /= group.length;
             centroid.y /= group.length;

             const firstP = group[0];
             const angleRad = Math.atan2(firstP.y - centroid.y, firstP.x - centroid.x);
             const angleDeg = (angleRad * 180) / Math.PI;

             detectedGroups.push({
                 x: centroid.x,
                 y: centroid.y,
                 count: group.length,
                 angle: angleDeg
             });
         }
     }

     // B. MATCH & PERSISTENCE
     const nextPhysicsMap = new Map<string, TrackedObject>();
     const usedGroupIndices = new Set<number>();

     // 1. Try to match existing active objects first
     physicsState.current.forEach((obj, key) => {
         let bestMatchIdx = -1;
         let minDist = CLUSTER_RADIUS * 2; 

         detectedGroups.forEach((g, idx) => {
             if (usedGroupIndices.has(idx)) return;
             
             // Distance check
             const d = Math.hypot(g.x - obj.x, g.y - obj.y);
             
             // Count check (Lenient: +/- 1 point allowed for noise)
             const countDiff = Math.abs(g.count - obj.touchCount);
             
             if (d < minDist && countDiff <= 2) {
                 minDist = d;
                 bestMatchIdx = idx;
             }
         });

         if (bestMatchIdx !== -1) {
             const g = detectedGroups[bestMatchIdx];
             usedGroupIndices.add(bestMatchIdx);
             
             // HEAVY SMOOTHING for stability
             const newX = lerp(obj.x, g.x, POSITION_SMOOTHING);
             const newY = lerp(obj.y, g.y, POSITION_SMOOTHING);
             const newRot = lerpAngle(obj.rotation, g.angle, ROTATION_SMOOTHING);

             const moved = Math.hypot(newX - obj.x, newY - obj.y) > MOVEMENT_THRESHOLD;
             const rotated = Math.abs(newRot - obj.rotation) > 0.5;

             nextPhysicsMap.set(key, {
                 ...obj,
                 x: moved ? newX : obj.x,
                 y: moved ? newY : obj.y,
                 rotation: rotated ? newRot : obj.rotation,
                 touchCount: g.count, // Update count but keep ID
                 lastSeen: now,
                 status: 'active'
             });
         } else {
             // 2. Ghost Handling
             if (now - obj.lastSeen < FLICKER_BUFFER_MS) {
                 nextPhysicsMap.set(key, { ...obj, status: 'ghost' });
             } else {
                 // Really lost
                 if (activeOriginInstanceId === obj.instanceId) {
                     setActiveOriginInstanceId(null);
                     setActiveState(null);
                 }
             }
         }
     });

     // C. NEW DETECTIONS (Only if not matched to existing)
     detectedGroups.forEach((g, idx) => {
         if (!usedGroupIndices.has(idx)) {
             const project = PROJECTS.find(p => p.touchPoints === g.count);
             if (project) {
                 const instanceId = `${project.id}-${now}`;
                 nextPhysicsMap.set(instanceId, {
                     id: project.id,
                     instanceId: instanceId,
                     x: g.x,
                     y: g.y,
                     rotation: g.angle,
                     touchCount: g.count,
                     lastSeen: now,
                     status: 'active'
                 });

                 if (!projectData[project.id]) {
                     fetchDataForProject(project.id, project.subtitle);
                 }
             }
         }
     });

     physicsState.current = nextPhysicsMap;
     
     // D. RENDER
     const activeItems: PlacedItem[] = [];
     physicsState.current.forEach(obj => {
         activeItems.push({
             id: obj.id,
             instanceId: obj.instanceId,
             x: obj.x,
             y: obj.y,
             rotation: obj.rotation,
             touchCount: obj.touchCount
         });
     });

     setRenderItems(activeItems);
  };

  const fetchDataForProject = async (id: string, context: string) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    const project = PROJECTS.find(s => s.id === id);
    if (project) {
      try {
        const data = await fetchProjectDetails(project.name, context);
        setProjectData(prev => ({ ...prev, [id]: data }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStates(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleContentChange = (instanceId: string, projectId: string, content: ContentType) => {
    if (content === 'location') {
      const project = PROJECTS.find(s => s.id === projectId);
      if (project && project.locationState) {
        setActiveState(project.locationState);
        setActiveOriginInstanceId(instanceId);
      }
    } else if (activeOriginInstanceId === instanceId) {
      setActiveState(null);
      setActiveOriginInstanceId(null);
    }
  };

  const handleReset = () => {
    physicsState.current.clear();
    setRenderItems([]);
    setActiveState(null);
    setActiveOriginInstanceId(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden touch-none font-sans bg-black"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }} 
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_100%)] pointer-events-none" />
      
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* SYSTEM BAR */}
      <div className="absolute top-8 left-8 z-[100] pointer-events-auto flex gap-2">
         <button 
           onPointerDown={(e) => { e.stopPropagation(); handleReset(); }}
           className="flex items-center gap-2 bg-red-900/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full text-[10px] text-red-400 font-mono hover:bg-red-500/20 hover:border-red-400 transition-colors group"
         >
           <RotateCcw size={12} className="group-hover:-rotate-180 transition-transform duration-500" />
           <span className="uppercase tracking-wider">RESET</span>
         </button>

         <button 
           onPointerDown={(e) => { e.stopPropagation(); setDebugMode(!debugMode); }}
           className={`flex items-center gap-2 backdrop-blur-md border px-3 py-1.5 rounded-full text-[10px] font-mono transition-colors group
             ${debugMode ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}
           `}
         >
           <Bug size={12} />
           <span className="uppercase tracking-wider">CALIBRATE</span>
         </button>
      </div>

      <IndiaMap activeStateId={activeState} />

      {renderItems.map((placed) => {
         const isActive = placed.instanceId === activeOriginInstanceId;
         const project = PROJECTS.find(s => s.id === placed.id);
         if (!project) return null;

         return (
           <ConnectionLayer 
              key={`conn-${placed.instanceId}`}
              startX={placed.x} 
              startY={placed.y}
              targetX={dimensions.width / 2}
              targetY={dimensions.height / 2}
              active={isActive}
              color={project.color || '#fff'}
           />
         );
      })}

      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none z-40">
        <h1 className="text-4xl font-extrabold tracking-[0.2em] text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
             RUBENIUS
        </h1>
        <p className="text-cyan-500/60 font-mono text-[10px] tracking-[0.8em] uppercase border-t border-cyan-900/50 pt-2">
           INTERACTIVE SURFACE
        </p>
      </div>

      {renderItems.map((placed) => {
        const project = PROJECTS.find(s => s.id === placed.id);
        if (!project) return null;

        return (
          <ProjectNode
            key={placed.instanceId}
            project={project}
            instanceId={placed.instanceId}
            x={placed.x}
            y={placed.y}
            rotation={placed.rotation}
            onRemove={() => {}} 
            geminiContent={projectData[placed.id]}
            isLoadingGemini={!!loadingStates[placed.id]}
            onActiveContentChange={(content) => handleContentChange(placed.instanceId, project.id, content)}
          />
        );
      })}

      {/* --- DEBUG OVERLAY --- */}
      {debugMode && (
          <div className="absolute inset-0 pointer-events-none z-[9999]">
              {/* Visualize Raw Touch Points */}
              {debugPoints.map(p => (
                  <div 
                    key={p.id} 
                    className="absolute w-4 h-4 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 border border-white"
                    style={{ left: p.x, top: p.y }}
                  >
                      <span className="absolute -top-4 left-0 text-[8px] text-red-500 font-mono">ID:{p.id}</span>
                  </div>
              ))}

              {/* Visualize Recognized Clusters */}
              {renderItems.map(item => (
                  <div 
                    key={item.instanceId}
                    className="absolute border-2 border-green-500 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ 
                        left: item.x, 
                        top: item.y, 
                        width: CLUSTER_RADIUS * 2, 
                        height: CLUSTER_RADIUS * 2 
                    }}
                  >
                      <div className="w-1 h-1 bg-green-500 absolute" />
                      <span className="absolute -bottom-6 text-green-500 text-[10px] font-mono bg-black/50 px-1">
                          DETECTED: {item.touchCount} PTS
                      </span>
                  </div>
              ))}

              <div className="absolute bottom-4 left-4 bg-black/80 text-green-400 p-2 text-xs font-mono border border-green-900 rounded">
                  DEBUG ACTIVE: Place Coaster to Test Radius <br/>
                  Target Radius: {Math.round(CLUSTER_RADIUS)}px <br/>
                  Raw Points: {debugPoints.length}
              </div>
          </div>
      )}

    </div>
  );
};

export default App;