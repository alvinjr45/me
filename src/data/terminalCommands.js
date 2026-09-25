import {
  accentChoices, appearanceChoices, backgroundChoices, wallpaperChoices, wallpaperSpeedChoices
} from '../components/deviceSettings';

export const terminalPages = [
  { name: 'home', path: '/', description: 'Return to the desktop' },
  { name: 'build', path: 'https://ajt3.website', description: 'Projects and experiments (new tab)' },
  { name: 'tech', path: '/tech', description: 'Product engineering and creative systems' },
  { name: 'music', path: '/music', description: 'Browse the playlist collection' },
  { name: 'dogs', path: '/dogs', description: 'Meet Drake and Josh' },
  { name: 'blog', path: '/blog', description: 'Read notes from the build' },
  { name: 'photos', path: '/photos', description: 'Explore photos and albums' },
  { name: 'calendar', path: '/calendar', description: 'Browse published events' },
  { name: 'guestbook', path: '/guestbook', description: 'Read conversations and leave a note' },
  { name: 'app-store', path: '/app-store', description: 'Explore the demo catalog and manage your library' },
  { name: 'instagram', path: 'https://www.instagram.com/_ajt3_/', description: 'Visit Instagram (new tab)' },
  { name: 'settings', path: '/settings', description: 'Customize this device' },
  { name: 'terminal', path: '/terminal', description: 'Open the full terminal' },
  { name: 'terms', path: '/terms', description: 'Guestbook terms and conditions' },
  { name: 'privacy', path: '/privacy', description: 'Privacy policy' }
];

export const terminalAliases = { store: 'app-store', apps: 'app-store', blogs: 'blog', about: 'whoami' };

export const terminalSettings = [
  { name: 'theme', key: 'appearance', setter: 'setAppearance', choices: appearanceChoices },
  { name: 'accent', key: 'accent', setter: 'setAccent', choices: accentChoices },
  { name: 'wallpaper', key: 'wallpaper', setter: 'setWallpaper', choices: wallpaperChoices },
  { name: 'background', key: 'background', setter: 'setBackground', choices: backgroundChoices },
  { name: 'speed', key: 'wallpaperSpeed', setter: 'setWallpaperSpeed', choices: wallpaperSpeedChoices },
  { name: 'brightness', key: 'wallpaperDim', setter: 'setWallpaperDim', min: 35, max: 100 },
  { name: 'intensity', key: 'wallpaperIntensity', setter: 'setWallpaperIntensity', min: 60, max: 140 },
  { name: 'motion', key: 'motion', setter: 'setMotion', values: ['on', 'off'] },
  { name: 'clock', key: 'clock24', setter: 'setClock24', values: ['12', '24'] }
];

export function settingOptions(setting) {
  return setting.choices?.map((choice) => choice.key) || setting.values || [];
}

export const terminalHelp = [
  { name: 'help', group: 'Get started', usage: '--help | help [command]', description: 'Show this guide or help for one command. Example: help set' },
  { name: 'ls', group: 'Explore', usage: 'ls [search]', description: 'List public pages with descriptions. Example: ls photo' },
  { name: 'open', group: 'Explore', usage: 'open <page> | cd <page> | <page>', description: 'Open any page listed by ls. Example: open guestbook. Use home or cd / for the desktop. Aliases: store, apps, blogs.' },
  { name: 'posts', group: 'Explore', usage: 'posts [search]', description: 'List published blog titles and slugs. Example: posts dogs' },
  { name: 'read', group: 'Explore', usage: 'read <slug>', description: 'Open a published blog post using a slug from posts.' },
  { name: 'playlists', group: 'Explore', usage: 'playlists [search]', description: 'List playlist names and keys. Example: playlists michael' },
  { name: 'listen', group: 'Explore', usage: 'listen <playlist key or title>', description: 'Open a playlist in Apple Music in a new tab. Example: listen michael' },
  { name: 'albums', group: 'Explore', usage: 'albums', description: 'List photo albums and published photo counts. Use photos to browse them.' },
  { name: 'events', group: 'Explore', usage: 'events [today | upcoming]', description: 'List published events happening now or later (default: upcoming). Example: events today' },
  { name: 'get', group: 'Customize', usage: 'get [setting]', description: 'Show current device preferences. Example: get theme' },
  { name: 'set', group: 'Customize', usage: 'set <setting> <value>', description: 'Change a device preference. Example: set theme dark. Run help set for every option.' },
  { name: 'whoami', group: 'Terminal', usage: 'whoami | about', description: 'A quick introduction to AJ Thompson.' },
  { name: 'pwd', group: 'Terminal', usage: 'pwd', description: 'Show the current site path.' },
  { name: 'date', group: 'Terminal', usage: 'date', description: 'Show your local date and time.' },
  { name: 'history', group: 'Terminal', usage: 'history', description: 'Show commands entered in this terminal. Up/Down recalls them.' },
  { name: 'clear', group: 'Terminal', usage: 'clear', description: 'Clear terminal output. Command recall remains available.' },
  { name: 'logout', group: 'System', usage: 'logout', description: 'Close the current session and return to the lock screen.' },
  { name: 'restart', group: 'System', usage: 'restart', description: 'Close apps, reboot the simulated device, and return to the lock screen.' },
  { name: 'shutdown', group: 'System', usage: 'shutdown', description: 'Close apps and power off the simulated device.' }
];
