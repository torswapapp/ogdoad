import { useObject } from '../RealmContext';

import { REALM_TYPE_WALLET_TRANSACTION } from './schema';

import type { RealmTransaction } from './schema';

export const useTransactionById = (compoundId: string) => {
  return useObject<RealmTransaction, string | undefined>(REALM_TYPE_WALLET_TRANSACTION, compoundId ?? undefined, 'id');
};
