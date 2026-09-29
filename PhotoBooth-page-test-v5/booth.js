(()=>{
const $=s=>document.querySelector(s),sec=$('#page-04');if(!sec)return;
const v=$('#bVideo'),cv=$('#bResult'),cd=$('#bCount'),fl=$('#bFlash'),msg=$('#bMsg'),info=$('#bInfo');
const L={
 polaroid:{n:1,w:800,h:1000,f:880,s:[[40,40,720,720]]},
 strip:{n:4,w:440,h:1270,f:1225,s:[0,1,2,3].map(i=>[40,30+i*290,360,270])},
 grid:{n:4,w:890,h:1010,f:945,s:[[30,30,400,400],[460,30,400,400],[30,460,400,400],[460,460,400,400]]}};
const F={natural:{css:'none'},
 sakura:{css:'saturate(1.1) brightness(1.05) sepia(.15) hue-rotate(-12deg)',tint:'rgba(255,140,190,.4)'},
 ocean:{css:'saturate(1.1) hue-rotate(8deg)',tint:'rgba(60,140,230,.4)'},
 film:{css:'grayscale(1) contrast(1.1)',gray:1}};
const T={sakura:{a:'#ffe6f0',b:'#ffb8d6',ink:'#7a2a52',pet:'#ff7db8'},
 ocean:{a:'#0a2547',b:'#062038',ink:'#dff1ff',pet:'#69d9ff'},
 lantern:{a:'#4a1238',b:'#1a0a24',ink:'#ffd9e8',pet:'#ffb35c'}};
L.two={n:2,w:520,h:1160,f:1105,s:[[40,30,440,510],[40,570,440,510]]};
const LN={strip:'4 cut',grid:'2 × 2',two:'2 cut',polaroid:'Polaroid'},TN={sakura:'Sakura pagi',ocean:'Samudra malam',lantern:'Lampion'};
const cfg={b:'none',m:'solo',l:'strip',f:'natural',t:'sakura',s:'none',d:'none',dc:'polos'};
const say=t=>msg.textContent=t,wait=ms=>new Promise(r=>setTimeout(r,ms));
let stream=null,busy=false,looping=false;
// ---- state virtual ----
const PFX='sakura-booth-',ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const me={name:'',color:'#ff7db8'},pr={name:'pasangan',color:'#69d9ff'};let myRdy=false,pRdy=false;
let role='solo',peer=null,conn=null,partnerReady=false,code='',partnerShots=[];
const send=o=>{if(conn&&conn.open)conn.send(o)};
const pc=document.createElement('canvas'),px=pc.getContext('2d');pc.id='bPc';pc.width=640;pc.height=480;$('#bVideo').after(pc);
let seg=null,segLoading=false;const MP='https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/';
const bc=document.createElement('canvas'),bx=bc.getContext('2d');
function blurBack(im,w,h){bc.width=Math.max(8,w*.08|0);bc.height=Math.max(8,h*.08|0);bx.drawImage(im,0,0,bc.width,bc.height);px.imageSmoothingEnabled=true;px.imageSmoothingQuality='high';px.drawImage(bc,0,0,w,h)}
function onSeg(r){const w=pc.width,h=pc.height;px.save();px.clearRect(0,0,w,h);px.drawImage(r.segmentationMask,0,0,w,h);
  px.globalCompositeOperation='source-in';px.drawImage(r.image,0,0,w,h);px.globalCompositeOperation='destination-over';
  if(cfg.b==='blur'){blurBack(r.image,w,h)}
  else{const t=T[cfg.b==='ocean'?'ocean':'sakura'],g=px.createLinearGradient(0,0,w,h);g.addColorStop(0,t.a);g.addColorStop(1,t.b);px.fillStyle=g;px.fillRect(0,0,w,h);
    px.fillStyle=t.pet;px.globalAlpha=.5;for(let i=0;i<18;i++){px.beginPath();px.ellipse((i*97)%w,(i*151)%h,16,8,i,0,6.3);px.fill()}px.globalAlpha=1}
  px.restore()}
function loadSeg(){if(seg||segLoading)return;segLoading=true;say('Memuat model latar… (butuh internet)');
  const s=document.createElement('script');s.src=MP+'selfie_segmentation.js';
  s.onload=()=>{try{seg=new SelfieSegmentation({locateFile:f=>MP+f});seg.setOptions({modelSelection:1});seg.onResults(onSeg);say('Latar siap.')}catch(e){say('Model latar gagal dimuat.');cfg.b='none'}segLoading=false};
  s.onerror=()=>{segLoading=false;cfg.b='none';say('Model latar gagal dimuat. Cek internet.')};document.head.append(s)}
async function loop(){if(!stream){looping=false;return}
  if(v.videoWidth){if(pc.width!==v.videoWidth){pc.width=v.videoWidth;pc.height=v.videoHeight}
    if(cfg.b!=='none'&&seg){try{await seg.send({image:v})}catch(e){px.drawImage(v,0,0)}}else px.drawImage(v,0,0);
    if(cfg.s!=='none'){kickFace();drawSticker()}}
  requestAnimationFrame(loop)}
function outStream(){const o=pc.captureStream(30);stream.getAudioTracks().forEach(t=>o.addTrack(t));return o}
const pV=$('#pVideo'),pTile=$('#pTile');
function step(n){sec.querySelectorAll('.steps li').forEach((li,i)=>{li.classList.toggle('on',i===n);li.classList.toggle('past',i<n)})}
function thumb(kind,key){const c=document.createElement('canvas'),l=L[kind==='l'?key:cfg.l],t=T[kind==='t'?key:cfg.t];c.width=88;c.height=112;const x=c.getContext('2d'),k=Math.min(88/l.w,112/l.h);
  const w=l.w*k,h=l.h*k,ox=(88-w)/2,oy=(112-h)/2,g=x.createLinearGradient(ox,oy,ox+w,oy+h);g.addColorStop(0,t.a);g.addColorStop(1,t.b);x.fillStyle=g;x.fillRect(ox,oy,w,h);
  x.fillStyle='rgba(255,255,255,.85)';l.s.forEach(s=>x.fillRect(ox+s[0]*k,oy+s[1]*k,s[2]*k,s[3]*k));x.fillStyle=t.pet;for(let i=0;i<6;i++){x.beginPath();x.arc(ox+(i*37%w),oy+(i*53%h),3,0,6.3);x.fill()}return c}
function cards(id,kind,names){const box=$(id);box.innerHTML='';Object.keys(names).forEach(k=>{const b=document.createElement('button');b.className='card'+(cfg[kind]===k?' on':'');b.dataset.v=k;b.append(thumb(kind,k),names[k]);
  b.onclick=()=>{cfg[kind]=k;box.querySelectorAll('.card').forEach(x=>x.classList.toggle('on',x===b));if(kind==='l')cards('#bT','t',TN);cards('#bL','l',LN);decCards();sendCfg();slots()};box.append(b)})}
function slots(){const n=L[cfg.l].n,s=$('#bSlots');s.innerHTML='';for(let i=0;i<n;i++){const d=document.createElement('div');d.textContent=i+1;s.append(d)}}
function paint(){$('#nMe').textContent=me.name||'kamu';$('#nMe').style.setProperty('--c',me.color);$('#nP').textContent=pr.name;$('#nP').style.setProperty('--c',pr.color);$('#pName').textContent=conn&&conn.open?pr.name:'menunggu…';$('#pDot').className=conn&&conn.open&&partnerReady?'ok':''}
$('#bName').oninput=e=>{me.name=e.target.value;paint();send({t:'hi',...me})};
sec.querySelectorAll('.dot').forEach(d=>d.onclick=()=>{me.color=d.dataset.c;sec.querySelectorAll('.dot').forEach(x=>x.classList.toggle('on',x===d));paint();send({t:'hi',...me})});
$('#bMic').onclick=()=>{const t=stream&&stream.getAudioTracks()[0];if(!t)return say('Mic tidak tersedia.');t.enabled=!t.enabled;$('#bMic').textContent=t.enabled?'mic on':'mic off'};
function callPartner(){if(peer&&conn&&conn.open&&stream&&!conn._called){conn._called=1;peer.call(conn.peer,outStream())}}
function tryAuto(){if(role!=='guest'&&cfg.m==='duo'&&myRdy&&pRdy&&!busy)run()}
$('#bReady').onclick=()=>{myRdy=!myRdy;$('#bReady').classList.toggle('on',myRdy);$('#bReady').textContent=myRdy?'READY ✓':'READY';send({t:'rdy',v:myRdy});say(myRdy?(pRdy?'Semua siap!':'Menunggu '+pr.name+'…'):'Tekan READY kalau sudah siap.');tryAuto()};

sec.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
  const k=b.dataset.k;cfg[k]=b.dataset.v;
  sec.querySelectorAll(`.chip[data-k="${k}"]`).forEach(x=>x.classList.toggle('on',x===b));
  if(k==='b'&&cfg.b!=='none')loadSeg();
  if(k==='s'&&cfg.s!=='none')loadFace();
  if(k==='dc')pickDec();
  if(k==='f')v.style.filter=pc.style.filter=F[cfg.f].css;
  if(k==='m')sec.classList.toggle('duo',cfg.m==='duo');
  if(k==='l'||k==='f')sendCfg();
}));

