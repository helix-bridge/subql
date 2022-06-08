import { SubstrateEvent } from '@subql/types';
import { Block, BridgeDispatchEvent, Transfer } from '../types';
import { AccountHandler } from './account';

export class EventHandler {
  private event: SubstrateEvent;

  constructor(event: SubstrateEvent) {
    this.event = event;
  }

  get index() {
    return this.event.idx;
  }

  get blockNumber() {
    return this.event.block.block.header.number.toNumber();
  }

  get blockHash() {
    return this.event.block.block.hash.toString();
  }

  get events() {
    return this.event.block.events;
  }

  get section() {
    return this.event.event.section;
  }

  get method() {
    return this.event.event.method;
  }

  get data() {
    return this.event.event.data.toString();
  }

  get extrinsicHash() {
    const i = this.event?.extrinsic?.extrinsic?.hash?.toString();

    return i === 'null' ? undefined : i;
  }

  get eventHash() {
    return this.event.event.hash.toString();
  }

  get timestamp() {
    return this.event.block.timestamp;
  }

  public async save() {
    if (this.section === 'bridgePangoroDispatch') {
      await this.handleBridgeDispatchEvent();
    }

    if (this.method === 'DVMTransfer' && this.section === 'ethereum') {
      await this.handleDvmToSubstrate();
    } else if (this.method === 'Transfer' && this.section === 'balances') {
      await this.handleSubstrateToDvm();
    }
  }

  public async handleBridgeDispatchEvent() {
    const [_, [laneId, nonce]] = JSON.parse(this.data) as [string, [string, bigint]];
    const event = new BridgeDispatchEvent(this.s2sEventId(laneId, nonce));

    event.index = this.index;
    event.method = this.method;
    event.data = this.data;
    event.block = this.simpleBlock();

    await event.save();
  }

  // Dvm -> 15 -> Substrate
  private findDvmToSubstrate(router: string, count: number) {
    const event = this.event?.extrinsic?.events.find((item) => {
      if (item.event.method === 'DVMTransfer') {
        const [_1, to, amount] = JSON.parse(item.event.data.toString());
        if (count === amount && to === router) {
          return true;
        }
      }
      return false;
    });
    return event;
  }

  private async handleDvmToSubstrate() {
    const [from, to, amount] = JSON.parse(this.data);
    let sender = AccountHandler.formatAddress(from);
    const recipient = AccountHandler.formatAddress(to);
    const senderIsDvm = AccountHandler.isDvmAddress(sender);
    const recipientIsDvm = AccountHandler.isDvmAddress(recipient);

    if (senderIsDvm && !recipientIsDvm) {
      const event = this.findDvmToSubstrate(from, amount);

      if (!event) {
        return;
      }

      const [iFrom] = JSON.parse(event.event.data.toString());
      sender = AccountHandler.formatAddress(iFrom);
      const senderDvm = AccountHandler.truncateToDvmAddress(sender);
      await this.handleTransfer('crab-dvm', 'crab', senderDvm, recipient, amount);
    }
  }

  private async handleSubstrateToDvm() {
    const [from, to, amount] = JSON.parse(this.data);
    const sender = AccountHandler.formatAddress(from);
    const recipient = AccountHandler.formatAddress(to);
    const senderIsDvm = AccountHandler.isDvmAddress(sender);
    const recipientIsDvm = AccountHandler.isDvmAddress(recipient);

    if (!senderIsDvm && recipientIsDvm) {
      const recipientDvm = AccountHandler.truncateToDvmAddress(recipient);
      await this.handleTransfer('crab', 'crab-dvm', sender, recipientDvm, amount);
    }
  }

  private async handleTransfer(
    fromChain: string,
    toChain: string,
    sender: string,
    recipient: string,
    amount: number
  ) {
    await AccountHandler.ensureAccount(recipient);
    await AccountHandler.updateTransferStatistic(recipient);
    await AccountHandler.ensureAccount(sender);
    await AccountHandler.updateTransferStatistic(sender);

    const transfer = new Transfer(this.extrinsicHash);

    transfer.recipientId = recipient;
    transfer.senderId = sender;

    transfer.section = this.section;
    transfer.method = this.method;
    transfer.amount = BigInt(amount ?? 0);
    transfer.timestamp = this.timestamp;
    transfer.fromChain = fromChain;
    transfer.toChain = toChain;

    transfer.block = this.simpleBlock();

    try {
      await transfer.save();
    } catch (error) {
      console.log(error.message);
    }
  }

  private simpleBlock(): Block {
    return {
      blockHash: this.blockHash,
      number: this.blockNumber,
      specVersion: this.event.block.specVersion,
      extrinsicHash: this.extrinsicHash,
    };
  }

  private s2sEventId(laneId: string, nonce: bigint): string {
    return `${laneId}0x${nonce.toString(16)}`;
  }
}
