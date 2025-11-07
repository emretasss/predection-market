default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32v1-none/release/*.wasm

fmt:
	cargo fmt --all

clean:
	cargo clean

deploy:
	@echo "Deploying prediction market contract..."
	stellar contract deploy --network testnet --source-account testnet_key target/wasm32v1-none/release/prediction_market.wasm




