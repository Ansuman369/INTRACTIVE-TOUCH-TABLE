import { Project } from './types';

// --- PHYSICAL CALIBRATION ---

// 1. Measure your screen width in millimeters.
// 2. Divide your screen horizontal resolution (e.g., 3840) by that width.
// Example: 55" TV is approx 1210mm wide. 3840 / 1210 = 3.17 px/mm.
// Standard 24" monitor (1920px) is ~530mm wide => 3.6 px/mm.
// UPDATE THIS VALUE BASED ON YOUR ACTUAL SCREEN HARDWARE.
export const PX_PER_MM = 3.7; 

// PHYSICAL COASTER SPECS
// Updated to 65mm as requested
export const PHYSICAL_COASTER_DIAMETER_MM = 65; 
export const PHYSICAL_RADIUS_PX = (PHYSICAL_COASTER_DIAMETER_MM * PX_PER_MM) / 2; 

// APP RADIUS CONFIGURATION
// This is the visual size of the UI ring around the coaster
export const COASTER_RADIUS_PX = PHYSICAL_RADIUS_PX; 

const baseImg = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

const GALLERY_POOLS = {
  futuristic: [
    '1506318137071-a8bcbf7fe5ed', '1486406146926-c627a92ad1ab', '1497366216548-37526070297c', 
    '1518770660439-4636190af475', '1550751827-4bd374c3f58b', '1480074568708-e7b720bb6fce'
  ],
  interior: [
    '1497366811353-33c3820bbc04', '1497215728101-856f4ea42174', '1524758631624-e2822e304c36', 
    '1556761175-5973ac0f9648', '1504384308090-c54beed04a91'
  ]
};

export const PROJECTS: Project[] = [
  {
    id: 'prod_a',
    name: 'PROD A',
    subtitle: '4-POINT SERIES',
    year: '2024',
    locationState: 'karnataka',
    color: '#ef4444', // Red
    baseColor: 'bg-red-600',
    description: 'Entry level module. 65mm form factor.',
    iconChar: 'A',
    galleryImages: GALLERY_POOLS.futuristic.map(id => baseImg(id)),
    touchPoints: 4
  },
  {
    id: 'prod_b',
    name: 'PROD B',
    subtitle: '5-POINT SERIES',
    year: '2024',
    locationState: 'tamilnadu',
    color: '#f97316', // Orange
    baseColor: 'bg-orange-600',
    description: 'Pentagonal structure. Enhanced grip.',
    iconChar: 'B',
    galleryImages: GALLERY_POOLS.interior.map(id => baseImg(id)),
    touchPoints: 5
  },
  {
    id: 'prod_c',
    name: 'PROD C',
    subtitle: '6-POINT SERIES',
    year: '2024',
    locationState: 'kerala',
    color: '#eab308', // Yellow
    baseColor: 'bg-yellow-600',
    description: 'Hex-grid layout. Optimal spacing.',
    iconChar: 'C',
    galleryImages: GALLERY_POOLS.futuristic.map(id => baseImg(id)),
    touchPoints: 6
  },
  {
    id: 'prod_d',
    name: 'PROD D',
    subtitle: '7-POINT SERIES',
    year: '2024',
    locationState: 'andhra',
    color: '#84cc16', // Lime
    baseColor: 'bg-lime-600',
    description: 'Heptagonal secure node.',
    iconChar: 'D',
    galleryImages: GALLERY_POOLS.interior.map(id => baseImg(id)),
    touchPoints: 7
  },
  {
    id: 'prod_e',
    name: 'PROD E',
    subtitle: '9-POINT SERIES',
    year: '2024',
    locationState: 'telangana',
    color: '#3b82f6', // Blue
    baseColor: 'bg-blue-600',
    description: 'High-density 9-point flagship model.',
    iconChar: 'E',
    galleryImages: GALLERY_POOLS.futuristic.map(id => baseImg(id)),
    touchPoints: 9
  }
];