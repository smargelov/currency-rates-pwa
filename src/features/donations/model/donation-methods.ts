/**
 * Catalog of supported donation methods. The *values* (addresses, IBANs) are
 * never in the repository: the container writes them to `/donations.json`
 * from `DONATE_*` environment variables at start-up (see docker/40-donations.sh),
 * and the app shows only the methods present in that file. Variable names
 * match the KoC bot deployment so the same Dokploy block can be reused.
 */
export type DonationMethodId =
  'ton' | 'usdt_trc20' | 'usdt_erc20' | 'usdc_erc20' | 'eth' | 'btc' | 'iban_bog' | 'iban_tbc'

export interface DonationMethodMeta {
  id: DonationMethodId
  /** Short title, e.g. "USDT". */
  title: string
  /** Network or bank shown next to the title. */
  subtitle: string
  /** Environment variable the deployment sets; documented in the README. */
  envVar: string
}

export interface DonationMethod extends DonationMethodMeta {
  /** Wallet address or IBAN, exactly as configured. */
  value: string
}

/** Display order on the Settings page. */
export const DONATION_METHODS: readonly DonationMethodMeta[] = [
  { id: 'ton', title: 'TON', subtitle: 'Toncoin', envVar: 'DONATE_TON_ADDRESS' },
  { id: 'usdt_trc20', title: 'USDT', subtitle: 'TRC20', envVar: 'DONATE_USDT_TRC20' },
  { id: 'usdt_erc20', title: 'USDT', subtitle: 'ERC20', envVar: 'DONATE_USDT_ERC20' },
  { id: 'usdc_erc20', title: 'USDC', subtitle: 'ERC20', envVar: 'DONATE_USDC_ERC20' },
  { id: 'eth', title: 'ETH', subtitle: 'Ethereum', envVar: 'DONATE_ETH' },
  { id: 'btc', title: 'BTC', subtitle: 'Bitcoin', envVar: 'DONATE_BTC' },
  {
    id: 'iban_bog',
    title: 'Bank of Georgia',
    subtitle: 'IBAN',
    envVar: 'DONATE_BANK_GEORGIA_IBAN',
  },
  { id: 'iban_tbc', title: 'TBC Bank', subtitle: 'IBAN', envVar: 'DONATE_TBC_IBAN' },
]

/**
 * Turns the raw `/donations.json` payload into an ordered list of methods,
 * dropping unknown ids and blank values. Anything malformed yields `[]`.
 */
export function parseDonations(raw: unknown): DonationMethod[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return []
  const record = raw as Record<string, unknown>
  const result: DonationMethod[] = []
  for (const meta of DONATION_METHODS) {
    const value = record[meta.id]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed === '') continue
    result.push({ ...meta, value: trimmed })
  }
  return result
}
