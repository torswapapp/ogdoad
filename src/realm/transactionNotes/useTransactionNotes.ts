import { useObject } from '../RealmContext';

import { REALM_TYPE_TRANSACTION_NOTES } from './schema';

import type { RealmTransactionNotes } from './schema';

export const useTransactionNotes = (walletId: string, transactionId: string) => {
  const notes = useObject<RealmTransactionNotes>(REALM_TYPE_TRANSACTION_NOTES, `${walletId}:${transactionId}`, 'id');

  return notes?.value;
};
