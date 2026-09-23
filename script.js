const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

window.showToast = (text) => {
  const toast = $('.toast');
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
};

const menu = $('.menu');
const menuButton = $('.menu-toggle');
menuButton.addEventListener('click', () => {
  menu.classList.toggle('open');
  menuButton.classList.toggle('open');
});
$$('.menu a').forEach((link) => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton.classList.remove('open');
}));

let imageIndex = 0;
const shots = $$('.hero-shot');
const setShot = (index) => {
  imageIndex = (index + shots.length) % shots.length;
  shots.forEach((shot, itemIndex) => shot.classList.toggle('active', itemIndex === imageIndex));
  $('#hero-count').textContent = `0${imageIndex + 1} — 03`;
  $('#hero-place').textContent = shots[imageIndex].dataset.loc;
};
$('#next-image').addEventListener('click', () => setShot(imageIndex + 1));
setInterval(() => setShot(imageIndex + 1), 7500);

$$('.project').forEach((project) => project.addEventListener('click', () => {
  $('.project.active')?.classList.remove('active');
  project.classList.add('active');
}));

let hasCounted = false;
const countObserver = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting) || hasCounted) return;
  hasCounted = true;
  $$('[data-number]').forEach((element) => {
    const final = Number(element.dataset.number);
    let current = 0;
    const increment = Math.max(1, Math.ceil(final / 45));
    const timer = setInterval(() => {
      current = Math.min(final, current + increment);
      element.textContent = current.toLocaleString();
      if (current === final) clearInterval(timer);
    }, 28);
  });
}, { threshold: 0.25 });
countObserver.observe($('.numbers'));

const modal = $('.support-modal');
$$('.js-support').forEach((button) => button.addEventListener('click', () => {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  menu.classList.remove('open');
  menuButton.classList.remove('open');
}));
$('.modal-x').addEventListener('click', () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
});
modal.addEventListener('click', (event) => {
  if (event.target === modal) $('.modal-x').click();
});
$$('.js-ledger').forEach((button) => button.addEventListener('click', () => {
  window.showToast('公开账本演示已加载，完整数据将在正式站点开放。');
}));

const oldEmail = $('a[href="mailto:hello@weiguang.org"]');
if (oldEmail) {
  oldEmail.href = 'mailto:junlinkun@icloud.com';
  oldEmail.querySelector('strong').textContent = 'junlinkun@icloud.com';
}