async function startCam(){
  try{
    const vc={facingMode:'user',width:{ideal:1280},height:{ideal:960}};try{stream=await navigator.mediaDevices.getUserMedia({video:vc,audio:{echoCancellation:true}})}catch(e){stream=await navigator.mediaDevices.getUserMedia({video:vc,audio:false});$('#bMic').style.display='none'}
    v.srcObject=stream;await v.play();if(!looping){looping=true;loop()}v.style.filter=pc.style.filter=F[cfg.f].css;
    sec.classList.add('live');sec.classList.remove('done');
    send({t:'ready'});send({t:'hi',...me});callPartner();step(1);slots();
    say(role==='guest'?'Kamera siap. Tunggu pasanganmu menekan "mulai foto".':'Siap. Tekan "mulai foto".');
    refreshInfo();
  }catch(e){say('Kamera tidak bisa dibuka. Izinkan akses kamera dan buka halaman lewat HTTPS atau localhost.')}
}
function stopCam(){if(!stream&&!sec.classList.contains('live'))return;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;face=null;v.srcObject=null;sec.classList.remove('live');send({t:'unready'});myRdy=false}
new MutationObserver(()=>{if(!sec.classList.contains('active'))stopCam()}).observe(sec,{attributes:true,attributeFilter:['class']});

