message(0xf8a6ea5) UnStake {
    query_id: Int as uint64;
    amount: Int as uint64;
}
message(0xf8a5ea5) GetReward {
    query_id: Int as uint64;
}
message(0xf8a4ea5) SetJettonWallet {
    query_id: Int as uint64;
    wallet: Address;
}
message(0xf8a3ea5) TransferOwnerShip {
    query_id: Int as uint64;
    to_address: Address;
}