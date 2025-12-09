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
      // First, check if there's an active session for THIS table TODAY
      const { data: tableSession, error: tableError } = await supabase
        .rpc('get_session_by_fingerprint', {
          p_fingerprint: fingerprint,
          p_table_id: tableId
        });

      if (tableError) {
        console.error('Error checking session:', tableError);
        setNeedsName(true);
        setIsLoading(false);
        return;
      }

      // If we have a session for this table today, use it
      if (tableSession && tableSession.length > 0) {
        const sessionData = tableSession[0];
        setSession({
          id: sessionData.id,
          client_name: sessionData.client_name,
          device_fingerprint: sessionData.device_fingerprint,
          table_id: sessionData.table_id,
          is_active: sessionData.is_active
        });
        setNeedsName(false);
        setIsLoading(false);
        return;
      }

      // No session for this table today - check if client has a name from another table today
      const { data: existingName, error: nameError } = await supabase
        .rpc('get_client_name_for_today', {
          p_fingerprint: fingerprint
        });

      if (nameError) {
        console.error('Error checking existing name:', nameError);
        setNeedsName(true);
        setIsLoading(false);
        return;
      }

      // If client has a name from today, auto-create session for this table
      if (existingName) {
        const success = await createSession(existingName);
        if (!success) {
          setNeedsName(true);
        }
        setIsLoading(false);
        return;
      }

      // No name found for today - need to ask for name
      setNeedsName(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setNeedsName(true);
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