function grab(w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  const vw=pc.width,vh=pc.height,r=w/h;let sw=vw,sh=vw/r;if(sh>vh){sh=vh;sw=vh*r}
  x.translate(w,0);x.scale(-1,1);x.drawImage(pc,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,w,h);x.setTransform(1,0,0,1,0,0);
  const f=F[cfg.f];
  if(f.gray){const d=x.getImageData(0,0,w,h),p=d.data;for(let i=0;i<p.length;i+=4){p[i]=p[i+1]=p[i+2]=p[i]*.3+p[i+1]*.59+p[i+2]*.11}x.putImageData(d,0,0)}
  if(f.tint){x.globalCompositeOperation='soft-light';x.fillStyle=f.tint;x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over'}
  return c;
}
// urutan countdown + jepret; dipakai host, guest, dan mode sendiri (timing identik)
async function sequence(sizes,onShot){
  for(let i=0;i<sizes.length;i++){
    say(sizes.length>1?`foto ${i+1} / ${sizes.length}`:'siap-siap...');
    for(let k=3;k>0;k--){cd.textContent=k;cd.classList.remove('tick');void cd.offsetWidth;cd.classList.add('tick');await wait(1000)}
    cd.textContent='';fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');
    const gc=grab(sizes[i][0],sizes[i][1]);onShot(i,gc);const sl=$('#bSlots').children[i];if(sl){sl.innerHTML='';const im=new Image();im.src=gc.toDataURL('image/jpeg',.5);sl.append(im)}await wait(650);
  }
}
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src});

async function run(){
  if(busy||!stream)return;
  const l=L[cfg.l],duo=cfg.m==='duo';
  if(duo&&!(conn&&conn.open&&partnerReady)){say('Pasangan belum siap. Pastikan dia sudah masuk dan mengaktifkan kamera.');return}
  busy=true;$('#bShoot').disabled=true;partnerShots=[];myRdy=pRdy=false;$('#bReady').classList.remove('on');$('#bReady').textContent='READY';send({t:'rdy',v:false});slots();
  const sizes=l.s.map(s=>duo?[s[2]/2,s[3]]:[s[2],s[3]]),mine=[];
  if(duo)send({t:'go',l:cfg.l,f:cfg.f,sizes});
  await sequence(sizes,(i,c)=>mine.push(c));
  if(duo){
    say('menerima foto pasangan...');
    for(let t=0;t<80&&partnerShots.filter(Boolean).length<l.n;t++)await wait(100);
    if(partnerShots.filter(Boolean).length<l.n){say('Foto pasangan tidak lengkap. Coba ulangi.');busy=false;$('#bShoot').disabled=false;return}
  }
  compose(mine.map((c,i)=>({a:c,b:duo?partnerShots[i]:null})));
  say('Selesai. Unduh atau ulangi.');
  if(duo)send({t:'result',img:cv.toDataURL('image/jpeg',.92)});
  busy=false;$('#bShoot').disabled=false;
}

function compose(shots){
  const l=L[cfg.l],t=T[cfg.t],x=cv.getContext('2d');cv.width=l.w;cv.height=l.h;
  const g=x.createLinearGradient(0,0,l.w,l.h);g.addColorStop(0,t.a);g.addColorStop(1,t.b);
  x.fillStyle=g;x.fillRect(0,0,l.w,l.h);
  for(let i=0;i<26;i++){x.save();x.translate((i*137)%l.w,(i*271)%l.h);x.rotate(i);x.globalAlpha=.25;x.fillStyle=t.pet;x.beginPath();x.ellipse(0,0,14,7,0,0,6.28);x.fill();x.restore()}
  const D=DEC[cfg.d]||DEC.none;if(D.bg)D.bg(x,l,t);
  shots.forEach((p,i)=>{const s=l.s[i];x.fillStyle='rgba(255,255,255,.92)';x.fillRect(s[0]-6,s[1]-6,s[2]+12,s[3]+12);
    x.drawImage(p.a,s[0],s[1]);
    if(p.b){x.drawImage(p.b,s[0]+s[2]/2,s[1]);x.fillStyle='rgba(255,255,255,.92)';x.fillRect(s[0]+s[2]/2-2,s[1],4,s[3])}});
  if(D.fg)D.fg(x,l,t);
  x.fillStyle=t.ink;x.textAlign='center';
  x.font=`italic 600 ${Math.round(l.w*.05)}px "Playfair Display",Georgia,serif`;x.fillText('happy birthday ♡',l.w/2,l.f);
  x.font=`500 ${Math.round(l.w*.028)}px "DM Mono",monospace`;x.fillText('09 · 10 · 2026',l.w/2,l.f+l.w*.06);
  showResult();
}
function showResult(){step(2);sec.classList.add('done');cv.classList.remove('dev');void cv.offsetWidth;cv.classList.add('dev')}


