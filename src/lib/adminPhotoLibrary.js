import { getSupabaseFunctionHeaders, readResponsePayload } from './adminPostEditor';

export async function requestPhotoLibrary(secret, payload, { signal } = {}) {
  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  if (!baseUrl || !secret) throw new Error('Sign in before managing photos.');
  const isForm = payload instanceof FormData;
  const response = await fetch(`${baseUrl}/functions/v1/admin-photo-library`, {
    method: 'POST',
    headers: { ...getSupabaseFunctionHeaders({ json: !isForm }), 'x-admin-secret': secret },
    body: isForm ? payload : JSON.stringify(payload),
    signal
  });
  const result = await readResponsePayload(response);
  if (!response.ok) throw new Error(result.data?.error || 'The photo service is unavailable. Check that the photo-library migration and function are deployed.');
  if (!result.data) throw new Error('The photo service returned an invalid response.');
  return result.data;
}

export function notifyPhotoLibraryChanged() {
  window.dispatchEvent(new Event('ajt3-photos-updated'));
  try {
    window.localStorage.setItem('ajt3-photos-updated', String(Date.now()));
  } catch {
    // The current tab still receives library updates when storage is unavailable.
  }
}
