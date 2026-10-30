#!/usr/bin/env bash
# End-to-end test of the Gate Closing scraper against a local fake web. No real network.
# Usage: bash ticker-build/scraper/test/e2e.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SCR="$HERE/.."; TB="$SCR/.."
T="$(mktemp -d)"; PORT=$((20000 + RANDOM % 20000))
export GC_DATA_DIR="$T/data" GC_JOURNAL_DIR="$T/j" GC_SOURCES="$T/sources.json" GC_CONFIG="$T/config.json" GC_ALLOW_HTTP=1 GC_MIN_INTERVAL_MS=0
mkdir -p "$T/j"; cp "$TB/gate-closing-journal.json" "$TB/gate-closing-journal.js" "$T/j/"
node -e '
const c=require(process.argv[1]); c.dark_threshold=2; c.min_domain_interval_ms=0; require("fs").writeFileSync(process.argv[2], JSON.stringify(c));
const B="http://127.0.0.1:'"$PORT"'", L="http://localhost:'"$PORT"'";
const s=(id,path,kind,extra={})=>({id,name:"TEST "+id,url:B+path,kind,entity_id:"ENT-SUNO",mechanism_id:"MECH-METERING",market:"Music",enabled:true,tos:{status:"CLEARED"},...extra});
require("fs").writeFileSync(process.argv[3], JSON.stringify({sources:[
 s("t-policy","/policy","html"), s("t-dateonly","/dateonly","html"), s("t-big","/big","html"), s("t-moved","/moved","html"),
 s("t-soft","/soft","html"), s("t-wall","/wall","html"), s("t-feed","/feed.xml","rss"), s("t-private","/private/x","html"),
 {...s("t-localhost","/x","html"), url:L+"/x"}, s("t-blocked","/policy","html",{tos:{status:"BLOCKED"}}) ]}));
' "$SCR/config.json" "$T/config.json" "$T/sources.json"
echo '{"policy":"v1","dateonly":"2026-09-01T00:00:00Z","big":"v1","moved":"ok","soft":"ok","feed":"ok"}' > "$T/state.json"
node "$HERE/fixture-server.js" "$PORT" "$T/state.json" & SRV=$!; trap 'kill $SRV 2>/dev/null; rm -rf "$T"' EXIT; sleep 0.5

pass(){ echo "  PASS $*"; }; failx(){ echo "  FAIL $*"; exit 1; }
row(){ node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse).filter(r=>r.source_id===process.argv[2]).pop(); console.log(r.outcome[process.argv[3]]??"null")' "$GC_DATA_DIR/manifest.jsonl" "$1" "$2"; }
snap(){ cp "$T/j/gate-closing-journal.json" "$T/jb.json"; cp "$GC_DATA_DIR/manifest.jsonl" "$T/mb.jsonl" 2>/dev/null || : > "$T/mb.jsonl"; }
guard(){ node "$SCR/guard.js" "$T/jb.json" "$T/j/gate-closing-journal.json" "$T/mb.jsonl" "$GC_DATA_DIR/manifest.jsonl"; }

echo "== R1 baseline"; snap; node "$SCR/run.js"; guard
[ "$(row t-policy change)" = BASELINE ] && pass "policy baseline" || failx "policy baseline"
[ "$(row t-wall health)" = WALL ] && pass "cloudflare wall detected, nothing emitted" || failx "wall"
[ "$(row t-private health)" = ROBOTS_DISALLOWED ] && pass "robots Disallow honored (not fetched)" || failx robots
[ "$(row t-localhost health)" = ROBOTS_DISALLOWED ] && pass "robots.txt 500 → full disallow" || failx robots500
grep -q '"source_id":"t-blocked"' "$GC_DATA_DIR/manifest.jsonl" && failx "BLOCKED source fetched" || pass "ToS-BLOCKED source never fetched"
grep -q '"type":"PROBE"' "$GC_DATA_DIR/manifest.jsonl" && pass "soft-404 probe recorded per domain" || failx probe

