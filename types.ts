import React from 'react';

export interface Project {
  id: string;
  name: string; // Prod A, Prod B...
  subtitle: string;
  year: string;
  locationState: string;
  color: string; 
  baseColor: string;
  description: string;
  iconChar: string;
  galleryImages: string[];
  isBrandHub?: boolean;
  touchPoints: number; // 4 to 12
}

export interface GeneratedContent {
  summary: string;
  innovationPoint: string;
  locationContext: string;
}

export interface PlacedItem {
  id: string; // The Product ID (e.g. 'prod_a')
  instanceId: string; // Unique session ID
  x: number;
  y: number;
  rotation: number; // Derived from physical rotation
  touchCount: number;
}

export type ContentType = 'info' | 'images' | 'location' | null;

export interface ProjectNodeProps {
  project: Project;
  instanceId: string;
  x: number;
  y: number;
  rotation: number;
  onRemove: (instanceId: string) => void;
  geminiContent?: GeneratedContent | null;
  isLoadingGemini: boolean;
  onActiveContentChange?: (content: ContentType) => void;
}