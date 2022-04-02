// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { AppConfig } from '@nepoche/api-providers/index.js';

import { InternalChainId } from '../chains/index.js';
import { WebbCurrencyId } from '../enums/index.js';

export const getAnchorAddressForBridge = (
  assetId: WebbCurrencyId,
  chainId: number,
  amount: number,
  bridgeConfigByAsset: AppConfig['bridgeByAsset']
): string | undefined => {
  const linkedAnchorConfig = bridgeConfigByAsset[assetId]?.anchors.find(
    (anchor) => anchor.amount === amount.toString()
  );

  if (!linkedAnchorConfig) {
    throw new Error('Unsupported configuration for bridge');
  }

  const anchorAddress = linkedAnchorConfig.anchorAddresses[chainId as InternalChainId];

  return anchorAddress;
};
