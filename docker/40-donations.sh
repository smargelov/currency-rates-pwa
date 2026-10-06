#!/bin/sh
# Runs from /docker-entrypoint.d/ on container start (nginx:alpine convention).
#
# Builds /usr/share/nginx/html/donations.json from DONATE_* environment
# variables so donation details live in the deployment (Dokploy env), not in
# the image or the repository. A method whose variable is empty or unset is
# left out and therefore never shown in the app. DONATE_ENABLED=false hides all.
set -eu

OUT="${DONATIONS_JSON_PATH:-/usr/share/nginx/html/donations.json}"

# Master switch (same as the KoC bot): anything but "true" hides every method.
ENABLED="${DONATE_ENABLED:-true}"

# id|env-var — keep in sync with src/features/donations/model/donation-methods.ts
METHODS="
ton|DONATE_TON_ADDRESS
usdt_trc20|DONATE_USDT_TRC20
usdt_erc20|DONATE_USDT_ERC20
usdc_erc20|DONATE_USDC_ERC20
eth|DONATE_ETH
btc|DONATE_BTC
iban_bog|DONATE_BANK_GEORGIA_IBAN
iban_tbc|DONATE_TBC_IBAN
"

json_escape() {
  # Escape backslashes and double quotes; addresses never contain control chars.
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

entries=""
if [ "$ENABLED" = "true" ]; then
for line in $METHODS; do
  id="${line%%|*}"
  var="${line##*|}"
  value="$(eval "printf '%s' \"\${$var:-}\"")"
  [ -n "$value" ] || continue
  entry="\"$id\":\"$(json_escape "$value")\""
  if [ -n "$entries" ]; then
    entries="$entries,$entry"
  else
    entries="$entry"
  fi
done
fi

# Always (re)write the file so a stale one never leaks into a deployment
# that has no donation methods configured.
printf '{%s}\n' "$entries" > "$OUT"
echo "donations: wrote $OUT"
