'use strict';
const LEVELS=[['Rookie Returner',0],['Pavement Pounder',150],['Trail Tripletail',400],['10K Crusher',800],['Half Hero',1400],['Long Run Legend',2200],['Marathon Ready',3200]];
const BADGES=[['👟','First Step','Log your first run',(h,s)=>h.length>0],['🔥','7-Day Streak','7 days in a row',(h,s)=>s.best>=7],
['☀️','Heat Beater','Run at 80°F+ (tell Grok Bot)',()=>false],['5️⃣','First 5 Miles','One 5-mile run',h=>h.some(r=>r.miles>=5)],
['🏅','30-Day Streak','30 days in a row',(h,s)=>s.best>=30],['💪','Strength Streak','2 strength/wk for 4 wks (tell Grok Bot)',()=>false],['🔟','Double Digits','A 10-mile run',h=>h.some(r=>r.miles>=10)],['⚡','Turbo Charged','Achieve 5 Turbo Boosts',h=>h.reduce((a,r)=>a+(r.boostsHit||0),0)>=5]];
const QUESTS=[['Mon','🏃','Run-walk 4:1','20–25 min · ~1.5 mi','+11 XP','5 min dynamic warm-up (leg swings, hip circles), then 4 min easy run / 1 min walk. Talking pace. Finish with calf + hamstring stretches.'],
['Tue','💪','Strength + mobility','20 min','+13 XP','Squats 3×10, glute bridges 3×12, calf raises 3×15, plank 3×30s. Then 5 min hip flexor + quad stretches.'],
['Wed','🧘','Rest + mobility','10 min','+8 XP','Planned rest. Gentle mobility: ankle rolls, cat-cow, figure-4 glute stretch, 30–45s holds.'],
['Thu','🏃','Run-walk 4:1','25 min · ~2 mi','+12 XP','Same format as Monday. Go early to beat the heat; bring water.'],
['Fri','💪','Strength + mobility','20 min','+13 XP','Repeat Tuesday. Add a side plank 2×20s each side.'],
['Sat','⭐','Long run-walk','30 min · ~2.5 mi','+27 XP',"Week's longest effort (long run bonus +15). Easy pace, electrolytes if over 45 min."],
['Sun','😴','Rest + mobility','10 min','+8 XP','Recovery day. Light walk optional, then full stretch routine.']];
const BOSSES=[['👾','First 5K',3.1],['🐉','First 10K',6.2],['🧌','Half Marathon',13.1],['👑','Marathon',26.2]];
const TIPS=[['Stretch','Warm up dynamic','Leg swings, walking lunges, hip circles, ankle rolls: 5 minutes before every run.'],['Stretch','Cool down static','Hold calves, hamstrings, hip flexors, quads and glutes 30–45 s each after runs.'],['Fuel','Protein every meal','~1.2–1.6 g per kg body weight daily to keep muscle at 57+.'],['Fuel','Carbs before long runs','Oats, rice, potatoes or fruit 2–3 h out. Practice gels on runs over 60–75 min.'],['Heat','Beat the Florida sun','Run at dawn or dusk, sip water all day, electrolytes for long or hot runs.'],['Supps','Evidence-backed picks','Vitamin D, creatine 3–5 g/day, omega-3. Check with your doctor first.']];
const KEY='mq_history_v1',$=id=>document.getElementById(id);
const M_PER_MI=1609.344,MAX_ACC=30,MAX_SPEED=7; // m/s (~3:50/mi) — faster = GPS jump
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}};
const save=h=>localStorage.setItem(KEY,JSON.stringify(h));
const pad=n=>String(n).padStart(2,'0');
const fmtT=ms=>{const s=Math.floor(ms/1000);return Math.floor(s/3600)+':'+pad(Math.floor(s/60)%60)+':'+pad(s%60)};
const fmtP=sPerMi=>!isFinite(sPerMi)||sPerMi<=0||sPerMi>3600?'--:--':Math.floor(sPerMi/60)+':'+pad(Math.round(sPerMi%60)%60);
function hav(a,b){const R=6371000,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function xpFor(r){let x=10;if(r.interval==='cont')x+=Math.floor(r.miles);if(r.movingMs>=30*60000)x+=15;return x+(r.boostPts||0)}
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
function streaks(h){const days=[...new Set(h.map(r=>dayKey(r.start)))].sort();let best=0,run=0,prev=null;
 for(const d of days){const t=new Date(d+'T12:00');run=prev&&Math.round((t-prev)/864e5)===1?run+1:1;best=Math.max(best,run);prev=t}
 let cur=0;if(prev){const gap=Math.round((new Date(dayKey(Date.now())+'T12:00')-prev)/864e5);cur=gap<=1?run:0}return{cur,best}}
function stats(){const h=load(),xp=h.reduce((a,r)=>a+(r.xp||0),0);let li=0;LEVELS.forEach((l,i)=>{if(xp>=l[1])li=i});return{h,xp,li,s:streaks(h)}}

function renderGame(){const{h,xp,li,s}=stats(),nx=LEVELS[li+1];
 $('lvlName').textContent=`Level ${li+1} · ${LEVELS[li][0]}`;$('xpText').textContent=xp+' XP';$('streak').textContent=s.cur;
 const pct=nx?(xp-LEVELS[li][1])/(nx[1]-LEVELS[li][1])*100:100;setTimeout(()=>$('xpFill').style.width=Math.max(3,pct)+'%',100);
 $('nextText').textContent=nx?`${nx[1]-xp} XP to ${nx[0]}`:'Max level — go race!';
 $('ladder').innerHTML=LEVELS.map((l,i)=>`<div class="step ${i===li?'cur':i<li?'done':''}"><span>${i<li?'✅':i===li?'📍':'🔒'} L${i+1} ${l[0]}</span><span>${i===li?'YOU ARE HERE':l[1]+' XP'}</span></div>`).reverse().join('');
 const got=BADGES.map(b=>b[3](h,s));$('badgeCount').textContent=got.filter(Boolean).length+' / '+BADGES.length;
 $('badges').innerHTML=BADGES.map((b,i)=>`<div class="badge ${got[i]?'got':''}"><i>${b[0]}</i><b>${b[1]}</b><br>${b[2]}</div>`).join('');
 $('quests').innerHTML=QUESTS.map(q=>`<details><summary>${q[1]} ${q[0]} · ${q[2]} <span class="sub">${q[3]} · ${q[4]}</span></summary><p>${q[5]}</p></details>`).join('');
 const longest=Math.max(0,...h.map(r=>r.miles));
 $('bosses').innerHTML=BOSSES.map(b=>`<div class="boss ${longest>=b[2]?'beat':''}"><i>${b[0]}</i><b>${b[1]}</b><div class="sub">${b[2]} mi · ${longest>=b[2]?'DEFEATED':Math.round(Math.min(1,longest/b[2])*100)+'%'}</div></div>`).join('');
 $('tips').innerHTML=TIPS.map(t=>`<div class="tip"><div class="sub">${t[0]}</div><b>${t[1]}</b><p>${t[2]}</p></div>`).join('');
 renderHist(h)}

function drawMap(el,pts,map){if(!window.L)return null;if(!map){map=L.map(el,{zoomControl:false,attributionControl:true}).setView(pts[0]||[26.64,-81.87],15);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map)}
 if(pts.length){const line=L.polyline(pts,{color:'#19d3c5',weight:5}).addTo(map);L.circleMarker(pts[0],{radius:6,color:'#3f3',fillOpacity:1}).addTo(map);
 L.circleMarker(pts[pts.length-1],{radius:6,color:'#f55',fillOpacity:1}).addTo(map);map.fitBounds(line.getBounds(),{padding:[20,20]})}return map}
