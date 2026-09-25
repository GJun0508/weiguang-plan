const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.showToast = (text) => {
  const toast = $('.toast');
  toast.textContent = text;
  toast.classList.add('show');
  window.clearTimeout(window.toastTimer);
  window.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
};

const menu = $('.menu');
const menuButton = $('.menu-toggle');
const setMenu = (open) => {
  menu.classList.toggle('open', open);
  menuButton.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
};
menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('.menu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

let imageIndex = 0;
const shots = $$('.hero-shot');
const setShot = (index) => {
  imageIndex = (index + shots.length) % shots.length;
  shots.forEach((shot, itemIndex) => shot.classList.toggle('active', itemIndex === imageIndex));
  $('#hero-count').textContent = `0${imageIndex + 1} — 03`;
  $('#hero-place').textContent = shots[imageIndex].dataset.loc;
};
$('#next-image').addEventListener('click', () => setShot(imageIndex + 1));
if (!reduceMotion) window.setInterval(() => setShot(imageIndex + 1), 7500);

const header = $('.header');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 32);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const hero = $('.hero');
if (!reduceMotion && window.matchMedia('(min-width: 761px)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * -12;
    const y = (event.clientY / window.innerHeight - 0.5) * -8;
    hero.style.setProperty('--hero-x', `${x}px`);
    hero.style.setProperty('--hero-y', `${y}px`);
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--hero-x', '0px');
    hero.style.setProperty('--hero-y', '0px');
  });
}

const revealTargets = $$('.manifesto, .image-break, .work, .numbers, .ledger, .closing');
document.body.classList.add('motion-ready');
revealTargets.forEach((element) => element.classList.add('reveal-target'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealTargets.forEach((element) => revealObserver.observe(element));

let hasCounted = false;
const countObserver = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting) || hasCounted) return;
  hasCounted = true;
  $$('[data-number]').forEach((element) => {
    const final = Number(element.dataset.number);
    let current = 0;
    const increment = Math.max(1, Math.ceil(final / 45));
    const timer = window.setInterval(() => {
      current = Math.min(final, current + increment);
      element.textContent = current.toLocaleString();
      if (current === final) window.clearInterval(timer);
    }, reduceMotion ? 0 : 28);
  });
}, { threshold: 0.25 });
countObserver.observe($('.numbers'));

const modal = $('.support-modal');
let lastFocused = null;
const openModal = () => {
  lastFocused = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setMenu(false);
  window.dispatchEvent(new Event('donationmodal:open'));
  window.setTimeout(() => $('.modal-x')?.focus(), 30);
};
const closeModal = () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  window.dispatchEvent(new Event('donationmodal:close'));
  lastFocused?.focus?.();
};
$$('.js-support').forEach((button) => button.addEventListener('click', openModal));
$('.modal-x').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
modal.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
  if (event.key !== 'Tab') return;
  const focusable = $$('button, input, a, [tabindex]:not([tabindex="-1"])', modal).filter((item) => !item.disabled);
  const first = focusable[0]; const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

$$('.project').forEach((project) => project.addEventListener('click', () => {
  $('.project.active')?.classList.remove('active');
  project.classList.add('active');
}));
$$('.js-ledger').forEach((button) => button.addEventListener('click', () => {
  window.showToast('公开账本演示已加载，完整数据将在正式站点开放。');
}));

const oldEmail = $('a[href="mailto:hello@weiguang.org"]');
if (oldEmail) {
  oldEmail.href = 'mailto:junlinkun@icloud.com';
  oldEmail.querySelector('strong').textContent = 'junlinkun@icloud.com';
}
