import type { CurrencyMeta } from './types'

type Row = readonly [code: string, name: string, symbol?: string]

/** Curated list of widely traded cryptocurrencies available in the rates feed. */
const CRYPTO_ROWS: readonly Row[] = [
  ['btc', 'Bitcoin', '₿'],
  ['eth', 'Ethereum', 'Ξ'],
  ['usdt', 'Tether'],
  ['usdc', 'USD Coin'],
  ['bnb', 'BNB'],
  ['xrp', 'XRP'],
  ['sol', 'Solana'],
  ['ada', 'Cardano'],
  ['doge', 'Dogecoin'],
  ['trx', 'TRON'],
  ['ton', 'Toncoin'],
  ['dot', 'Polkadot'],
  ['avax', 'Avalanche'],
  ['link', 'Chainlink'],
  ['ltc', 'Litecoin'],
  ['bch', 'Bitcoin Cash'],
  ['xlm', 'Stellar'],
  ['xmr', 'Monero'],
  ['etc', 'Ethereum Classic'],
  ['atom', 'Cosmos'],
  ['near', 'NEAR Protocol'],
  ['uni', 'Uniswap'],
  ['dai', 'Dai'],
  ['shib', 'Shiba Inu'],
  ['sui', 'Sui'],
  ['apt', 'Aptos'],
  ['arb', 'Arbitrum'],
  ['op', 'Optimism'],
  ['pol', 'Polygon'],
  ['fil', 'Filecoin'],
  ['hbar', 'Hedera'],
  ['icp', 'Internet Computer'],
  ['vet', 'VeChain'],
  ['algo', 'Algorand'],
  ['xtz', 'Tezos'],
  ['eos', 'EOS'],
  ['aave', 'Aave'],
  ['mkr', 'Maker'],
  ['ldo', 'Lido DAO'],
  ['inj', 'Injective'],
  ['pepe', 'Pepe'],
  ['paxg', 'PAX Gold'],
  ['xaut', 'Tether Gold'],
]

const METAL_ROWS: readonly Row[] = [
  ['xau', 'Gold (troy ounce)'],
  ['xag', 'Silver (troy ounce)'],
  ['xpt', 'Platinum (troy ounce)'],
  ['xpd', 'Palladium (troy ounce)'],
]

export const CRYPTO_CURRENCIES: readonly CurrencyMeta[] = CRYPTO_ROWS.map(
  ([code, name, symbol]) => ({ code, name, type: 'crypto', symbol }),
)

export const METAL_CURRENCIES: readonly CurrencyMeta[] = METAL_ROWS.map(([code, name]) => ({
  code,
  name,
  type: 'metal',
}))
