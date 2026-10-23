#!/usr/bin/env bash
# Runs the pure word-bank logic tests without needing npm install / Electron.
# Transpiles the TS (type-stripping) to ESM, fixes relative import extensions,
# then executes with Node.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist-test
tsc electron/wordbank-core.ts electron/wordbank-core.test.ts src/shared/types.ts \
  --module es2022 --target es2022 --moduleResolution bundler \
  --outDir dist-test --rootDir . --skipLibCheck --noEmitOnError false --noCheck

# Node ESM needs explicit .js extensions on relative specifiers.
# Portable in-place edit (works on both GNU and BSD sed via a temp file).
for f in $(find dist-test -name '*.js'); do
  perl -pi -e "s/from '(\\.\\.?\\/[^']+?)(?<!\\.js)'/from '\$1.js'/g" "$f"
done

# Mark the output as ESM.
cat > dist-test/package.json <<'JSON'
{ "type": "module" }
JSON

node dist-test/electron/wordbank-core.test.js