function runCard(r,i){return`<div class="card"><h3>${new Date(r.start).toLocaleString([], {weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</h3>
 <div class="stats"><div><b>${r.miles.toFixed(2)}</b><span>miles</span></div><div><b>${fmtT(r.movingMs)}</b><span>time</span></div><div><b>${fmtP(r.movingMs/1000/r.miles)}</b><span>avg /mi</span></div></div>
 <div class="stats"><div><b>~${r.kcal}</b><span>kcal (estimate)</span></div><div><b>+${r.xp}</b><span>XP</span></div><div><b>${r.interval==='cont'?'Cont.':r.interval}</b><span>mode</span></div></div>
 <div class="stats"><div><b>⚡${r.boostsHit||0}/${r.boostsTried||0}</b><span>boosts achieved</span></div><div><b>+${r.boostPts||0}</b><span>booster pts (in XP)</span></div></div>
 ${r.route.length>1?`<div class="map small" id="hm${i}"></div>`:'<div class="sub">No GPS route recorded.</div>'}
 ${r.splits.length?`<table><tr><th>Mile</th><th>Split</th></tr>${r.splits.map((s,k)=>`<tr><td>${k+1}</td><td>${fmtP(s/1000)}</td></tr>`).join('')}</table>`:''}
 ${i>=0?`<button class="mid" data-del="${r.start}">Delete</button>`:''}</div>`}
