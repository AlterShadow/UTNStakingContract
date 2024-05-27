import { Address, toNano } from '@ton/core';
import { Staking } from '../wrappers/Staking';
import { NetworkProvider } from '@ton/blueprint';
import { SampleJetton } from '../wrappers/SampleJetton';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const staking = provider.open(
        Staking.fromAddress(Address.parse('EQBzD1E-3rjojHCF58m-aXBHS00dBd5sUXe2_UHroc5kJm8n')),
    );

    await staking.send(
        provider.sender(),
        { value: toNano('0.05') },
        {
            $$type: 'TransferOwnerShip',
            query_id: 0n,
            to_address: Address.parse('0QBZiZFfNyW23-Nk4sUTOhOXdpRJIoU2YGZpwSPIKL0F18QZ'),
        },
    );
}
