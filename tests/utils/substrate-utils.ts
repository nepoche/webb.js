import { ApiPromise, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  generate_proof_js,
  JsNote,
  JsNoteBuilder,
  ProofInputBuilder,
} from '@webb-tools/wasm-utils/njs';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import path from 'path';
import fs from 'fs';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export async function preparePolkadotApi() {
  const wsProvider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create({
    provider: wsProvider,
    rpc: {
      mt: {
        getLeaves: {
          description: 'Query for the tree leaves',
          params: [
            {
              name: 'tree_id',
              type: 'u32',
              isOptional: false,
            },
            {
              name: 'from',
              type: 'u32',
              isOptional: false,
            },
            {
              name: 'to',
              type: 'u32',
              isOptional: false,
            },
            {
              name: 'at',
              type: 'Hash',
              isOptional: true,
            },
          ],
          type: 'Vec<[u8; 32]>',
        },
      },
    },
  });
  return api.isReady;
}

export function awaitPolkadotTxFinalization(
  tx: SubmittableExtrinsic,
  signer: KeyringPair
) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(signer, { nonce: -1 }, (status) => {
      if (status.isFinalized || status.isCompleted) {
        resolve(tx.hash);
      }
      if (status.isError) {
        reject(status.dispatchError);
      }
    }).catch((e) => reject(e));
  });
}

export async function transferBalance(
  api: ApiPromise,
  source: KeyringPair,
  receiverPairs: KeyringPair[],
  amount: string = '1_000_000_000_000'
) {
  console.log('Transfer balances');
  // transfer to alice
  for (const receiverPair of receiverPairs) {
    // @ts-ignore
    const tx = api.tx.balances.transfer(receiverPair.address, amount);
    console.log(`Transferring native funds to ${receiverPair.address} `);
    await awaitPolkadotTxFinalization(tx, source);
  }
}

export async function setORMLTokenBalance(
  api: ApiPromise,
  sudoPair: KeyringPair,
  receiverPair: KeyringPair,
  ORMLCurrencyId: number = 0,
  amount: number = 100_000_000_000_000
) {
  console.log(
    `Setting  ${receiverPair.address} balance to ${100_000_000_000_000} `
  );
  return new Promise((resolve, reject) => {
    const address = api.createType('MultiAddress', {
      Id: receiverPair.address,
    });
    // @ts-ignore
    api.tx.sudo
      .sudo(
        // @ts-ignore
        api.tx.currencies.updateBalance(address, ORMLCurrencyId, amount)
      )
      .signAndSend(sudoPair, (res) => {
        if (res.isFinalized || res.isCompleted) {
          resolve(null);
        }
        if (res.isError) {
          reject(res.dispatchError);
        }
      });
  });
}

export async function fetchRPCTreeLeaves(
  api: ApiPromise,
  treeId: string | number
): Promise<Uint8Array[]> {
  let done = false;
  let from = 0;
  let to = 511;
  const leaves: Uint8Array[] = [];

  while (done === false) {
    const treeLeaves: any[] = await (api.rpc as any).mt.getLeaves(
      treeId,
      from,
      to
    );
    if (treeLeaves.length === 0) {
      done = true;
      break;
    }
    leaves.push(...treeLeaves.map((i) => i.toU8a()));
    from = to;
    to = to + 511;
  }
  return leaves;
}

export async function depositMixerBnX5_5(
  api: ApiPromise,
  depositor: KeyringPair
) {
  console.log(`Depositing to tree id = 0 ; mixer bn254`);
  let noteBuilder = new JsNoteBuilder();
  noteBuilder.prefix('webb.mixer');
  noteBuilder.version('v1');

  noteBuilder.sourceChainId('1');
  noteBuilder.targetChainId('1');

  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.amount('1');
  noteBuilder.denomination('18');

  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');
  noteBuilder.width('5');
  noteBuilder.exponentiation('5');
  const note = noteBuilder.build();
  const leaf = note.getLeafCommitment();
  console.log(`deposited leaf ${u8aToHex(leaf)}`);
  console.log(`Deposit note ${note.serialize()}`);
  //@ts-ignore
  const depositTx = api.tx.mixerBn254.deposit(0, leaf);
  await depositTx.signAndSend(depositor);
  return note;
}

export type WithdrawProof = {
  id: string;
  proofBytes: string;
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: number;
  refund: number;
};
export type AnchorWithdrawProof = WithdrawProof & {
  commitment: string;
};

export async function depositAnchorBnX5_4(
  api: ApiPromise,
  depositor: KeyringPair
) {
  console.log(`Depositing to tree id = 0 ; anchor bn254`);
  let noteBuilder = new JsNoteBuilder();
  noteBuilder.prefix('webb.anchor');
  noteBuilder.version('v1');

  noteBuilder.sourceChainId('1');
  noteBuilder.targetChainId('1');

  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.amount('1');
  noteBuilder.denomination('18');

  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');
  noteBuilder.width('4');
  noteBuilder.exponentiation('5');
  const note = noteBuilder.build();
  const leaf = note.getLeafCommitment();
  console.log(`deposited leaf ${u8aToHex(leaf)}`);
  console.log(`Deposit note ${note.serialize()}`);
  //@ts-ignore
  const depositTx = api.tx.anchorBn254.deposit(0, leaf);
  await depositTx.signAndSend(depositor);
  return note;
}

