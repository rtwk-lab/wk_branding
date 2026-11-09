/* Native SVG morph: sampled original contours, no external dependency. */
(() => {
 document.querySelector('[data-fluid-global-pause]')?.addEventListener('click',event=>{const b=event.currentTarget;const stopped=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(stopped));b.textContent=stopped?'背景の動きを再開する':'背景の動きを止める';document.dispatchEvent(new CustomEvent('ws-fluid-pause',{detail:stopped}))});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const globalButton=document.querySelector('[data-fluid-global-pause]');
 function showMotionState(){if(globalButton){globalButton.disabled=reduced.matches;globalButton.textContent=reduced.matches?'端末の設定により背景の動きを停止中':globalButton.getAttribute('aria-pressed')==='true'?'背景の動きを再開する':'背景の動きを止める'}}
 showMotionState();reduced.addEventListener('change',showMotionState);
 document.querySelectorAll('[data-ws-fluid]').forEach(root=>{
  const shapes=[...root.querySelectorAll('.ws-fluid__shape')].map((svg,i)=>{
   const path=svg.querySelector('path'), original=path.getAttribute('d'), length=path.getTotalLength();
   const points=Array.from({length:96},(_,j)=>{const p=path.getPointAtLength(length*j/96);return {x:p.x,y:p.y}});
   const center=points.reduce((a,p)=>({x:a.x+p.x/96,y:a.y+p.y/96}),{x:0,y:0});
   return {svg,path,original,points,center,i};
  });
  let visible=false,paused=false,raf=0,last=0,elapsed=Number(root.dataset.fluidOffset||0);
  const button=root.querySelector('.ws-fluid__pause');
  function frame(now){
   raf=0;if(!visible||paused||reduced.matches||document.hidden){last=0;return}
   if(last)elapsed+=Math.min(now-last,64);last=now;
   const rect=root.getBoundingClientRect();
   shapes.forEach(({svg,path,points,center,i})=>{
    // Use the shape anchor, not the height of a potentially very long chapter.
    const anchor=rect.top+svg.offsetTop;
    const progress=Math.max(0,Math.min(1,(innerHeight-anchor)/(innerHeight+svg.getBoundingClientRect().height)));
    svg.style.setProperty('--fluid-y',`${(0.5-progress)*(i?240:200)}px`);
    svg.style.setProperty('--fluid-r',`${elapsed/(i?240000:180000)*360*(i?-1:1)}deg`);
    const phase=elapsed/30000*Math.PI*2+progress*1.2+i;
    const q=points.map((p,j)=>{const angle=j/points.length*Math.PI*2;const scale=1+.025*Math.sin(angle*3+phase)+.012*Math.sin(angle*2-phase*.7);return {x:center.x+(p.x-center.x)*scale,y:center.y+(p.y-center.y)*scale}});
    const mid=(a,b)=>`${((a.x+b.x)/2).toFixed(2)},${((a.y+b.y)/2).toFixed(2)}`;
    let d=`M${mid(q[q.length-1],q[0])}`;
    q.forEach((p,j)=>{d+=`Q${p.x.toFixed(2)},${p.y.toFixed(2)} ${mid(p,q[(j+1)%q.length])}`});
    path.setAttribute('d',d+'Z');
   });raf=requestAnimationFrame(frame);
  }
  function sync(){cancelAnimationFrame(raf);raf=0;last=0;
   if(reduced.matches)shapes.forEach(s=>{s.path.setAttribute('d',s.original);s.svg.style.removeProperty('--fluid-y');s.svg.style.removeProperty('--fluid-r')});
   if(visible&&!paused&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(root);
  button?.addEventListener('click',()=>{paused=!paused;button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'動きを再開する':'動きを止める';sync()});
  document.addEventListener('ws-fluid-pause',event=>{paused=event.detail;sync()});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  window.addEventListener('beforeprint',()=>{cancelAnimationFrame(raf);last=0});window.addEventListener('afterprint',sync);
 });
})();
