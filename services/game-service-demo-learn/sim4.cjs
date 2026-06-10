const { GameEngine } = require('./dist/game/engine/engine');
function run(seed) {
  let x = seed; const rng = () => (x = (x*1103515245+12345) & 0x7fffffff) / 0x7fffffff;
  const pick = (a) => a[Math.floor(rng()*a.length)];
  const seats = [0,1,2,3].map((seat) => ({ seat, pairName:`P${seat}`, isBot:false }));
  const engine = new GameEngine(seats);
  let earlyHu=0, hu=false, huMelds=-1, done=false, guard=0, claims=0;
  engine.on('your_turn', ({ seat, hand, canWin }) => {
    if (done||guard++>8000){done=true;return;}
    if (canWin && engine.melds[seat].length < 3) earlyHu++; // engine offered HU too early
    if (canWin) { engine.declareHu(seat); } else engine.discard(seat, pick(hand));
  });
  engine.on('claim_window_open', (data) => {
    if (done) return;
    const keys = Object.keys(data.legalBySeat).map(Number);
    // flag if a HU was offered to a seat with <3 melds
    for (const k of keys) for (const c of data.legalBySeat[k]) if (c.type==='HU' && engine.melds[k].length<3) earlyHu++;
    if (keys.length===0) return;
    // aggressively claim to build melds; prefer HU, else random claim
    const huSeat = keys.find(k => data.legalBySeat[k].some(c=>c.type==='HU'));
    if (huSeat!==undefined){ engine.submitClaim(huSeat,'HU',[]); return; }
    const s = pick(keys); const c = pick(data.legalBySeat[s]); claims++; engine.submitClaim(s, c.type, c.tiles);
  });
  engine.on('hu', (p) => { hu=true; huMelds=p.melds.length; done=true; });
  engine.on('draw', ()=>done=true);
  engine.startHand();
  return { earlyHu, hu, huMelds, claims };
}
let early=0, hus=0, draws=0, minHuMelds=99;
for (let s=1;s<=300;s++){ const r=run(s*7); early+=r.earlyHu; if(r.hu){hus++; minHuMelds=Math.min(minHuMelds,r.huMelds);} else draws++; }
console.log(`runs:300 hus:${hus} draws:${draws} early-HU-offers(<3 melds):${early} min-melds-at-hu:${minHuMelds===99?'n/a':minHuMelds}`);
console.log(early===0 && hus>0 ? 'PASS: no early HU; wins require >=3 claimed melds and are reachable' : 'CHECK');
process.exit(early===0 && hus>0 ? 0 : 1);
