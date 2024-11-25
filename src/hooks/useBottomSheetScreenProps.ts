import { useMemo, useRef } from 'react';

import type { BottomSheetRef } from '@/components/BottomSheet';
import type { NavigationProps, RouteProps } from '@/Routes';

export function useBottomSheetScreenProps<T extends keyof RouteProps>(navigation: NavigationProps<T>['navigation']) {
  const sheetRef = useRef<BottomSheetRef>(null);

  const close = () => sheetRef.current?.close();

  const bottomSheetProps = useMemo(
    () => ({
      onDismiss: navigation.goBack,
      ref: sheetRef,
      handleAndroidBackButton: true,
    }),
    [navigation.goBack],
  );

  return {
    bottomSheetProps,
    close,
  };
}
