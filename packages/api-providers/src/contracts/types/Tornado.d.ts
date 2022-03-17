/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  PayableOverrides,
  CallOverrides,
} from 'ethers';
import { BytesLike } from '@ethersproject/bytes';
import { Listener, Provider } from '@ethersproject/providers';
import { FunctionFragment, EventFragment, Result } from '@ethersproject/abi';
import type { TypedEventFilter, TypedEvent, TypedListener } from './common';

interface TornadoInterface extends ethers.utils.Interface {
  functions: {
    'FIELD_SIZE()': FunctionFragment;
    'ROOT_HISTORY_SIZE()': FunctionFragment;
    'ZERO_VALUE()': FunctionFragment;
    'commitments(bytes32)': FunctionFragment;
    'currentRootIndex()': FunctionFragment;
    'denomination()': FunctionFragment;
    'filledSubtrees(uint256)': FunctionFragment;
    'getLastRoot()': FunctionFragment;
    'hashLeftRight(address,bytes32,bytes32)': FunctionFragment;
    'hasher()': FunctionFragment;
    'isKnownRoot(bytes32)': FunctionFragment;
    'levels()': FunctionFragment;
    'nextIndex()': FunctionFragment;
    'nullifierHashes(bytes32)': FunctionFragment;
    'roots(uint256)': FunctionFragment;
    'verifier()': FunctionFragment;
    'zeros(uint256)': FunctionFragment;
    'deposit(bytes32)': FunctionFragment;
    'withdraw(bytes,bytes32,bytes32,address,address,uint256,uint256)': FunctionFragment;
    'isSpent(bytes32)': FunctionFragment;
    'isSpentArray(bytes32[])': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'FIELD_SIZE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'ROOT_HISTORY_SIZE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'ZERO_VALUE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'commitments', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'currentRootIndex', values?: undefined): string;
  encodeFunctionData(functionFragment: 'denomination', values?: undefined): string;
  encodeFunctionData(functionFragment: 'filledSubtrees', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'getLastRoot', values?: undefined): string;
  encodeFunctionData(functionFragment: 'hashLeftRight', values: [string, BytesLike, BytesLike]): string;
  encodeFunctionData(functionFragment: 'hasher', values?: undefined): string;
  encodeFunctionData(functionFragment: 'isKnownRoot', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'levels', values?: undefined): string;
  encodeFunctionData(functionFragment: 'nextIndex', values?: undefined): string;
  encodeFunctionData(functionFragment: 'nullifierHashes', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'roots', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'verifier', values?: undefined): string;
  encodeFunctionData(functionFragment: 'zeros', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'deposit', values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: 'withdraw',
    values: [BytesLike, BytesLike, BytesLike, string, string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: 'isSpent', values: [BytesLike]): string;
  encodeFunctionData(functionFragment: 'isSpentArray', values: [BytesLike[]]): string;

  decodeFunctionResult(functionFragment: 'FIELD_SIZE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'ROOT_HISTORY_SIZE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'ZERO_VALUE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'commitments', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'currentRootIndex', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'denomination', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'filledSubtrees', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getLastRoot', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'hashLeftRight', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'hasher', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isKnownRoot', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'levels', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'nextIndex', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'nullifierHashes', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'roots', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'verifier', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'zeros', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'deposit', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'withdraw', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isSpent', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isSpentArray', data: BytesLike): Result;

  events: {
    'Deposit(bytes32,uint32,uint256)': EventFragment;
    'Withdrawal(address,bytes32,address,uint256)': EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: 'Deposit'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'Withdrawal'): EventFragment;
}

export type DepositEvent = TypedEvent<
  [string, number, BigNumber] & {
    commitment: string;
    leafIndex: number;
    timestamp: BigNumber;
  }
>;

export type WithdrawalEvent = TypedEvent<
  [string, string, string, BigNumber] & {
    to: string;
    nullifierHash: string;
    relayer: string;
    fee: BigNumber;
  }
>;

export class Tornado extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: TornadoInterface;

  functions: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<[BigNumber]>;

    ROOT_HISTORY_SIZE(overrides?: CallOverrides): Promise<[number]>;

    ZERO_VALUE(overrides?: CallOverrides): Promise<[BigNumber]>;

    commitments(arg0: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    currentRootIndex(overrides?: CallOverrides): Promise<[number]>;

    denomination(overrides?: CallOverrides): Promise<[BigNumber]>;

    filledSubtrees(arg0: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    /**
     * Returns the last root
     */
    getLastRoot(overrides?: CallOverrides): Promise<[string]>;

    /**
     * Hash 2 tree leaves, returns MiMC(_left, _right)
     */
    hashLeftRight(_hasher: string, _left: BytesLike, _right: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    hasher(overrides?: CallOverrides): Promise<[string]>;

    /**
     * Whether the root is present in the root history
     */
    isKnownRoot(_root: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    levels(overrides?: CallOverrides): Promise<[number]>;

    nextIndex(overrides?: CallOverrides): Promise<[number]>;

    nullifierHashes(arg0: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    roots(arg0: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    verifier(overrides?: CallOverrides): Promise<[string]>;

    /**
     * provides Zero (Empty) elements for a MiMC MerkleTree. Up to 32 levels
     */
    zeros(i: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    /**
     * Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
     * @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
     */
    deposit(
      _commitment: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    /**
     * Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs `input` array consists of: - merkle root of all deposits in the contract - hash of unique deposit nullifier to prevent double spends - the recipient of funds - optional fee that goes to the transaction sender (usually a relay)
     */
    withdraw(
      _proof: BytesLike,
      _root: BytesLike,
      _nullifierHash: BytesLike,
      _recipient: string,
      _relayer: string,
      _fee: BigNumberish,
      _refund: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    /**
     * whether a note is already spent
     */
    isSpent(_nullifierHash: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    /**
     * whether an array of notes is already spent
     */
    isSpentArray(_nullifierHashes: BytesLike[], overrides?: CallOverrides): Promise<[boolean[]] & { spent: boolean[] }>;
  };

  FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

  ROOT_HISTORY_SIZE(overrides?: CallOverrides): Promise<number>;

  ZERO_VALUE(overrides?: CallOverrides): Promise<BigNumber>;

  commitments(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  currentRootIndex(overrides?: CallOverrides): Promise<number>;

  denomination(overrides?: CallOverrides): Promise<BigNumber>;

  filledSubtrees(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

  /**
   * Returns the last root
   */
  getLastRoot(overrides?: CallOverrides): Promise<string>;

  /**
   * Hash 2 tree leaves, returns MiMC(_left, _right)
   */
  hashLeftRight(_hasher: string, _left: BytesLike, _right: BytesLike, overrides?: CallOverrides): Promise<string>;

  hasher(overrides?: CallOverrides): Promise<string>;

  /**
   * Whether the root is present in the root history
   */
  isKnownRoot(_root: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  levels(overrides?: CallOverrides): Promise<number>;

  nextIndex(overrides?: CallOverrides): Promise<number>;

  nullifierHashes(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  roots(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

  verifier(overrides?: CallOverrides): Promise<string>;

  /**
   * provides Zero (Empty) elements for a MiMC MerkleTree. Up to 32 levels
   */
  zeros(i: BigNumberish, overrides?: CallOverrides): Promise<string>;

  /**
   * Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
   * @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
   */
  deposit(
    _commitment: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  /**
   * Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs `input` array consists of: - merkle root of all deposits in the contract - hash of unique deposit nullifier to prevent double spends - the recipient of funds - optional fee that goes to the transaction sender (usually a relay)
   */
  withdraw(
    _proof: BytesLike,
    _root: BytesLike,
    _nullifierHash: BytesLike,
    _recipient: string,
    _relayer: string,
    _fee: BigNumberish,
    _refund: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  /**
   * whether a note is already spent
   */
  isSpent(_nullifierHash: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  /**
   * whether an array of notes is already spent
   */
  isSpentArray(_nullifierHashes: BytesLike[], overrides?: CallOverrides): Promise<boolean[]>;

  callStatic: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT_HISTORY_SIZE(overrides?: CallOverrides): Promise<number>;

    ZERO_VALUE(overrides?: CallOverrides): Promise<BigNumber>;

    commitments(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    currentRootIndex(overrides?: CallOverrides): Promise<number>;

    denomination(overrides?: CallOverrides): Promise<BigNumber>;

    filledSubtrees(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

    /**
     * Returns the last root
     */
    getLastRoot(overrides?: CallOverrides): Promise<string>;

    /**
     * Hash 2 tree leaves, returns MiMC(_left, _right)
     */
    hashLeftRight(_hasher: string, _left: BytesLike, _right: BytesLike, overrides?: CallOverrides): Promise<string>;

    hasher(overrides?: CallOverrides): Promise<string>;

    /**
     * Whether the root is present in the root history
     */
    isKnownRoot(_root: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    levels(overrides?: CallOverrides): Promise<number>;

    nextIndex(overrides?: CallOverrides): Promise<number>;

    nullifierHashes(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    roots(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

    verifier(overrides?: CallOverrides): Promise<string>;

    /**
     * provides Zero (Empty) elements for a MiMC MerkleTree. Up to 32 levels
     */
    zeros(i: BigNumberish, overrides?: CallOverrides): Promise<string>;

    /**
     * Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
     * @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
     */
    deposit(_commitment: BytesLike, overrides?: CallOverrides): Promise<void>;

    /**
     * Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs `input` array consists of: - merkle root of all deposits in the contract - hash of unique deposit nullifier to prevent double spends - the recipient of funds - optional fee that goes to the transaction sender (usually a relay)
     */
    withdraw(
      _proof: BytesLike,
      _root: BytesLike,
      _nullifierHash: BytesLike,
      _recipient: string,
      _relayer: string,
      _fee: BigNumberish,
      _refund: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    /**
     * whether a note is already spent
     */
    isSpent(_nullifierHash: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    /**
     * whether an array of notes is already spent
     */
    isSpentArray(_nullifierHashes: BytesLike[], overrides?: CallOverrides): Promise<boolean[]>;
  };

  filters: {
    'Deposit(bytes32,uint32,uint256)'(
      commitment?: BytesLike | null,
      leafIndex?: null,
      timestamp?: null
    ): TypedEventFilter<[string, number, BigNumber], { commitment: string; leafIndex: number; timestamp: BigNumber }>;

    Deposit(
      commitment?: BytesLike | null,
      leafIndex?: null,
      timestamp?: null
    ): TypedEventFilter<[string, number, BigNumber], { commitment: string; leafIndex: number; timestamp: BigNumber }>;

    'Withdrawal(address,bytes32,address,uint256)'(
      to?: null,
      nullifierHash?: null,
      relayer?: string | null,
      fee?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber],
      { to: string; nullifierHash: string; relayer: string; fee: BigNumber }
    >;

    Withdrawal(
      to?: null,
      nullifierHash?: null,
      relayer?: string | null,
      fee?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber],
      { to: string; nullifierHash: string; relayer: string; fee: BigNumber }
    >;
  };

  estimateGas: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT_HISTORY_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    ZERO_VALUE(overrides?: CallOverrides): Promise<BigNumber>;

    commitments(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    currentRootIndex(overrides?: CallOverrides): Promise<BigNumber>;

    denomination(overrides?: CallOverrides): Promise<BigNumber>;

    filledSubtrees(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Returns the last root
     */
    getLastRoot(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Hash 2 tree leaves, returns MiMC(_left, _right)
     */
    hashLeftRight(_hasher: string, _left: BytesLike, _right: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    hasher(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Whether the root is present in the root history
     */
    isKnownRoot(_root: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    levels(overrides?: CallOverrides): Promise<BigNumber>;

    nextIndex(overrides?: CallOverrides): Promise<BigNumber>;

    nullifierHashes(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    roots(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    verifier(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * provides Zero (Empty) elements for a MiMC MerkleTree. Up to 32 levels
     */
    zeros(i: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
     * @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
     */
    deposit(
      _commitment: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    /**
     * Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs `input` array consists of: - merkle root of all deposits in the contract - hash of unique deposit nullifier to prevent double spends - the recipient of funds - optional fee that goes to the transaction sender (usually a relay)
     */
    withdraw(
      _proof: BytesLike,
      _root: BytesLike,
      _nullifierHash: BytesLike,
      _recipient: string,
      _relayer: string,
      _fee: BigNumberish,
      _refund: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    /**
     * whether a note is already spent
     */
    isSpent(_nullifierHash: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * whether an array of notes is already spent
     */
    isSpentArray(_nullifierHashes: BytesLike[], overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROOT_HISTORY_SIZE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ZERO_VALUE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    commitments(arg0: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    currentRootIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    denomination(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    filledSubtrees(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Returns the last root
     */
    getLastRoot(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Hash 2 tree leaves, returns MiMC(_left, _right)
     */
    hashLeftRight(
      _hasher: string,
      _left: BytesLike,
      _right: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    hasher(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Whether the root is present in the root history
     */
    isKnownRoot(_root: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    levels(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    nextIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    nullifierHashes(arg0: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    roots(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    verifier(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * provides Zero (Empty) elements for a MiMC MerkleTree. Up to 32 levels
     */
    zeros(i: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
     * @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
     */
    deposit(
      _commitment: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    /**
     * Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs `input` array consists of: - merkle root of all deposits in the contract - hash of unique deposit nullifier to prevent double spends - the recipient of funds - optional fee that goes to the transaction sender (usually a relay)
     */
    withdraw(
      _proof: BytesLike,
      _root: BytesLike,
      _nullifierHash: BytesLike,
      _recipient: string,
      _relayer: string,
      _fee: BigNumberish,
      _refund: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    /**
     * whether a note is already spent
     */
    isSpent(_nullifierHash: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * whether an array of notes is already spent
     */
    isSpentArray(_nullifierHashes: BytesLike[], overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}