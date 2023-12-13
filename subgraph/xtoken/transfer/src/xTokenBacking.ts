import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  TokenLocked,
  RemoteIssuingFailure,
} from "../generated/xTokenBacking/xTokenBacking"
import { xTokenNonceOrder, TransferRecord, RefundTransferRecord } from "../generated/schema"

const transferNonceId = "0x01";

export function handleTokenLocked(event: TokenLocked): void {
  let message_id = event.params.transferId.toHexString();
  let entity = TransferRecord.load(message_id);
  if (entity == null) {
      entity = new TransferRecord(message_id);
  }

  let counter = xTokenNonceOrder.load(transferNonceId);
  if (counter == null) {
      counter = new xTokenNonceOrder(transferNonceId);
      counter.count = BigInt.fromI32(0);
  }
  counter.count = counter.count + BigInt.fromI32(1);
  counter.save();

  entity.direction = 'lock';
  entity.remoteChainId = event.params.remoteChainId.toI32();
  entity.nonce = counter.count;
  entity.sender = event.params.sender;
  entity.receiver = event.params.recipient;
  entity.token = event.params.token;
  entity.amount = event.params.amount;
  entity.transactionHash = event.transaction.hash;
  entity.timestamp = event.block.timestamp;
  entity.fee = event.params.fee;
  entity.save();
}

// refund txs
export function handleRemoteIssuingFailure(event: RemoteIssuingFailure): void {
  let id = event.params.refundId.toHexString();
  let entity = RefundTransferRecord.load(id);
  if (entity == null) {
      entity = new RefundTransferRecord(id);
  }
  entity.sourceId = event.params.transferId.toHexString();
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}
