/**
 * ROBRUN CASH 3D ULTRA - Engine
 * 1. WebGL Three.js Ambient Particle Space
 * 2. Interactive 3D Gold Ingot / Safe Box in Hero Section
 * 3. 3D Gyroscopic Card Tilt with Dynamic Specular Glare
 * 4. Synthesized Web Audio Sound Effects (clicks, chimes)
 * 5. Complete Wallet & Balance Shopping System + Cabinet + Admin
 */

// ==========================================
// 1. WEB AUDIO SYNTHESIZER SOUND ENGINE
// ==========================================
const Sound = {
  enabled: true,
  ctx: null,

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  },

  playCoin() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      [987.77, 1318.51].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch (e) {}
  },

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.18, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.4);
      });
    } catch (e) {}
  }
};

// ==========================================
// 2. THREE.JS 3D GRAPHICS SCENES
// ==========================================
function init3DAmbientBackground() {
  const canvas = document.getElementById('bg-canvas-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 40;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particle Stars
  const particleCount = 220;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const goldColor = new THREE.Color(0xffaa00);
  const cyanColor = new THREE.Color(0x00f0ff);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

    const chosenColor = Math.random() > 0.4 ? goldColor : cyanColor;
    colors[i * 3] = chosenColor.r;
    colors[i * 3 + 1] = chosenColor.g;
    colors[i * 3 + 2] = chosenColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particleMesh = new THREE.Points(geometry, material);
  scene.add(particleMesh);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 10;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 10;
  });

  function animate() {
    requestAnimationFrame(animate);
    particleMesh.rotation.y += 0.001;
    particleMesh.rotation.x += 0.0005;
    camera.position.x += (mouseX - camera.position.x) * 0.03;
    camera.position.y += (-mouseY - camera.position.y) * 0.03;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function init3DHeroInteractive() {
  const canvas = document.getElementById('hero-interactive-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const width = canvas.parentElement.clientWidth || 450;
  const height = canvas.parentElement.clientHeight || 420;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const goldLight = new THREE.PointLight(0xffaa00, 3, 20);
  goldLight.position.set(4, 5, 4);
  scene.add(goldLight);

  const cyanLight = new THREE.PointLight(0x00f0ff, 2.5, 20);
  cyanLight.position.set(-4, -3, 3);
  scene.add(cyanLight);

  // Group to rotate
  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  // 1. Central 3D Cyber Vault / Gold Ingot
  const boxGeo = new THREE.BoxGeometry(2.4, 1.3, 1.1);
  const boxMat = new THREE.MeshPhysicalMaterial({
    color: 0xffaa00,
    metalness: 0.9,
    roughness: 0.2,
    reflectivity: 0.9,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1
  });
  const mainVault = new THREE.Mesh(boxGeo, boxMat);
  heroGroup.add(mainVault);

  // Inner Core Band (Cyan Glowing Line)
  const bandGeo = new THREE.BoxGeometry(2.46, 0.2, 1.16);
  const bandMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const bandMesh = new THREE.Mesh(bandGeo, bandMat);
  heroGroup.add(bandMesh);

  // 2. Orbiting Torus Rings (Holographic Currency Shield)
  const ringGeo = new THREE.TorusGeometry(2.6, 0.04, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true, transparent: true, opacity: 0.4 });
  const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
  ringMesh1.rotation.x = Math.PI / 3;
  heroGroup.add(ringMesh1);

  const ringGeo2 = new THREE.TorusGeometry(3.1, 0.03, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.35 });
  const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
  ringMesh2.rotation.y = Math.PI / 4;
  heroGroup.add(ringMesh2);

  // Mouse drag & interaction
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let targetRotX = 0.2, targetRotY = 0.5;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      // Parallax hover
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY += x * 0.05;
      targetRotX += y * 0.05;
      return;
    }
    const deltaX = e.clientX - prevX;
    const deltaY = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    targetRotY += deltaX * 0.015;
    targetRotX += deltaY * 0.015;
  });

  function renderHero() {
    requestAnimationFrame(renderHero);
    targetRotY += 0.005; // Auto subtle idle spin
    ringMesh1.rotation.z += 0.01;
    ringMesh2.rotation.x += 0.008;

    heroGroup.rotation.x += (targetRotX - heroGroup.rotation.x) * 0.08;
    heroGroup.rotation.y += (targetRotY - heroGroup.rotation.y) * 0.08;

    renderer.render(scene, camera);
  }
  renderHero();

  window.addEventListener('resize', () => {
    const newW = canvas.parentElement.clientWidth;
    const newH = canvas.parentElement.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  });
}

