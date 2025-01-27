// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

export interface TornMixerEntry {
  size: number;
  address: string;
  symbol: string;
  createdAtBlock: number;
}

export interface MixerConfig {
  tornMixers: TornMixerEntry[];
}
