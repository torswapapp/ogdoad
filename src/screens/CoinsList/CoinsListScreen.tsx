import sortBy from 'lodash/sortBy';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet, BottomSheetFlashList } from '@/components/BottomSheet';
import { FadingElement } from '@/components/FadingElement';
import { KeyboardAvoider } from '@/components/Keyboard';
import { NetworkFilter, useNetworkFilter } from '@/components/NetworkFilter';
import { SearchInput } from '@/components/SearchInput';
import { omitNetworkIcons } from '@/components/TokenIcon';
import { useBottomSheetScreenProps } from '@/hooks/useBottomSheetScreenProps';
import { useDebounceEffect } from '@/hooks/useDebounceEffect';
import { useTokenPrices } from '@/realm/tokenPrice';
import type { RealmToken } from '@/realm/tokens';
import { sortTokensAlphabetically, sortTokensByFiatValue, useTokensFilteredByReputationAndNetwork } from '@/realm/tokens';
import { useTokensGallery } from '@/realm/tokensGallery';
import type { NavigationProps } from '@/Routes';
import { isRealmObject } from '@/utils/isRealmObject';
import { navigationStyle } from '@/utils/navigationStyle';
import { runAfterUISync } from '@/utils/runAfterUISync';
import { safelyAnimateLayout } from '@/utils/safeLayoutAnimation';

import { tokenItemKeyExtractor } from '@/utils/tokenItemKeyExtractor';

import { RemoteAssetRow } from './components/RemoteAssetRow';
import { TokenRow } from './components/TokenRow';
import { GlobalFilter } from './GlobalFilter';
import { useFilteredTokensFromTokenLists } from './hooks/useFilteredTokensFromTokenLists';
import { ReputationFilter } from './ReputationFilter';

import { SEARCH_SCORE_TO_SORTING_INDEX, getSearchScore } from './utils/getSearchScore';
import { isRemoteAsset } from './utils/isRemoteAsset';

import type { Item } from './types';

import loc from '/loc';

const isInvalid = (item: Item) => {
  return !item || (isRealmObject(item) && !item.isValid());
};

const renderItemSeparator = () => <View style={styles.divider} />;

const getItemType = (item: Item): string => {
  if (isInvalid(item)) {
    return 'invalid';
  }
  return omitNetworkIcons[item.assetId] ? 'no_icon' : 'with_icon';
};

const INITIAL_TO_RENDER = 10;