function renderHist(h){const list=[...h].reverse();$('histList').innerHTML=list.length?list.map((r,i)=>runCard(r,i)).join(''):'<div class="card sub">No runs yet. Hit START!</div>';
 if($('tab-hist').classList.contains('on'))list.forEach((r,i)=>r.route.length>1&&drawMap($('hm'+i),r.route))}

// ---- Run engine ----
let R=null,map=null,live=null,wake=null,tick=null;
const say=t=>{if(!$('voiceChk').checked||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=1;speechSynthesis.speak(u)};
const buzz=p=>navigator.vibrate&&navigator.vibrate(p);
async function lockOn(){try{if('wakeLock'in navigator)wake=await navigator.wakeLock.request('screen')}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&R&&!R.paused)lockOn()});
function elapsed(){return R.acc+(R.paused?0:Date.now()-R.resumedAt)}
function onPos(p){if(!R)return;const c=p.coords,pt=[c.latitude,c.longitude],t=p.timestamp||Date.now();
 if(c.accuracy>MAX_ACC){R.gpsPoor=true;if(R.boost)endBoost('void','weak GPS');$('gps').textContent=`📍 Weak GPS (±${Math.round(c.accuracy)} m) — waiting`;return}
 R.gpsPoor=false;R.lastFix=Date.now();$('gps').textContent=`📍 GPS live (±${Math.round(c.accuracy)} m)`;if(R.paused)return;
 const last=R.last;if(last){const d=hav(last.pt,pt),dt=(t-last.t)/1000;if(dt<=0)return;
  if(d/dt>MAX_SPEED){R.rejected++;return} if(d<Math.max(2,c.accuracy/4))return; // jitter
  R.dist+=d;R.recent.push({t,d});const mi=R.dist/M_PER_MI;
  while(mi>=R.splits.length+1){const e=elapsed();R.splits.push(e-R.splitMark);R.splitMark=e;say(`Mile ${R.splits.length}. Split ${fmtP(R.splits.at(-1)/1000).replace(':',' minutes ')} seconds`);buzz([300,100,300])}
  boostOnDist()}
 R.last={pt,t};R.route.push(pt);R.seg.push(pt);
 if(map){live?live.setLatLngs(R.seg):(live=L.polyline(R.seg,{color:'#19d3c5',weight:5}).addTo(map));map.panTo(pt)}}
function onErr(e){$('gps').textContent=e.code===1?'📍 Location blocked — allow it in Settings › Safari › Location (or the browser site settings)':'📍 GPS error: '+e.message}
// ---- Turbo Boost ----
const CFG=Object.assign({gapMin:4*60000,gapMax:9*60000,firstMin:60000,firstMax:3*60000,minMi:0.25,seg:0.1,faster:30,pts:5,maxBoostMs:5*60000},window.MQ_CFG||{});
const SEG_M=CFG.seg*M_PER_MI,rnd=(a,b)=>a+Math.random()*(b-a);
const boostOn=()=>$('boostChk').checked;
function setTb(cls,msg){const t=$('turbo');t.className='turbo '+cls;$('tbMsg').textContent=msg;clearTimeout(R&&R.tbHide);const r=R;if(r)r.tbHide=setTimeout(()=>{if(!r.boost)t.hidden=true},6000)}
function tryBoost(e,ph){if(!boostOn()||R.boost||R.paused||ph.p!=='RUN'||R.gpsPoor)return;const mi=R.dist/M_PER_MI;if(mi<CFG.minMi)return;
 if(R.nextBoostAt==null){R.nextBoostAt=e+rnd(CFG.firstMin,CFG.firstMax);return} if(e<R.nextBoostAt)return;
 if(R.interval!=='cont'){const left=phaseOf(e).left;if(left!=null&&left<60000)return} // don't start right before a walk
 const avg=e/1000/mi,target=avg-CFG.faster;R.boost={startDist:R.dist,startE:e,avg,target,segPace:null};R.boostsTried++;
 $('turbo').hidden=false;$('turbo').className='turbo';$('tbMsg').textContent='Push it — hit the target pace for 0.1 mi!';$('tbTarget').textContent=fmtP(target);$('tbSeg').textContent='--:--';$('tbFill').style.width='0%';$('tbLeft').textContent=CFG.seg.toFixed(2);
 say('Turbo boost! Next tenth of a mile, thirty seconds faster!');buzz([150,80,150,80,400])}
