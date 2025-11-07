#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger}, token::StellarAssetClient, Address, Env, String,
};

fn create_token(e: &Env, admin: &Address) -> Address {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    sac.address()
}

#[test]
fn test_initialize() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_market_count(), 0);
    assert_eq!(client.get_platform_fee_rate(), 200); // Default 2%
}

#[test]
fn test_create_market() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_timestamp(1000);

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    let creator = Address::generate(&e);
    let token = create_token(&e, &admin);
    
    let question = String::from_str(&e, "Will BTC reach $100k by 2025?");
    let description = String::from_str(&e, "Bitcoin price prediction");
    let end_time = 2000;

    let market_id = client.create_market(&creator, &question, &description, &token, &end_time);

    assert_eq!(market_id, 1);
    assert_eq!(client.get_market_count(), 1);

    let market: Market = client.get_market(&market_id);
    assert_eq!(market.creator, creator);
    assert_eq!(market.question, question);
    assert_eq!(market.token, token);
    assert_eq!(market.end_time, end_time);
    assert_eq!(market.resolved, false);
    assert_eq!(market.total_yes, 0);
    assert_eq!(market.total_no, 0);
}

#[test]
fn test_predict_yes() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_timestamp(1000);

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    let creator = Address::generate(&e);
    let token = create_token(&e, &admin);
    
    // Mint tokens to creator
    let token_client = StellarAssetClient::new(&e, &token);
    token_client.mint(&creator, &1000_0000000);

    let question = String::from_str(&e, "Will it rain tomorrow?");
    let description = String::from_str(&e, "Weather prediction");
    let end_time = 2000;

    let market_id = client.create_market(&creator, &question, &description, &token, &end_time);

    let amount = 100_0000000;
    client.predict(&creator, &market_id, &PredictionSide::Yes, &amount);

    let market: Market = client.get_market(&market_id);
    assert_eq!(market.total_yes, amount);
    assert_eq!(market.total_no, 0);

    let prediction: Option<Prediction> = client.get_user_prediction(&creator, &market_id);
    assert!(prediction.is_some());
    let pred = prediction.unwrap();
    assert!(matches!(pred.side, PredictionSide::Yes));
    assert_eq!(pred.amount, amount);
}

#[test]
fn test_predict_no() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_timestamp(1000);

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    let creator = Address::generate(&e);
    let token = create_token(&e, &admin);
    
    let token_client = StellarAssetClient::new(&e, &token);
    token_client.mint(&creator, &1000_0000000);

    let question = String::from_str(&e, "Will it rain tomorrow?");
    let description = String::from_str(&e, "Weather prediction");
    let end_time = 2000;

    let market_id = client.create_market(&creator, &question, &description, &token, &end_time);

    let amount = 100_0000000;
    client.predict(&creator, &market_id, &PredictionSide::No, &amount);

    let market: Market = client.get_market(&market_id);
    assert_eq!(market.total_yes, 0);
    assert_eq!(market.total_no, amount);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_predict_zero_amount() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_timestamp(1000);

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    let creator = Address::generate(&e);
    let token = create_token(&e, &admin);
    
    let token_client = StellarAssetClient::new(&e, &token);
    token_client.mint(&creator, &1000_0000000);

    let question = String::from_str(&e, "Will it rain tomorrow?");
    let description = String::from_str(&e, "Weather prediction");
    let end_time = 2000;

    let market_id = client.create_market(&creator, &question, &description, &token, &end_time);

    client.predict(&creator, &market_id, &PredictionSide::Yes, &0);
}

#[test]
fn test_resolve_and_claim_winnings() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_timestamp(1000);

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    let creator = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let token = create_token(&e, &admin);
    
    // Mint tokens to all users
    let token_client = StellarAssetClient::new(&e, &token);
    token_client.mint(&creator, &1000_0000000);
    token_client.mint(&user1, &1000_0000000);
    token_client.mint(&user2, &1000_0000000);

    let question = String::from_str(&e, "Will BTC hit $100k?");
    let description = String::from_str(&e, "BTC prediction");
    let end_time = 2000;

    let market_id = client.create_market(&creator, &question, &description, &token, &end_time);

    // User1 predicts Yes with 100 tokens
    client.predict(&user1, &market_id, &PredictionSide::Yes, &100_0000000);
    
    // User2 predicts No with 200 tokens
    client.predict(&user2, &market_id, &PredictionSide::No, &200_0000000);

    // Resolve market with Yes winning
    e.ledger().set_timestamp(2000);
    client.resolve_market(&admin, &market_id, &PredictionSide::Yes);

    // User1 claims winnings
    let winnings = client.claim_winnings(&user1, &market_id);
    
    // User1 should receive approximately 300 tokens (less platform fee)
    // Winnings = (100 * 300) / 100 - 2% = 300 * 0.98 = 294
    assert!(winnings > 200_0000000 && winnings < 300_0000000);

    // User2 should not be able to claim
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.claim_winnings(&user2, &market_id);
    }));
    assert!(result.is_err());
}

#[test]
fn test_multiple_markets() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_timestamp(1000);

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    let creator = Address::generate(&e);
    let token = create_token(&e, &admin);
    
    let token_client = StellarAssetClient::new(&e, &token);
    token_client.mint(&creator, &1000_0000000);

    let end_time = 2000;

    // Create multiple markets
    let market1_id = client.create_market(
        &creator,
        &String::from_str(&e, "Market 1"),
        &String::from_str(&e, "Description 1"),
        &token,
        &end_time,
    );

    let market2_id = client.create_market(
        &creator,
        &String::from_str(&e, "Market 2"),
        &String::from_str(&e, "Description 2"),
        &token,
        &end_time,
    );

    assert_eq!(market1_id, 1);
    assert_eq!(market2_id, 2);
    assert_eq!(client.get_market_count(), 2);
}

#[test]
fn test_set_platform_fee_rate() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    // Set fee rate to 5% (500 basis points)
    client.set_platform_fee_rate(&admin, &500);
    assert_eq!(client.get_platform_fee_rate(), 500);
}

#[test]
#[should_panic(expected = "not authorized")]
fn test_non_admin_set_fee() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let non_admin = Address::generate(&e);
    let contract_id = e.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&e, &contract_id);

    client.initialize(&admin);

    client.set_platform_fee_rate(&non_admin, &500);
}

