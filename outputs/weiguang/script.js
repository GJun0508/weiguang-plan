const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const toast=(text)=>{const el=$('.toast');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800)};

const menu=$('.menu'),menuButton=$('.menu-toggle');
menuButton.addEventListener('click',()=>{menu.classList.toggle('open');menuButton.classList.toggle('open')});
$$('.menu a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');menuButton.classList.remove('open')}));

let imageIndex=0;
const shots=$$('.hero-shot');
function setShot(index){imageIndex=(index+shots.length)%shots.length;shots.forEach((shot,i)=>shot.classList.toggle('active',i===imageIndex));const active=shots[imageIndex];$('#hero-count').textContent=`0${imageIndex+1} — 03`;$('#hero-place').textContent=active.dataset.loc}
$('#next-image').addEventListener('click',()=>setShot(imageIndex+1));
setInterval(()=>setShot(imageIndex+1),7500);

$$('.project').forEach(project=>project.addEventListener('click',()=>{$('.project.active')?.classList.remove('active');project.classList.add('active')}));

let hasCounted=false;
const nums=$$('[data-number]');
const countObserver=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting)||hasCounted)return;hasCounted=true;nums.forEach(el=>{const final=Number(el.dataset.number);let now=0;const increment=Math.max(1,Math.ceil(final/45));const timer=setInterval(()=>{now=Math.min(final,now+increment);el.textContent=now.toLocaleString();if(now===final)clearInterval(timer)},28)})},{threshold:.25});
countObserver.observe($('.numbers'));

const modal=$('.support-modal');
$$('.js-support').forEach(button=>button.addEventListener('click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');menu.classList.remove('open');menuButton.classList.remove('open')}));
$('.modal-x').addEventListener('click',()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')});
modal.addEventListener('click',e=>{if(e.target===modal)$('.modal-x').click()});
$$('.support-amounts button').forEach(button=>button.addEventListener('click',()=>{$('.support-amounts .selected').classList.remove('selected');button.classList.add('selected')}));
$('.confirm-support').addEventListener('click',()=>{$('.modal-x').click();toast('感谢你愿意让这段行动继续。')});
$$('.js-ledger').forEach(button=>button.addEventListener('click',()=>toast('公开账本演示已加载，完整数据将在正式站点开放。')));
