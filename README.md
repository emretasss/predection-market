# stellarproject1

# 🎯 Decentralized Prediction Market

A fully decentralized prediction market built on Stellar Soroban** blockchain. Bet on real-world events with complete transparency, trustless resolution, and fair odds.

## 🌟 Features

- **🔒 Fully Decentralized**: Smart contracts manage all markets and payouts
- **⚡ Lightning Fast**: Built on Stellar's high-performance blockchain
- **💰 Fair Odds**: Real-time odds calculated from pool liquidity
- **🎮 Easy to Use**: Beautiful, intuitive interface
- **🌍 Global**: Access from anywhere, 24/7
- **🛡️ Secure**: Immutable smart contracts ensure fair outcomes

## 🏗️ Architecture

### Smart Contract (`contract/prediction_market/`)

Written in Rust using Soroban SDK, the contract provides:

- **Market Creation**: Anyone can create a prediction market
- **Predictions**: Users can bet on either Yes or No
- **Resolution**: Admin resolves markets and distributes winnings
- **Dynamic Odds**: Payouts based on pool distribution
- **Platform Fees**: Configurable fee system (default 2%)

**Key Functions:**
- `initialize()` - Initialize contract with admin
- `create_market()` - Create a new prediction market
- `predict()` - Place a bet on a market
- `resolve_market()` - Resolve market outcome (admin only)
- `claim_winnings()` - Claim winnings from resolved markets
- `get_market()` - Get market details
- `get_user_prediction()` - Get user's prediction for a market

### TypeScript SDK (`packages/prediction_market/`)

Auto-generated TypeScript client for interacting with the contract from frontend applications.

### Frontend (`src/`)

Modern Astro-based frontend with a beautiful UI.

## 🚀 Getting Started

### Prerequisites

- Rust (latest stable)
- Node.js 18+
- Stellar CLI

### Building the Smart Contract

```bash
cd contract/prediction_market
cargo test          # Run tests
stellar contract build    # Build WASM
```

### Generating TypeScript Bindings

```bash
stellar contract bindings typescript \
  --wasm contract/prediction_market/target/wasm32v1-none/release/prediction_market.wasm \
  --output-dir packages/prediction_market
```

### Running the Frontend

```bash
npm install
npm run dev
```

Visit `http://localhost:4321` to see the application.

## 📖 How It Works

### 1. Create Market
Anyone can create a market by specifying:
- Question (e.g., "Will BTC reach $100k by 2025?")
- Description
- Token for betting
- End time

### 2. Place Predictions
Users bet tokens on either Yes or No. The pool accumulates:
- `total_yes`: Total tokens on Yes side
- `total_no`: Total tokens on No side

### 3. Market Resolution
After the end time, admin resolves the market with the winning side.

### 4. Claim Winnings
Winners automatically receive their share of the losing side's pool, minus platform fees.

**Payout Formula:**
- If Yes wins: `winnings = (user_bet * total_pool) / total_yes`
- If No wins: `winnings = (user_bet * total_pool) / total_no`
- Platform fee: 2% of winnings

## 🧪 Testing

All smart contract functions are thoroughly tested:

```bash
cd contract/prediction_market
cargo test
```

Test coverage includes:
- Contract initialization
- Market creation
- Prediction placement (Yes/No)
- Market resolution
- Winnings claims
- Multiple markets
- Access control

## 📦 Project Structure

```
myfrontend/
├── contract/
│   └── prediction_market/
│       ├── src/
│       │   ├── lib.rs      # Main contract logic
│       │   └── test.rs     # Comprehensive tests
│       ├── Cargo.toml
│       └── Makefile
├── packages/
│   └── prediction_market/
│       ├── src/
│       │   └── index.ts    # Auto-generated TypeScript client
│       └── package.json
├── src/
│   ├── pages/
│   │   └── index.astro     # Landing page
│   └── layouts/
│       └── Layout.astro
└── README.md
```

## 🔐 Security

- All funds are stored in the smart contract
- Admin can only resolve markets, not withdraw funds
- Users can only claim their own winnings
- Market creation and predictions are permissionless
- All transactions are on-chain and transparent

## 🌐 Deployment

### Deploy to Testnet

```bash
cd contract/prediction_market
stellar contract build
stellar contract deploy \
  --network testnet \
  --source your_key
```

### Update Frontend

After deployment, update the contract ID in your frontend configuration.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Stellar Development Foundation for Soroban
- OpenZeppelin for security best practices
- Community contributors

---

Built with ❤️ using Stellar Soroban
# Stellar-Decentralized-Prediction-Market
# predection-market
