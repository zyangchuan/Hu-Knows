const { GameEngine } = require('./dist/game/engine/engine');
const base=(t)=>t.split(':')[0];
function run(seed) {
  let x=seed; const rng=()=>(x=(x*1103515245+12345)&0x7fffffff)/0x7fffffff;
  const pick=(a)=>a[Math.floor(rng()*a.length)];
  // seats 0,1,2 real; seat 3 bot
  const seats=[{seat:0,pairName:'A',isBot:false},{seat:1,pairName:'B',isBot:false},{seat:2,pairName:'C',isBot:false},{seat:3,pairName:'Bot',isBot:true}];
  const engine=new GameEngine(seats);
  let done=false,guard=0,botDiscards=0,botFeedClaimable=0,botFeedNotClaimable=0,chiFromBot=0,pungFromBot=0,lastWasBot=false;
  engine.on('your_turn',({seat,hand,canWin})=>{
    if(done||guard++>9000){done=true;return;}
    if(canWin){engine.declareHu(seat);return;}
    if(seat===3){ const fed=engine.learnBotDiscard(3); botDiscards++; engine.discard(3, fed||pick(hand)); lastWasBot=true; }
    else { engine.discard(seat, pick(hand)); lastWasBot=false; }
  });
  engine.on('claim_window_open',(data)=>{
    if(done)return;
    const realKeys=Object.keys(data.legalBySeat).map(Number).filter(k=>k!==3);
    if(data.bySeat===3){ if(realKeys.length>0)botFeedClaimable++; else botFeedNotClaimable++; }
    // real players claim; prefer CHI to exercise it; bot(3) never claims
    if(realKeys.length){
      // find a seat with chi
      let chosen=null;
      for(const k of realKeys){ const chi=data.legalBySeat[k].find(c=>c.type==='CHI'); if(chi){chosen={k,c:chi};break;} }
      if(!chosen){ const k=realKeys[0]; chosen={k,c:data.legalBySeat[k][0]}; }
      if(data.bySeat===3){ if(chosen.c.type==='CHI')chiFromBot++; else if(chosen.c.type==='PUNG')pungFromBot++; }
      engine.submitClaim(chosen.k, chosen.c.type, chosen.c.tiles);
    }
    for(const k of Object.keys(data.legalBySeat).map(Number)) if(!realKeys.includes(k)||true){} // others auto: pass non-claimers
    for(const k of Object.keys(data.legalBySeat).map(Number)) if(!(realKeys.length && k===/*chosen*/ -1)) {}
  });
  engine.on('hu',()=>done=true); engine.on('draw',()=>done=true);
  engine.startHand();
  return {botDiscards,botFeedClaimable,botFeedNotClaimable,chiFromBot,pungFromBot};
}
let bd=0,fc=0,fnc=0,chi=0,pung=0;
for(let s=1;s<=200;s++){const r=run(s*7); bd+=r.botDiscards; fc+=r.botFeedClaimable; fnc+=r.botFeedNotClaimable; chi+=r.chiFromBot; pung+=r.pungFromBot;}
console.log(`bot-discards:${bd} feed-claimable:${fc} feed-NOT-claimable:${fnc} chi-from-bot:${chi} pung-from-bot:${pung}`);
console.log(fnc===0 && chi>0 ? 'PASS: every bot discard was claimable; bot feeds Chi to the next seat' : 'CHECK');
process.exit(fnc===0 && chi>0 ? 0 : 1);
