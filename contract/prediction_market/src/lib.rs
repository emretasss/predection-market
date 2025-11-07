#![no_std]

use soroban_sdk::{
    contract, contractimpl, contractmeta, contracttype, token, Address, Env, String,
};

mod test;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Markets(u64),
    MarketCount,
    UserPredictions(Address, u64), // User -> MarketId -> Prediction
    PlatformFeeRate,
    WinningSide(u64),              // MarketId -> WinningSide
}

#[derive(Clone, Copy)]
#[contracttype]
pub enum PredictionSide {
    Yes,
    No,
}

#[derive(Clone)]
#[contracttype]
pub struct Prediction {
    pub side: PredictionSide,
    pub amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct Market {
    pub creator: Address,
    pub question: String,
    pub description: String,
    pub token: Address,         // Token used for betting
    pub end_time: u64,          // Unix timestamp
    pub created_at: u64,        // Unix timestamp
    pub total_yes: i128,
    pub total_no: i128,
    pub resolved: bool,
}

fn has_admin(e: &Env) -> bool {
    e.storage().instance().has(&DataKey::Admin)
}

fn get_admin(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::Admin).unwrap()
}

fn set_admin(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}

fn get_market_count(e: &Env) -> u64 {
    e.storage()
        .instance()
        .get(&DataKey::MarketCount)
        .unwrap_or(0)
}

fn set_market_count(e: &Env, count: u64) {
    e.storage().instance().set(&DataKey::MarketCount, &count);
}

fn get_market(e: &Env, market_id: u64) -> Market {
    e.storage()
        .persistent()
        .get(&DataKey::Markets(market_id))
        .unwrap()
}

fn set_market(e: &Env, market_id: u64, market: &Market) {
    e.storage()
        .persistent()
        .set(&DataKey::Markets(market_id), market);
}

fn get_user_prediction(e: &Env, user: &Address, market_id: u64) -> Option<Prediction> {
    e.storage()
        .persistent()
        .get(&DataKey::UserPredictions(user.clone(), market_id))
}

fn set_user_prediction(e: &Env, user: &Address, market_id: u64, prediction: &Prediction) {
    e.storage()
        .persistent()
        .set(&DataKey::UserPredictions(user.clone(), market_id), prediction);
}

fn get_platform_fee_rate(e: &Env) -> i128 {
    e.storage()
        .instance()
        .get(&DataKey::PlatformFeeRate)
        .unwrap_or(200) // Default 2% (200 basis points)
}

fn set_platform_fee_rate(e: &Env, rate: i128) {
    if rate < 0 || rate > 10000 {
        panic!("fee rate must be between 0 and 10000 (0-100%)");
    }
    e.storage().instance().set(&DataKey::PlatformFeeRate, &rate);
}

fn transfer_tokens(e: &Env, token: &Address, from: &Address, to: &Address, amount: i128) {
    token::Client::new(e, token).transfer(from, to, &amount);
}

fn get_winning_side(e: &Env, market_id: u64) -> Option<PredictionSide> {
    e.storage()
        .persistent()
        .get(&DataKey::WinningSide(market_id))
}

fn set_winning_side(e: &Env, market_id: u64, side: PredictionSide) {
    e.storage()
        .persistent()
        .set(&DataKey::WinningSide(market_id), &side);
}

