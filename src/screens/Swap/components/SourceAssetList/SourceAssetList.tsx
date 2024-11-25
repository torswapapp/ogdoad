import { useHeaderHeight } from '@react-navigation/elements';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import type { BottomSheetRef } from '@/components/BottomSheet';
import { BottomSheet, BottomSheetFlashList } from '@/components/BottomSheet';
import { FadingElement } from '@/components/FadingElement';
import { KeyboardAvoider } from '@/components/Keyboard';
import { Label } from '@/components/Label';
import { NetworkFilter, useNetworkFilter } from '@/components/NetworkFilter';
import { getNetworkFilterFromCaip } from '@/components/NetworkFilter/getNetworkFilterFromCaip';
import { SearchInput } from '@/components/SearchInput';
import { useDebounceEffect } from '@/hooks/useDebounceEffect';
import { useTokenSearchQuery } from '@/hooks/useTokenSearchQuery';
import { useSwapSourceListQuery } from '@/reactQuery/hooks/useSwapSourceListQuery';
import { useTokenPrices } from '@/realm/tokenPrice';
import type { RealmToken } from '@/realm/tokens';
import { sortTokensByFiatValue, useTokensFilteredByReputationAndNetwork } from '@/realm/tokens';
import { runAfterUISync } from '@/utils/runAfterUISync';
import { safelyAnimateLayout } from '@/utils/safeLayoutAnimation';

import { tokenItemKeyExtractor } from '@/utils/tokenItemKeyExtractor';

import {
  SOURCE_ASSET_SHEET_OFFSET,
  SWAP_LIST_CACHE_DURATION,
  SWAP_NETWORKS_CAIP_IDS,
  SWAP_NETWORK_FILTER,
  SWAP_NETWORK_UI_FILTER,
} from '../../SwapScreen.constants';
import { EmptyState } from '../EmptyStateContainer';
import { SourceAssetListItem } from '../SourceAssetListItem';

import type { ListRenderItem } from '@shopify/flash-list';

import loc from '/loc';

type Props = {
  expandOnMount?: boolean;
  currentAsset: RealmToken;
  onSearchInputFocused: () => void;
  onAssetSelected: (token: RealmToken) => void;
  goBack: () => void;
  onClose: (wasTouched?: boolean) => void;
};

const renderItemSeparator = () => <View style={styles.divider} />;

