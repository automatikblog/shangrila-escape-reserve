import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFingerprint } from './useFingerprint';

interface ClientSession {
  id: string;
  client_name: string;
  device_fingerprint: string;
  table_id: string;
  is_active: boolean;
}

export const useClientSession = (tableId: string | undefined) => {
  const { fingerprint, isLoading: fingerprintLoading } = useFingerprint();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsName, setNeedsName] = useState(false);

  const checkExistingSession = useCallback(async () => {
    if (!fingerprint || !tableId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_session_by_fingerprint', {
          p_fingerprint: fingerprint,
          p_table_id: tableId
        });

      if (error) {
        console.error('Error checking session:', error);
        setNeedsName(true);
        return;
      }

      if (data && data.length > 0) {
        const sessionData = data[0];
        setSession({
          id: sessionData.id,
          client_name: sessionData.client_name,
          device_fingerprint: sessionData.device_fingerprint,
          table_id: sessionData.table_id,
          is_active: sessionData.is_active
        });
        setNeedsName(false);
      } else {
        setNeedsName(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setNeedsName(true);
    } finally {
      setIsLoading(false);
    }
  }, [fingerprint, tableId]);

  useEffect(() => {
    if (!fingerprintLoading && fingerprint && tableId) {
      checkExistingSession();
    }
  }, [fingerprintLoading, fingerprint, tableId, checkExistingSession]);

  const createSession = async (clientName: string): Promise<boolean> => {
    if (!fingerprint || !tableId) return false;

    try {
      const { data, error } = await supabase
        .from('client_sessions')
        .insert({
          client_name: clientName,
          device_fingerprint: fingerprint,
          table_id: tableId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return false;
      }

      setSession(data);
      setNeedsName(false);
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  return {
    session,
    isLoading: isLoading || fingerprintLoading,
    needsName,
    createSession,
    fingerprint
  };
};