// Contract metadata
contractmeta!(
    key = "Description",
    val = "Decentralized Prediction Market - Bet on future events with decentralized resolution"
);

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    /// Initialize the contract with an admin address
    pub fn initialize(e: Env, admin: Address) {
        if has_admin(&e) {
            panic!("already initialized");
        }
        set_admin(&e, &admin);
        set_market_count(&e, 0);
        set_platform_fee_rate(&e, 200); // 2% default fee
    }

    /// Create a new prediction market
    pub fn create_market(
        e: Env,
        creator: Address,
        question: String,
        description: String,
        token: Address,
        end_time: u64,
    ) -> u64 {
        creator.require_auth();

        let current_time = e.ledger().timestamp();
        if end_time <= current_time {
            panic!("end_time must be in the future");
        }

        let market_id = get_market_count(&e) + 1;

        let market = Market {
            creator: creator.clone(),
            question: question.clone(),
            description: description.clone(),
            token: token.clone(),
            end_time,
            created_at: current_time,
            total_yes: 0,
            total_no: 0,
            resolved: false,
        };

        set_market(&e, market_id, &market);
        set_market_count(&e, market_id);

        market_id
    }

    /// Place a prediction on a market
    pub fn predict(
        e: Env,
        user: Address,
        market_id: u64,
        side: PredictionSide,
        amount: i128,
    ) {
        user.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut market = get_market(&e, market_id);

        if market.resolved {
            panic!("market already resolved");
        }

        let current_time = e.ledger().timestamp();
        if current_time >= market.end_time {
            panic!("market has ended");
        }

        // Transfer tokens from user to contract
        transfer_tokens(&e, &market.token, &user, &e.current_contract_address(), amount);

        // Update user's prediction
        let existing_prediction = get_user_prediction(&e, &user, market_id);
        
        if let Some(pred) = existing_prediction {
            // User already has a prediction, check if they're changing sides
            let new_side = side.clone();
            let new_amount = amount + pred.amount;
            
            // If changing sides, reverse the previous bet
            match (&pred.side, &new_side) {
                (PredictionSide::Yes, PredictionSide::No) | (PredictionSide::No, PredictionSide::Yes) => {
                    // User is switching sides
                    match pred.side {
                        PredictionSide::Yes => market.total_yes -= pred.amount,
                        PredictionSide::No => market.total_no -= pred.amount,
                    }
                }
                _ => {
                    // Same side, just adding more
                }
            }
            
            let new_prediction = Prediction {
                side: new_side.clone(),
                amount: new_amount,
            };
            
            set_user_prediction(&e, &user, market_id, &new_prediction);
        } else {
            // New prediction
            let new_prediction = Prediction {
                side: side.clone(),
                amount,
            };
            set_user_prediction(&e, &user, market_id, &new_prediction);
        }

        // Update market totals
        match side {
            PredictionSide::Yes => market.total_yes += amount,
            PredictionSide::No => market.total_no += amount,
        }

        set_market(&e, market_id, &market);
    }

    /// Resolve a market (admin only) and distribute winnings
    pub fn resolve_market(e: Env, admin: Address, market_id: u64, winning_side: PredictionSide) {
        admin.require_auth();
        
        let market_admin = get_admin(&e);
        if admin != market_admin {
            panic!("not authorized");
        }

        let mut market = get_market(&e, market_id);

        if market.resolved {
            panic!("market already resolved");
        }

        let current_time = e.ledger().timestamp();
        if current_time < market.end_time {
            panic!("market not yet ended");
        }

        market.resolved = true;
        set_winning_side(&e, market_id, winning_side.clone());

        set_market(&e, market_id, &market);
    }

    /// Claim winnings from a resolved market
    pub fn claim_winnings(e: Env, user: Address, market_id: u64) -> i128 {
        user.require_auth();

        let prediction = get_user_prediction(&e, &user, market_id);
        if prediction.is_none() {
            panic!("no prediction found");
        }

        let pred = prediction.unwrap();
        let market = get_market(&e, market_id);

        if !market.resolved {
            panic!("market not resolved");
        }

        let winning_side = get_winning_side(&e, market_id).unwrap();

        // Check if user predicted correctly
        let is_winner = match (&pred.side, &winning_side) {
            (PredictionSide::Yes, PredictionSide::Yes) => true,
            (PredictionSide::No, PredictionSide::No) => true,
            _ => false,
        };

        if !is_winner {
            panic!("not a winning prediction");
        }

        // Calculate winnings based on market odds
        let total_pot = market.total_yes + market.total_no;
        let user_pot_share = match winning_side {
            PredictionSide::Yes => {
                if market.total_no == 0 {
                    pred.amount
                } else {
                    (pred.amount * total_pot) / market.total_yes
                }
            }
            PredictionSide::No => {
                if market.total_yes == 0 {
                    pred.amount
                } else {
                    (pred.amount * total_pot) / market.total_no
                }
            }
        };

        // Apply platform fee
        let fee_rate = get_platform_fee_rate(&e);
        let platform_fee = (user_pot_share * fee_rate) / 10000;
        let winnings = user_pot_share - platform_fee;

        // Transfer winnings to user
        transfer_tokens(&e, &market.token, &e.current_contract_address(), &user, winnings);

        // Clear user prediction
        e.storage()
            .persistent()
            .remove(&DataKey::UserPredictions(user.clone(), market_id));

        winnings
    }

    /// Get market details
    pub fn get_market(e: Env, market_id: u64) -> Market {
        get_market(&e, market_id)
    }

    /// Get user's prediction for a specific market
    pub fn get_user_prediction(e: Env, user: Address, market_id: u64) -> Option<Prediction> {
        get_user_prediction(&e, &user, market_id)
    }

    /// Get total market count
    pub fn get_market_count(e: Env) -> u64 {
        get_market_count(&e)
    }

    /// Get platform fee rate
    pub fn get_platform_fee_rate(e: Env) -> i128 {
        get_platform_fee_rate(&e)
    }

    /// Set platform fee rate (admin only)
    pub fn set_platform_fee_rate(e: Env, admin: Address, fee_rate: i128) {
        admin.require_auth();
        
        let market_admin = get_admin(&e);
        if admin != market_admin {
            panic!("not authorized");
        }

        set_platform_fee_rate(&e, fee_rate);
    }

    /// Update admin (admin only)
    pub fn update_admin(e: Env, admin: Address, new_admin: Address) {
        admin.require_auth();
        
        let market_admin = get_admin(&e);
        if admin != market_admin {
            panic!("not authorized");
        }

        set_admin(&e, &new_admin);
    }

    /// Get admin address
    pub fn get_admin(e: Env) -> Address {
        get_admin(&e)
    }

    /// Get winning side for a market
    pub fn get_winning_side(e: Env, market_id: u64) -> Option<PredictionSide> {
        get_winning_side(&e, market_id)
    }
}

