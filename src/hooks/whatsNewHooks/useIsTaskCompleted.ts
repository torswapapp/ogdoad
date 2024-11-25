import type { SettingsType } from '@/realm/settings';
import { useSettingsByKey } from '@/realm/settings';

export const useIsTaskCompleted = (taskKey: keyof SettingsType) => {
  const taskCompleted = useSettingsByKey(taskKey);

  return !(taskCompleted === false);
};
