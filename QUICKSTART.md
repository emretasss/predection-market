# 🚀 Quick Start Guide

Get your Decentralized Prediction Market running in minutes!

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js 18+
# Visit: https://nodejs.org/

# Install Stellar CLI
npm install -g @stellar/cli
```

## 🏃 Quick Start (Development)

### 1. Clone and Setup

```bash
cd /Users/emre/Desktop/workshop/myfrontend
npm install
```

### 2. Run Tests

```bash
cd contract/prediction_market
cargo test
```

You should see:
```
running 9 tests
test result: ok. 9 passed; 0 failed
```

### 3. Build Contract

```bash
stellar contract build
```

### 4. Build TypeScript SDK

```bash
cd ../..
stellar contract bindings typescript \
  --wasm contract/prediction_market/target/wasm32v1-none/release/prediction_market.wasm \
  --output-dir packages/prediction_market \
  --overwrite

cd packages/prediction_market
npm install && npm run build
```

### 5. Run Frontend

```bash
cd ../..
npm run dev
```

Visit: `http://localhost:4321`

## 🌐 Deploy to Testnet

### 1. Generate Testnet Key

```bash
stellar keys generate testnet_key
```

### 2. Fund Key from Friendbot

Visit: https://laboratory.stellar.org/#account-creator?network=test

### 3. Deploy Contract

```bash
cd contract/prediction_market
stellar contract deploy \
  --network testnet \
  --source-account alice \
  --wasm target/wasm32v1-none/release/prediction_market.wasm
```

**Save the contract ID!** Example: `CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D`

### 4. Initialize Contract

First, get your admin address (public key):
```bash
stellar keys public-key alice
```

Then initialize the contract with your deployed contract ID:
```bash
stellar contract invoke \
  --network testnet \
  --source-account alice \
  --id CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D \
  -- initialize \
  --admin GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB
```

**Note:** Replace `GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB` with the output from `stellar keys public-key alice` if your alice key is different.

### 5. Deploy a Test Token

You need a token contract to use for betting. Deploy a Soroban token contract:

From the project root directory (`myfrontend`):
```bash
cd example/token
stellar contract build
stellar contract deploy \
  --network testnet \
  --source-account alice \
  --wasm target/wasm32v1-none/release/soroban_token_contract.wasm \
  -- \
  --admin GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB \
  --decimal 7 \
  --name "TestToken" \
  --symbol "TEST"
```

**Save the token contract ID!** (e.g., `TOKEN_CONTRACT_ID_HERE`)
token contrat id =CAT42XQKNGT4PC2O5YINUQXFGOELKDGI6AOZCANRB7TCLGGRWCS2ZYD4

**Note:** The token is initialized during deploy with the constructor arguments above, so no separate initialize step is needed.

Mint some tokens to your account:
```bash
stellar contract invoke \
  --network testnet \
  --source-account alice \
  --id CAT42XQKNGT4PC2O5YINUQXFGOELKDGI6AOZCANRB7TCLGGRWCS2ZYD4 \
  -- mint \
  --to GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB \
  --amount 1000000000000
```

### 6. Update Frontend

Edit `packages/prediction_market/src/index.ts` and add your contract ID (`CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D`) to the networks object.

## 📖 Usage Examples

### Create a Market

**Important:** Make sure you have initialized the prediction market contract first (see step 4)!

Replace `CAT42XQKNGT4PC2O5YINUQXFGOELKDGI6AOZCANRB7TCLGGRWCS2ZYD4` with your deployed token contract ID:

From anywhere (contract directory is not needed for invoke):
```bash
stellar contract invoke \
  --network testnet \
  --source-account alice \
  --id CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D \
  -- create_market \
  --creator GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB \
  --question 'Will Bitcoin reach 100k?' \
  --description "Bitcoin price prediction" \
  --token CAT42XQKNGT4PC2O5YINUQXFGOELKDGI6AOZCANRB7TCLGGRWCS2ZYD4 \
  --end_time 1764708197
```

