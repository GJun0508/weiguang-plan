const donationState = {
  amount: 100,
  project: '读到世界 · 乡村阅读',
  method: '微信支付',
};

const storageKey = 'weiguang-sky-donations';
const readDonations = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
};
const writeDonations = (items) => localStorage.setItem(storageKey, JSON.stringify(items.slice(-80)));

const syncSummary = () => {
  const name = $('#donor-name').value.trim();
  donationState.anonymousLabel = $('#anonymous').checked ? '匿名微光' : (name || '一位同行者');
  $('#summary-project').textContent = donationState.project;
  $('#summary-amount').textContent = `¥ ${donationState.amount.toLocaleString()}`;
  $('#summary-total').textContent = `¥ ${donationState.amount.toLocaleString()}`;
  $('#summary-name').textContent = donationState.anonymousLabel;
};

const setStep = (name) => {
  $$('.donation-step').forEach((step) => step.classList.toggle('is-active', step.dataset.step === name));
  const stepIndex = { choose: 0, confirm: 1, receipt: 2 }[name];
  $$('.flow-steps span').forEach((step, index) => step.classList.toggle('active', index === stepIndex));
  syncSummary();
};

$$('input[name="project"]').forEach((radio) => radio.addEventListener('change', () => {
  donationState.project = radio.value;
  syncSummary();
}));
$$('.amount-grid button').forEach((button) => button.addEventListener('click', () => {
  donationState.amount = Number(button.dataset.amount);
  $$('.amount-grid button').forEach((item) => item.classList.toggle('selected', item === button));
  $('.custom-amount input').value = '';
  syncSummary();
}));
$('.custom-amount input').addEventListener('input', (event) => {
  const amount = Math.floor(Number(event.target.value));
  if (!amount || amount < 1) return;
  donationState.amount = Math.min(amount, 999999);
  $$('.amount-grid button').forEach((item) => item.classList.remove('selected'));
  syncSummary();
});
$('#anonymous').addEventListener('change', syncSummary);
$('#donor-name').addEventListener('input', syncSummary);
$('.next-step').addEventListener('click', () => {
  if (!donationState.amount || donationState.amount < 1) {
    window.showToast('请先选择一个有效金额。');
    return;
  }
  setStep('confirm');
});
$('.back-step').addEventListener('click', () => setStep('choose'));
$$('.payment-method').forEach((button) => button.addEventListener('click', () => {
  $$('.payment-method').forEach((item) => item.classList.toggle('selected', item === button));
  donationState.method = button.dataset.method;
}));

