import React from 'react';
import { Project, GeneratedContent } from '../types';
import { Sparkles, Cpu, MapPin, Loader2 } from 'lucide-react';

interface InfoCardProps {
  project: Project;
  content?: GeneratedContent | null;
  isLoading: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ project, content, isLoading }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center z-50">
      {/* Connecting Line (Simulated) */}
      <div 
        className="absolute w-1 h-32 bottom-full left-1/2 -translate-x-1/2 bg-gradient-to-t from-white/50 to-transparent"
      />
      
      <div 
        className="relative pointer-events-auto glass-panel p-6 rounded-2xl border-t border-white/20 shadow-2xl max-w-sm w-80 animate-float transform transition-all duration-500"
        style={{
          boxShadow: `0 0 50px -12px ${project.color}50`
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">{project.name}</h2>
            <p className="text-white/60 text-xs italic font-serif">{project.subtitle}</p>
          </div>
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner ${project.baseColor}`}
          >
            {project.iconChar}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <p className="text-gray-300 text-sm leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Dynamic Content Area */}
          <div className="min-h-[160px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-white/40 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs tracking-wider uppercase">Asking Gemini...</span>
              </div>
            ) : content ? (
              <div className="space-y-3 animate-pulse-slow">
                <div className="flex gap-3 items-start">
                  <Sparkles className="w-4 h-4 text-yellow-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-0.5">Summary</span>
                    <p className="text-sm text-white/90">{content.summary}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <Cpu className="w-4 h-4 text-orange-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-0.5">Innovation</span>
                    <p className="text-sm text-white/90">{content.innovationPoint}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">Location</span>
                    <p className="text-sm text-white/90">{content.locationContext}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;