// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { Chain, Wallet } from './common.js';
import { WebbApiProvider } from './webb-provider.interface.js';

export interface WebbContextState<T = unknown> {
  wallets: Record<number, Wallet>;
  chains: Record<number, Chain>;
  activeApi?: WebbApiProvider<T>;
  activeWallet?: Wallet;
  activeChain?: Chain;

  setActiveChain(id: number): void;

  setActiveWallet(id: number): void;
}
