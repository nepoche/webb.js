// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import runtime from '@nepoche/type-definitions/runtime';

import definitions from '@polkadot/types/interfaces/runtime/definitions';
import { Definitions } from '@polkadot/types/types';

export default {
  rpc: {},
  types: {
    ...definitions.types,
    ...runtime.types
  }
} as Definitions;
