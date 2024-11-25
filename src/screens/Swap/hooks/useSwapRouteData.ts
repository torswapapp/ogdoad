import { addSeconds, formatDistanceStrict } from 'date-fns';
import { useMemo } from 'react';

import { useAppCurrency } from '@/realm/settings';

import { formatCurrency } from '@/utils/formatCurrency';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { isBtc } from '@/utils/isBtc';
import { unitConverter } from '@/utils/unitConverter';

import { useSwapContext } from '../components/SwapContext';

import { mergeFees } from '../utils/mergeFees';

import type { SwapRouteUIData } from '../types';

import { getDateLocale } from '/loc/date';

export const useSwapRouteData = (): SwapRouteUIData | undefined => {
  const {
    swapQuoteState: [swapQuoteResult],
    sourceTokenState: [sourceAsset],
    sourceAmountState: [sourceAssetAmount],
    targetAssetState: [targetAsset],
    swapFeesFiatValueState: [feeFiatValues],
  } = useSwapContext();

  const { currency } = useAppCurrency();

  return useMemo(() => {
    if (!swapQuoteResult || !sourceAsset || !targetAsset || !sourceAssetAmount) {
      return undefined;
    }

    const output = swapQuoteResult.to.amount ?? '0';
    const minOutput = swapQuoteResult.minAmountOut ?? '0';

    const sourceAssetAmountInTokenUnits = unitConverter.smallUnit2TokenUnit(sourceAssetAmount, sourceAsset.metadata.decimals);
    const targetAssetAmountInTokenUnits = unitConverter.smallUnit2TokenUnit(output, targetAsset.metadata.decimals);
    const ratio = targetAssetAmountInTokenUnits.dividedBy(sourceAssetAmountInTokenUnits).toString(10);

    const ratioToFormatted = formatTokenAmount(ratio, {
      compact: true,
      currency,
      highPrecision: true,
      isBtc: isBtc({ assetId: targetAsset.assetId }),
    });
    const rate = `1 ${sourceAsset.metadata.symbol} ≈ ${ratioToFormatted} ${targetAsset.metadata.symbol}`;

    const minOutputFormatted = formatTokenAmount(unitConverter.smallUnit2TokenUnit(minOutput, targetAsset.metadata.decimals).toString(10), {
      compact: true,
      currency,
      highPrecision: true,
      isBtc: isBtc({ assetId: targetAsset.assetId }),
    });

    const fees = mergeFees(swapQuoteResult.route.txSteps);

    const now = Date.now();
    const durationFormatted = swapQuoteResult.route.timeEstimate
      ? formatDistanceStrict(addSeconds(now, swapQuoteResult.route.timeEstimate), now, {
          locale: getDateLocale(),
        })
      : undefined;

    const feesTotal = feeFiatValues ? Object.values(feeFiatValues).reduce((a, b) => a + b, 0) : undefined;

    return {
      sourceAsset,
      sourceAssetAmount,
      targetAsset,
      rate,
      output,
      minOutput,
      minOutputFormatted,
      slippage: swapQuoteResult.swapSlippage ? `${swapQuoteResult.swapSlippage}%` : '-',
      transactionFeesTotalFiat: feesTotal ? formatCurrency(feesTotal, { currency }) : '-',
      fees,
      steps: swapQuoteResult.route.txSteps,
      duration: durationFormatted ? `~${durationFormatted}` : undefined,
    };
  }, [currency, feeFiatValues, sourceAsset, sourceAssetAmount, swapQuoteResult, targetAsset]);
};