export const SourceAssetList = React.forwardRef<BottomSheetRef, Props>(
  ({ onAssetSelected, currentAsset, onSearchInputFocused, goBack, onClose, expandOnMount = true }, ref) => {
    const tokenPrices = useTokenPrices();
    const isTouched = useRef<boolean>(false);

    const [networkFilter, setNetworkFilter] = useNetworkFilter([getNetworkFilterFromCaip(currentAsset.wallet.caipId)]);

    const tokens = useTokensFilteredByReputationAndNetwork(networkFilter.length ? networkFilter : SWAP_NETWORK_FILTER, true);
    const [inputValue, setInputValue] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>(inputValue);

    const { data: supportedAssets, isLoading } = useSwapSourceListQuery(SWAP_NETWORKS_CAIP_IDS, SWAP_LIST_CACHE_DURATION);

    const ownedTokens = useMemo(() => {
      return tokens.filtered("balance != '0'");
    }, [tokens]);

    const compatibleTokens = useMemo(() => {
      if (isLoading || !supportedAssets) {
        return [];
      }
      return sortTokensByFiatValue(ownedTokens.filtered('assetId IN $0', supportedAssets), tokenPrices);
    }, [tokenPrices, ownedTokens, supportedAssets, isLoading]);

    const data = useTokenSearchQuery(compatibleTokens, searchQuery);

    const hasOnlyUnsupportedTokens = !!ownedTokens.length && !compatibleTokens.length;

    const unsupportedAssetCount = ownedTokens.length - compatibleTokens.length;

    useEffect(() => {
      runAfterUISync(safelyAnimateLayout);
    }, [data.length]);

    const onChangeText = useCallback((text: string) => {
      setInputValue(text);
    }, []);

    useDebounceEffect(
      () => {
        setSearchQuery(inputValue);
      },
      [inputValue],
      250,
    );

    const clearSearch = () => setInputValue('');

    const headerHeight = useHeaderHeight();

    const { height, width } = useSafeAreaFrame();

    const snapPoints = useMemo(() => [height - headerHeight - SOURCE_ASSET_SHEET_OFFSET, height - headerHeight], [height, headerHeight]);

    const placeholderCount = useMemo(() => (snapPoints[0] - 240) / 60, [snapPoints]);

    const showSearchInput = isLoading || !!data.length || !!searchQuery || (ownedTokens.length && !!networkFilter.length);

    const showNetworkFilter = isLoading || !!data.length || (!!networkFilter.length && ownedTokens.length);

    const onSelected = useCallback(
      (asset: RealmToken) => {
        isTouched.current = true;
        onAssetSelected(asset);
      },
      [onAssetSelected],
    );

    const renderItem: ListRenderItem<RealmToken> = useCallback(
      ({ item }) => <SourceAssetListItem token={item} onSelected={onSelected} selected={item.id === currentAsset.id} />,
      [currentAsset.id, onSelected],
    );

    const renderListHeader = useCallback(
      () =>
        data.length ? (
          <Label color="light50" style={styles.listHeader}>
            {loc.swap.sourceListHeader}
          </Label>
        ) : null,
      [data.length],
    );

    const renderListFooter = useCallback(
      () =>
        data.length && unsupportedAssetCount ? (
          <Label type="regularBody" color="light75" style={styles.listFooter}>
            {loc.formatString(loc.swap.unsupportedAssetsHidden, { count: unsupportedAssetCount })}
          </Label>
        ) : null,
      [data.length, unsupportedAssetCount],
    );

    const renderEmptyContent = useCallback(
      () => (
        <EmptyState
          variant="sourceAssetList"
          isLoading={isLoading}
          isSearchResult={!!searchQuery}
          placeholderCount={placeholderCount}
          hasUnsupportedAssets={hasOnlyUnsupportedTokens}
          hasNetworkFilter={networkFilter.length > 0}
          clearSearch={clearSearch}
          goBack={goBack}
          clearNetworkFilter={() => setNetworkFilter([])}
        />
      ),
      [goBack, hasOnlyUnsupportedTokens, isLoading, networkFilter.length, placeholderCount, searchQuery, setNetworkFilter],
    );

    const estimatedListSize = useMemo(() => (!data.length ? undefined : { width, height: snapPoints[1] }), [width, snapPoints, data.length]);

    return (
      <BottomSheet
        index={expandOnMount ? 0 : -1}
        ref={ref}
        snapPoints={snapPoints}
        topInset={headerHeight}
        onChange={index => {
          if (index === -1) {
            onClose(isTouched.current);
            isTouched.current = false;
          }
        }}>
        {!!showSearchInput && (
          <Animated.View style={styles.header}>
            <SearchInput onFocus={onSearchInputFocused} value={inputValue} placeholder={loc.swap.sourceSearchPlaceholder} onChangeText={onChangeText} />
          </Animated.View>
        )}
        {!!showNetworkFilter && (
          <View style={styles.networkFilter}>
            <NetworkFilter networkFilter={networkFilter} setNetworkFilter={setNetworkFilter} dataToFilter={SWAP_NETWORK_UI_FILTER} />
          </View>
        )}
        <KeyboardAvoider style={styles.keyboardAvoider}>
          <FadingElement>
            <BottomSheetFlashList
              ListEmptyComponent={renderEmptyContent}
              ListHeaderComponent={renderListHeader}
              testID="CoinsListFlatList"
              data={data}
              extraData={currentAsset.id}
              renderItem={renderItem}
              keyExtractor={tokenItemKeyExtractor}
              ItemSeparatorComponent={renderItemSeparator}
              estimatedItemSize={60}
              estimatedListSize={estimatedListSize}
              contentContainerStyle={styles.list}
              ListFooterComponent={renderListFooter}
              keyboardShouldPersistTaps="handled"
            />
          </FadingElement>
        </KeyboardAvoider>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  networkFilter: {
    height: 40,
  },
  listHeader: {
    marginBottom: 8,
    marginHorizontal: 8,
  },
  listFooter: {
    textAlign: 'center',
    marginVertical: 16,
    marginHorizontal: 24,
  },
  list: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  keyboardAvoider: {
    flex: 1,
  },
  divider: {
    height: 6,
  },
});
