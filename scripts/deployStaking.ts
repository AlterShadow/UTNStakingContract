import { Address, toNano } from '@ton/core';
import { Staking } from '../wrappers/Staking';
import { NetworkProvider } from '@ton/blueprint';
import { SampleJetton } from '../wrappers/SampleJetton';
import { buildOnchainMetadata } from '../utils/jetton-helpers';
import { JettonDefaultWallet } from '../build/Staking/tact_JettonDefaultWallet';
import { JettonMaster } from '@ton/ton';

const jettonParams = {
    name: 'Best Practice',
    description: 'This is description of Test tact jetton',
    symbol: 'XXXE',
    image: 'https://play-lh.googleusercontent.com/ahJtMe0vfOlAu1XJVQ6rcaGrQBgtrEZQefHy7SXB7jpijKhu1Kkox90XDuH8RmcBOXNn',
};
let content = buildOnchainMetadata(jettonParams);

export async function run(provider: NetworkProvider) {
    // const staking = provider.open(
    //     await Staking.fromInit(
    //         provider.sender().address ?? Address.parse('EQCI4WyxPr7rQVaJRksq7ZAsz2KzpxMLiutzWzbIeEH7UvuD'),
    //         toNano('0.12'),
    //     ),
    // );

    // await staking.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: 'Deploy',
    //         queryId: 0n,
    //     },
    // );

    // await provider.waitForDeploy(staking.address);

    // const jettonContract = provider.open(
    //     await SampleJetton.fromInit(
    //         provider.sender().address ?? Address.parse('EQCTg62YqJ05aKsY1EFukODXpBXheoMx0kONqJe6NvkYjIUP'),
    //         content,
    //         toNano(100000),
    //     ),
    // );

    // await jettonContract.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: 'Deploy',
    //         queryId: 0n,
    //     },
    // );

    // await provider.waitForDeploy(jettonContract.address);

    // const staking = provider.open(
    //     Staking.fromAddress(Address.parse('EQCbtXqDntXry2pB66Ue37AaOPKibp2osHhLJXJmCCfeh8dL')),
    // );
    // const jettonContract = provider.open(
    //     JettonMaster.create(Address.parse('EQAPKqRFnQc-2m5Ogg0UUMNM0cZRdK4JUR2gN6wk8PX90_Wf')),
    // );

    // const staking = provider.open(
    //     Staking.fromAddress(Address.parse('EQCbtXqDntXry2pB66Ue37AaOPKibp2osHhLJXJmCCfeh8dL')),
    // );
    const jettonContract = provider.open(
        SampleJetton.fromAddress(Address.parse('EQDdDA_t-njb4JKufyFyTv_E0_CNIN9FitTFmuYFU9513B-L')),
    );

    await jettonContract.send(
        provider.sender(),
        { value: toNano('10') },
        {
            $$type: 'Mint',
            amount: toNano(1000),
            receiver: Address.parse('0QDGUkdgSugwTrxWLlOiliDAmWEFVGiB0aGmqsleb1T9w3r4'),
        },
    );

    // console.log(await jettonContract.getGetWalletAddress(staking.address));

    // await staking.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: 'SetJettonWallet',
    //         query_id: 0n,
    //         wallet: await jettonContract.getWalletAddress(staking.address),
    //     },
    // );

    // console.log('ID', await staking.getId());
}
