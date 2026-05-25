import { supabase } from '../lib/supabaseClient';

const dogPortraits = {
  Drake: '/images/dogs/drake.jpg',
  Josh: '/images/dogs/josh.jpg'
};

export function getDogPortraitUrl(culprit) {
  return dogPortraits[culprit] || dogPortraits.Drake;
}

export function getDogPortraitAlt(culprit) {
  return `${culprit || 'Dog'} portrait`;
}

export const defaultDogIncident = {
  culprit: 'Drake',
  incident: 'Stole a sock and carried it like a trophy.',
  incidentAt: '2026-04-24T12:00:00.000Z',
  portraitUrl: getDogPortraitUrl('Drake'),
  portraitAlt: getDogPortraitAlt('Drake')
};

function normalizeIncident(row) {
  if (!row) {
    return defaultDogIncident;
  }

  return {
    culprit: row.culprit || defaultDogIncident.culprit,
    incident: row.incident || defaultDogIncident.incident,
    incidentAt: row.incident_at || defaultDogIncident.incidentAt,
    portraitUrl: getDogPortraitUrl(row.culprit || defaultDogIncident.culprit),
    portraitAlt: getDogPortraitAlt(row.culprit || defaultDogIncident.culprit)
  };
}

export function formatIncidentDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function getDaysSinceIncident(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return 0;
  }

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export async function getLatestDogIncident() {
  if (!supabase) {
    return defaultDogIncident;
  }

  const { data, error } = await supabase
    .from('ajt3_dog_incidents')
    .select('id,culprit,incident,incident_at,updated_at')
    .eq('id', 'latest')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeIncident(data);
}
