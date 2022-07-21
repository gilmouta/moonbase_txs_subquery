import { SubstrateEvent } from '@subql/types';
import { Account } from '../types/models/Account';
import { Transfer } from '../types/models/Transfer';
import { ProxyAnnounced } from '../types/models/ProxyAnnounced';
import { Balance } from '@polkadot/types/interfaces';

async function ensureAccounts(accountIds: string[]): Promise<void> {
    for (const accountId of accountIds) {
        const account = await Account.get(accountId);
        if (!account) {
            await new Account(accountId).save();
        }
    }
}

export async function handleTransfer(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [from, to, amount],
        },
    } = event;
    await ensureAccounts([from.toString(), to.toString()]);
    const transferInfo = new Transfer(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
    );
    transferInfo.fromId = from.toString();
    transferInfo.toId = to.toString();
    transferInfo.amount = (amount as Balance).toBigInt();
    transferInfo.blockNum = event.block.block.header.number.toNumber();
    //const roundInfo = (await api.query.parachainStaking.round()) as any;
    //transferInfo.round = roundInfo.current.toNumber();
    await transferInfo.save();
}

export async function handleProxyAnnounced(event: SubstrateEvent): Promise<void> {
    const [real, delegate, call_hash] = event.event.data.toJSON() as [string, string, string]
    
    // Add accounts to index
    await ensureAccounts([real, delegate]);

    // Create proxyAnnounce event in index
    const proxyAnnounced = new ProxyAnnounced(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
    );
    // Set event data
    proxyAnnounced.realId = real;
    proxyAnnounced.delegateId = delegate;
    proxyAnnounced.call_hash = (call_hash as string);
    proxyAnnounced.blockNum = event.block.block.header.number.toNumber();

    // Save entity with event data
    await proxyAnnounced.save();
}