**Important Notes:**
- Use single quotes (`'`) for questions containing special characters like `$` to avoid shell interpretation
- `--end_time` must be a **future** Unix timestamp (seconds since epoch). Current timestamp is around `1762116187`. Example: `1764708197` (approximately 30 days from now)
- To get a future timestamp, use: `python3 -c "import datetime; print(int((datetime.datetime.now() + datetime.timedelta(days=30)).timestamp()))"`

### Place a Bet

```bash
stellar contract invoke \
  --network testnet \
  --source-account alice \
  --id CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D \
  -- predict \
  --user GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB \
  --market_id 1 \
  --side Yes \
  --amount 1000000000
```

### Resolve Market (Admin Only)

```bash
stellar contract invoke \
  --network testnet \
  --source-account alice \
  --id CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D \
  -- resolve_market \
  --admin GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB \
  --market_id 1 \
  --winning_side Yes
```

### Claim Winnings

```bash
stellar contract invoke \
  --network testnet \
  --source-account alice \
  --id CCIIOVCYEI6PS4DT5UW6XQ44AJDJWCGZ5TGJRERQKZT7NLXVHGFCRW3D \
  -- claim_winnings \
  --user GA6KDOM7JHCAUJDN4OGMARNFJSRRL643YDWVYXMUSDHEMQYOQO5JY6OB \
  --market_id 1
```

## 🔧 Development Commands

```bash
# Run all tests
cd contract/prediction_market && cargo test

# Build contract
cd contract/prediction_market && stellar contract build

# Run frontend dev server
npm run dev

# Build frontend
npm run build

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### "Contract not found"
- Ensure contract is deployed
- Check contract ID is correct
- Verify network (testnet/mainnet)

### "Auth required"
- Ensure you're passing the correct source key
- Check that the key has proper permissions

### "Insufficient balance"
- Fund your account from Friendbot
- Ensure you have enough for fees

### "Account alias "TOKEN_ADDRESS" not Found" or "Token not found"
- Deploy a token contract first (see step 5: Deploy a Test Token)
- Replace `TOKEN_ADDRESS` or `TOKEN_CONTRACT_ID_HERE` with your deployed token contract ID
- Ensure the token contract is initialized and minted tokens to your account

### "Missing argument admin" when deploying token
- Token contract requires constructor arguments during deploy
- Use `--` separator and provide `--admin`, `--decimal`, `--name`, and `--symbol` arguments
- See step 5 in the deployment guide for the complete command

### "UnreachableCodeReached" when calling create_market
- **Ensure the prediction market contract is initialized first!** (See step 4)
- Check that you called `initialize` after deploying the contract
- **Most common issue:** `--end_time` must be a **future** timestamp! If you use a past timestamp, the contract will panic with "end_time must be in the future"
  - Current Unix timestamp: Run `date +%s` to see current time
  - Future timestamp example: `1764708197` (30 days from now)
- For questions with special characters (like `$`), use single quotes: `'Will Bitcoin reach $100k?'` instead of double quotes

### "VM call trapped" errors
- Verify the contract is properly initialized
- Check that all required parameters are provided correctly
- For strings with special characters, use single quotes to prevent shell interpretation

### Build errors
```bash
# Clean and rebuild
cd contract/prediction_market
cargo clean
stellar contract build
```

## 📚 Next Steps

1. ✅ Read `README.md` for full documentation
2. ✅ Check `PROJECT_SUMMARY.md` for architecture
3. ✅ Review `contract/prediction_market/README.md` for contract details
4. 🌟 Deploy to mainnet (when ready)

## 🆘 Need Help?

- Stellar Docs: https://developers.stellar.org
- Soroban Docs: https://soroban.stellar.org
- Discord: Stellar Dev Community

## 🎉 You're All Set!

Your prediction market is ready to go. Start creating markets and betting!

---

Happy Predicting! 🎯