// ================= Stiker wajah (MediaPipe Face Detection) =================
let fd=null,fdLoading=false,fdBusy=false,fdT=0,face=null,faceSeen=0;
const FB='https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/';
function loadFace(){if(fd||fdLoading)return;fdLoading=true;say('Memuat model wajah… (butuh internet)');
  const s=document.createElement('script');s.src=FB+'face_detection.js';
  s.onload=()=>{try{fd=new FaceDetection({locateFile:f=>FB+f});fd.setOptions({model:'short',minDetectionConfidence:.5});fd.onResults(onFace);say('Stiker siap.')}catch(e){say('Model wajah gagal dimuat.');cfg.s='none';setChip('s','none')}fdLoading=false};
  s.onerror=()=>{fdLoading=false;cfg.s='none';setChip('s','none');say('Model wajah gagal dimuat. Cek internet.')};document.head.append(s)}
function onFace(r){const d=r.detections&&r.detections[0];if(!d)return;
  const W=pc.width,H=pc.height,k=d.landmarks;let ax,ay,bx,by;
  if(k&&k.length>=2){ax=k[0].x*W;ay=k[0].y*H;bx=k[1].x*W;by=k[1].y*H}
  else{const b=d.boundingBox;ax=(b.xCenter-b.width*.22)*W;bx=(b.xCenter+b.width*.22)*W;ay=by=(b.yCenter-b.height*.12)*H}
  if(ax>bx){[ax,bx]=[bx,ax];[ay,by]=[by,ay]}
  const n={x:(ax+bx)/2,y:(ay+by)/2,u:Math.max(20,Math.hypot(bx-ax,by-ay)),a:Math.atan2(by-ay,bx-ax)};
  face=face?{x:face.x+(n.x-face.x)*.55,y:face.y+(n.y-face.y)*.55,u:face.u+(n.u-face.u)*.55,a:face.a+(n.a-face.a)*.55}:n;faceSeen=performance.now()}
function kickFace(){const now=performance.now();if(!fd||fdBusy||now-fdT<60)return;fdBusy=true;fdT=now;
  Promise.resolve(fd.send({image:v})).catch(()=>{}).then(()=>{fdBusy=false})}
function drawSticker(){if(!face||performance.now()-faceSeen>500)return;
  px.save();px.translate(face.x,face.y);px.rotate(face.a);px.scale(face.u,face.u);STK[cfg.s]&&STK[cfg.s](px);px.restore()}
