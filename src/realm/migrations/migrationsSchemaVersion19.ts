import { REALM_TYPE_PENDING_TRANSACTION } from '../transactions';

import type Realm from 'realm';

export const migrationsSchemaVersion19 = (oldRealm: Realm, newRealm: Realm) => {
  if (oldRealm.schemaVersion < 19) {
    newRealm.delete(newRealm.objects(REALM_TYPE_PENDING_TRANSACTION).filtered('wallet.type == $0', 'HDsegwitBech32'));
  }
};
