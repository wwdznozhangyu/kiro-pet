#!/usr/bin/env bash
# Transpile a TS entry (plus its project-relative deps) to ESM and run it with Node.
# Works without npm install: uses the globally available `tsc` for type-stripping,
# then rewrites relative import specifiers to add .js so Node ESM can resolve them.
#
# Usage: scripts/run-node-ts.sh <entry.ts> [args...]
set -euo pipefail
cd "$(dirname "$0")/.."

ENTRY="$1"; shift || true
OUT="dist-ts"

rm -rf "$OUT"
# Compile the whole relevant source set so imports resolve. Cheap for this project size.
tsc "$ENTRY" \
  electron/wordbank-core.ts \
  src/shared/types.ts \
  --module es2022 --target es2022 --moduleResolution bundler \
  --outDir "$OUT" --rootDir . --skipLibCheck --noEmitOnError false --noCheck

# Rename emitted .js -> .mjs so Node treats them as ESM without a package.json marker
# (a package.json in the output dir would confuse project-root detection in the scripts).
for f in $(find "$OUT" -name '*.js'); do
  mv "$f" "${f%.js}.mjs"
done

# Node ESM needs explicit extensions on relative specifiers; point them at .mjs.
for f in $(find "$OUT" -name '*.mjs'); do
  perl -pi -e "s/from '(\\.\\.?\\/[^']+?)(?<!\\.mjs)'/from '\$1.mjs'/g" "$f"
done

# Map the entry path (e.g. scripts/build-wordbank.ts) to its compiled .mjs location.
ENTRY_JS="$OUT/${ENTRY%.ts}.mjs"
node "$ENTRY_JS" "$@"