// koordinat lokal: asal = tengah dua mata, 1 satuan = jarak antar mata, y ke bawah
const STK={
 ears(c){c.lineCap='round';c.strokeStyle='#ff7db8';c.lineWidth=.06;c.beginPath();c.moveTo(-.85,-1.22);c.quadraticCurveTo(0,-1.85,.85,-1.22);c.stroke();
  [-1,1].forEach(s=>{c.save();c.translate(s*.85,-1.45);c.rotate(s*.4);
   c.fillStyle='#ffe6f0';c.strokeStyle='#ff7db8';c.lineWidth=.04;c.beginPath();c.moveTo(-.34,.3);c.quadraticCurveTo(-.3,-.5,0,-.66);c.quadraticCurveTo(.3,-.5,.34,.3);c.closePath();c.fill();c.stroke();
   c.fillStyle='#ff9ac8';c.beginPath();c.moveTo(-.2,.24);c.quadraticCurveTo(-.17,-.3,0,-.42);c.quadraticCurveTo(.17,-.3,.2,.24);c.closePath();c.fill();c.restore()})},
 crown(c){const N=9;c.lineCap='round';c.strokeStyle='#5fbf8a';c.lineWidth=.07;c.beginPath();
  for(let i=0;i<=N;i++){const x=-1.2+2.4*i/N,y=-1.05-.42*(1-(x/1.2)**2);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
  for(let i=0;i<=N;i++){const x=-1.2+2.4*i/N,y=-1.05-.42*(1-(x/1.2)**2);
   if(i<N){c.fillStyle='#5fbf8a';c.beginPath();c.ellipse(x+.13,y-.05,.09,.04,-.6,0,6.29);c.fill()}
   bloom(c,x,y,i%2?.15:.2,['#ffc2dd','#fff','#ff9ac8'][i%3],i)}},
 glasses(c){c.lineWidth=.07;c.strokeStyle='#2a1230';
  [-1,1].forEach(s=>{c.beginPath();c.arc(s*.5,0,.4,0,6.29);c.fillStyle='rgba(255,154,200,.22)';c.fill();c.stroke()});
  c.lineCap='round';c.beginPath();c.moveTo(-.1,-.04);c.quadraticCurveTo(0,-.16,.1,-.04);c.moveTo(-.9,-.02);c.lineTo(-1.2,-.07);c.moveTo(.9,-.02);c.lineTo(1.2,-.07);c.stroke()}
};

// ================= Frame bergambar (digambar lewat canvas) =================
const rnd=s=>()=>(s=s*16807%2147483647)/2147483647;
const PAL=['#ff7db8','#69d9ff','#ffd166','#b28dff','#7ee0a8'];
function heart(c,x,y,s,col){c.fillStyle=col;c.beginPath();c.moveTo(x,y+s*.35);c.bezierCurveTo(x-s*.9,y-s*.3,x-s*.4,y-s*.95,x,y-s*.4);c.bezierCurveTo(x+s*.4,y-s*.95,x+s*.9,y-s*.3,x,y+s*.35);c.fill()}
function star(c,x,y,r,col,p=5,k=.45){c.fillStyle=col;c.beginPath();for(let i=0;i<p*2;i++){const a=-1.5708+i*Math.PI/p,rr=i%2?r*k:r;c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath();c.fill()}
function bloom(c,x,y,r,col,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=col;for(let i=0;i<5;i++){c.rotate(1.2566);c.beginPath();c.ellipse(0,-r*.6,r*.42,r*.62,0,0,6.29);c.fill()}c.fillStyle='#ffd166';c.beginPath();c.arc(0,0,r*.22,0,6.29);c.fill();c.restore()}
function balloon(c,x,y,r,col){c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=Math.max(1,r*.06);c.beginPath();c.moveTo(x,y+r*1.15);c.quadraticCurveTo(x+r*.35,y+r*2,x-r*.1,y+r*2.9);c.stroke();
  c.fillStyle=col;c.beginPath();c.ellipse(x,y,r*.82,r,0,0,6.29);c.fill();c.beginPath();c.moveTo(x,y+r*.95);c.lineTo(x-r*.14,y+r*1.2);c.lineTo(x+r*.14,y+r*1.2);c.fill();
  c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(x-r*.3,y-r*.35,r*.15,r*.28,.5,0,6.29);c.fill()}
function cloud(c,x,y,r,col){c.fillStyle=col;c.beginPath();[[0,0,1],[.9,.2,.75],[-.9,.25,.7],[.4,-.45,.8],[-.4,-.3,.65]].forEach(q=>{const cx=x+q[0]*r,cy=y+q[1]*r,rr=q[2]*r*.8;c.moveTo(cx+rr,cy);c.arc(cx,cy,rr,0,6.29)});c.fill()}
function moon(c,x,y,r,col){const m=document.createElement('canvas');m.width=m.height=r*2.4|0;const q=m.getContext('2d'),o=m.width/2;q.fillStyle=col;q.beginPath();q.arc(o,o,r,0,6.29);q.fill();q.globalCompositeOperation='destination-out';q.beginPath();q.arc(o+r*.45,o-r*.2,r*.85,0,6.29);q.fill();c.drawImage(m,x-o,y-o)}
const un=l=>Math.min(l.w,520);
function confetti(c,l,n,seed,a){const r=rnd(seed);c.save();c.globalAlpha=a;for(let i=0;i<n;i++){c.fillStyle=PAL[i%5];c.save();c.translate(r()*l.w,r()*l.h);c.rotate(r()*6);c.fillRect(-7,-3,14,6);c.restore()}c.restore()}
function branch(c,w){c.strokeStyle='#6b3f4a';c.lineCap='round';c.lineWidth=w*.014;c.beginPath();c.moveTo(-5,w*.16);c.bezierCurveTo(w*.08,w*.12,w*.14,w*.05,w*.3,w*.035);c.stroke();
  c.lineWidth=w*.008;c.beginPath();c.moveTo(w*.12,w*.085);c.quadraticCurveTo(w*.17,w*.12,w*.22,w*.14);c.stroke();
  [[.06,.13,.035],[.14,.075,.04],[.22,.045,.035],[.29,.035,.03],[.21,.135,.03],[.1,.03,.025]].forEach((q,i)=>bloom(c,w*q[0],w*q[1],w*q[2],i%2?'#ffc2dd':'#ffe6f0',i))}
const DEC={
 none:{c:'polos',n:'Polos'},
 balon:{c:'birthday',n:'Balon',
  bg(c,l){confetti(c,l,40,7,.5)},
  fg(c,l){const w=l.w,h=l.h,u=un(l),n=9,cy=u*.07;c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.beginPath();c.moveTo(0,6);c.quadraticCurveTo(w/2,cy,w,6);c.stroke();
   for(let i=0;i<n;i++){const t=(i+.5)/n,x=t*w,y=6+2*t*(1-t)*(cy-6),fw=w/n*.38;c.fillStyle=PAL[i%5];c.beginPath();c.moveTo(x-fw,y-2);c.lineTo(x+fw,y-2);c.lineTo(x,y+u*.05);c.closePath();c.fill()}
   [[.07,1],[.93,-1]].forEach((q,i)=>{balloon(c,w*q[0],h-u*.11,u*.055,PAL[i*2]);balloon(c,w*q[0]+q[1]*u*.075,h-u*.085,u*.045,PAL[i*2+1])})}},
 pesta:{c:'birthday',n:'Pesta',
  bg(c,l){confetti(c,l,90,11,.65)},
  fg(c,l){const w=l.w,u=un(l),s=u*.14;[[.08,-1],[.92,1]].forEach((q,i)=>{c.save();c.translate(w*q[0],u*.11);c.rotate(q[1]*.4);c.fillStyle=PAL[i*2+1];c.beginPath();c.moveTo(-s*.4,s*.6);c.lineTo(0,-s*.6);c.lineTo(s*.4,s*.6);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.8)';[[-.12,.2],[.1,.05],[0,.38]].forEach(d=>{c.beginPath();c.arc(d[0]*s,d[1]*s,s*.05,0,6.29);c.fill()});
    c.fillStyle=PAL[2];c.beginPath();c.arc(0,-s*.62,s*.09,0,6.29);c.fill();c.restore()});
   star(c,w*.5,u*.03,u*.03,PAL[2]);star(c,w*.22,l.h-u*.04,u*.025,PAL[0]);star(c,w*.78,l.h-u*.04,u*.025,PAL[1])}},
 awan:{c:'cozy',n:'Awan',
  bg(c,l){const r=rnd(5);for(let i=0;i<30;i++)star(c,r()*l.w,r()*l.h,3+r()*4,'rgba(255,255,255,.55)',4,.35)},
  fg(c,l){const w=l.w,h=l.h,u=un(l),f='rgba(255,255,255,.8)';cloud(c,w*.13,h-u*.05,u*.09,f);cloud(c,w*.88,h-u*.06,u*.1,f);cloud(c,w*.2,u*.02,u*.07,f);cloud(c,w*.82,u*.015,u*.08,f);
   star(c,w*.35,h-u*.05,u*.022,'#ffe9a8');star(c,w*.66,h-u*.04,u*.018,'#ffe9a8')}},
 hangat:{c:'cozy',n:'Hangat',
  bg(c,l){c.save();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;c.setLineDash([12,10]);c.strokeRect(14,14,l.w-28,l.h-28);c.restore();
   const r=rnd(3);for(let i=0;i<24;i++)heart(c,r()*l.w,r()*l.h,7+r()*8,'rgba(255,154,200,.45)')},
  fg(c,l){const w=l.w,h=l.h,u=un(l),mx=w*.09,my=h-u*.085,mw=u*.09,mh=u*.07;
   c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=u*.006;c.lineCap='round';[-.3,.3].forEach(o=>{c.beginPath();c.moveTo(mx+o*mw,my-mh*.15);c.quadraticCurveTo(mx+o*mw+8,my-mh*.6,mx+o*mw,my-mh*1.1);c.stroke()});
   c.strokeStyle='#fff1f6';c.lineWidth=u*.012;c.beginPath();c.arc(mx+mw*.5,my+mh*.5,mh*.3,-1.4,1.4);c.stroke();
   c.fillStyle='#fff1f6';c.beginPath();c.roundRect?c.roundRect(mx-mw*.5,my,mw,mh,u*.012):c.rect(mx-mw*.5,my,mw,mh);c.fill();c.fillStyle='#8a5a44';c.beginPath();c.ellipse(mx,my+2,mw*.44,mh*.12,0,0,6.29);c.fill();
   heart(c,mx-mw*.05,my+mh*.55,u*.02,'#ff7db8');
   heart(c,w-u*.09,h-u*.07,u*.045,'#ff9ac8');heart(c,w-u*.15,h-u*.045,u*.03,'#ffc2dd');heart(c,w-u*.05,h-u*.13,u*.028,'#ffd9e8')}},
 sakura:{c:'jepang',n:'Ranting',
  fg(c,l){const u=un(l);branch(c,u);c.save();c.translate(l.w,0);c.scale(-1,1);branch(c,u);c.restore()}},
 matsuri:{c:'jepang',n:'Matsuri',
  bg(c,l,t){const r=un(l)*.06;c.save();c.strokeStyle=t.ink;c.globalAlpha=.16;c.lineWidth=1.5;
   for(let row=0,y=0;y<l.h+r;row++,y+=r*.5)for(let x=(row%2)*r;x<l.w+r;x+=r*2)for(let k=1;k<=3;k++){c.beginPath();c.arc(x,y,r*k/3,Math.PI,0);c.stroke()}c.restore()},
  fg(c,l){const w=l.w,u=un(l);for(let i=0;i<5;i++){const x=w*(.1+.2*i),y=u*.012+(i%2)*u*.012,rx=u*.026,ry=u*.032;
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.5;c.beginPath();c.moveTo(x,0);c.lineTo(x,y);c.stroke();
    c.fillStyle='#e0334c';c.beginPath();c.ellipse(x,y+ry,rx,ry,0,0,6.29);c.fill();
    c.strokeStyle='rgba(60,10,20,.45)';[.4,.75].forEach(k=>{c.beginPath();c.ellipse(x,y+ry,rx*k,ry,0,0,6.29);c.stroke()});
    c.fillStyle='#2a1230';c.fillRect(x-rx*.5,y,rx,ry*.18);c.fillRect(x-rx*.5,y+ry*1.82,rx,ry*.18);
    c.strokeStyle='#ffd166';c.beginPath();c.moveTo(x,y+ry*2);c.lineTo(x,y+ry*2+u*.02);c.stroke()}}},
 bintang:{c:'langit',n:'Bintang',
  bg(c,l){const r=rnd(9);for(let i=0;i<80;i++){c.globalAlpha=.3+r()*.6;star(c,r()*l.w,r()*l.h,2+r()*3,'#fff',4,.3)}c.globalAlpha=1},
  fg(c,l){const w=l.w,h=l.h,u=un(l);moon(c,w-u*.1,u*.09,u*.07,'#fff3c4');star(c,u*.07,u*.07,u*.035,'#ffe9a8',4,.3);star(c,u*.06,h-u*.06,u*.03,'#ffe9a8',4,.3);star(c,w-u*.07,h-u*.06,u*.035,'#ffe9a8',4,.3)}},
 aurora:{c:'langit',n:'Aurora',
  bg(c,l){const w=l.w,h=l.h;c.save();c.lineWidth=h*.06;c.lineCap='round';['rgba(110,231,183,.3)','rgba(105,217,255,.3)','rgba(178,141,255,.3)'].forEach((col,i)=>{const y=h*(.2+.28*i);c.strokeStyle=col;c.beginPath();c.moveTo(-20,y);c.bezierCurveTo(w*.3,y-h*.15,w*.7,y+h*.15,w+20,y-h*.05);c.stroke()});c.restore();
   const r=rnd(4);for(let i=0;i<40;i++){c.fillStyle='rgba(255,255,255,'+(.3+r()*.5)+')';c.beginPath();c.arc(r()*w,r()*h,1+r()*2,0,6.29);c.fill()}},
  fg(c,l){const w=l.w,h=l.h,u=un(l);star(c,u*.07,u*.06,u*.03,'#dff1ff',4,.3);star(c,w-u*.07,u*.08,u*.04,'#dff1ff',4,.3);star(c,u*.06,h-u*.05,u*.035,'#dff1ff',4,.3);star(c,w-u*.06,h-u*.06,u*.03,'#dff1ff',4,.3)}}
};
function thumbD(key){const c=document.createElement('canvas');c.width=120;c.height=150;const x=c.getContext('2d'),l=L.polaroid,t=T[cfg.t],k=Math.min(120/l.w,150/l.h);
  x.save();x.translate((120-l.w*k)/2,(150-l.h*k)/2);x.scale(k,k);
  const g=x.createLinearGradient(0,0,l.w,l.h);g.addColorStop(0,t.a);g.addColorStop(1,t.b);x.fillStyle=g;x.fillRect(0,0,l.w,l.h);
  const D=DEC[key];if(D.bg)D.bg(x,l,t);x.fillStyle='rgba(255,255,255,.85)';l.s.forEach(s=>x.fillRect(s[0],s[1],s[2],s[3]));if(D.fg)D.fg(x,l,t);x.restore();return c}
const decList=()=>Object.keys(DEC).filter(k=>DEC[k].c===cfg.dc&&k!=='none');
function decCards(){const box=$('#bD'),list=decList();box.innerHTML='';$('#bDg').style.display=list.length?'flex':'none';
  list.forEach(k=>{const b=document.createElement('button');b.className='card dk'+(cfg.d===k?' on':'');b.append(thumbD(k),DEC[k].n);
   b.onclick=()=>{cfg.d=k;box.querySelectorAll('.card').forEach(x=>x.classList.toggle('on',x===b));sendCfg()};box.append(b)})}
function pickDec(){const list=decList();cfg.d=cfg.dc==='polos'?'none':(list.includes(cfg.d)?cfg.d:list[0]);decCards();sendCfg()}
function setChip(k,v){sec.querySelectorAll('.chip[data-k="'+k+'"]').forEach(x=>x.classList.toggle('on',x.dataset.v===v))}
function sendCfg(){send({t:'cfg',l:cfg.l,f:cfg.f,tt:cfg.t,d:cfg.d,dc:cfg.dc})}

// ================= Fitur undang (virtual) =================
function refreshInfo(){
  if(role!=='host')return;
  info.textContent=!conn||!conn.open?'Menunggu pasangan membuka link… (kode: '+code+')'
   :!partnerReady?'Pasangan sudah masuk ✓ — menunggu dia mengaktifkan kamera.'
   :stream?'Pasangan siap ✓ — tekan "mulai foto".':'Pasangan siap ✓ — aktifkan kameramu dulu.';
}
function wire(c){
  conn=c;
  c.on('open',()=>{if(role==='host')sendCfg();send({t:'hi',...me});if(stream){send({t:'ready'});callPartner()}
    say(role==='guest'?'Terhubung ke pasanganmu ♡ Aktifkan kamera.':'Pasangan terhubung ♡');refreshInfo()});
  c.on('data',onData);
  c.on('close',()=>{partnerReady=false;pRdy=false;pTile.classList.add('off');conn=null;say('Koneksi dengan pasangan terputus.');refreshInfo()});
}
async function onData(d){
  if(d.t==='ready'){partnerReady=true;refreshInfo();callPartner();paint()}
  else if(d.t==='hi'){pr.name=d.name||'pasangan';pr.color=d.color;paint()}
  else if(d.t==='rdy'){pRdy=d.v;if(d.v)say(pr.name+' sudah READY');tryAuto()}
  else if(d.t==='unready'){partnerReady=false;pRdy=false;pTile.classList.add('off');refreshInfo();paint()}
  else if(d.t==='cfg'&&role==='guest'){cfg.l=d.l;cfg.f=d.f;cfg.t=d.tt||cfg.t;cfg.d=d.d||'none';cfg.dc=d.dc||'polos';setChip('dc',cfg.dc);v.style.filter=pc.style.filter=F[cfg.f].css;cards('#bL','l',LN);cards('#bT','t',TN);decCards();slots()}
  else if(d.t==='shot'&&role==='host'){partnerShots[d.i]=await loadImg(d.img)}
  else if(d.t==='go'&&role==='guest'&&stream&&!busy){
    busy=true;cfg.l=d.l;cfg.f=d.f;v.style.filter=pc.style.filter=F[cfg.f].css;sec.classList.remove('done');
    await sequence(d.sizes,(i,c)=>send({t:'shot',i,img:c.toDataURL('image/jpeg',.9)}));
    say('menunggu hasil dari pasanganmu...');busy=false;
  }
  else if(d.t==='result'&&role==='guest'){
    const im=await loadImg(d.img);cv.width=im.width;cv.height=im.height;cv.getContext('2d').drawImage(im,0,0);
    showResult();say('Selesai. Unduh fotonya!');
  }
  else if(d.t==='again'&&role==='guest'){sec.classList.remove('done');step(1);say('Siap. Tunggu pasanganmu menekan "mulai foto".')}
}
function inviteLink(){return location.href.split('#')[0].split('?')[0]+'?room='+code}
function createRoom(){
  if(typeof Peer==='undefined'){info.textContent='Library koneksi belum termuat. Cek internet lalu muat ulang halaman.';return}
  code=Array.from({length:5},()=>ALPHA[Math.random()*ALPHA.length|0]).join('');
  role='host';info.textContent='Membuat room…';
  peer=new Peer(PFX+code);
  peer.on('open',()=>{sec.classList.add('room');$('#bCode').textContent=code;refreshInfo();
    if(location.protocol==='file:')info.textContent+=' ⚠ Link hanya bisa dibuka pasangan setelah website di-hosting (HTTPS).'});
  peer.on('connection',c=>{if(conn&&conn.open){c.close();return}wire(c)});
  peer.on('call',c=>{c.answer();c.on('stream',s=>{pV.srcObject=s;pTile.classList.remove('off');pV.play().catch(()=>{})})});
  peer.on('error',e=>{if(e.type==='unavailable-id'){peer.destroy();createRoom()}else info.textContent='Gagal membuat room: '+e.type});
}
function joinRoom(rc){
  role='guest';code=rc;sec.classList.add('guest','duo');cfg.m='duo';
  say('Kamu diundang foto bareng ♡ Menghubungkan…');
  try{if(typeof goTo==='function'&&typeof pages!=='undefined'){const g=pages.indexOf(sec);if(g>=0)goTo(g)}}catch(e){}
  if(typeof Peer==='undefined'){say('Library koneksi belum termuat. Cek internet lalu muat ulang.');return}
  peer=new Peer();
  peer.on('open',()=>wire(peer.connect(PFX+rc,{reliable:true})));
  peer.on('call',c=>{c.answer();c.on('stream',s=>{pV.srcObject=s;pTile.classList.remove('off');pV.play().catch(()=>{})})});
  peer.on('error',e=>say(e.type==='peer-unavailable'?'Room tidak ditemukan. Minta pasanganmu membuat undangan baru.':'Koneksi gagal: '+e.type));
}
$('#bInv').addEventListener('click',createRoom);
$('#bWA').addEventListener('click',()=>window.open('https://wa.me/?text='+encodeURIComponent('Ayo foto bareng di photo booth virtual 🌸 Buka link ini: '+inviteLink()+' (kode: '+code+')'),'_blank'));
$('#bCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(inviteLink());info.textContent='Link disalin ✓'}catch(e){prompt('Salin link ini:',inviteLink())}});

$('#bCam').addEventListener('click',startCam);
$('#bShoot').addEventListener('click',run);
$('#bAgain').addEventListener('click',()=>{sec.classList.remove('done');step(1);send({t:'again'});if(!stream)startCam();else say('Siap. Tekan "mulai foto".')});
$('#bSave').addEventListener('click',()=>{const a=document.createElement('a');a.download='photobooth.png';a.href=cv.toDataURL('image/png');a.click()});

cards('#bL','l',LN);cards('#bT','t',TN);decCards();slots();paint();step(0);
const rc=new URLSearchParams(location.search).get('room');
if(rc)joinRoom(rc.toUpperCase().replace(/[^A-Z0-9]/g,''));
})();