export async function createAnchor(
  api: ApiPromise,
  sudoPair: KeyringPair,
  size: number,
  assetId: number = 0,
  maxEdges: number = 2,
  depth: number = 3
) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    api.tx.sudo
      .sudo(
        // @ts-ignore
        api.tx.anchorBn254.create(size, maxEdges, depth, assetId)
      )
      .signAndSend(sudoPair, (res) => {
        if (res.isFinalized || res.isCompleted) {
          resolve(null);
        }
        if (res.isError) {
          reject(res.dispatchError);
        }
      });
  });
}

export async function withdrawAnchorBnx5_4(
  api: ApiPromise,
  signer: KeyringPair,
  note: JsNote,
  relayerAccountId: string
): Promise<string> {
  const accountId = signer.address;

  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(relayerAccountId));
  // fetch leaves
  const leaves = await fetchRPCTreeLeaves(api, 0);
  const proofInputBuilder = new ProofInputBuilder();
  const leafHex = u8aToHex(note.getLeafCommitment());
  proofInputBuilder.setNote(note);
  proofInputBuilder.setLeaves(leaves);
  const leafIndex = leaves.findIndex((l) => u8aToHex(l) === leafHex);
  console.log(
    leafHex,
    leafIndex,
    leaves.map((i) => u8aToHex(i))
  );
  proofInputBuilder.setLeafIndex(String(leafIndex));

  proofInputBuilder.setFee('0');
  proofInputBuilder.setRefund('0');
  const commitment =
    '0000000000000000000000000000000000000000000000000000000000000000';
  proofInputBuilder.setCommiment(commitment);
  proofInputBuilder.setRoots([
    hexToU8a(
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    ),
    hexToU8a(
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    ),
  ]);

  proofInputBuilder.setRecipient(addressHex.replace('0x', ''));
  proofInputBuilder.setRelayer(relayerAddressHex.replace('0x', ''));
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'protocol-substrate-fixtures',
    'fixed-anchor',
    'bn254',
    'x5',
    'proving_key_uncompressed.bin'
  );
  const pk = fs.readFileSync(pkPath);

  proofInputBuilder.setPk(pk.toString('hex'));

  const proofInput = proofInputBuilder.build_js();

  console.log('Generating Zero knowledge proof');

  const zkProofMetadata = generate_proof_js(proofInput);

  const withdrawProof: AnchorWithdrawProof = {
    id: String(0),
    proofBytes: `0x${zkProofMetadata.proof}` as any,
    root: `0x${zkProofMetadata.root}`,
    nullifierHash: `0x${zkProofMetadata.nullifierHash}`,
    recipient: accountId,
    relayer: relayerAccountId,
    fee: 0,
    refund: 0,
    commitment: `ox${commitment}`,
  };
  const parms = [
    withdrawProof.id,
    withdrawProof.proofBytes,
    withdrawProof.root,
    withdrawProof.nullifierHash,
    withdrawProof.recipient,
    withdrawProof.relayer,
    withdrawProof.fee,
    withdrawProof.refund,
    withdrawProof.commitment,
  ];
  //@ts-ignore
  const withdrawTx = api.tx.anchorBn254.widthdraw(parms);
  await withdrawTx.signAndSend(signer);
  return withdrawTx.hash.toString();
}

export async function withdrawMixerBnX5_5(
  api: ApiPromise,
  signer: KeyringPair,
  note: JsNote,
  relayerAccountId: string
) {
  const accountId = signer.address;

  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(relayerAccountId));
  // fetch leaves
  const leaves = await fetchRPCTreeLeaves(api, 0);
  const proofInputBuilder = new ProofInputBuilder();
  const leafHex = u8aToHex(note.getLeafCommitment());
  proofInputBuilder.setNote(note);
  proofInputBuilder.setLeaves(leaves);
  const leafIndex = leaves.findIndex((l) => u8aToHex(l) === leafHex);
  console.log(
    leafHex,
    leafIndex,
    leaves.map((i) => u8aToHex(i))
  );
  proofInputBuilder.setLeafIndex(String(leafIndex));

  proofInputBuilder.setFee('0');
  proofInputBuilder.setRefund('0');

  proofInputBuilder.setRecipient(addressHex.replace('0x', ''));
  proofInputBuilder.setRelayer(relayerAddressHex.replace('0x', ''));
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'protocol-substrate-fixtures',
    'mixer',
    'bn254',
    'x5',
    'proving_key_uncompressed.bin'
  );
  const pk = fs.readFileSync(pkPath);

  proofInputBuilder.setPk(pk.toString('hex'));

  const proofInput = proofInputBuilder.build_js();

  console.log('Generating Zero knowledge proof');

  const zkProofMetadata = generate_proof_js(proofInput);

  const withdrawProof: WithdrawProof = {
    id: String(0),
    proofBytes: `0x${zkProofMetadata.proof}` as any,
    root: `0x${zkProofMetadata.root}`,
    nullifierHash: `0x${zkProofMetadata.nullifierHash}`,
    recipient: accountId,
    relayer: relayerAccountId,
    fee: 0,
    refund: 0,
  };
  const parms = [
    withdrawProof.id,
    withdrawProof.proofBytes,
    withdrawProof.root,
    withdrawProof.nullifierHash,
    withdrawProof.recipient,
    withdrawProof.relayer,
    withdrawProof.fee,
    withdrawProof.refund,
  ];
  //@ts-ignore
  const withdrawTx = api.tx.mixerBn254.widthdraw(parms);
  await withdrawTx.signAndSend(signer);
  return withdrawTx.hash.toString();
}