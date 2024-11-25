import { useCallback } from 'react';
import Realm from 'realm';

import type { DefiPositionsResponse } from '@/api/fetchDefiPositions';
import { useRealm } from '@/realm/RealmContext';
import type { RealmFiatRates } from '@/realm/usdFiatRates/schema';
import { REALM_TYPE_FIAT_RATES } from '@/realm/usdFiatRates/schema';

export const useUsdFiatRatesMutations = () => {
  const realm = useRealm();
  const saveFiatRates = useCallback(
    (fiatRatesResponse: DefiPositionsResponse['fiatRates']) => {
      const fiatRatesList = Object.entries(fiatRatesResponse).map(([iso, value]) => ({
        iso,
        value,
      }));

      realm.write(() => {
        for (const fiatRates of fiatRatesList) {
          realm.create<RealmFiatRates>(REALM_TYPE_FIAT_RATES, fiatRates, Realm.UpdateMode.Modified);
        }
      });
    },
    [realm],
  );

  return {
    saveFiatRates,
  };
};
