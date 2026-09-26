import { createContext } from 'react';

export const wallpaperChoices = [
  { key: 'aurora', label: 'Aurora', description: 'Drifting polar light' },
  { key: 'nebula', label: 'Nebula', description: 'Deep-space color clouds' },
  { key: 'tide', label: 'Tide', description: 'Calm ocean currents' },
  { key: 'ember', label: 'Ember', description: 'Warm floating glow' },
  { key: 'sunset', label: 'Sunset', description: 'Soft evening gradients' },
  { key: 'cobalt', label: 'Cobalt', description: 'Flowing electric blue' },
  { key: 'jade', label: 'Jade', description: 'Layered emerald silk' },
  { key: 'bloom', label: 'Bloom', description: 'Rose and lilac light' },
  { key: 'glacier', label: 'Glacier', description: 'Cool crystalline ridges' },
  { key: 'dunes', label: 'Dunes', description: 'Sculpted desert sand' },
  { key: 'lagoon', label: 'Lagoon', description: 'Sunlight beneath the surface' },
  { key: 'eclipse', label: 'Eclipse', description: 'A quiet solar halo' },
  { key: 'prism', label: 'Prism', description: 'Slow ribbons of color' },
  { key: 'velvet', label: 'Velvet', description: 'Deep plum folds' },
  { key: 'copper', label: 'Copper', description: 'Warm metallic contours' },
  { key: 'fireflies', label: 'Fireflies', description: 'Tiny lights after dark' },
  { key: 'rain', label: 'Rain', description: 'Silver rain at midnight' },
  { key: 'horizon', label: 'Horizon', description: 'A still blue distance' },
  { key: 'ink', label: 'Ink', description: 'Indigo drifting into black' },
  { key: 'solstice', label: 'Solstice', description: 'Golden rays through dusk' }
];

export const DeviceSettingsContext = createContext(null);

export const appearanceChoices = [
  { key: 'system', label: 'System' },
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' }
];

export const deviceViewChoices = [
  { key: 'auto', label: 'Auto' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'desktop', label: 'Desktop' }
];

export const accentChoices = [
  { key: 'signal', label: 'Signal', main: '#fb7f33', accent: '#33affb' },
  { key: 'ocean', label: 'Ocean', main: '#279bd8', accent: '#65d9cf' },
  { key: 'mint', label: 'Mint', main: '#4bc58c', accent: '#65b9ff' },
  { key: 'violet', label: 'Violet', main: '#9a78ee', accent: '#ef77ba' },
  { key: 'rose', label: 'Rose', main: '#ef6688', accent: '#ffad61' }
];

export const wallpaperSpeedChoices = [
  { key: 'slow', label: 'Slow' },
  { key: 'normal', label: 'Normal' },
  { key: 'fast', label: 'Fast' }
];

export const backgroundChoices = [
  { key: 'alpine', label: 'Alpine Lake', description: 'A modern panoramic window' },
  { key: 'coast', label: 'Coastal Retreat', description: 'A rounded brass coastal lookout' },
  { key: 'desert', label: 'Desert Sunset', description: 'An open adobe arch' },
  { key: 'forest', label: 'Forest Cabin', description: 'Warm timber cabin panes' },
  { key: 'city', label: 'City After Dark', description: 'Floor-to-ceiling loft glass' },
  { key: 'winter', label: 'Snowbound', description: 'Frosted chalet windows' },
  { key: 'aurora', label: 'Northern Lights', description: 'A curved observatory canopy' },
  { key: 'garden', label: 'Spring Garden', description: 'Open shoji garden doors' }
];
