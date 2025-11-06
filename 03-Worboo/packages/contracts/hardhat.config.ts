import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const sharedAccounts =
  PRIVATE_KEY && PRIVATE_KEY !== ""
    ? PRIVATE_KEY.startsWith("0x")
      ? [PRIVATE_KEY]
      : [`0x${PRIVATE_KEY}`]
    : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    moonbase: {
      url: process.env.MOONBASE_RPC || "",
      chainId: 1287,
      accounts: sharedAccounts,
      gasPrice: Number(process.env.MOONBASE_GAS_PRICE || 1_000_000_000), // 1 Gwei 默认
      gas: "auto"
    },
    moonbeam: {
      url: process.env.MOONBEAM_RPC || "",
      chainId: 1284,
      accounts: sharedAccounts,
      gasPrice: Number(process.env.MOONBEAM_GAS_PRICE || 1_000_000_000),
      gas: "auto"
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "DEV",
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    outputFile: process.env.GAS_REPORT_OUTPUT || "build/gas/gas-report.txt",
    noColors: true
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6"
  }
};

export default config;