function endBoost(kind,why){const b=R.boost;if(!b)return;R.boost=null;R.nextBoostAt=elapsed()+rnd(CFG.gapMin,CFG.gapMax);R.boostLog.push({kind,avg:b.avg,target:b.target,segPace:b.segPace,why:why||''});
 if(kind==='hit'){R.boostsHit++;R.boostPts+=CFG.pts;setTb('win',`🎉 BOOST ACHIEVED! ${fmtP(b.segPace)}/mi · +${CFG.pts} booster points`);say('Boost achieved! Plus five booster points!');buzz([100,50,100,50,100,50,300])}
 else if(kind==='miss'){setTb('fail',`So close — ${fmtP(b.segPace)}/mi vs ${fmtP(b.target)} target. You'll get the next one! 💪`);say("Good effort! Ease back and get the next one.")}
 else{R.boostsTried--;setTb('fail','Boost cancelled ('+why+'). No penalty.')}
 updBoostUI()}
function boostOnDist(){const b=R.boost;if(!b)return;const d=R.dist-b.startDist,e=elapsed();
 if(d>5)b.segPace=(e-b.startE)/1000/(d/M_PER_MI);$('tbSeg').textContent=fmtP(b.segPace);$('tbFill').style.width=Math.min(100,d/SEG_M*100)+'%';$('tbLeft').textContent=Math.max(0,(SEG_M-d)/M_PER_MI).toFixed(2);
 if(d>=SEG_M){b.segPace=(e-b.startE)/1000/(d/M_PER_MI);endBoost(b.segPace<=b.target?'hit':'miss')}}
function updBoostUI(){if(!R)return;const e=elapsed(),mi=R.dist/M_PER_MI;$('boostTarget').textContent=R.boost?fmtP(R.boost.target):mi>0.02?fmtP(e/1000/mi-CFG.faster):'--:--';
 $('boostCount').textContent=R.boostsHit+'/'+R.boostsTried;$('boostPts').textContent=R.boostPts}
function phaseOf(ms){if(R.interval==='cont')return{p:'RUN',left:null};const[r,w]=R.interval.split(':').map(Number),cyc=(r+w)*60000,m=ms%cyc;
 return m<r*60000?{p:'RUN',left:r*60000-m}:{p:'WALK',left:cyc-m}}
function update(){if(!R)return;const e=elapsed();$('timer').textContent=fmtT(e);const mi=R.dist/M_PER_MI;$('dist').textContent=mi.toFixed(2);
 $('avgPace').textContent=mi>0.02?fmtP(e/1000/mi):'--:--';
 const now=Date.now();R.recent=R.recent.filter(x=>now-x.t<30000);const rd=R.recent.reduce((a,x)=>a+x.d,0);$('curPace').textContent=rd>15&&!R.paused?fmtP(30/(rd/M_PER_MI)):'--:--';
 const ph=phaseOf(e);$('phase').textContent=R.paused?'PAUSED':ph.p;$('phase').className='phase'+(ph.p==='WALK'?' walk':'');
 $('phaseCd').textContent=ph.left!=null?`${ph.p==='RUN'?'Walk':'Run'} in ${Math.ceil(ph.left/1000)}s`:'';
 if(R.boost&&!R.paused&&R.lastFix&&Date.now()-R.lastFix>15000)endBoost('void','lost GPS');
 if(R.boost&&e-R.boost.startE>CFG.maxBoostMs)endBoost('void','timed out');
 if(!R.paused&&ph.p!==R.phase){if(ph.p==='WALK'&&R.boost)endBoost('void','walk interval');R.phase=ph.p;if(R.interval!=='cont'){say(ph.p==='RUN'?'Run! Pick it up.':'Walk. Nice work, recover.');buzz(ph.p==='RUN'?[200,100,200,100,200]:[600])}}
 tryBoost(e,ph);updBoostUI()}
function start(){R={start:Date.now(),acc:0,resumedAt:Date.now(),paused:false,dist:0,route:[],seg:[],splits:[],splitMark:0,laps:[],lapMark:0,recent:[],last:null,rejected:0,interval:$('ivSel').value,phase:'RUN',boost:null,nextBoostAt:null,boostsTried:0,boostsHit:0,boostPts:0,boostLog:[],gpsPoor:false};$('turbo').hidden=true;
 $('summary').hidden=true;$('laps').innerHTML='';show(true);lockOn();say('Quest started. Run!');buzz(200);
 if(!navigator.geolocation)onErr({message:'not supported'});else{$('gps').textContent='📍 Finding GPS…';R.watch=navigator.geolocation.watchPosition(onPos,onErr,{enableHighAccuracy:true,maximumAge:0,timeout:20000})}
 if(!map)map=drawMap($('map'),[]);if(live){live.remove();live=null}tick=setInterval(update,250);update()}
