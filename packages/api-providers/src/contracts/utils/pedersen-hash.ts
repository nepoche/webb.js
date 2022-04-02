// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line  @typescript-eslint/no-var-requires
// @ts-ignore
import circomlib from 'tornado-circomlib';

export function pedersenHash (data: Uint8Array) {
  return circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
}
