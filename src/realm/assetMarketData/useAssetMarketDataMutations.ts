import { useCallback } from 'react';
import Realm from 'realm';

import { useRealmTransaction } from '../hooks/useRealmTransaction';
import { useRealm } from '../RealmContext';

import { REALM_TYPE_TOKEN } from '../tokens';

import { REALM_TYPE_ASSET_MARKET_DATA } from './schema';

import type { AssetMarketData, RealmAssetMarketData } from './schema';
import type { RealmToken } from '../tokens';

export const useAssetMarketDataMutations = () => {
  const realm = useRealm();
  const { runInTransaction } = useRealmTransaction();

  const setAssetMarketData = useCallback(
    (assetMetadata: AssetMarketData) => {
      const tokens = realm.objects<RealmToken>(REALM_TYPE_TOKEN).filtered('assetId == $0', assetMetadata.assetId);
      runInTransaction(() => {
        const marketData = realm.create<RealmAssetMarketData>(REALM_TYPE_ASSET_MARKET_DATA, assetMetadata, Realm.UpdateMode.Modified);
        for (const token of tokens) {
          token.marketData = marketData;
        }
      });
    },
    [realm, runInTransaction],
  );

  const deleteAllAssetMarketData = useCallback(() => {
    realm.write(() => {
      realm.delete(realm.objects(REALM_TYPE_ASSET_MARKET_DATA));
    });
  }, [realm]);

  return {
    setAssetMarketData,
    deleteAllAssetMarketData,
  };
};
