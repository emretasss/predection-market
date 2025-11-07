# Prediction Market Contract

A decentralized prediction market smart contract for Stellar Soroban.

## Overview

This contract allows users to:
1. Create markets for any question/event
2. Place bets on Yes/No outcomes
3. Resolve markets and claim winnings
4. View all markets and their statistics

## Architecture

### Data Structures

#### Market
```rust
pub struct Market {
    pub creator: Address,
    pub question: String,
    pub description: String,
    pub token: Address,
    pub end_time: u64,
    pub created_at: u64,
    pub total_yes: i128,
    pub total_no: i128,
    pub resolved: bool,
}
```

#### Prediction
```rust
pub struct Prediction {
    pub side: PredictionSide,  // Yes or No
    pub amount: i128,
}
```

### Storage

- **Markets**: Persistent storage keyed by market ID
- **User Predictions**: Persistent storage for user bets
- **Winning Side**: Persistent storage for resolved outcomes
- **Platform Settings**: Instance storage for fee rates and admin

## Functions

### Initialization

#### `initialize(admin: Address)`
Initializes the contract with an admin address.
- Can only be called once
- Sets default platform fee to 2%

### Market Management

#### `create_market(creator, question, description, token, end_time) -> market_id`
Creates a new prediction market.
- Requires auth from creator
- End time must be in the future
- Returns new market ID

### Predictions

#### `predict(user, market_id, side, amount)`
Place a bet on a market.
- Requires auth from user
- Amount must be positive
- Market must not be resolved
- Market must not have ended
- Users can add to existing predictions or switch sides

### Resolution

#### `resolve_market(admin, market_id, winning_side)`
Resolves a market (admin only).
- Requires auth from admin
- Market must not be already resolved
- Market must have ended
- Sets winning side for payout calculations

#### `claim_winnings(user, market_id) -> winnings`
Claims winnings from a resolved market.
- Requires auth from user
- User must have a winning prediction
- Transfers winnings minus platform fee
- Clears user's prediction

### View Functions

#### `get_market(market_id) -> Market`
Returns market details.

#### `get_user_prediction(user, market_id) -> Option<Prediction>`
Returns user's prediction for a market.

#### `get_market_count() -> u64`
Returns total number of markets.

#### `get_winning_side(market_id) -> Option<PredictionSide>`
Returns the winning side for a resolved market.

#### `get_platform_fee_rate() -> i128`
Returns current platform fee rate (in basis points).

#### `get_admin() -> Address`
Returns admin address.

### Admin Functions

#### `set_platform_fee_rate(admin, fee_rate)`
Updates platform fee rate (admin only).
- Fee must be between 0 and 10000 (0-100%)

#### `update_admin(admin, new_admin)`
Updates admin address (admin only).

## Payout Formula

Winnings are calculated based on pool distribution:

For Yes side wins:
```
winnings = (user_bet * total_pool) / total_yes
```
Where `total_pool = total_yes + total_no`

For No side wins:
```
winnings = (user_bet * total_pool) / total_no
```

Platform fee (default 2%) is deducted from winnings:
```
final_winnings = winnings - (winnings * fee_rate / 10000)
```

## Testing

Run all tests:
```bash
cargo test
```

Build for production:
```bash
stellar contract build
```

## Security Considerations

- ✅ Funds locked in contract (admin cannot withdraw)
- ✅ Resolution time-gated (only after end_time)
- ✅ Double resolution prevention
- ✅ Auth requirements on all state changes
- ✅ Platform fee bounded (0-100%)
- ⚠️ Admin control over resolution (consider oracle-based resolution for production)

## Future Enhancements

- Oracle-based automated resolution
- Multi-token support per market
- Partial predictions and liquidity providers
- Governance for market creation
- Incentives for early market creators

## License

MIT