// ==========================================
// 3. 3D CARD TILT WITH DYNAMIC SPECULAR GLARE
// ==========================================
function initCard3DTilt() {
  const cards = document.querySelectorAll('.tilt-element');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`;

      const glare = card.querySelector('.card-glare');
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 170, 0, 0.22) 0%, transparent 70%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      const glare = card.querySelector('.card-glare');
      if (glare) {
        glare.style.background = 'transparent';
      }
    });
  });
}

// ==========================================
// 4. DATABASE & STATE (LocalStorage)
// ==========================================
const DB = {
  getUsers() {
    const data = localStorage.getItem('robrun_users');
    if (!data) {
      const defaultUsers = [{ id: 'usr_1', name: 'Игрок #1 (Вы)', contact: '@robber_main', balance: 0 }];
      localStorage.setItem('robrun_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
  },

  saveUsers(users) {
    localStorage.setItem('robrun_users', JSON.stringify(users));
  },

  getCurrentUser() {
    const users = this.getUsers();
    return users[0] || { id: 'usr_1', name: 'Игрок #1', balance: 0 };
  },

  updateCurrentUserBalance(deltaOrNew, isDelta = true) {
    const users = this.getUsers();
    if (users.length > 0) {
      if (isDelta) users[0].balance = Math.max(0, users[0].balance + deltaOrNew);
      else users[0].balance = Math.max(0, deltaOrNew);
      this.saveUsers(users);
    }
    return this.getCurrentUser();
  },

  updateUserBalanceById(userId, newBalance) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.balance = Math.max(0, newBalance);
      this.saveUsers(users);
    }
  },

  getOrders() {
    const data = localStorage.getItem('robrun_orders');
    return data ? JSON.parse(data) : [];
  },

  saveOrders(orders) {
    localStorage.setItem('robrun_orders', JSON.stringify(orders));
  },

  addOrder(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);
    return order;
  },

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.saveOrders(orders);
    }
  },

  getMessages() {
    const data = localStorage.getItem('robrun_messages');
    if (!data) {
      const defaultMessages = [
        {
          id: 1,
          userId: 'usr_1',
          from: 'admin',
          text: 'Добро пожаловать в ROBRUN CASH 3D ULTRA! Если у вас есть вопросы по передаче валюты в игре — пишите мне прямо сюда.',
          time: '16:00'
        }
      ];
      localStorage.setItem('robrun_messages', JSON.stringify(defaultMessages));
      return defaultMessages;
    }
    return JSON.parse(data);
  },

  saveMessages(messages) {
    localStorage.setItem('robrun_messages', JSON.stringify(messages));
  },

  addMessage(from, text, userId = 'usr_1') {
    const messages = this.getMessages();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: Date.now(), userId, from, text, time: timeStr };
    messages.push(newMsg);
    this.saveMessages(messages);
    return newMsg;
  }
};

// ==========================================
// 5. APPLICATION LOGIC & CONTROLLER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // Initialize 3D Graphics
  init3DAmbientBackground();
  init3DHeroInteractive();
  initCard3DTilt();

  // Elements
  const headerBalanceVal = document.getElementById('header-balance-val');
  const cabinetBalanceVal = document.getElementById('cabinet-balance-val');
  const summaryUserBalance = document.getElementById('summary-user-balance');
  const btnOpenTopup = document.getElementById('btn-open-topup');
  const cabinetTopupBtn = document.getElementById('cabinet-topup-btn');
  const soundToggle = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  // Navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewSections = document.querySelectorAll('.view-section');
  const logoBrand = document.getElementById('nav-brand');

  // Modals
  const topupModal = document.getElementById('topup-modal');
  const topupModalClose = document.getElementById('topup-modal-close');
  const topupAmountInput = document.getElementById('topup-amount-input');
  const topupBtnSum = document.getElementById('topup-btn-sum');
  const btnSubmitTopup = document.getElementById('btn-submit-topup');
  const topupChips = document.querySelectorAll('.topup-chip');

  const insufficientModal = document.getElementById('insufficient-modal');
  const insufficientClose = document.getElementById('insufficient-close');
  const insufficientCost = document.getElementById('insufficient-cost');
  const insufficientCurrent = document.getElementById('insufficient-current');
  const insufficientDiff = document.getElementById('insufficient-diff');
  const btnInsufficientTopup = document.getElementById('btn-insufficient-topup');

  const orderSuccessModal = document.getElementById('order-success-modal');
  const orderSuccessClose = document.getElementById('order-success-close');
  const successOrderId = document.getElementById('success-order-id');
  const successTime = document.getElementById('success-time');
  const successTotalCash = document.getElementById('success-total-cash');
  const successPrice = document.getElementById('success-price');
  const successRemainingBalance = document.getElementById('success-remaining-balance');
  const successNickServer = document.getElementById('success-nick-server');
  const btnGotoCabinetAfterOrder = document.getElementById('btn-goto-cabinet-after-order');

  // Calculator
  const currencyInput = document.getElementById('currency-input');
  const currencySlider = document.getElementById('currency-slider');
  const preset3DCards = document.querySelectorAll('.preset-3d-card');
  const summaryBaseAmount = document.getElementById('summary-base-amount');
  const summaryBonusPct = document.getElementById('summary-bonus-pct');
  const summaryBonusAmount = document.getElementById('summary-bonus-amount');
  const summaryTotalReceived = document.getElementById('summary-total-received');
  const summaryTotalPrice = document.getElementById('summary-total-price');
  const bonusTierText = document.getElementById('bonus-tier-text');
  const bonusNextText = document.getElementById('bonus-next-text');
  const bonusProgressFill = document.getElementById('bonus-progress-fill');
  const milestoneDots = document.querySelectorAll('.gauge-milestones .milestone-dot');
  const submitOrderBtn = document.getElementById('submit-order-btn');
  const orderForm = document.getElementById('order-form');

  // Cabinet & Chat
  const cabinetOrdersList = document.getElementById('cabinet-orders-list');
  const cabinetOrdersCount = document.getElementById('cabinet-orders-count');
  const customerChatMessages = document.getElementById('customer-chat-messages');
  const customerChatForm = document.getElementById('customer-chat-form');
  const customerChatInput = document.getElementById('customer-chat-input');

  // Admin
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminViewTabs = document.querySelectorAll('.admin-view-tab');
  const adminOrdersTbody = document.getElementById('admin-orders-tbody');
  const adminUsersTbody = document.getElementById('admin-users-tbody');
  const adminChatMessages = document.getElementById('admin-chat-messages');
  const adminChatForm = document.getElementById('admin-chat-form');
  const adminChatInput = document.getElementById('admin-chat-input');
  const adminDialogsList = document.getElementById('admin-dialogs-list');
  const adminStatOrders = document.getElementById('admin-stat-orders');
  const adminStatTurnover = document.getElementById('admin-stat-turnover');
  const subtabOrdersBadge = document.getElementById('subtab-orders-badge');
  const btnQuickReplyHello = document.getElementById('btn-quick-reply-hello');

  // Pricing: 70 RUB / 100,000 $
  const RATE_PER_UNIT = 70 / 100000;

  function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function parseFormattedNumber(str) {
    const clean = str.toString().replace(/[^\d]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  }

  // --- Sound Toggle ---
  soundToggle.addEventListener('click', () => {
    Sound.enabled = !Sound.enabled;
    soundIcon.textContent = Sound.enabled ? '🔊' : '🔇';
    Sound.playClick();
  });

  // --- Views Switcher ---
  function switchView(viewId) {
    Sound.playClick();
    viewSections.forEach(v => v.classList.remove('active'));
    navTabs.forEach(t => t.classList.remove('active'));

    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.add('active');

    navTabs.forEach(t => {
      if (t.dataset.view === viewId) t.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderAll();
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  logoBrand.addEventListener('click', () => switchView('shop-view'));

  // Admin Subtabs
  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.playClick();
      adminTabBtns.forEach(b => b.classList.remove('active'));
      adminViewTabs.forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.subtab);
      if (target) target.classList.add('active');
    });
  });

  // --- Top-Up Modal ---
  function openTopupModal(amount = 700) {
    Sound.playClick();
    topupAmountInput.value = amount;
    topupBtnSum.textContent = formatNumber(amount);
    topupChips.forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.dataset.amount, 10) === amount);
    });
    topupModal.classList.add('open');
  }

  function closeTopupModal() {
    Sound.playClick();
    topupModal.classList.remove('open');
  }

  btnOpenTopup.addEventListener('click', () => openTopupModal(700));
  cabinetTopupBtn.addEventListener('click', () => openTopupModal(700));
  topupModalClose.addEventListener('click', closeTopupModal);

  topupChips.forEach(chip => {
    chip.addEventListener('click', () => {
      Sound.playClick();
      topupChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = parseInt(chip.dataset.amount, 10);
      topupAmountInput.value = val;
      topupBtnSum.textContent = formatNumber(val);
    });
  });

  topupAmountInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    topupBtnSum.textContent = formatNumber(val);
  });

  btnSubmitTopup.addEventListener('click', () => {
    const amount = parseInt(topupAmountInput.value, 10);
    if (!amount || amount < 50) {
      alert('Минимальная сумма — 50 ₽');
      return;
    }

    const updatedUser = DB.updateCurrentUserBalance(amount, true);
    closeTopupModal();
    Sound.playCoin();

    DB.addMessage('admin', `✅ Ваш баланс пополнен на ${formatNumber(amount)} ₽. Доступно для покупок: ${formatNumber(updatedUser.balance)} ₽.`);
    renderAll();
    alert(`Баланс успешно пополнен на ${formatNumber(amount)} ₽!`);
  });

  // --- Calculator & Bonus Tiers ---
  function getBonusTier(amount) {
    if (amount >= 10000000) return { pct: 25, nextAmount: null, nextPct: null, stepIndex: 3 };
    if (amount >= 5000000) return { pct: 20, nextAmount: 10000000, nextPct: 25, stepIndex: 2 };
    if (amount >= 1000000) return { pct: 15, nextAmount: 5000000, nextPct: 20, stepIndex: 1 };
    return { pct: 0, nextAmount: 1000000, nextPct: 15, stepIndex: 0 };
  }

  function updateCalculator(amount) {
    if (amount < 0) amount = 0;

    const tier = getBonusTier(amount);
    const bonusCurrency = Math.round(amount * (tier.pct / 100));
    const totalCurrency = amount + bonusCurrency;
    const basePrice = Math.round(amount * RATE_PER_UNIT);

    summaryBaseAmount.textContent = `${formatNumber(amount)} $`;
    summaryBonusPct.textContent = `${tier.pct}%`;
    summaryBonusAmount.textContent = tier.pct > 0 ? `+${formatNumber(bonusCurrency)} $` : '0 $';
    summaryTotalReceived.textContent = `${formatNumber(totalCurrency)} $`;
    summaryTotalPrice.textContent = `${formatNumber(basePrice)} ₽`;
    submitOrderBtn.querySelector('.btn-text').textContent = `ОПЛАТИТЬ С БАЛАНСА (${formatNumber(basePrice)} ₽)`;

    // Gauge
    bonusTierText.innerHTML = `Бонусный уровень: <strong>+${tier.pct}%</strong>`;
    if (tier.nextAmount) {
      const diff = tier.nextAmount - amount;
      bonusNextText.textContent = `До бонуса ${tier.nextPct}% не хватает: ${formatNumber(diff)} $`;
    } else {
      bonusNextText.textContent = `Максимальный бонус города активирован! 👑`;
    }

    let progressPct = 0;
    if (amount < 1000000) progressPct = (amount / 1000000) * 25;
    else if (amount < 5000000) progressPct = 25 + ((amount - 1000000) / 4000000) * 35;
    else if (amount < 10000000) progressPct = 60 + ((amount - 5000000) / 5000000) * 30;
    else progressPct = 100;
    bonusProgressFill.style.width = `${Math.min(100, Math.max(5, progressPct))}%`;

    milestoneDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx <= tier.stepIndex);
    });

    currencyInput.value = formatNumber(amount);
    currencySlider.value = Math.min(amount, 15000000);

    preset3DCards.forEach(card => {
      card.classList.toggle('active', parseInt(card.dataset.amount, 10) === amount);
    });
  }

  currencyInput.addEventListener('input', (e) => {
    updateCalculator(parseFormattedNumber(e.target.value));
  });

  currencySlider.addEventListener('input', (e) => {
    updateCalculator(parseInt(e.target.value, 10));
  });

  preset3DCards.forEach(card => {
    card.addEventListener('click', () => {
      Sound.playClick();
      updateCalculator(parseInt(card.dataset.amount, 10));
    });
  });

  // --- Order Placement (Balance Strict) ---
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentUser = DB.getCurrentUser();
    const amount = parseFormattedNumber(currencyInput.value);
    const price = Math.round(amount * RATE_PER_UNIT);

    // Balance check
    if (currentUser.balance < price) {
      Sound.playClick();
      const diff = price - currentUser.balance;
      insufficientCost.textContent = `${formatNumber(price)} ₽`;
      insufficientCurrent.textContent = `${formatNumber(currentUser.balance)} ₽`;
      insufficientDiff.textContent = `${formatNumber(diff)} ₽`;

      btnInsufficientTopup.onclick = () => {
        insufficientModal.classList.remove('open');
        openTopupModal(diff);
      };

      insufficientModal.classList.add('open');
      return;
    }

    // Deduct balance
    const updatedUser = DB.updateCurrentUserBalance(-price, true);
    Sound.playSuccess();

    const nick = document.getElementById('player-nick').value.trim();
    const server = document.getElementById('player-server').value;
    const contact = document.getElementById('player-contact').value.trim();
    const deliveryType = document.getElementById('delivery-type').value;

    const tier = getBonusTier(amount);
    const bonusCurrency = Math.round(amount * (tier.pct / 100));
    const totalCurrency = amount + bonusCurrency;

    const now = new Date();
    const timeFormatted = now.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const newOrder = {
      id: 'RR-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser.id,
      userNick: currentUser.name,
      gameNick: nick,
      server: server,
      contact: contact,
      deliveryType: deliveryType,
      cashAmount: amount,
      bonusAmount: bonusCurrency,
      bonusPct: tier.pct,
      totalCash: totalCurrency,
      price: price,
      date: timeFormatted,
      status: 'Ожидает обработки'
    };

    DB.addOrder(newOrder);

    // Chat auto-log
    DB.addMessage('admin', `📦 Заказ ${newOrder.id} успешно создан! Получите: ${formatNumber(newOrder.totalCash)} $ (бонус +${newOrder.bonusPct}%). Мы свяжемся с вами по ${newOrder.contact}.`);

    successOrderId.textContent = newOrder.id;
    successTime.textContent = newOrder.date;
    successTotalCash.textContent = `${formatNumber(newOrder.totalCash)} $`;
    successPrice.textContent = `${formatNumber(newOrder.price)} ₽`;
    successRemainingBalance.textContent = `${formatNumber(updatedUser.balance)} ₽`;
    successNickServer.textContent = `${newOrder.gameNick} (${newOrder.server})`;

    orderSuccessModal.classList.add('open');
    renderAll();
  });

  insufficientClose.addEventListener('click', () => insufficientModal.classList.remove('open'));
  orderSuccessClose.addEventListener('click', () => orderSuccessModal.classList.remove('open'));

  btnGotoCabinetAfterOrder.addEventListener('click', () => {
    orderSuccessModal.classList.remove('open');
    switchView('cabinet-view');
  });

  // --- Chat Senders ---
  customerChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = customerChatInput.value.trim();
    if (!text) return;
    Sound.playClick();
    DB.addMessage('user', text);
    customerChatInput.value = '';
    renderChat();
  });

  adminChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = adminChatInput.value.trim();
    if (!text) return;
    Sound.playClick();
    DB.addMessage('admin', text);
    adminChatInput.value = '';
    renderChat();
  });

  btnQuickReplyHello.addEventListener('click', () => {
    Sound.playClick();
    DB.addMessage('admin', 'Курьер готов к передаче! Пожалуйста, зайдите на указанный сервер и напишите ваш статус.');
    renderChat();
  });

  // ==========================================
  // 6. RENDERING
  // ==========================================
  function renderHeaderAndBalances() {
    const user = DB.getCurrentUser();
    headerBalanceVal.textContent = `${formatNumber(user.balance)} ₽`;
    cabinetBalanceVal.textContent = `${formatNumber(user.balance)} ₽`;
    summaryUserBalance.textContent = `${formatNumber(user.balance)} ₽`;
  }

  function renderCabinetOrders() {
    const orders = DB.getOrders();
    cabinetOrdersCount.textContent = `${orders.length} заказов`;

    if (orders.length === 0) {
      cabinetOrdersList.innerHTML = `
        <div style="text-align:center; padding: 50px 20px; color: var(--text-dim);">
          <div style="font-size: 2.6rem; margin-bottom: 10px;">📦</div>
          <p>Активных заказов пока нет.</p>
        </div>
      `;
      return;
    }

    cabinetOrdersList.innerHTML = orders.map(o => {
      let statusClass = 'status-pending';
      if (o.status === 'В процессе') statusClass = 'status-processing';
      if (o.status === 'Выполнен') statusClass = 'status-completed';
      if (o.status === 'Отменен') statusClass = 'status-cancelled';

      return `
        <div class="order-cyber-item">
          <div class="order-head-row">
            <span class="order-id-tag">${o.id}</span>
            <span class="status-badge ${statusClass}">${o.status}</span>
          </div>
          <div class="order-exact-time">Время: <strong>${o.date}</strong></div>
          <div class="order-specs-grid">
            <div><span>Валюта:</span> <strong style="color:var(--green-neon);">${formatNumber(o.totalCash)} $</strong> (+${o.bonusPct}%)</div>
            <div><span>Списано:</span> <strong style="color:var(--gold-neon);">${formatNumber(o.price)} ₽</strong></div>
            <div><span>Ник:</span> <strong>${escapeHtml(o.gameNick)}</strong></div>
            <div><span>Сервер:</span> <strong>${o.server}</strong></div>
            <div style="grid-column: span 2;"><span>Способ:</span> <strong>${o.deliveryType}</strong></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderChat() {
    const messages = DB.getMessages();
    const html = messages.map(m => `
      <div class="msg-row ${m.from === 'user' ? 'from-user' : 'from-admin'}">
        <div class="msg-bubble">${escapeHtml(m.text)}</div>
        <div class="msg-time">${m.from === 'admin' ? '🛡️ Администратор' : 'Вы'} • ${m.time}</div>
      </div>
    `).join('');

    customerChatMessages.innerHTML = html;
    customerChatMessages.scrollTop = customerChatMessages.scrollHeight;

    adminChatMessages.innerHTML = html;
    adminChatMessages.scrollTop = adminChatMessages.scrollHeight;

    const lastMsg = messages[messages.length - 1];
    adminDialogsList.innerHTML = `
      <div class="admin-dialog-item active">
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
          <strong style="font-size:0.9rem;">Игрок #1</strong>
          <small style="color:var(--text-dim);">${lastMsg ? lastMsg.time : ''}</small>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${lastMsg ? escapeHtml(lastMsg.text) : 'Нет сообщений'}
        </div>
      </div>
    `;
  }

  function renderAdminTables() {
    const orders = DB.getOrders();
    const users = DB.getUsers();

    adminStatOrders.textContent = orders.length;
    subtabOrdersBadge.textContent = orders.length;
    const totalTurnover = orders.reduce((sum, o) => sum + (o.status !== 'Отменен' ? o.price : 0), 0);
    adminStatTurnover.textContent = `${formatNumber(totalTurnover)} ₽`;

    // Orders table
    if (orders.length === 0) {
      adminOrdersTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-dim);">Заказов пока нет</td></tr>`;
    } else {
      adminOrdersTbody.innerHTML = orders.map(o => `
        <tr>
          <td><strong style="color:var(--gold-neon);">${o.id}</strong></td>
          <td style="white-space:nowrap; font-size:0.8rem; color:var(--cyan-neon); font-family:var(--font-cyber);">${o.date}</td>
          <td>
            <strong>${escapeHtml(o.gameNick)}</strong><br>
            <small style="color:var(--text-dim);">${escapeHtml(o.contact)}</small>
          </td>
          <td>
            ${o.server}<br>
            <small style="color:var(--text-muted);">${o.deliveryType}</small>
          </td>
          <td>
            <strong style="color:var(--green-neon);">${formatNumber(o.totalCash)} $</strong><br>
            <small style="color:var(--text-muted);">+${formatNumber(o.bonusAmount)} $ (${o.bonusPct}%)</small>
          </td>
          <td><strong style="color:var(--gold-neon);">${formatNumber(o.price)} ₽</strong></td>
          <td>
            <select class="admin-status-select" data-order-id="${o.id}">
              <option value="Ожидает обработки" ${o.status === 'Ожидает обработки' ? 'selected' : ''}>🟡 Ожидает</option>
              <option value="В процессе" ${o.status === 'В процессе' ? 'selected' : ''}>🔵 В процессе</option>
              <option value="Выполнен" ${o.status === 'Выполнен' ? 'selected' : ''}>🟢 Выполнен</option>
              <option value="Отменен" ${o.status === 'Отменен' ? 'selected' : ''}>🔴 Отменен</option>
            </select>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.admin-status-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          Sound.playClick();
          const orderId = e.target.dataset.orderId;
          const newStatus = e.target.value;
          DB.updateOrderStatus(orderId, newStatus);
          DB.addMessage('admin', `Статус вашего заказа ${orderId} изменен на «${newStatus}».`);
          renderAll();
        });
      });
    }

    // Users table
    adminUsersTbody.innerHTML = users.map(u => `
      <tr>
        <td><code>${u.id}</code></td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.contact)}</td>
        <td><strong style="font-size:1.15rem; color:var(--gold-neon); font-family:var(--font-cyber);">${formatNumber(u.balance)} ₽</strong></td>
        <td>
          <div class="balance-control-box">
            <input type="number" class="balance-control-input" id="balance-input-${u.id}" value="${u.balance}" min="0" step="100">
            <button class="btn-admin-action" data-set-user="${u.id}">Задать</button>
            <button class="btn-admin-action btn-admin-add" data-add-user="${u.id}" data-amount="500">+500 ₽</button>
            <button class="btn-admin-action btn-admin-add" data-add-user="${u.id}" data-amount="1000">+1 000 ₽</button>
          </div>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.playClick();
        const userId = btn.dataset.setUser;
        const input = document.getElementById(`balance-input-${userId}`);
        const newVal = parseInt(input.value, 10);
        if (!isNaN(newVal)) {
          DB.updateUserBalanceById(userId, newVal);
          DB.addMessage('admin', `Администратор скорректировал баланс: ${formatNumber(newVal)} ₽.`);
          renderAll();
          alert(`Баланс обновлен: ${formatNumber(newVal)} ₽`);
        }
      });
    });

    document.querySelectorAll('[data-add-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.playCoin();
        const userId = btn.dataset.addUser;
        const addAmount = parseInt(btn.dataset.amount, 10);
        const users = DB.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
          const newVal = user.balance + addAmount;
          DB.updateUserBalanceById(userId, newVal);
          DB.addMessage('admin', `Вам начислено +${formatNumber(addAmount)} ₽. Текущий баланс: ${formatNumber(newVal)} ₽.`);
          renderAll();
        }
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function renderAll() {
    renderHeaderAndBalances();
    renderCabinetOrders();
    renderChat();
    renderAdminTables();
  }

  // Live Toast Feed Simulation
  const sampleOrders = [
    { nick: 'CyberViper', amount: 1000000, bonus: '+15%' },
    { nick: 'KefirRaid_77', amount: 5000000, bonus: '+20%' },
    { nick: 'Ghost_Heist', amount: 500000, bonus: 'базовый' },
    { nick: 'Night_Runner', amount: 10000000, bonus: '+25%' }
  ];
  let orderIndex = 0;
  const cyberToast = document.getElementById('cyber-toast');
  const toastNick = document.getElementById('toast-nick');
  const toastAmount = document.getElementById('toast-amount');

  function showNextToast() {
    const item = sampleOrders[orderIndex % sampleOrders.length];
    orderIndex++;
    toastNick.textContent = item.nick;
    toastAmount.textContent = `${formatNumber(item.amount)} $`;
    cyberToast.querySelector('.toast-bonus-val').textContent = `(${item.bonus} бонус)`;
    cyberToast.classList.add('show');
    setTimeout(() => cyberToast.classList.remove('show'), 4000);
  }

  setTimeout(showNextToast, 4000);
  setInterval(showNextToast, 13000);

  // Sync across tabs
  window.addEventListener('storage', () => renderAll());

  // Init
  updateCalculator(1000000);
  renderAll();
});
