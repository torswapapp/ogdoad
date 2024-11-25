import type { RealmDefi } from '@/realm/defi/schema';
import { REALM_TYPE_DEFI } from '@/realm/defi/schema';
import { useObject } from '@/realm/RealmContext';

export const useDefiById = (id: string) => {
  return useObject<RealmDefi>(REALM_TYPE_DEFI, id, 'id');
};