echo "== R2 changes"; echo '{"policy":"v2","dateonly":"2026-10-15T00:00:00Z","big":"v2","moved":"home","soft":"gone","feed":"trunc"}' > "$T/state.json"
snap; node "$SCR/run.js"; guard
[ "$(row t-policy route)" = EVENT ] && pass "small real change → PROPOSED event" || failx "policy event"
EV="$(row t-policy event_id)"
node -e 'const j=require(process.argv[1]); const e=j.events.find(x=>x.event_id===process.argv[2]); if(e.date!==null||e.audit_status!=="PROPOSED"||!e.flags.includes("NEEDS_HUMAN_DATE")||e.direction!=="open"||e.new_state) process.exit(1); if(!e.date_candidates.some(d=>/October 1, 2026/.test(d.value))) process.exit(2); console.log("  PASS "+e.event_id+": date null, NEEDS_HUMAN_DATE, document date \"October 1, 2026\" kept only as a candidate")' "$T/j/gate-closing-journal.json" "$EV" || failx "event shape"
[ "$(row t-dateonly change)" = DATE_FIELD_CHANGED ] && [ "$(row t-dateonly route)" = REVIEW ] && pass "date-only change → review queue" || failx dateonly
[ "$(row t-big route)" = REVIEW ] && pass "large rewrite → review, not board" || failx big
[ "$(row t-moved health)" = MOVED_REDIRECT_HOME ] && pass "redirect to homepage caught (not 'no change')" || failx moved
[ "$(row t-soft health)" = SOFT_404 ] && pass "200 soft-404 caught via probe signature" || failx soft
[ "$(row t-feed health)" = TRUNCATED ] && pass "truncated feed caught" || failx trunc
[ "$(row t-wall route)" = REVIEW ] && pass "wall twice → SOURCE_DARK review item" || failx dark-wall

echo "== R3 still dark"; snap; node "$SCR/run.js"; guard
for s in t-moved t-soft t-feed; do [ "$(row $s route)" = REVIEW ] && pass "$s dark → review" || failx "$s dark"; done
[ "$(node -e 'console.log(require(process.argv[1]).items.filter(i=>i.reason==="SOURCE_DARK").length)' "$GC_DATA_DIR/review-queue.json")" = 4 ] && pass "one SOURCE_DARK per dark streak (no spam)" || failx dark-dedupe

echo "== R4 nothing changed, recovering"; echo '{"policy":"v2","dateonly":"2026-10-15T00:00:00Z","big":"v2","moved":"ok","soft":"ok","feed":"ok"}' > "$T/state.json"
snap; N0=$(node -e 'console.log(require(process.argv[1]).events.length)' "$T/j/gate-closing-journal.json"); node "$SCR/run.js"; guard
N1=$(node -e 'console.log(require(process.argv[1]).events.length)' "$T/j/gate-closing-journal.json")
[ "$(row t-policy change)" = UNCHANGED ] && [ "$N0" = "$N1" ] && pass "unchanged hashes → nothing emitted" || failx unchanged

echo "== human append between runs"; node -e '
const E=require(process.argv[1]); const fs=require("fs"); const p=process.argv[2]; const j=JSON.parse(fs.readFileSync(p));
const r=E.appendEvent(j,{event_id:"EVT-0900",kind:"observation",title:"human note",entity_id:"ENT-KDP",mechanism_id:"MECH-VOLUME",market:"Publishing",date:"2026-10-30",posted_at:"2026-10-30",direction:"open",source_refs:["SRC-KDP-LIMIT-202609"],proposed_by:{actor:"Rob",role:"human"},audit_status:"PROPOSED"});
fs.writeFileSync(p, JSON.stringify(r.journal,null,1)+"\n");' "$TB/gate-closing-engine.js" "$T/j/gate-closing-journal.json"
snap; node "$SCR/run.js" >/dev/null; guard
grep -q '"type":"EXTERNAL_APPEND"' "$GC_DATA_DIR/manifest.jsonl" && pass "human append captured as EXTERNAL_APPEND" || failx external

