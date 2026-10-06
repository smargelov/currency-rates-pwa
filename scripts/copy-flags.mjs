// Copies only the 1:1 flag SVGs referenced by the fiat catalog from
// node_modules/flag-icons into public/flags. Runs on `npm install`
// (postinstall) so the full flag-icons CSS (hundreds of inlined SVGs)
// never ends up in the bundle; flags load lazily as <img> and are cached
// by the service worker at runtime.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const catalogPath = join(root, 'src', 'entities', 'currency', 'model', 'catalog-fiat.ts')
const srcDir = join(root, 'node_modules', 'flag-icons', 'flags', '1x1')
const outDir = join(root, 'public', 'flags')

if (!existsSync(srcDir)) {
  console.warn('flag-icons is not installed, skipping flag copy')
  process.exit(0)
}

const catalog = readFileSync(catalogPath, 'utf8')
// Tuple rows look like: ['gel', 'Georgian Lari', 'ge', '₾'] — the third item is the flag.
const codes = new Set(
  [...catalog.matchAll(/\['[a-z]{3}',\s*'[^']*',\s*'([a-z]{2})'/g)].map((m) => m[1]),
)

mkdirSync(outDir, { recursive: true })
let copied = 0
for (const code of codes) {
  const source = join(srcDir, `${code}.svg`)
  if (!existsSync(source)) {
    console.warn(`No flag for "${code}"`)
    continue
  }
  copyFileSync(source, join(outDir, `${code}.svg`))
  copied += 1
}
console.log(`Copied ${copied} flags into public/flags`)
