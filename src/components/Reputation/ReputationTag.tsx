import { SvgIcon } from '@/components/SvgIcon';
import { REPUTATION } from '@/hooks/useReputation';

import { useShouldFilterOut } from './useShouldFilterOut';

import type { FilterOut } from './useShouldFilterOut';

export const ReputationTagWhitelisted = () => {
  return <SvgIcon name="verified" color="kraken" size={16} bgColor="light100" />;
};

export const ReputationTagBlacklisted = () => {
  return <SvgIcon name="warning-filled" color="red400" size={16} />;
};

export const ReputationTagUnverified = () => {
  return <SvgIcon name="error" color="yellow500" size={16} />;
};

type ReputationTagProps = {
  assetId?: string;
  reputation: REPUTATION;
  filterOut?: FilterOut;
};

export const ReputationTag = ({ assetId = '', reputation, filterOut = { reputation: [], coinDesignation: ['network'] } }: ReputationTagProps) => {
  const shouldFilterOut = useShouldFilterOut({ assetId, reputation }, filterOut);

  if (shouldFilterOut) {
    return null;
  }

  if (reputation === REPUTATION.WHITELISTED) {
    return <ReputationTagWhitelisted />;
  }

  if (reputation === REPUTATION.BLACKLISTED) {
    return <ReputationTagBlacklisted />;
  }

  if (reputation === REPUTATION.UNVERIFIED) {
    return <ReputationTagUnverified />;
  }

  return null;
};