echo "== review queue"; node "$SCR/review.js" list
R1=$(node -e 'console.log(require(process.argv[1]).items.find(i=>i.reason==="CHANGE_NEEDS_REVIEW"&&i.source_id==="t-big").review_id)' "$GC_DATA_DIR/review-queue.json")
R2=$(node -e 'console.log(require(process.argv[1]).items.find(i=>i.reason==="DATE_FIELD_CHANGED_ONLY").review_id)' "$GC_DATA_DIR/review-queue.json")
node "$SCR/review.js" resolve "$R1" emit --by "Rob" --note "test emit"
node "$SCR/review.js" resolve "$R2" dismiss --by "Rob"
node -e 'const j=require(process.argv[1]); const e=j.events[j.events.length-1]; if(e.audit_status!=="PROPOSED"||e.date!==null||e.proposed_by.role!=="human") process.exit(1)' "$T/j/gate-closing-journal.json" && pass "human emit from review → still PROPOSED, date null" || failx emit

echo "== wipe test"; node "$SCR/replay.js" --wipe-test --out "$T/rebuilt" | tail -2
echo "== replay to an earlier row"; MID=$(sed -n '30p' "$GC_DATA_DIR/manifest.jsonl" | node -e 'process.stdin.on("data",d=>console.log(JSON.parse(d).fetch_id))')
node "$SCR/replay.js" --to "$MID" --out "$T/mid" | head -1; node -e 'const s=require(process.argv[1]); console.log("  ticker state @"+s.as_of_row+": "+s.events+" events, open review "+s.open_review)' "$T/mid/ticker-state.json"

echo "== tamper tests"
cp "$GC_DATA_DIR/manifest.jsonl" "$T/m.bak"
sed -i '5s/"http_status":200/"http_status":201/' "$GC_DATA_DIR/manifest.jsonl"
node "$SCR/replay.js" >/dev/null 2>&1 && failx "edited manifest row accepted" || pass "edited manifest row → replay refuses"
cp "$T/m.bak" "$GC_DATA_DIR/manifest.jsonl"
SNAP=$(node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse).find(r=>r.source_id==="t-policy"&&r.raw_snapshot_path); console.log(r.raw_snapshot_path)' "$GC_DATA_DIR/manifest.jsonl")
cp "$GC_DATA_DIR/$SNAP" "$T/s.bak"; echo tampered >> "$GC_DATA_DIR/$SNAP"
node "$SCR/replay.js" >/dev/null 2>&1 && failx "edited snapshot accepted" || pass "edited snapshot → replay refuses"
cp "$T/s.bak" "$GC_DATA_DIR/$SNAP"
node -e 'const L=require(process.argv[1]); const e={audit_status:"POSTED",kind:"observation",direction:"open",date:null,flags:["NEEDS_HUMAN_DATE"]}; try{L.assertAutoEventShape(e);process.exit(1)}catch(x){}' "$SCR/lib.js" && pass "code refuses auto POSTED" || failx boundary
cp "$T/j/gate-closing-journal.json" "$T/jb.json"; node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(process.argv[1]));const E=require(process.argv[2]);const r=E.appendEvent(j,{event_id:"EVT-0999",kind:"evidence",title:"x",entity_id:"ENT-SUNO",mechanism_id:"MECH-METERING",market:"Music",date:"2026-10-30",posted_at:"2026-10-30",direction:"supports",source_refs:["SRC-KDP-LIMIT-202609"],proposed_by:{actor:"gc-scraper/1 (automated fetch-hash-diff; not an adjudicator)",role:"model"},audit_status:"PROPOSED"});fs.writeFileSync(process.argv[3],JSON.stringify(r.journal))' "$T/jb.json" "$TB/gate-closing-engine.js" "$T/ja.json"
node "$SCR/guard.js" "$T/jb.json" "$T/ja.json" "$T/mb.jsonl" "$GC_DATA_DIR/manifest.jsonl" >/dev/null 2>&1 && failx "guard let a SUPPORT auto event through" || pass "CI guard blocks auto SUPPORT/dated event"
node "$SCR/replay.js" --wipe-test >/dev/null && pass "restored state replays clean" || failx restore
echo; cat "$GC_DATA_DIR/digests/"*.md | head -8
echo "ALL E2E CHECKS PASSED"
