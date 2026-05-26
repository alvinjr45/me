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

export function createDogIncidentDraft(incidentAt = '') {
  return {
    culprit: '',
    incident: '',
    incidentAt,
    incidentCount: null,
    portraitUrl: '',
    portraitAlt: ''
  };
}

function normalizeIncident(row) {
  if (!row) {
    return null;
  }

  const culprit = row.culprit || '';

  return {
    culprit,
    incident: row.incident || '',
    incidentAt: row.incident_at || '',
    incidentCount: Number.isFinite(Number(row.incident_count))
      ? Number(row.incident_count)
      : null,
    portraitUrl: culprit ? getDogPortraitUrl(culprit) : '',
    portraitAlt: culprit ? getDogPortraitAlt(culprit) : ''
  };
}

function getIncidentCountSuffix(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const normalized = Math.abs(Math.trunc(value));
  const mod100 = normalized % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return 'th';
  }

  switch (normalized % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function formatIncidentCount(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const count = Math.max(0, Math.trunc(value));

  if (!count) {
    return '';
  }

  return `${count}${getIncidentCountSuffix(count)} incident all-time`;
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
    return null;
  }

  const { data, error } = await supabase
    .from('ajt3_dog_incidents')
    .select('id,culprit,incident,incident_at,updated_at')
    .eq('id', 'latest')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  let incidentCount = null;
  const culprit = data.culprit || '';

  if (culprit) {
    try {
      const counterResult = await supabase
        .from('ajt3_dog_incident_counters')
        .select('culprit,incident_count')
        .eq('culprit', culprit)
        .maybeSingle();

      if (counterResult.error) {
        throw counterResult.error;
      }

      if (Number.isFinite(Number(counterResult.data?.incident_count))) {
        incidentCount = Number(counterResult.data.incident_count);
      }
    } catch {
      incidentCount = null;
    }
  }

  return normalizeIncident({
    ...data,
    incident_count: incidentCount
  });
}