export const CoinsListScreen = ({ navigation }: NavigationProps<'CoinsList'>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [networkFilter, setNetworkFilter] = useNetworkFilter();
  const tokenPrices = useTokenPrices();
  const tokensGallery = useTokensGallery();

  const tokensFromRealm = useTokensFilteredByReputationAndNetwork(networkFilter);
  const { withBalance, withoutBalance } = useMemo(() => {
    return {
      withBalance: tokensFromRealm.filtered('balance != $0', '0').sorted(sortTokensAlphabetically.realm),
      withoutBalance: tokensFromRealm.filtered('balance == $0', '0'),
    };
  }, [tokensFromRealm]);
  const tokensFromTokenLists = useFilteredTokensFromTokenLists(networkFilter, searchQuery);
  const tokenGalleryAndNativeTokens: RealmToken[] = useMemo(() => {
    return sortTokensByFiatValue(
      tokensFromRealm.filtered('balance != $0 || inGallery == "manuallyAdded" || inGallery == "autoAdded" || assetId = wallet.nativeTokenCaipId', '0'),
      tokenPrices,
    );
  }, [tokensFromRealm, tokenPrices]);

  const tokens: Item[] = useMemo(() => {
    if (searchQuery) {
      const searchKey = searchQuery.charAt(0).toLowerCase();

      const tokensFromTokenListsPreFiltered = [...(tokensFromTokenLists[searchKey] || [])];

      return withBalance.concat(sortBy(tokensFromTokenListsPreFiltered.concat([...withoutBalance] as []), sortTokensAlphabetically.lodash) as []);
    }
    return tokenGalleryAndNativeTokens;
  }, [tokensFromTokenLists, withBalance, withoutBalance, tokenGalleryAndNativeTokens, searchQuery]);

  const data = useMemo(() => {
    if (!searchQuery) {
      return tokens;
    }

    const searchQuery_ = searchQuery.toLowerCase();

    const tokensGroupedBySearchScore = {
      withBalance: Object.keys(SEARCH_SCORE_TO_SORTING_INDEX).map(() => [] as Item[]),
      withoutBalance: Object.keys(SEARCH_SCORE_TO_SORTING_INDEX).map(() => [] as Item[]),
    };

    tokens.forEach(t => {
      const score = getSearchScore(searchQuery_, t);

      if (score in SEARCH_SCORE_TO_SORTING_INDEX) {
        if (t.balance === '0') {
          tokensGroupedBySearchScore.withoutBalance[SEARCH_SCORE_TO_SORTING_INDEX[score]].push(t);
        } else {
          tokensGroupedBySearchScore.withBalance[SEARCH_SCORE_TO_SORTING_INDEX[score]].push(t);
        }
      }
    });

    return tokensGroupedBySearchScore.withBalance.flat().concat(tokensGroupedBySearchScore.withoutBalance.flat());
  }, [searchQuery, tokens]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if (isRemoteAsset(item)) {
        return <RemoteAssetRow remoteAsset={item} tokensGalleryLength={tokensGallery.length} />;
      }

      if (isInvalid(item)) {
        return null;
      }

      return <TokenRow token={item} tokensGalleryLength={tokensGallery.length} />;
    },
    [tokensGallery.length],
  );

  const [canRenderAll, setCanRenderAll] = useState(false);

  useEffect(() => {
    runAfterUISync(safelyAnimateLayout);
  }, [data]);

  useEffect(() => {
    safelyAnimateLayout();
  }, [canRenderAll]);

  const onChangeText = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  useDebounceEffect(
    () => {
      setSearchQuery(inputValue);
    },
    [inputValue],
    300,
  );

  const { bottomSheetProps } = useBottomSheetScreenProps(navigation);

  const insets = useSafeAreaInsets();

  const dimensions = useWindowDimensions();

  const onBottomSheetChange = (index: number) => index === 0 && setCanRenderAll(true);

  const estimatedListSize = useMemo(() => ({ width: dimensions.width, height: dimensions.height - 200 }), [dimensions]);

  return (
    <BottomSheet snapPoints={['100%']} onChange={onBottomSheetChange} {...bottomSheetProps}>
      <View style={styles.headerRow}>
        <SearchInput placeholder={loc.coins.search_placeholder} onChangeText={onChangeText} testID="TokenSearchInput" value={inputValue} />
        <GlobalFilter>
          <ReputationFilter />
        </GlobalFilter>
      </View>
      <NetworkFilter networkFilter={networkFilter} setNetworkFilter={setNetworkFilter} />
      <KeyboardAvoider style={styles.keyboardAvoider}>
        <FadingElement>
          <BottomSheetFlashList
            testID="CoinsListFlatList"
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustContentInsets
            data={canRenderAll ? data : data.slice(0, INITIAL_TO_RENDER)}
            renderItem={renderItem}
            keyExtractor={tokenItemKeyExtractor}
            ItemSeparatorComponent={renderItemSeparator}
            estimatedItemSize={60}
            estimatedListSize={estimatedListSize}
            getItemType={getItemType}
            contentContainerStyle={StyleSheet.flatten([styles.container, { paddingBottom: insets.bottom }])}
          />
        </FadingElement>
      </KeyboardAvoider>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  divider: {
    height: 6,
  },
  container: {
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 24,
    marginTop: 24,
  },
});

CoinsListScreen.navigationOptions = navigationStyle({
  animation: 'none',
  presentation: 'transparentModal',
  gestureEnabled: false,
  headerShown: false,
  contentStyle: {
    backgroundColor: 'transparent',
  },
});
