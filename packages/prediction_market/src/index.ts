import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

/**
 * Contract IDs for deployed prediction market contracts
 */
export const CONTRACTS = {
  testnet: {
    predictionMarket: 'CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D',
    token: 'CAT42XQKNGT4PC2O5YINUQXFGOELKDGI6AOZCANRB7TCLGGRWCS2ZYD4',
  },
  mainnet: {
    predictionMarket: '', // Add mainnet contract ID when deployed
    token: '', // Add mainnet token contract ID when deployed
  },
} as const;

/**
 * Network configuration
 */
export const NETWORKS = {
  testnet: {
    contractId: CONTRACTS.testnet.predictionMarket,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  mainnet: {
    contractId: CONTRACTS.mainnet.predictionMarket,
    rpcUrl: 'https://soroban-rpc.mainnet.stellar.org:443',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
} as const;

/**
 * Helper function to create a client for a specific network
 */
export function createClient(network: keyof typeof NETWORKS, options?: Omit<ContractClientOptions, 'contractId' | 'rpcUrl' | 'networkPassphrase'>) {
  const networkConfig = NETWORKS[network];
  return new Client({
    ...options,
    contractId: networkConfig.contractId,
    rpcUrl: networkConfig.rpcUrl,
    networkPassphrase: networkConfig.networkPassphrase,
  });
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Markets", values: readonly [u64]} | {tag: "MarketCount", values: void} | {tag: "UserPredictions", values: readonly [string, u64]} | {tag: "PlatformFeeRate", values: void} | {tag: "WinningSide", values: readonly [u64]};

export type PredictionSide = {tag: "Yes", values: void} | {tag: "No", values: void};


export interface Prediction {
  amount: i128;
  side: PredictionSide;
}


export interface Market {
  created_at: u64;
  creator: string;
  description: string;
  end_time: u64;
  question: string;
  resolved: boolean;
  token: string;
  total_no: i128;
  total_yes: i128;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract with an admin address
   */
  initialize: ({admin}: {admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_market transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new prediction market
   */
  create_market: ({creator, question, description, token, end_time}: {creator: string, question: string, description: string, token: string, end_time: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a predict transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Place a prediction on a market
   */
  predict: ({user, market_id, side, amount}: {user: string, market_id: u64, side: PredictionSide, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a resolve_market transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolve a market (admin only) and distribute winnings
   */
  resolve_market: ({admin, market_id, winning_side}: {admin: string, market_id: u64, winning_side: PredictionSide}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_winnings transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim winnings from a resolved market
   */
  claim_winnings: ({user, market_id}: {user: string, market_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_market transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get market details
   */
  get_market: ({market_id}: {market_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Market>>

  /**
   * Construct and simulate a get_user_prediction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get user's prediction for a specific market
   */
  get_user_prediction: ({user, market_id}: {user: string, market_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<Prediction>>>

  /**
   * Construct and simulate a get_market_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total market count
   */
  get_market_count: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_platform_fee_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get platform fee rate
   */
  get_platform_fee_rate: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_platform_fee_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set platform fee rate (admin only)
   */
  set_platform_fee_rate: ({admin, fee_rate}: {admin: string, fee_rate: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a update_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update admin (admin only)
   */
  update_admin: ({admin, new_admin}: {admin: string, new_admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get admin address
   */
  get_admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_winning_side transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get winning side for a market
   */
  get_winning_side: ({market_id}: {market_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<PredictionSide>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAHTWFya2V0cwAAAAABAAAABgAAAAAAAAAAAAAAC01hcmtldENvdW50AAAAAAEAAAAAAAAAD1VzZXJQcmVkaWN0aW9ucwAAAAACAAAAEwAAAAYAAAAAAAAAAAAAAA9QbGF0Zm9ybUZlZVJhdGUAAAAAAQAAAAAAAAALV2lubmluZ1NpZGUAAAAAAQAAAAY=",
        "AAAAAgAAAAAAAAAAAAAADlByZWRpY3Rpb25TaWRlAAAAAAACAAAAAAAAAAAAAAADWWVzAAAAAAAAAAAAAAAAAk5vAAA=",
        "AAAAAQAAAAAAAAAAAAAAClByZWRpY3Rpb24AAAAAAAIAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAEc2lkZQAAB9AAAAAOUHJlZGljdGlvblNpZGUAAA==",
        "AAAAAQAAAAAAAAAAAAAABk1hcmtldAAAAAAACQAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAAQAAAAAAAAAAhlbmRfdGltZQAAAAYAAAAAAAAACHF1ZXN0aW9uAAAAEAAAAAAAAAAIcmVzb2x2ZWQAAAABAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAACHRvdGFsX25vAAAACwAAAAAAAAAJdG90YWxfeWVzAAAAAAAACw==",
        "AAAAAAAAAC1Jbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIGFuIGFkbWluIGFkZHJlc3MAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAB5DcmVhdGUgYSBuZXcgcHJlZGljdGlvbiBtYXJrZXQAAAAAAA1jcmVhdGVfbWFya2V0AAAAAAAABQAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAhxdWVzdGlvbgAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAIZW5kX3RpbWUAAAAGAAAAAQAAAAY=",
        "AAAAAAAAAB5QbGFjZSBhIHByZWRpY3Rpb24gb24gYSBtYXJrZXQAAAAAAAdwcmVkaWN0AAAAAAQAAAAAAAAABHVzZXIAAAATAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAAAAAARzaWRlAAAH0AAAAA5QcmVkaWN0aW9uU2lkZQAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAADVSZXNvbHZlIGEgbWFya2V0IChhZG1pbiBvbmx5KSBhbmQgZGlzdHJpYnV0ZSB3aW5uaW5ncwAAAAAAAA5yZXNvbHZlX21hcmtldAAAAAAAAwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAAAAAAx3aW5uaW5nX3NpZGUAAAfQAAAADlByZWRpY3Rpb25TaWRlAAAAAAAA",
        "AAAAAAAAACVDbGFpbSB3aW5uaW5ncyBmcm9tIGEgcmVzb2x2ZWQgbWFya2V0AAAAAAAADmNsYWltX3dpbm5pbmdzAAAAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAEAAAAL",
        "AAAAAAAAABJHZXQgbWFya2V0IGRldGFpbHMAAAAAAApnZXRfbWFya2V0AAAAAAABAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAQAAB9AAAAAGTWFya2V0AAA=",
        "AAAAAAAAACtHZXQgdXNlcidzIHByZWRpY3Rpb24gZm9yIGEgc3BlY2lmaWMgbWFya2V0AAAAABNnZXRfdXNlcl9wcmVkaWN0aW9uAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAQAAA+gAAAfQAAAAClByZWRpY3Rpb24AAA==",
        "AAAAAAAAABZHZXQgdG90YWwgbWFya2V0IGNvdW50AAAAAAAQZ2V0X21hcmtldF9jb3VudAAAAAAAAAABAAAABg==",
        "AAAAAAAAABVHZXQgcGxhdGZvcm0gZmVlIHJhdGUAAAAAAAAVZ2V0X3BsYXRmb3JtX2ZlZV9yYXRlAAAAAAAAAAAAAAEAAAAL",
        "AAAAAAAAACJTZXQgcGxhdGZvcm0gZmVlIHJhdGUgKGFkbWluIG9ubHkpAAAAAAAVc2V0X3BsYXRmb3JtX2ZlZV9yYXRlAAAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAhmZWVfcmF0ZQAAAAsAAAAA",
        "AAAAAAAAABlVcGRhdGUgYWRtaW4gKGFkbWluIG9ubHkpAAAAAAAADHVwZGF0ZV9hZG1pbgAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAABFHZXQgYWRtaW4gYWRkcmVzcwAAAAAAAAlnZXRfYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAB1HZXQgd2lubmluZyBzaWRlIGZvciBhIG1hcmtldAAAAAAAABBnZXRfd2lubmluZ19zaWRlAAAAAQAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAEAAAPoAAAH0AAAAA5QcmVkaWN0aW9uU2lkZQAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        create_market: this.txFromJSON<u64>,
        predict: this.txFromJSON<null>,
        resolve_market: this.txFromJSON<null>,
        claim_winnings: this.txFromJSON<i128>,
        get_market: this.txFromJSON<Market>,
        get_user_prediction: this.txFromJSON<Option<Prediction>>,
        get_market_count: this.txFromJSON<u64>,
        get_platform_fee_rate: this.txFromJSON<i128>,
        set_platform_fee_rate: this.txFromJSON<null>,
        update_admin: this.txFromJSON<null>,
        get_admin: this.txFromJSON<string>,
        get_winning_side: this.txFromJSON<Option<PredictionSide>>
  }
}