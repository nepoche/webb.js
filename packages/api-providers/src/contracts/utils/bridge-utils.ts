/* eslint-disable */
/* tslint:disable */
// TODO resole eslint issue and merge this to protocol solidity
//@ts-nocheck
import { PoseidonHasher3 } from './poseidon-hash3.js';

/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

import { ethers } from 'ethers';
import crypto from 'crypto';
import * as ff from 'ffjavascript';
const { utils } = ff;

const { leBuff2int, unstringifyBigInts } = utils;
const rbigint = (nbytes) => leBuff2int(crypto.randomBytes(nbytes));
const poseidonHasher = new PoseidonHasher3();
const blankFunctionSig = '0x00000000';
const blankFunctionDepositerOffset = 0;
const AbiCoder = new ethers.utils.AbiCoder();

function bigNumberToPaddedBytes(num, digits = 32) {
  var n = num.toString(16).replace(/^0x/, '');
  while (n.length < digits * 2) {
    n = '0' + n;
  }
  return '0x' + n;
}

const toHex = (covertThis, padding) => {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(covertThis), padding);
};

const toFixedHex = (number, length = 32) =>
  '0x' +
  BigInt(`${number}`)
    .toString(16)
    .padStart(length * 2, '0');

const arrayToFixedHex = (array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = toFixedHex(array[i]);
  }
  return array;
};

const getRandomRecipient = () => rbigint(20);

const abiEncode = (valueTypes, values) => {
  return AbiCoder.encode(valueTypes, values);
};

const getFunctionSignature = (contractInstance, functionName) => {
  return contractInstance.abi.filter((abiProperty) => abiProperty.name === functionName)[0].signature;
};

const createERCDepositData = (tokenAmountOrID, lenRecipientAddress, recipientAddress) => {
  return (
    '0x' +
    toHex(tokenAmountOrID, 32).substr(2) + // Token amount or ID to deposit (32 bytes)
    toHex(lenRecipientAddress, 32).substr(2) + // len(recipientAddress)          (32 bytes)
    recipientAddress.substr(2)
  ); // recipientAddress               (?? bytes)
};

const createUpdateProposalData = (sourceChainID, blockHeight, merkleRoot) => {
  return (
    '0x' +
    toHex(sourceChainID, 32).substr(2) + // chainID (32 bytes)
    toHex(blockHeight, 32).substr(2) + // latest block height of incoming root updates (32 bytes)
    toHex(merkleRoot, 32).substr(2)
  ); // Updated Merkle Root (32 bytes)
};

const createRootsBytes = (rootArray) :`0x${string}` => {
  let neighborBytes = '0x';
  for (let i = 0; i < rootArray.length; i++) {
    neighborBytes += toFixedHex(rootArray[i]).substr(2);
  }
  return neighborBytes; // root byte string (32 * array.length bytes)
};

const advanceBlock = () => {
  const time = Math.floor(Date.now() / 1000);
  network.provider.send('evm_increaseTime', [time]);
  network.provider.send('evm_mine', []);
};

const createResourceID = (contractAddress, chainID) => {
  return toHex(contractAddress + toHex(chainID, 4).substr(2), 32);
};

const assertObjectsMatch = (expectedObj, actualObj) => {
  for (const expectedProperty of Object.keys(expectedObj)) {
    assert.property(actualObj, expectedProperty, `actualObj does not have property: ${expectedProperty}`);

    let expectedValue = expectedObj[expectedProperty];
    let actualValue = actualObj[expectedProperty];

    // If expectedValue is not null, we can expected actualValue to not be null as well
    if (expectedValue !== null) {
      // Handling mixed case ETH addresses
      // If expectedValue is a string, we can expected actualValue to be a string as well
      if (expectedValue.toLowerCase !== undefined) {
        expectedValue = expectedValue.toLowerCase();
        actualValue = actualValue.toLowerCase();
      }

      // Handling BigNumber.js instances
      if (actualValue.toNumber !== undefined) {
        actualValue = actualValue.toNumber();
      }

      // Truffle seems to return uint/ints as strings
      // Also handles when Truffle returns hex number when expecting uint/int
      if (
        (typeof expectedValue === 'number' && typeof actualValue === 'string') ||
        (ethers.utils.isHexString(actualValue) && typeof expectedValue === 'number')
      ) {
        actualValue = parseInt(actualValue);
      }
    }

    assert.deepEqual(
      expectedValue,
      actualValue,
      `expectedValue: ${expectedValue} does not match actualValue: ${actualValue}`
    );
  }
};
//uint72 nonceAndID = (uint72(depositNonce) << 8) | uint72(chainID);
const nonceAndId = (nonce, id) => {
  return (
    ethers.utils.hexZeroPad(ethers.utils.hexlify(nonce), 8) +
    ethers.utils.hexZeroPad(ethers.utils.hexlify(id), 1).substr(2)
  );
};

