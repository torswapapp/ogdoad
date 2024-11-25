import type { Transaction } from '@/api/types';
import type { NETWORK_FILTER } from '@/components/NetworkFilter/types';
import { ChainAgnostic } from '@/onChain/wallets/utils/ChainAgnostic';

import { TRANSACTION_TYPES } from './const';
import { getTransactionMetadata } from './getTransactionMetadata';

import { memoizedJSONParseTx } from './utils';

import type { RealmTransaction } from './schema';
import type Realm from 'realm';

export function isAssetInvolvedInTransaction(obj: Transaction, assetId: string): boolean {
  for (const effect of obj.effects) {
    if (effect.type === TRANSACTION_TYPES.SWAP) {
      if (effect.receive.assetId === assetId || effect.spent.assetId === assetId) {
        return true;
      }
    }
    if ('assetId' in effect && effect.assetId === assetId) {
      return true;
    }
  }
  return false;
}

export function isNativeAssetInvolvedInTransaction(obj: Transaction, assetId: string): boolean {
  const classifiedTx = getTransactionMetadata(obj);
  if (classifiedTx.kind === 'simple' && classifiedTx.type === TRANSACTION_TYPES.RECEIVE && classifiedTx.effect.assetId !== assetId) {
    return false;
  }
  return true;
}
export function filterTransactionsByNetwork<T>(transactions: Realm.Results<T>, networkFilter: NETWORK_FILTER[]) {
  const phrases = networkFilter.map((item, index) => `wallet.nativeTokenCaipId BEGINSWITH $${index}`);
  const filterPhrase = phrases.join(' OR ');
  return transactions.filtered(filterPhrase, ...networkFilter);
}

export function filterTransactionsByAssetInvolvement(transactions: Array<RealmTransaction>, assetId?: string) {
  if (!assetId) {
    return transactions;
  }
  const isNativeAsset = Object.values(ChainAgnostic).includes(assetId);
  if (isNativeAsset) {
    return transactions.filter(transaction => isNativeAssetInvolvedInTransaction(memoizedJSONParseTx(transaction.data), assetId));
  }
  return transactions.filter(transaction => isAssetInvolvedInTransaction(memoizedJSONParseTx(transaction.data), assetId));
}
