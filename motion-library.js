/* GSAP text examples: local vendor files, no continuous loops. Add once after markup. */
(async () => {
 const gsap=window.gsap, SplitText=window.SplitText;
 const section=document.querySelector('.ws-motion-library');if(!section)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(!gsap||!SplitText||!window.ScrambleTextPlugin||!window.TextPlugin){
  section.querySelectorAll('[data-ws-motion-status]').forEach(el=>el.textContent='静止表示 / ライブラリ未読込');return;
 }
 gsap.registerPlugin(SplitText,window.ScrambleTextPlugin,window.TextPlugin);
 if(document.fonts?.ready)await document.fonts.ready;
 const states=[];let paused=false;
 function busy(state,on){state.button.disabled=on;state.button.setAttribute('aria-busy',String(on));state.status.textContent=on?'再生中':'再生できます';}
 function reset(state){state.tween?.kill();state.split?.revert();state.tween=null;state.split=null;state.visual.innerHTML=state.original;state.finished=false;busy(state,false);}
 function play(state){
  reset(state);
  if(reduced.matches||paused){state.status.textContent='静止表示';return;}
  busy(state,true);
  const done=()=>{state.finished=true;busy(state,false);};
  const kind=state.root.dataset.wsMotion;
  if(kind==='lines'){
   state.split=SplitText.create(state.visual,{type:'lines',mask:'lines',autoSplit:true,aria:'none',onSplit(self){
    if(state.finished)return gsap.set(self.lines,{clearProps:'transform,opacity'});
    state.tween=gsap.from(self.lines,{yPercent:105,opacity:0,duration:.65,stagger:.10,ease:'power2.out',onComplete:done});return state.tween;
   }});
  }else if(kind==='words'){
   state.split=SplitText.create(state.visual,{type:'words',aria:'none'});
   state.tween=gsap.from(state.split.words,{y:16,opacity:0,duration:.6,stagger:.09,ease:'power2.out',onComplete:done});
  }else if(kind==='chars'){
   state.split=SplitText.create(state.visual,{type:'chars',aria:'none'});
   state.tween=gsap.from(state.split.chars,{y:12,rotation:4,opacity:0,duration:.45,stagger:.014,ease:'power2.out',onComplete:done});
  }else if(kind==='scramble'){
   state.tween=gsap.to(state.visual,{duration:.8,scrambleText:{text:state.text,chars:'lowerCase',revealDelay:.12,speed:.4},ease:'none',onComplete:()=>{state.visual.textContent=state.text;done();}});
  }else if(kind==='replace'){
   state.visual.textContent='';
   state.tween=gsap.to(state.visual,{duration:.8,text:{value:state.text,delimiter:' '},ease:'none',onComplete:()=>{state.visual.textContent=state.text;done();}});
  }
 }
 section.querySelectorAll('[data-ws-motion]').forEach(root=>{
  const visual=root.querySelector('[data-ws-motion-text]'),button=root.querySelector('[data-ws-motion-replay]'),status=root.querySelector('[data-ws-motion-status]');
  if(!visual||!button||!status)return;
  const state={root,visual,button,status,original:visual.innerHTML,text:visual.textContent,split:null,tween:null,seen:false,finished:false};states.push(state);
  button.addEventListener('click',()=>play(state));
 });
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{
  const state=states.find(s=>s.root===entry.target);if(!state)return;
  if(!entry.isIntersecting&&state.tween&&!state.finished){reset(state);state.status.textContent='静止表示';}
  if(entry.isIntersecting&&entry.intersectionRatio>=.5&&!state.seen){state.seen=true;play(state);}
 });},{threshold:[0,.5]});states.forEach(state=>observer.observe(state.root));}
 const pause=section.querySelector('[data-ws-motion-pause]');
 pause?.addEventListener('click',()=>{paused=!paused;states.forEach(state=>{reset(state);state.status.textContent=paused?'静止表示':'再生できます';});pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'アニメーションを有効にする':'動きを停止して読む';});
 reduced.addEventListener('change',()=>states.forEach(state=>{reset(state);if(reduced.matches)state.status.textContent='静止表示 / モーション低減';}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)states.forEach(reset);});
 window.addEventListener('beforeprint',()=>states.forEach(reset));
})();