function createOrderId() {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
  return `WG-${date}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

const modalRoot = $('.support-modal');
const scene = document.createElement('div');
scene.className = 'donation-scene';
scene.setAttribute('aria-hidden', 'true');
modalRoot.prepend(scene);
modalRoot.addEventListener('pointermove', (event) => {
  const x = ((event.clientX / window.innerWidth) - 0.5) * -16;
  const y = ((event.clientY / window.innerHeight) - 0.5) * -10;
  scene.style.setProperty('--scene-x', `${x}px`);
  scene.style.setProperty('--scene-y', `${y}px`);
});

const orderPane = $('.order-pane');
const summary = document.createElement('div');
summary.className = 'order-summary';
['.order-number', '.order-line', '.order-line', '.order-line', '.order-total'].forEach((selector) => {
  const element = orderPane.querySelector(selector);
  if (element) summary.append(element);
});
orderPane.insertBefore(summary, $('.order-foot', orderPane));

const sky = document.createElement('div');
sky.className = 'sky-wrap';
sky.innerHTML = '<canvas class="star-canvas" aria-label="捐赠星空"></canvas><span class="sky-label">每一颗星，都是一份抵达现场的支持</span><span class="sky-count"></span><div class="star-tooltip" role="status"><small>DONATION STAR</small><b></b><span></span></div>';
orderPane.querySelector('.order-pane-top').after(sky);

const canvas = $('.star-canvas', sky);
const context = canvas.getContext('2d');
const countLabel = $('.sky-count', sky);
const tooltip = $('.star-tooltip', sky);
const staticStars = Array.from({ length: 115 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.72,
  r: Math.random() * 1.05 + 0.2,
  alpha: Math.random() * 0.55 + 0.14,
}));
let canvasWidth = 1;
let canvasHeight = 1;
let launch = null;
let hoveredStar = null;
let pinnedStar = null;

function resizeSky() {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = Math.max(1, rect.width);
  canvasHeight = Math.max(1, rect.height);
  canvas.width = Math.max(1, Math.round(canvasWidth * scale));
  canvas.height = Math.max(1, Math.round(canvasHeight * scale));
  context.setTransform(scale, 0, 0, scale, 0, 0);
}

function drawStar(x, y, radius, color, glow = 0) {
  context.save();
  if (glow) {
    context.shadowBlur = glow;
    context.shadowColor = color;
  }
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawDiamondStar(x, y, radius, focused = false) {
  context.save();
  context.translate(x, y);
  context.rotate(Math.PI / 4);
  context.shadowBlur = focused ? 28 : 18;
  context.shadowColor = '#ffffff';
  context.fillStyle = '#ffffff';
  context.fillRect(-radius, -radius, radius * 2, radius * 2);
  context.restore();
}

function positionTooltip(donation) {
  if (!donation) {
    tooltip.classList.remove('show');
    return;
  }
  tooltip.querySelector('b').textContent = donation.anonymousLabel || '一位同行者';
  tooltip.querySelector('span').textContent = `${donation.project} · ¥${Number(donation.amount).toLocaleString()}`;
  tooltip.classList.toggle('align-left', donation.x * canvasWidth > canvasWidth * 0.65);
  tooltip.style.left = `${donation.x * canvasWidth}px`;
  tooltip.style.top = `${donation.y * canvasHeight}px`;
  tooltip.classList.add('show');
}

function nearestDonation(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return readDonations().findLast((donation) => {
    const dx = donation.x * canvasWidth - x;
    const dy = donation.y * canvasHeight - y;
    return Math.hypot(dx, dy) < 16;
  }) || null;
}

canvas.addEventListener('pointermove', (event) => {
  hoveredStar = nearestDonation(event);
  canvas.style.cursor = hoveredStar ? 'pointer' : 'crosshair';
  if (!pinnedStar) positionTooltip(hoveredStar);
});
canvas.addEventListener('pointerleave', () => {
  hoveredStar = null;
  if (!pinnedStar) positionTooltip(null);
});
canvas.addEventListener('pointerdown', (event) => {
  pinnedStar = nearestDonation(event);
  positionTooltip(pinnedStar);
});

function launchStar(donation, startX, startY) {
  launch = { donation, startX, startY, startedAt: performance.now(), duration: 1450 };
}

$('.create-order').addEventListener('click', (event) => {
  syncSummary();
  const buttonRect = event.currentTarget.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const contribution = {
    id: createOrderId(),
    amount: donationState.amount,
    project: donationState.project,
    method: donationState.method,
    anonymousLabel: donationState.anonymousLabel,
    createdAt: new Date().toISOString(),
    x: 0.18 + Math.random() * 0.68,
    y: 0.1 + Math.random() * 0.42,
  };
  $('#order-id').textContent = contribution.id;
  writeDonations([...readDonations(), contribution]);
  setStep('receipt');
  const startX = buttonRect.left + buttonRect.width / 2 - canvasRect.left;
  const startY = buttonRect.top + buttonRect.height / 2 - canvasRect.top;
  launchStar(contribution, startX, startY);
});

$('.new-donation').addEventListener('click', () => {
  Object.assign(donationState, { amount: 100, project: '读到世界 · 乡村阅读', method: '微信支付' });
  $('#order-id').textContent = '待生成';
  $('#donor-name').value = '';
  $('#anonymous').checked = false;
  $('.custom-amount input').value = '';
  $$('input[name="project"]').forEach((radio, index) => { radio.checked = index === 0; });
  $$('.amount-grid button').forEach((button) => button.classList.toggle('selected', Number(button.dataset.amount) === 100));
  $$('.payment-method').forEach((button, index) => button.classList.toggle('selected', index === 0));
  setStep('choose');
});
$('.save-receipt').addEventListener('click', () => window.showToast('测试捐赠凭证已保存在当前浏览器。'));

function animateSky(time) {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  staticStars.forEach((star, index) => {
    const alpha = star.alpha + 0.12 * Math.sin(time / 850 + index * 0.7);
    drawStar(star.x * canvasWidth, star.y * canvasHeight, star.r, `rgba(246,248,239,${alpha})`);
  });

  const donations = readDonations();
  donations.forEach((donation) => {
    if (launch?.donation.id === donation.id) return;
    const isFocused = donation.id === (pinnedStar?.id || hoveredStar?.id);
    drawDiamondStar(donation.x * canvasWidth, donation.y * canvasHeight, isFocused ? 4.3 : 3.1, isFocused);
  });

  if (launch) {
    const progress = Math.min((time - launch.startedAt) / launch.duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const endX = launch.donation.x * canvasWidth;
    const endY = launch.donation.y * canvasHeight;
    const controlX = (launch.startX + endX) / 2;
    const controlY = Math.min(launch.startY, endY) - canvasHeight * 0.2;
    const inverse = 1 - ease;
    const currentX = inverse * inverse * launch.startX + 2 * inverse * ease * controlX + ease * ease * endX;
    const currentY = inverse * inverse * launch.startY + 2 * inverse * ease * controlY + ease * ease * endY;
    const trailX = currentX - (currentX - launch.startX) * 0.12;
    const trailY = currentY - (currentY - launch.startY) * 0.12;
    context.strokeStyle = `rgba(255,255,255,${0.88 * (1 - progress)})`;
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(trailX, trailY);
    context.lineTo(currentX, currentY);
    context.stroke();
    drawDiamondStar(currentX, currentY, 4.2, true);
    if (progress === 1) {
      const arrived = launch.donation;
      launch = null;
      pinnedStar = arrived;
      positionTooltip(arrived);
      window.showToast('一颗新的微光，已经飞入远山星空。');
    }
  }

  countLabel.textContent = `${donations.length + staticStars.length} LIGHTS`;
  requestAnimationFrame(animateSky);
}

new ResizeObserver(resizeSky).observe(canvas);
resizeSky();
requestAnimationFrame(animateSky);
syncSummary();
