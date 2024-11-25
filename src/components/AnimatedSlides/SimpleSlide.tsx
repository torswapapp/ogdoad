import type { PropsWithChildren } from 'react';

import type React from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { FadingElement } from '@/components/FadingElement';
import { FloatingBottomButtons } from '@/components/FloatingBottomButtons';
import type { TypographyKey } from '@/components/Label';
import { Label } from '@/components/Label';
import { useBottomSheetPadding } from '@/hooks/useBottomSheetPadding';

import type { LottieViewProps } from 'lottie-react-native';

type Props = {
  onButtonPress: () => void;
  buttonText: string;
  title: string;
  animation: LottieViewProps['source'];
  animationHeight?: number;
  contentOffset?: number;
  typeTitle?: TypographyKey;
};

export const SimpleSlide: React.FC<PropsWithChildren & Props> = ({
  title,
  animation,
  onButtonPress,
  buttonText,
  children,
  animationHeight,
  contentOffset,
  typeTitle,
}) => {
  const [lottieLayout, setLottieLayout] = useState<LayoutRectangle>();

  const onAnimationLayout = (e: LayoutChangeEvent) => {
    setLottieLayout(animationHeight ? { ...e.nativeEvent.layout, height: animationHeight } : e.nativeEvent.layout);
  };

  const paddingBottom = useBottomSheetPadding(false, -100 + 16);

  return (
    <View style={styles.flex}>
      <FadingElement y2="10%">
        <BottomSheetScrollView style={styles.flex} contentContainerStyle={[styles.flexGrow, lottieLayout && { paddingBottom }]}>
          <View style={lottieLayout ? lottieLayout : styles.flexGrow}>
            <LottieView source={animation} autoPlay loop={false} style={styles.flex} onLayout={onAnimationLayout} resizeMode="cover" />
          </View>
          <Animated.View style={contentOffset ? { ...styles.body, transform: [{ translateY: contentOffset }] } : styles.body}>
            <Label style={styles.labelContainer} type={typeTitle ?? 'headerWalletConnectTutorial'} entering={FadeInUp.delay(300)}>
              {title}
            </Label>
            {lottieLayout ? children : undefined}
          </Animated.View>
        </BottomSheetScrollView>
      </FadingElement>

      <FloatingBottomButtons
        primary={{
          exiting: FadeOut,
          text: buttonText,
          onPress: onButtonPress,
        }}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    transform: [{ translateY: -100 }],
  },
  labelContainer: {
    marginBottom: 16,
  },
});
