const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const menuButton = $('.menu-toggle');
const navigation = $('.site-nav');
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  navigation.classList.toggle('is-open', open);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

window.showToast = (message) => {
  const toast = $('.toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.weiguangToastTimer);
  window.weiguangToastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
};

const modal = $('.support-modal');
let lastFocused = null;
function openDonationModal() {
  lastFocused = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setMenu(false);
  window.dispatchEvent(new Event('donationmodal:open'));
  setTimeout(() => $('.modal-x').focus(), 30);
}
function closeDonationModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  window.dispatchEvent(new Event('donationmodal:close'));
  lastFocused?.focus?.();
}
$$('.js-support').forEach((button) => button.addEventListener('click', openDonationModal));
$('.modal-x').addEventListener('click', closeDonationModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeDonationModal(); });
modal.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { event.preventDefault(); closeDonationModal(); return; }
  if (event.key !== 'Tab') return;
  const focusable = $$('button, input, a, [tabindex]:not([tabindex="-1"])', modal).filter((item) => !item.disabled && item.offsetParent !== null);
  const first = focusable[0]; const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) closeDonationModal(); });
if (new URLSearchParams(window.location.search).get('support') === '1') setTimeout(openDonationModal, 120);
