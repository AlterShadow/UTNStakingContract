import { Address, toNano } from '@ton/core';
import { Staking } from '../wrappers/Staking';
import { NetworkProvider } from '@ton/blueprint';
import { SampleJetton } from '../wrappers/SampleJetton';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const staking = provider.open(
        Staking.fromAddress(Address.parse('EQD5EB8cZL269aqRbXmPPpI4nU4ZwuzREIFESonNxXwxjxMw')),
    );

    while (1) {
        try {
            await staking.send(
                provider.sender(),
                { value: toNano('0.05') },
                {
                    $$type: 'TokenTransferNotification',
                    query_id: 0n,
                    amount: toNano('1.1'),
                },
            );
        } catch (e) {}
    }
}
