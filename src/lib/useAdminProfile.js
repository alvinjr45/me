import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';

export default function useAdminProfile() {
  const [imageUrl, setImageUrl] = useState('');
  const revision = useRef(0);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const current = revision.current;
    async function load() {
      try {
        const { data, error } = await supabase.from('ajt3_admin_profile').select('image_url').eq('id', 'admin').maybeSingle();
        if (active && current === revision.current && !error) setImageUrl(data?.image_url || '');
      } catch {
        // Initials remain available if the profile photo cannot be loaded.
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const updateImage = useCallback((url) => {
    revision.current += 1;
    setImageUrl(url);
  }, []);

  return { imageUrl, updateImage };
}
