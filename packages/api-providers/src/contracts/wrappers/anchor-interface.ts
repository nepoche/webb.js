// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { Deposit } from '../utils/make-deposit.js';

export type AnchorInterface = {
  createDeposit(): Deposit;
  deposit(commitment: string): Promise<void>;
};
