import type React from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';

import type { WithSpringConfig } from 'react-native-reanimated';

import { BlurView } from '@react-native-community/blur';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';

import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMenu } from '@/components/Menu/MenuProvider';
import { useTheme } from '@/theme/themes';
import { useAndroidBackButton } from '@/utils/useAndroidBackButton';

import { ContextMenu } from './ContextMenu';

import { DropdownMenu } from './DropdownMenu';

import { TooltipMenu, type TooltipMenuProps } from './TooltipMenu';

import type { ContextMenuProps } from './ContextMenu';
import type { DropdownMenuProps } from './DropdownMenu';

export type PositionProps = {
  origin: {
    x: number;
    y: number;
    offsetX: number;
    elementHeight: number;
  };
  menuWidth?: number;
  preferTop?: boolean;
};

export type PopupMenuProps<T> =
  | (ContextMenuProps & { type: 'context' })
  | (DropdownMenuProps<T> & { type: 'dropdown' })
  | (TooltipMenuProps & { type: 'tooltip' });
export type MenuOverlayProps<T = any> = PopupMenuProps<T> & PositionProps;

const springConfig: WithSpringConfig = {
  mass: 1,
  stiffness: 200,
  damping: 18,
};

export const MenuOverlay: React.FC<MenuOverlayProps<any>> = ({ origin, menuWidth, preferTop, ...props }) => {
  const [layout, setLayout] = useState<LayoutRectangle>();
  const { height, width } = useWindowDimensions();
  const { hide, setVisible } = useMenu();
  const { colors } = useTheme();
  const frame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  const horizontalAlign = origin.x < width / 2 ? 'left' : 'right';
  const transition = useSharedValue(0);

  useEffect(() => {
    transition.value = withSpring(1, springConfig);
  }, [transition]);

  const onClose = () => {
    setVisible(false);
    transition.value = withSpring(0, springConfig, finished => {
      if (finished) {
        runOnJS(hide)();
      }
    });
  };

  useAndroidBackButton(() => {
    onClose();
    return true;
  });

  const maxMenuHeight = useMemo(() => {
    if (origin.y - origin.elementHeight / 2 > height / 2) {
      return origin.y - insets.top - origin.elementHeight;
    }

    return height - origin.y - Platform.select({ ios: insets.bottom, default: 0 }) - 16;
  }, [height, insets.bottom, insets.top, origin.y, origin.elementHeight]);

  const horizontalPositionStyle = horizontalAlign === 'left' ? { left: 0 } : { right: 0 };

  const onLayout = (e: LayoutChangeEvent) => setLayout(e.nativeEvent.layout);

  const positionValues:
    | {
        translateOriginY: number;
        translateOriginX: number;
        additionalOffset: number;
        verticalAlign: 'top' | 'bottom';
      }
    | undefined = useMemo(() => {
    if (!layout) {
      return;
    }

    const maxBottom = frame.height - insets.bottom;
    const minTop = insets.top;
    const top = layout.y;
    const bottom = layout.height + layout.y;

    const translateOriginX = (layout.width / 2) * (horizontalAlign === 'left' ? -1 : 1);
    const translateOriginY = layout.height / -2;

    const verticalAlign = (preferTop && top >= minTop) || bottom > maxBottom ? 'top' : 'bottom';
    const additionalOffset = verticalAlign === 'top' ? -layout.height - origin.elementHeight : 0;

    return {
      verticalAlign,
      translateOriginX,
      translateOriginY,
      additionalOffset,
    };
  }, [frame.height, horizontalAlign, insets.bottom, insets.top, layout, origin.elementHeight, preferTop]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!positionValues) {
      return { opacity: 0 };
    }

    const { translateOriginY, translateOriginX, additionalOffset } = positionValues;

    return {
      transform: [
        { translateY: translateOriginY },
        { translateX: translateOriginX },
        { scale: interpolate(transition.value, [0, 1], [0.5, 1]) },
        { translateX: -translateOriginX },
        { translateY: -translateOriginY },
        { translateY: additionalOffset },
        { translateX: origin.offsetX },
      ],
      opacity: interpolate(transition.value, [0, 1], [0, 1]),
    };
  }, [layout]);

  return (
    <TouchableWithoutFeedback style={{ ...StyleSheet.absoluteFillObject }} onPress={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          testID="MenuOverlay"
          onLayout={onLayout}
          style={[
            styles.modalContent,
            !!menuWidth && { width: menuWidth },
            props.type !== 'tooltip' && Platform.OS === 'android' && styles.modalAndroid,
            horizontalPositionStyle,
            { maxHeight: maxMenuHeight, top: origin.y },
            animatedStyle,
          ]}>
          {props.type === 'tooltip' && <TooltipMenu horizontalAlign={horizontalAlign} verticalAlign={positionValues?.verticalAlign} {...props} />}
          {props.type === 'dropdown' && (
            <View style={[{ backgroundColor: colors.coreBackground }, styles.dropdown]}>
              <View style={{ backgroundColor: colors.purple_30 }}>
                <DropdownMenu {...props} onClose={onClose} />
              </View>
            </View>
          )}
          {props.type === 'context' && (
            <>
              <View style={[styles.blurBackground, { backgroundColor: Platform.select({ ios: colors.background, default: colors.androidDarkBlurBg }) }]} />
              <BlurView blurAmount={60} blurType="dark" style={styles.blur}>
                <ContextMenu {...props} onClose={onClose} />
              </BlurView>
            </>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalContent: {
    position: 'absolute',
    width: 284,
    borderRadius: 16,
    marginHorizontal: 24,
    flex: 1,
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 0,
      height: -12,
    },
    shadowRadius: 36,
  },
  modalAndroid: {
    overflow: 'hidden',
    elevation: 16,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    opacity: 0.3,
  },
  dropdown: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 16,
  },
});
