# Currency Rates

Fast, ad-free currency converter PWA that works offline. One screen: a pinned
base currency, a list of currencies you care about, type an amount in any row
and the rest update instantly — with a built-in calculator.

- No accounts, no API keys, no ads. Rates come from
  [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api)
  (free, no rate limits, daily updates) with a CDN fallback.
- Optional: plug in your own [Open Exchange Rates](https://openexchangerates.org/) app id
  in Settings for hourly updates. The key stays in your browser.
- Installable PWA; rates are cached locally so the app opens instantly even without network.

## Development

```bash
npm install     # also renders app icons and copies flag SVGs into public/
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

Node 22+.

## Project layout

Feature-Sliced Design, light edition:

```
src/
├─ app/        # entry, router, global styles and design tokens
├─ pages/      # route-level screens
├─ widgets/    # composite blocks (currency list, keypad, bottom nav)
├─ features/   # user actions (convert, manage list, refresh rates, API key)
├─ entities/   # domain: currency catalog, rates & snapshots, settings
└─ shared/     # api client, storage, expression evaluator, formatting, ui kit
```

## Deployment

`master` → GitHub Actions builds a Docker image (nginx serving `dist/`),
pushes it to GHCR and triggers a Dokploy webhook. See `.github/workflows/deploy.yml`.
Requires the `DOKPLOY_WEBHOOK_URL` repository secret.

### Donations (optional)

Settings → "Support the project" lists wallet addresses / IBANs. They are not
in the repository or the image: on container start `docker/40-donations.sh`
writes `/donations.json` from environment variables set on the deployment
(Dokploy → Environment). A method whose variable is missing or empty is not
shown; with none set (or `DONATE_ENABLED=false`) the whole section disappears.
The variable names match the KoC bot deployment, so the same block can be pasted.

| Variable                   | Shown as               |
| -------------------------- | ---------------------- |
| `DONATE_TON_ADDRESS`       | TON · Toncoin          |
| `DONATE_USDT_TRC20`        | USDT · TRC20           |
| `DONATE_USDT_ERC20`        | USDT · ERC20           |
| `DONATE_USDC_ERC20`        | USDC · ERC20           |
| `DONATE_ETH`               | ETH · Ethereum         |
| `DONATE_BTC`               | BTC · Bitcoin          |
| `DONATE_BANK_GEORGIA_IBAN` | Bank of Georgia · IBAN |
| `DONATE_TBC_IBAN`          | TBC Bank · IBAN        |

For local development drop a `public/donations.json` (git-ignored) with the
same ids as keys, e.g. `{"btc":"bc1q…"}`.

## License

MIT
