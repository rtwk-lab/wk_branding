/* Add once, after markup. No framework dependencies. */
(() => {
 const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
 const states = new Map();
 const intervalMs = 5000;
 function stopMotion(button,state){
  clearTimeout(state.swap);clearTimeout(state.end);state.swap=null;state.end=null;
  button.classList.remove('is-playing');
 }
 function playAttention(button,state){
  if(button.classList.contains('is-playing'))return;
  const glyph=button.querySelector('.ws-attention__glyph');if(!glyph)return;
  const next=glyph.textContent.trim()==='i'?'!':'i';
  if(reduce.matches){glyph.textContent=next;return;}
  button.classList.add('is-playing');
  state.swap=setTimeout(()=>{glyph.textContent=next;},260);
  state.end=setTimeout(()=>{button.classList.remove('is-playing');state.swap=null;state.end=null;},660);
 }
 function syncAttention(button,state){
  const active=state.visible&&!state.paused&&!document.hidden&&!reduce.matches;
  if(!active){clearInterval(state.interval);state.interval=null;stopMotion(button,state);return;}
  if(state.interval===null)state.interval=setInterval(()=>playAttention(button,state),intervalMs);
 }
 document.querySelectorAll('[data-ws-attention]').forEach(button=>{
  const state={visible:!('IntersectionObserver' in window),paused:false,seen:false,interval:null,swap:null,end:null};states.set(button,state);
  button.addEventListener('click',()=>playAttention(button,state));
  const pause=button.closest('.ws-attention-group')?.querySelector('[data-ws-attention-pause]');
  if(pause)pause.addEventListener('click',()=>{state.paused=!state.paused;pause.setAttribute('aria-pressed',String(state.paused));pause.textContent=state.paused?'自動再生を再開':'自動再生を停止';syncAttention(button,state);});
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{
    state.visible=entry.isIntersecting&&entry.intersectionRatio>=.7;
    if(state.visible&&!state.seen&&!document.hidden){state.seen=true;playAttention(button,state);}
    syncAttention(button,state);
   });},{threshold:[0,.7]});observer.observe(button);
  }else{state.seen=true;if(!document.hidden)playAttention(button,state);syncAttention(button,state);}
 });
 document.addEventListener('visibilitychange',()=>states.forEach((state,button)=>syncAttention(button,state)));
 reduce.addEventListener('change',()=>states.forEach((state,button)=>syncAttention(button,state)));
 document.querySelectorAll('[data-ws-card-toggle]').forEach(button => {
  button.addEventListener('click', () => {
   const panel = document.getElementById(button.getAttribute('aria-controls'));
   if (!panel) return;
   const open = button.getAttribute('aria-expanded') !== 'true';
   button.setAttribute('aria-expanded', String(open)); panel.hidden = !open;
   button.setAttribute('aria-label', open ? '使い方の補足を閉じる' : '使い方の補足を開く');
  });
 });
 document.querySelectorAll('[data-ws-progress-demo]').forEach(root => {
  const bar=root.querySelector('progress'), value=root.querySelector('output'), range=root.querySelector('input'), toggle=root.querySelector('[data-progress-play]');
  if(!bar || !value || !range || !toggle) return;
  let raf=0, running=false, start=0, elapsed=0;
  const duration=6000;
  function draw(percent) { const n=Math.max(0,Math.min(100,Math.round(percent))); bar.value=n; value.value=n+'%'; range.value=String(n); }
  function pause() { if(running) elapsed=Math.min(duration,performance.now()-start); running=false;cancelAnimationFrame(raf);toggle.textContent=elapsed>=duration?'もう一度再生':'再生';toggle.setAttribute('aria-pressed','false'); }
  function frame(now) { if(!running)return;elapsed=Math.min(duration,now-start);draw(elapsed/duration*100);if(elapsed>=duration){pause();return;}raf=requestAnimationFrame(frame); }
  toggle.addEventListener('click',()=>{if(running){pause();return;}if(elapsed>=duration)elapsed=0;running=true;start=performance.now()-elapsed;toggle.textContent='一時停止';toggle.setAttribute('aria-pressed','true');raf=requestAnimationFrame(frame);});
  range.addEventListener('input',()=>{pause();elapsed=Number(range.value)/100*duration;draw(Number(range.value));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  draw(Number(bar.value)); elapsed=Number(bar.value)/100*duration;
 });
 const reading=document.querySelector('[data-ws-reading]');
 if(reading){let scheduled=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;reading.value=max>0?Math.max(0,Math.min(100,scrollY/max*100)):100;scheduled=false;};addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);addEventListener('load',update);if('ResizeObserver' in window)new ResizeObserver(update).observe(document.body);update();}
})();