function generateDeposit(targetChainID = 0, secret = 31) {
  let deposit = {
    chainID: BigInt(targetChainID),
    secret: rbigint(secret),
    nullifier: rbigint(31)
  };

  deposit.commitment = poseidonHasher.hash3([deposit.chainID, deposit.nullifier, deposit.secret]);
  deposit.nullifierHash = poseidonHasher.hash(null, deposit.nullifier, deposit.nullifier);
  return deposit;
}

function hexifyBigInts(o) {
  if (typeof o === 'bigint') {
    let str = o.toString(16);
    while (str.length < 64) str = '0' + str;
    str = '0x' + str;
    return str;
  } else if (Array.isArray(o)) {
    return o.map(hexifyBigInts);
  } else if (typeof o == 'object') {
    const res = {};
    for (let k in o) {
      res[k] = hexifyBigInts(o[k]);
    }
    return res;
  } else {
    return o;
  }
}

// Convert a hex string to a byte array
function hexStringToBytes(str: string) {
  if (str.slice(0, 2) === '0x') {
    str = str.substr(2);
  }

  if (!str) {
    return new Uint8Array();
  }

  var a = [];
  for (var i = 0, len = str.length; i < len; i += 2) {
    // @ts-ignore
    a.push(parseInt(str.substr(i, 2), 16));
  }

  return new Uint8Array(a);
}

function toSolidityInput(proof, publicSignals) {
  const result = {
    pi_a: [proof.pi_a[0], proof.pi_a[1]],
    pi_b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]]
    ],
    pi_c: [proof.pi_c[0], proof.pi_c[1]]
  };

  result.publicSignals = publicSignals;

  return hexifyBigInts(unstringifyBigInts(result));
}

function p256(n) {
  let nstr = BigInt(n).toString(16);
  while (nstr.length < 64) nstr = '0' + nstr;
  nstr = `"0x${nstr}"`;

  return nstr;
}

async function groth16ExportSolidityCallData(proof, pub) {
  let inputs = '';
  for (let i = 0; i < pub.length; i++) {
    if (inputs != '') inputs = inputs + ',';
    inputs = inputs + p256(pub[i]);
  }

  let S;
  S =
    `[${p256(proof.pi_a[0])}, ${p256(proof.pi_a[1])}],` +
    `[[${p256(proof.pi_b[0][1])}, ${p256(proof.pi_b[0][0])}],[${p256(proof.pi_b[1][1])}, ${p256(proof.pi_b[1][0])}]],` +
    `[${p256(proof.pi_c[0])}, ${p256(proof.pi_c[1])}],` +
    `[${inputs}]`;

  return S;
}

async function generateWithdrawProofCallData(proof, pub) {
  const result = await groth16ExportSolidityCallData(proof, pub);
  const fullProof = JSON.parse('[' + result + ']');
  const pi_a = fullProof[0];
  const pi_b = fullProof[1];
  const pi_c = fullProof[2];

  let proofEncoded = [pi_a[0], pi_a[1], pi_b[0][0], pi_b[0][1], pi_b[1][0], pi_b[1][1], pi_c[0], pi_c[1]]
    .map((elt) => elt.substr(2))
    .join('');

  return proofEncoded;
}

export {
  advanceBlock,
  blankFunctionSig,
  blankFunctionDepositerOffset,
  bigNumberToPaddedBytes,
  getRandomRecipient,
  toFixedHex,
  arrayToFixedHex,
  toHex,
  hexStringToBytes,
  abiEncode,
  generateDeposit,
  getFunctionSignature,
  createERCDepositData,
  createUpdateProposalData,
  createRootsBytes,
  createResourceID,
  assertObjectsMatch,
  nonceAndId,
  poseidonHasher,
  toSolidityInput,
  p256,
  groth16ExportSolidityCallData,
  generateWithdrawProofCallData
};
