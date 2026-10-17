#!/usr/bin/env bash
# base = default branch. Usage: ab.sh <repo> <branch> <comma-separated paths>. Writes ab/: Lighthouse reports, build/gate logs, summary.txt.
set -u
REPO=$1; BRANCH=$2; IFS=, read -ra PATHS <<< "$3"; RUNS=${RUNS:-5}
mkdir -p ab; cd ab
export CHROME_PATH=$(command -v google-chrome)
for side in base head; do
  # base = the repo's default (production) branch; head = the fix branch
  if [ $side = head ]; then B=(-b "$BRANCH"); else B=(); fi
  git clone -q --depth 1 "${B[@]}" "https://github.com/royeradames/$REPO.git" $side || { echo "clone $side failed" | tee -a summary.txt; exit 1; }
  (cd $side && git log --oneline -1 && npm ci --no-audit --no-fund && npm run build) > $side-build.log 2>&1
  echo "$side $(cd $side && git rev-parse --short HEAD) build rc=$?" | tee -a summary.txt
done
port_base=3101; port_head=3102
(cd base && npx next start -H 127.0.0.1 -p $port_base > ../base-server.log 2>&1 &)
(cd head && npx next start -H 127.0.0.1 -p $port_head > ../head-server.log 2>&1 &)
for p in $port_base $port_head; do for i in $(seq 1 60); do curl -sf -o /dev/null http://127.0.0.1:$p/ && break; sleep 1; done; done
for P in "${PATHS[@]}"; do
  slug=$(echo "$P" | tr '/?=&' '____')
  for RUN in $(seq 1 "$RUNS"); do
    for side in base head; do
      port=$port_base; [ $side = head ] && port=$port_head
      for DEV in mobile desktop; do
        [ $DEV = desktop ] && [ "$RUN" -gt 2 ] && continue
        EXTRA=(); [ $DEV = desktop ] && EXTRA=(--preset=desktop)
        F=lh-$side-$slug-$DEV-$RUN.json
        lighthouse "http://127.0.0.1:$port$P" --quiet --output=json --output-path=$F --max-wait-for-load=45000 \
          --chrome-flags="--headless=new --no-sandbox --no-first-run" "${EXTRA[@]}" > /dev/null 2>&1
      done
    done
  done
done
python3 - <<'PY' | tee -a summary.txt
import json,glob,statistics,collections
g=collections.defaultdict(list)
for f in glob.glob('lh-*.json'):
    _,side,rest=f[:-5].split('-',2); slug,dev,run=rest.rsplit('-',2)
    r=json.load(open(f)); a=r['audits']
    g[(slug,dev,side)].append(({k:round(v['score']*100) for k,v in r['categories'].items() if v['score'] is not None},
        a['largest-contentful-paint']['numericValue'],a['total-blocking-time']['numericValue'],a['first-contentful-paint']['numericValue'],a['cumulative-layout-shift']['numericValue']))
for key in sorted(g):
    rs=g[key]; med=lambda i: statistics.median(x[i] for x in rs)
    cats={c:statistics.median(x[0].get(c,0) for x in rs) for c in ['performance','accessibility','best-practices','seo']}
    print(f"{key[0]:28} {key[1]:7} {key[2]:4} n={len(rs)} P{cats['performance']} A{cats['accessibility']} B{cats['best-practices']} S{cats['seo']} perfRuns={[x[0].get('performance') for x in rs]} LCP={med(1):.0f} TBT={med(2):.0f} FCP={med(3):.0f} CLS={med(4):.3f}")
PY
# Visual identity: screenshots of base and head while both servers run.
(cd head && npx playwright install --with-deps chromium > ../pw-shots-install.log 2>&1)
node ../.github/lh/shots.mjs head "$3" > shots.log 2>&1; echo "shots rc=$?" | tee -a summary.txt
pip install -q pillow > /dev/null 2>&1; python3 ../.github/lh/shotdiff.py | tee -a summary.txt
pkill -f "next start" || true
gzip -9 lh-*.json
# Gates: lint, typecheck, tests on head; the same on base so pre-existing failures are visible.
npx --yes playwright@latest --version > /dev/null 2>&1
for side in base head; do
  ( cd $side
    for s in lint typecheck; do if npm run | grep -q "^  $s$"; then npm run $s > ../$side-$s.log 2>&1; echo "$side $s rc=$?"; fi; done
    if npm run | grep -q "^  test$"; then npx playwright install --with-deps chromium > ../$side-pwinstall.log 2>&1; CI=1 npm test > ../$side-test.log 2>&1; echo "$side test rc=$?"; tail -5 ../$side-test.log | sed "s/^/  $side test: /"; fi
  ) | tee -a summary.txt
done
cat summary.txt
