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

## License

MIT
