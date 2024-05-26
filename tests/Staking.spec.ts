import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, fromNano, toNano } from '@ton/core';
import { Staking } from '../wrappers/Staking';
import '@ton/test-utils';
import { SampleJetton } from '../build/Staking/tact_SampleJetton';
import { JettonMaster } from '@ton/ton';
import { JettonDefaultWallet } from '../build/Staking/tact_JettonDefaultWallet';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

const jettonParams = {
    name: 'Best Practice',
    description: 'This is description of Test tact jetton',
    symbol: 'XXXE',
    image: 'https://play-lh.googleusercontent.com/ahJtMe0vfOlAu1XJVQ6rcaGrQBgtrEZQefHy7SXB7jpijKhu1Kkox90XDuH8RmcBOXNn',
};
let content = buildOnchainMetadata(jettonParams);

describe('Staking', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let staker: SandboxContract<TreasuryContract>;
    let staking: SandboxContract<Staking>;
    let jettonContract: SandboxContract<SampleJetton>;
    let walletContract: SandboxContract<JettonDefaultWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        console.log('Deployer address: ', deployer.address);

        staking = blockchain.openContract(await Staking.fromInit(deployer.address, toNano('0.12')));

        const deployResult = await staking.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: staking.address,
            deploy: true,
            success: true,
        });

        console.log('StakingAddress: ' + staking.address);

        jettonContract = blockchain.openContract(await SampleJetton.fromInit(deployer.address, content, toNano(1000)));

        const jettonDeployResult = await jettonContract.send(
            deployer.getSender(),
            { value: toNano('10') },
            {
                $$type: 'Mint',
                amount: toNano(200),
                receiver: deployer.address,
            },
        );
        expect(jettonDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonContract.address,
            deploy: true,
            success: true,
        });

        let stakingContract_jettonWallet = await jettonContract.getGetWalletAddress(staking.address);
        console.log("StakingAddress's JettonWallet: " + stakingContract_jettonWallet);

        let deployer_jettonWallet = await jettonContract.getGetWalletAddress(deployer.address);

        console.log('Deployer JettonWallet: ', deployer_jettonWallet);

        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(deployer_jettonWallet));

        console.log('Deployer Jetton wallet balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        let transferJettonResult = await walletContract.send(
            deployer.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'TokenTransfer',
                query_id: 0n,
                amount: toNano(80),
                destination: staking.address,
                response_destination: deployer.address,
                custom_payload: null,
                forward_ton_amount: toNano('0.1'),
                forward_payload: beginCell().storeUint(0, 1).storeUint(0, 32).endCell(),
            },
        );

        expect(transferJettonResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: walletContract.address,
            success: true,
        });

        console.log('Deployer Jetton wallet balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(stakingContract_jettonWallet));
        console.log('Staking jettonwallet balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        const setJettonWalletResult = await staking.send(
            deployer.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'SetJettonWallet',
                query_id: 0n,
                wallet: stakingContract_jettonWallet,
            },
        );

        expect(setJettonWalletResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: staking.address,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and staking are ready to use
    });

    it('should increase counter', async () => {
        staker = await blockchain.treasury('staker');

        let deployer_jettonWallet = await jettonContract.getGetWalletAddress(deployer.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(deployer_jettonWallet));
        let transferJettonResult = await walletContract.send(
            deployer.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'TokenTransfer',
                query_id: 0n,
                amount: toNano(100),
                destination: staker.address,
                response_destination: deployer.address,
                custom_payload: null,
                forward_ton_amount: toNano('0.1'),
                forward_payload: beginCell().storeUint(0, 1).storeUint(0, 32).endCell(),
            },
        );

        expect(transferJettonResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: walletContract.address,
            success: true,
        });

        let stakingContract_jettonWallet = await jettonContract.getGetWalletAddress(staking.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(stakingContract_jettonWallet));
        console.log('Staking contract jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        let staker_jettonWallet = await jettonContract.getGetWalletAddress(staker.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(staker_jettonWallet));
        console.log('Staker contract jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        transferJettonResult = await walletContract.send(
            staker.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'TokenTransfer',
                query_id: 0n,
                amount: toNano(40),
                destination: staking.address,
                response_destination: staker.address,
                custom_payload: null,
                forward_ton_amount: toNano('0.1'),
                forward_payload: beginCell().storeUint(0, 1).storeUint(0, 32).endCell(),
            },
        );
        expect(transferJettonResult.transactions).toHaveTransaction({
            from: staker.address,
            to: walletContract.address,
            success: true,
        });


        stakingContract_jettonWallet = await jettonContract.getGetWalletAddress(staking.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(stakingContract_jettonWallet));
        console.log('Staking contract jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        staker_jettonWallet = await jettonContract.getGetWalletAddress(staker.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(staker_jettonWallet));
        console.log('Staker contract jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        const staked_balance_data = await staking.getGetStakedBalancesData();
        console.log(staker.address, staked_balance_data.values(), await staking.getGetTotalTonsTaked());
        
        console.log('rewards: ', (await staking.getGetRewardsData()).values());
        await new Promise((resolve) => setTimeout(() => resolve(1), 10000));
        console.log('rewards: ', await staking.getGetCurrentReward(staker.address));

        let unStakeResult = await staking.send(
            staker.getSender(),
            { value: toNano('10') },
            {
                $$type: 'UnStake',
                query_id: 0n,
                amount: toNano('30'),
            },
        );
        expect(unStakeResult.transactions).toHaveTransaction({
            from: staker.address,
            to: staking.address,
            success: true,
        });

        stakingContract_jettonWallet = await jettonContract.getGetWalletAddress(staking.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(stakingContract_jettonWallet));
        console.log('Staking contract jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));
        staker_jettonWallet = await jettonContract.getGetWalletAddress(staker.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(staker_jettonWallet));
        console.log('Staker jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));

        await new Promise((resolve) => setTimeout(() => resolve(1), 10000));

        const getRewardResult = await staking.send(
            staker.getSender(),
            { value: toNano('10') },
            {
                $$type: 'GetReward',
                query_id: 0n,
            },
        );
        expect(getRewardResult.transactions).toHaveTransaction({
            from: staker.address,
            to: staking.address,
            success: true,
        });

        const rewardsData = await staking.getGetRewardsData();
        console.log('rewards: ', fromNano((rewardsData.values())[0].claimed_reward_amount));
        stakingContract_jettonWallet = await jettonContract.getGetWalletAddress(staking.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(stakingContract_jettonWallet));
        console.log('Staking contract jetton balance: ', fromNano((await walletContract.getGetWalletData()).balance));
        staker_jettonWallet = await jettonContract.getGetWalletAddress(staker.address);
        walletContract = blockchain.openContract(JettonDefaultWallet.fromAddress(staker_jettonWallet));
        console.log(
            'Staker jetton balance: ',
            staker.address,
            fromNano((await walletContract.getGetWalletData()).balance),
        );
    }, 30000);
});
