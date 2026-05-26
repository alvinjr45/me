import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getAllowedOrigin(request: Request) {
  const requestOrigin = request.headers.get('origin') || '';
  const configuredOrigins = Deno.env.get('ADMIN_CORS_ORIGINS') || Deno.env.get('ADMIN_CORS_ORIGIN') || '*';
  const allowedOrigins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.includes('*')) {
    return '*';
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] || '*';
}

function corsHeaders(request: Request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json'
    }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function normalizeIncidentAt(value: FormDataEntryValue | null) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return `${rawValue}T12:00:00.000Z`;
  }

  return rawValue;
}

function formatError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { message: String(error || 'Unknown error') };
  }

  const record = error as Record<string, unknown>;
  const details = {
    name: typeof record.name === 'string' ? record.name : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
    code: typeof record.code === 'string' ? record.code : undefined,
    details: typeof record.details === 'string' ? record.details : undefined,
    hint: typeof record.hint === 'string' ? record.hint : undefined,
    stack: typeof record.stack === 'string' ? record.stack : undefined
  };

  return details;
}

async function getIncidentCount(supabase: ReturnType<typeof createClient>, culprit: string) {
  try {
    const { data, error } = await supabase
      .from('ajt3_dog_incident_counters')
      .select('culprit,incident_count')
      .eq('culprit', culprit)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const count = Number(data?.incident_count);
    return Number.isFinite(count) ? count : null;
  } catch (error) {
    console.warn('[admin-dog-incident] counter load failed', formatError(error));
    return null;
  }
}

async function bumpIncidentCount(supabase: ReturnType<typeof createClient>, culprit: string) {
  try {
    const { data, error } = await supabase.rpc('increment_dog_incident_counter', {
      culprit_name: culprit
    });

    if (!error) {
      const nextCount = Number(data);
      return Number.isFinite(nextCount) ? nextCount : null;
    }

    console.warn('[admin-dog-incident] counter rpc failed, falling back to direct increment', formatError(error));
    const currentCount = (await getIncidentCount(supabase, culprit)) ?? 0;
    const nextCount = currentCount + 1;

    const { error: upsertError } = await supabase
      .from('ajt3_dog_incident_counters')
      .upsert({ culprit, incident_count: nextCount }, { onConflict: 'culprit' });

    if (upsertError) {
      throw upsertError;
    }

    return nextCount;
  } catch (error) {
    console.warn('[admin-dog-incident] counter save failed', formatError(error));
    return null;
  }
}

async function saveIncidentAndCount(
  supabase: ReturnType<typeof createClient>,
  culprit: string,
  incident: string,
  incidentAt: string
) {
  try {
    const { data, error } = await supabase.rpc('save_dog_incident', {
      culprit_name: culprit,
      incident_text: incident,
      incident_time: incidentAt
    });

    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      const incidentCount = Number(row?.incident_count);

      return {
        culprit: String(row?.culprit || culprit),
        incident: String(row?.incident || incident),
        incidentAt: String(row?.incident_at || incidentAt),
        incidentCount: Number.isFinite(incidentCount) ? incidentCount : null
      };
    }

    console.warn('[admin-dog-incident] save rpc failed, falling back to direct writes', formatError(error));

    const incidentRow = {
      id: 'latest',
      culprit,
      incident,
      incident_at: incidentAt,
      portrait_url: null,
      portrait_alt: null
    };

    const { data: incidentData, error: incidentError } = await supabase
      .from('ajt3_dog_incidents')
      .upsert(incidentRow, { onConflict: 'id' })
      .select('id,culprit,incident,incident_at')
      .single();

    if (incidentError) {
      throw incidentError;
    }

    const incidentCount = await bumpIncidentCount(supabase, incidentData.culprit);

    return {
      culprit: incidentData.culprit,
      incident: incidentData.incident,
      incidentAt: incidentData.incident_at,
      incidentCount
    };
  } catch (error) {
    console.warn('[admin-dog-incident] save and count failed', formatError(error));
    return null;
  }
}

Deno.serve(async (request) => {
  console.info('[admin-dog-incident] request', {
    method: request.method,
    origin: request.headers.get('origin') || '',
    hasAdminSecret: Boolean(request.headers.get('x-admin-secret'))
  });

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }

  try {
    const adminSecret = request.headers.get('x-admin-secret') || '';
    const expectedSecret = requiredEnv('ADMIN_POST_SECRET');

    if (!adminSecret || adminSecret !== expectedSecret) {
      console.warn('[admin-dog-incident] unauthorized', {
        method: request.method,
        origin: request.headers.get('origin') || ''
      });
      return jsonResponse(request, { error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));

    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('ajt3_dog_incidents')
        .select('id,culprit,incident,incident_at,updated_at')
        .eq('id', 'latest')
        .maybeSingle();

      if (error) {
        console.error('[admin-dog-incident] load failed', formatError(error));
        return jsonResponse(request, { error: 'Load failed', details: formatError(error) }, 500);
      }

      const incidentCount = data?.culprit ? await getIncidentCount(supabase, data.culprit) : null;

      console.info('[admin-dog-incident] loaded incident');
      return jsonResponse(request, {
        incident: data
          ? {
              culprit: data.culprit,
              incident: data.incident,
              incidentAt: data.incident_at,
              incidentCount
            }
          : null
      });
    }

    const formData = await request.formData();
    const culprit = String(formData.get('culprit') || 'Drake').trim() || 'Drake';
    const incident = String(formData.get('incident') || '').trim();

    if (!incident) {
      return jsonResponse(request, { error: 'Incident details are required' }, 400);
    }

    const incidentAt = normalizeIncidentAt(formData.get('incidentAt'));
    const savedIncident = await saveIncidentAndCount(supabase, culprit, incident, incidentAt);

    if (!savedIncident) {
      return jsonResponse(request, { error: 'Save failed' }, 500);
    }

    console.info('[admin-dog-incident] saved incident', {
      culprit: savedIncident.culprit,
      incidentAt: savedIncident.incidentAt,
      incidentCount: savedIncident.incidentCount
    });
    return jsonResponse(request, {
      incident: {
        culprit: savedIncident.culprit,
        incident: savedIncident.incident,
        incidentAt: savedIncident.incidentAt,
        incidentCount: savedIncident.incidentCount
      }
    });
  } catch (error) {
    console.error('[admin-dog-incident] unexpected error', formatError(error));
    return jsonResponse(request, { error: 'Unexpected error', details: formatError(error) }, 500);
  }
});
