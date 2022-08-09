#!/usr/bin/env bash

set -ueo pipefail

set -x
TOPLEVEL=$(git rev-parse --show-toplevel)
cd "$TOPLEVEL"

if ! which hatch &>/dev/null; then
  echo "hatch is not installed. https://hatch.pypa.io/latest/install/"
  exit 1
fi

for pkg in click aioitertools aiomultiprocessing more_itertools usort ufmt black libcst; do
  hatch run py-wtf index --package-name="$pkg" index/
done

cd "$TOPLEVEL/www"
npm install
npm run export
OUT=$(mktemp -d)/docs
REV=$(git rev-parse HEAD)
mv out/ $OUT/
git checkout pages
cd "$TOPLEVEL"
mv docs/CNAME docs/.nojekyll $OUT/
rm -rf docs/
mv $OUT docs
git add -A
git commit -m "Deploy of $REV"
exit 0
git push
git checkout -