function pause(){if(R.paused){R.paused=false;R.resumedAt=Date.now();R.last=null;R.seg=[];live=null;$('pauseBtn').textContent='PAUSE';say('Resumed');lockOn()}
 else{if(R.boost)endBoost('void','paused');R.acc+=Date.now()-R.resumedAt;R.paused=true;$('pauseBtn').textContent='RESUME';say('Paused')}update()}
function lap(){const e=elapsed();R.laps.push(e-R.lapMark);R.lapMark=e;$('laps').innerHTML+=`<li>Lap ${R.laps.length}: ${fmtT(R.laps.at(-1))} · ${(R.dist/M_PER_MI).toFixed(2)} mi</li>`;buzz(100)}
function stop(){if(!confirm('Finish this run?'))return;if(R.boost)endBoost('void','run stopped');if(!R.paused){R.acc+=Date.now()-R.resumedAt;R.paused=true}
 clearInterval(tick);if(R.watch!=null)navigator.geolocation.clearWatch(R.watch);if(wake){wake.release().catch(()=>{});wake=null}
 let miles=R.dist/M_PER_MI;if(miles<0.05){const v=prompt('GPS got little or no distance. Enter miles (or leave blank):','');if(v&&!isNaN(+v))miles=+v}
 const run={start:R.start,end:Date.now(),movingMs:R.acc,miles:+miles.toFixed(3),interval:R.interval,splits:R.splits,laps:R.laps,
  route:R.route.map(p=>[+p[0].toFixed(6),+p[1].toFixed(6)]),kcal:Math.round(miles*100),boostsTried:R.boostsTried,boostsHit:R.boostsHit,boostPts:R.boostPts,boostLog:R.boostLog,rejectedPts:R.rejected};
 run.xp=xpFor(run);const h=load();h.push(run);save(h);R=null;show(false);say(`Quest complete. ${miles.toFixed(2)} miles. Plus ${run.xp} X P.`);$('turbo').hidden=true;
 const s=$('summary');s.hidden=false;s.innerHTML=`<div class="xpPop">+${run.xp} XP</div>`+runCard(run,-1).replace('id="hm-1"','id="sumMap"');
 if(run.route.length>1)drawMap($('sumMap'),run.route);renderGame();$('phase').textContent='DONE';$('phaseCd').textContent='';$('curPace').textContent='--:--'}
function show(on){$('startBtn').hidden=on;['pauseBtn','lapBtn','stopBtn'].forEach(b=>$(b).hidden=!on);$('pauseBtn').textContent='PAUSE';$('ivSel').disabled=on}
$('startBtn').onclick=start;$('pauseBtn').onclick=pause;$('lapBtn').onclick=lap;$('stopBtn').onclick=stop;
window.addEventListener('beforeunload',e=>{if(R){e.preventDefault();e.returnValue=''}});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button,.tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('tab-'+b.dataset.tab).classList.add('on');if(b.dataset.tab==='hist')renderHist(load());if(b.dataset.tab==='run'&&map)map.invalidateSize()});
$('histList').onclick=e=>{const d=e.target.dataset.del;if(d&&confirm('Delete this run?')){save(load().filter(r=>String(r.start)!==d));renderGame()}};
$('exportBtn').onclick=()=>{const b=new Blob([JSON.stringify({app:'Marathon Quest',exported:new Date().toISOString(),runs:load()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='marathon-quest-'+dayKey(Date.now())+'.json';a.click()};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),runs=j.runs||j,h=load(),seen=new Set(h.map(r=>r.start));runs.forEach(r=>{if(!seen.has(r.start))h.push(r)});h.sort((a,b)=>a.start-b.start);save(h);renderGame();alert('Imported')}catch(x){alert('Bad file')}};
$('boostChk').checked=localStorage.mq_boosts!=='off';$('boostChk').onchange=e=>{localStorage.mq_boosts=e.target.checked?'on':'off';if(!e.target.checked&&R&&R.boost)endBoost('void','boosts off')};
renderGame();map=drawMap($('map'),[]);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
