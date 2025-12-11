import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Settings {
  table_inactivity_minutes: number;
  no_sales_alert_days: number;
}

const DEFAULT_SETTINGS: Settings = {
  table_inactivity_minutes: 40,
  no_sales_alert_days: 15,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        const settingsMap: Settings = { ...DEFAULT_SETTINGS };
        data.forEach((row: { key: string; value: string }) => {
          if (row.key === 'table_inactivity_minutes') {
            settingsMap.table_inactivity_minutes = parseInt(row.value, 10) || DEFAULT_SETTINGS.table_inactivity_minutes;
          } else if (row.key === 'no_sales_alert_days') {
            settingsMap.no_sales_alert_days = parseInt(row.value, 10) || DEFAULT_SETTINGS.no_sales_alert_days;
          }
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: keyof Settings, value: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key, 
          value: value.toString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating setting:', error);
        return false;
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateSetting,
    refetch: fetchSettings,
  };
};
