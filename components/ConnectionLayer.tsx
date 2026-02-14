import React from 'react';

interface ConnectionLayerProps {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  active: boolean;
  color: string;
}

const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ startX, startY, targetX, targetY, active, color }) => {
  if (!active) return null;

  // Generate paths
  const midX = (startX + targetX) / 2;
  const path1 = `M ${startX},${startY} L ${midX},${startY} L ${midX},${targetY} L ${targetX},${targetY}`;
  const path2 = `M ${startX},${startY} Q ${startX},${targetY} ${targetX},${targetY}`;
  const path3 = `M ${startX},${startY} L ${startX},${(startY + targetY)/2} L ${targetX},${(startY + targetY)/2} L ${targetX},${targetY}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Main Beam - Thicker and brighter */}
      <path d={path1} fill="none" stroke={`url(#grad-${color})`} strokeWidth="3" className="animate-pulse opacity-80" strokeLinecap="round">
        <animate attributeName="stroke-dasharray" from="0, 1000" to="1000, 0" dur="1.5s" repeatCount="indefinite" />
      </path>

      {/* Secondary Curve - Visible dashed line */}
      <path d={path2} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="10,5" className="animate-[spin_4s_linear]">
      </path>

      {/* Tech Offset - Flash */}
      <path d={path3} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.4">
         <animate attributeName="opacity" values="0;0.8;0" dur="1s" repeatCount="indefinite" />
      </path>
      
      {/* Node at start */}
      <circle cx={startX} cy={startY} r="5" fill={color} className="animate-ping" />
      <circle cx={startX} cy={startY} r="3" fill="white" />
      
      {/* Node at target */}
      <circle cx={targetX} cy={targetY} r="4" fill="white" stroke={color} strokeWidth="2" />
    </svg>
  );
};

export default ConnectionLayer;
