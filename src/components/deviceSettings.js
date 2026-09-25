import { createContext } from 'react';

export const wallpaperChoices = [
  { key: 'aurora', label: 'Aurora', description: 'Drifting polar light' },
  { key: 'nebula', label: 'Nebula', description: 'Deep-space color clouds' },
  { key: 'tide', label: 'Tide', description: 'Calm ocean currents' },
  { key: 'ember', label: 'Ember', description: 'Warm floating glow' },
  { key: 'synth', label: 'Synth', description: 'A vivid retro horizon' },
  { key: 'sunset', label: 'Sunset', description: 'Soft evening gradients' },
  { key: 'graphite', label: 'Graphite', description: 'A subtle moving grid' }
];

export const DeviceSettingsContext = createContext(null);

export const appearanceChoices = [
  { key: 'system', label: 'System' },
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' }
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
