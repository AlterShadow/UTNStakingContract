import "@stdlib/deploy";
import "./messages.tact";
import "./jetton.tact";
struct RewardInfo {
    current_reward: Int = 0;
    claimed_reward_amount: Int = 0;
    updated_at: Int;
}
struct StakedBalanceInfo {
    current_staked: Int = 0;
    unstaked_amount: Int = 0;
}

contract Staking with Deployable {
    const MinTonForStorage: Int = ton("0.01"); // enough for 1 KB of storage for 2.5 years

    this_contract_jettonWallet: Address?;
    prev_owner: Address;
    owner: Address;
    reward_rate: Int;
    total_tons_staked: Int;
    staked_balances: map<Address, StakedBalanceInfo>;
    rewards: map<Address, RewardInfo>;
    init(_owner: Address, _reward_rate: Int){
        self.prev_owner = _owner;
        self.owner = _owner;
        self.reward_rate = _reward_rate;
        self.total_tons_staked = 0;
    }

    fun earned(_account: Address): Int {
        let balance_info: StakedBalanceInfo = StakedBalanceInfo{current_staked: 0, unstaked_amount: 0};
        if (self.staked_balances.get(_account) != null) {
            balance_info = self.staked_balances.get(_account)!!;
        }
        let reward_info: RewardInfo = RewardInfo{current_reward: 0, claimed_reward_amount: 0, updated_at: now()};
        if (self.rewards.get(_account) != null) {
            reward_info = self.rewards.get(_account)!!;
        }
        let rate: Int = (now() - reward_info.updated_at) * self.reward_rate / 3600 * 24 * 365;
        let earned_ton: Int = balance_info.current_staked * rate;
        return (earned_ton / pow(10, 9) + reward_info.current_reward);
    }

    fun update_reward(_account: Address) {
        let estimated_reward: Int = self.earned(_account);
        let reward_info: RewardInfo = RewardInfo{current_reward: 0, claimed_reward_amount: 0, updated_at: now()};
        if (self.rewards.get(_account) != null) {
            reward_info = self.rewards.get(_account)!!;
        }
        reward_info.current_reward = estimated_reward;
        reward_info.updated_at = now();
        self.rewards.set(_account, reward_info);
    }

    receive(msg: UnStake){
        let ctx: Context = context();
        require(self.this_contract_jettonWallet != null, "jettonWallet is null");
        let balance_info: StakedBalanceInfo = StakedBalanceInfo{current_staked: 0, unstaked_amount: 0};
        if (self.staked_balances.get(ctx.sender) != null) {
            balance_info = self.staked_balances.get(ctx.sender)!!;
        }
        require(balance_info.current_staked >= msg.amount,
            "Staked balance should be greater than amount to be unstaked"
        );
        self.update_reward(ctx.sender);
        //update stake balance
        balance_info.current_staked -= msg.amount;
        balance_info.unstaked_amount += msg.amount;
        self.staked_balances.set(ctx.sender, balance_info);
        //update total stake balance
        self.total_tons_staked = (self.total_tons_staked - msg.amount);
        send(SendParameters{
                to: self.this_contract_jettonWallet!!,
                value: 0,
                mode: (SendRemainingValue + SendIgnoreErrors),
                bounce: false,
                body: TokenTransfer{
                    query_id: 0,
                    amount: msg.amount,
                    destination: ctx.sender,
                    response_destination: myAddress(),
                    custom_payload: null,
                    forward_ton_amount: ton("0.01"),
                    forward_payload: emptySlice()
                }.toCell()
            }
        );
    }

    receive(msg: TokenNotification){
        require(context().sender == self.this_contract_jettonWallet, "not from one of any jetton wallet");
        let balance_info: StakedBalanceInfo = StakedBalanceInfo{current_staked: 0, unstaked_amount: 0};
        if (self.staked_balances.get(msg.from) != null) {
            balance_info = self.staked_balances.get(msg.from)!!;
        }
        //store current reward
        self.update_reward(msg.from);
        balance_info.current_staked += msg.amount;
        self.staked_balances.set(msg.from, balance_info);
        self.total_tons_staked = (self.total_tons_staked + msg.amount);
    }

    receive(msg: GetReward){
        self.update_reward(context().sender);
        let reward_info: RewardInfo = RewardInfo{current_reward: 0, claimed_reward_amount: 0, updated_at: now()};
        if (self.rewards.get(context().sender) != null) {
            reward_info = self.rewards.get(context().sender)!!;
        }
        if (reward_info.current_reward > 0) {
            let claimable_reward: Int = reward_info.current_reward;
            reward_info.claimed_reward_amount += reward_info.current_reward;
            reward_info.current_reward = 0;
            reward_info.updated_at = now();
            self.rewards.set(context().sender, reward_info);
            send(SendParameters{
                    to: self.this_contract_jettonWallet!!,
                    value: 0,
                    mode: (SendRemainingValue + SendIgnoreErrors),
                    bounce: false,
                    body: TokenTransfer{
                        query_id: 0,
                        amount: claimable_reward,
                        destination: context().sender,
                        response_destination: myAddress(),
                        custom_payload: null,
                        forward_ton_amount: ton("0.01"),
                        forward_payload: emptySlice()
                    }.toCell()
                }
            );
        }
    }

    receive(msg: SetJettonWallet){
        require(context().sender == self.owner, "no owner");
        self.this_contract_jettonWallet = msg.wallet;
    }

    receive(msg: TransferOwnerShip){
        require(context().sender == self.owner, "no owner");
        self.owner = msg.to_address;
    }

    get fun get_rewards_data(): map<Address, RewardInfo> {
        return self.rewards;
    }

    get fun get_current_reward(_account: Address): RewardInfo {
        let reward_info: RewardInfo = RewardInfo{current_reward: 0, claimed_reward_amount: 0, updated_at: now()};
        if (self.rewards.get(_account) != null) {
            reward_info = self.rewards.get(_account)!!;
        }
        reward_info.current_reward = self.earned(_account);
        return reward_info;
    }

    get fun get_claimable_reward(_account: Address): Int {
        return self.earned(_account);
    }

    get fun get_staked_balances_data(): map<Address, StakedBalanceInfo> {
        return self.staked_balances;
    }

    get fun get_current_staked_balance(_account: Address): StakedBalanceInfo {
        let balance_info: StakedBalanceInfo = StakedBalanceInfo{current_staked: 0, unstaked_amount: 0};
        if (self.staked_balances.get(_account) != null) {
            balance_info = self.staked_balances.get(_account)!!;
        }
        return balance_info;
    }

    get fun get_total_tons_taked(): Int {
        return self.total_tons_staked;
    }
}