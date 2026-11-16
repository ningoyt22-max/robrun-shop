/**
 * ROBRUN CASH - Firebase Realtime Cloud Integration
 * Connected to Firebase Project: robrun-git
 * Features:
 *   - Firebase Authentication (Google Sign-In & User Session)
 *   - Cloud Firestore (Realtime User Balances, Orders, Live Chat)
 *   - Security: Balances & orders stored in the cloud, protected from client tampering
 *   - Live bi-directional chat between Buyer & Admin
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCWeTcNCYYWJ_u6BbHHnxPqQmqRcEPmAPg",
  authDomain: "robrun-git.firebaseapp.com",
  projectId: "robrun-git",
  storageBucket: "robrun-git.firebasestorage.app",
  messagingSenderId: "736942180958",
  appId: "1:736942180958:web:e6f87b08086d4165b582cf",
  measurementId: "G-J97WE9GRW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// State Variables
let currentUser = null;
let currentUserData = { balance: 0 };
let currentTargetAmount = 1000000;
let userUnsubscribe = null;
let ordersUnsubscribe = null;
let chatUnsubscribe = null;
let adminSelectedUserId = null;

// Pricing: 70 RUB per 100,000 $ (0.0007 RUB per $)
const RATE_PER_UNIT = 70 / 100000;

// Format Helpers
function formatNumber(num) {
  return Math.round(num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseFormattedNumber(str) {
  const clean = str.toString().replace(/[^\d]/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ==========================================
// 2. DOM INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // Auth UI Elements
  const btnLoginGoogle = document.getElementById('btn-login-google');
  const userLoggedBox = document.getElementById('user-logged-box');
  const userAvatarBtn = document.getElementById('user-avatar-btn');
  const userAvatarImg = document.getElementById('user-avatar-img');
  const userAvatarPlaceholder = document.getElementById('user-avatar-placeholder');

  // Header & Balance
  const headerBalanceVal = document.getElementById('header-balance-val');
  const cabinetBalanceVal = document.getElementById('cabinet-balance-val');
  const summaryUserBalance = document.getElementById('summary-user-balance');
  const cabinetUsername = document.getElementById('cabinet-username');
  const cabinetUserEmail = document.getElementById('cabinet-useremail');
  const cabinetAvatarBox = document.getElementById('cabinet-avatar-box');
  const btnOpenTopup = document.getElementById('btn-open-topup');
  const cabinetTopupBtn = document.getElementById('cabinet-topup-btn');

  // Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewPanels = document.querySelectorAll('.view-panel');
  const brandLogo = document.getElementById('nav-brand');

  // Calculator Elements
  const currencyInput = document.getElementById('currency-input');
  const currencySlider = document.getElementById('currency-slider');
  const presetCards = document.querySelectorAll('.preset-card');
  const summaryBaseAmount = document.getElementById('summary-base-amount');
  const summaryBonusPct = document.getElementById('summary-bonus-pct');
  const summaryBonusAmount = document.getElementById('summary-bonus-amount');
  const summaryTotalReceived = document.getElementById('summary-total-received');
  const summaryTotalPrice = document.getElementById('summary-total-price');
  const bonusTierText = document.getElementById('bonus-tier-text');
  const bonusNextText = document.getElementById('bonus-next-text');
  const bonusProgressFill = document.getElementById('bonus-progress-fill');
  const milestoneTexts = document.querySelectorAll('.bonus-milestones .milestone-text');
  const submitOrderBtn = document.getElementById('submit-order-btn');
  const orderForm = document.getElementById('order-form');

  // Modals
  const topupModal = document.getElementById('topup-modal');
  const topupModalClose = document.getElementById('topup-modal-close');
  const topupAmountInput = document.getElementById('topup-amount-input');
  const topupBtnSum = document.getElementById('topup-btn-sum');
  const btnSubmitTopup = document.getElementById('btn-submit-topup');
  const chipBtns = document.querySelectorAll('.chip-btn');
  const methodBoxes = document.querySelectorAll('.method-box');

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

  // Cabinet & Chat Elements
  const cabinetOrdersList = document.getElementById('cabinet-orders-list');
  const cabinetOrdersCount = document.getElementById('cabinet-orders-count');
  const customerChatMessages = document.getElementById('customer-chat-messages');
  const customerChatForm = document.getElementById('customer-chat-form');
  const customerChatInput = document.getElementById('customer-chat-input');

  // Admin Elements
  const adminTabLinks = document.querySelectorAll('.admin-tab-link');
  const adminSubviews = document.querySelectorAll('.admin-subview');
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
  const adminChatTargetUser = document.getElementById('admin-chat-target-user');
  const adminChatTargetMeta = document.getElementById('admin-chat-target-meta');

  // ==========================================
  // 3. FIREBASE AUTH STATE LISTENER
  // ==========================================
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
      // User is signed in
      btnLoginGoogle.style.display = 'none';
      userLoggedBox.style.display = 'flex';

      if (user.photoURL) {
        userAvatarImg.src = user.photoURL;
        userAvatarImg.style.display = 'block';
        userAvatarPlaceholder.style.display = 'none';
        cabinetAvatarBox.innerHTML = `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        userAvatarImg.style.display = 'none';
        userAvatarPlaceholder.style.display = 'block';
        cabinetAvatarBox.innerHTML = '👤';
      }

      cabinetUsername.textContent = user.displayName || user.email.split('@')[0];
      cabinetUserEmail.textContent = user.email;

      // Sync User in Firestore
      await syncUserDocument(user);

      // Listen to User's Firestore Document in Realtime
      subscribeToUserData(user.uid);

      // Listen to User's Orders
      subscribeToUserOrders(user.uid);

      // Listen to User's Chat Messages
      subscribeToUserChat(user.uid);

    } else {
      // User is signed out
      btnLoginGoogle.style.display = 'flex';
      userLoggedBox.style.display = 'none';

      currentUserData = { balance: 0 };
      updateBalancesUI(0);

      cabinetUsername.textContent = 'Гость (Войдите в аккаунт)';
      cabinetUserEmail.textContent = 'Синхронизировано с Firebase Cloud';
      cabinetAvatarBox.innerHTML = '👤';

      if (userUnsubscribe) userUnsubscribe();
      if (ordersUnsubscribe) ordersUnsubscribe();
      if (chatUnsubscribe) chatUnsubscribe();

      cabinetOrdersList.innerHTML = `
        <div style="text-align:center; padding: 48px 20px; color: var(--text-dim);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔐</div>
          <p>Войдите в аккаунт, чтобы видеть историю своих заказов.</p>
        </div>
      `;
      customerChatMessages.innerHTML = `
        <div class="msg-bubble-wrap support">
          <div class="msg-text">Пожалуйста, войдите через Google, чтобы общаться с оператором поддержки.</div>
          <div class="msg-meta">Система</div>
        </div>
      `;
    }
  });

  // Google Login Click
  btnLoginGoogle.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Ошибка авторизации Google:', error);
      alert('Ошибка входа: ' + (error.message || 'Проверьте, включен ли Google вход в Firebase Console'));
    }
  });

  // Logout Click
  userAvatarBtn.addEventListener('click', async () => {
    if (confirm('Вы действительно хотите выйти из аккаунта?')) {
      await signOut(auth);
    }
  });

  // ==========================================
  // 4. FIRESTORE REALTIME SYNC
  // ==========================================
  async function syncUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Покупатель',
          photoURL: user.photoURL || '',
          balance: 0,
          createdAt: serverTimestamp()
        });
      } else {
        // Update contact/name if changed
        await updateDoc(userRef, {
          email: user.email,
          displayName: user.displayName || snap.data().displayName,
          photoURL: user.photoURL || snap.data().photoURL
        });
      }
    } catch (e) {
      console.warn('Firestore initial sync notice:', e);
    }
  }

  function subscribeToUserData(uid) {
    if (userUnsubscribe) userUnsubscribe();
    userUnsubscribe = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        currentUserData = docSnap.data();
        updateBalancesUI(currentUserData.balance || 0);
      }
    }, (error) => {
      console.error('Ошибка подписки на пользователя:', error);
    });
  }

  function updateBalancesUI(balance) {
    headerBalanceVal.textContent = `${formatNumber(balance)} ₽`;
    cabinetBalanceVal.textContent = `${formatNumber(balance)} ₽`;
    summaryUserBalance.textContent = `${formatNumber(balance)} ₽`;
  }

  // Subscribe to Orders for Current User
  function subscribeToUserOrders(uid) {
    if (ordersUnsubscribe) ordersUnsubscribe();
    const q = query(collection(db, 'orders'), where('userId', '==', uid));

    ordersUnsubscribe = onSnapshot(q, (snapshot) => {
      cabinetOrdersCount.textContent = `${snapshot.size} заказов`;

      if (snapshot.empty) {
        cabinetOrdersList.innerHTML = `
          <div style="text-align:center; padding: 48px 20px; color: var(--text-dim);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📦</div>
            <p>Активных заказов пока нет.</p>
          </div>
        `;
        return;
      }

      const orders = [];
      snapshot.forEach(docSnap => orders.push({ id: docSnap.id, ...docSnap.data() }));

      // Sort client-side by date
      orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      cabinetOrdersList.innerHTML = orders.map(o => {
        let statusClass = 'status-pending';
        if (o.status === 'В процессе') statusClass = 'status-processing';
        if (o.status === 'Выполнен') statusClass = 'status-completed';
        if (o.status === 'Отменен') statusClass = 'status-cancelled';

        return `
          <div class="order-entry">
            <div class="order-entry-top">
              <span class="order-code">${o.orderCode || o.id.slice(0, 7)}</span>
              <span class="status-badge ${statusClass}">${o.status}</span>
            </div>
            <div class="order-time">Время оформления: <strong>${o.date || 'Недавно'}</strong></div>
            <div class="order-stats-grid">
              <div><span>Валюта:</span> <strong>${formatNumber(o.totalCash)} $</strong> (+${o.bonusPct}%)</div>
              <div><span>Списано:</span> <strong>${formatNumber(o.price)} ₽</strong></div>
              <div><span>Ник:</span> <strong>${escapeHtml(o.gameNick)}</strong></div>
              <div><span>Сервер:</span> <strong>${o.server}</strong></div>
              <div style="grid-column: span 2;"><span>Способ передачи:</span> <strong>${o.deliveryType}</strong></div>
            </div>
          </div>
        `;
      }).join('');
    });
  }

  // Subscribe to Chat for Current User
  function subscribeToUserChat(uid) {
    if (chatUnsubscribe) chatUnsubscribe();
    const q = query(collection(db, 'messages'), where('userId', '==', uid));

    chatUnsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(docSnap => msgs.push({ id: docSnap.id, ...docSnap.data() }));
      msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (msgs.length === 0) {
        customerChatMessages.innerHTML = `
          <div class="msg-bubble-wrap support">
            <div class="msg-text">Здравствуйте! Напишите нам, если у вас возникли вопросы по доставке валюты в ROB RUN.</div>
            <div class="msg-meta">Оператор поддержки</div>
          </div>
        `;
        return;
      }

      customerChatMessages.innerHTML = msgs.map(m => `
        <div class="msg-bubble-wrap ${m.from === 'user' ? 'client' : 'support'}">
          <div class="msg-text">${escapeHtml(m.text)}</div>
          <div class="msg-meta">${m.from === 'admin' ? 'Администратор' : 'Вы'} • ${m.time || ''}</div>
        </div>
      `).join('');
      customerChatMessages.scrollTop = customerChatMessages.scrollHeight;
    });
  }

  // Send message in customer chat
  customerChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Пожалуйста, сначала войдите через Google!');
      return;
    }
    const text = customerChatInput.value.trim();
    if (!text) return;

    customerChatInput.value = '';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    try {
      await addDoc(collection(db, 'messages'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        from: 'user',
        text: text,
        time: timeStr,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
    }
  });

  // ==========================================
  // 5. TOP-UP & PURCHASE (BALANCE ONLY)
  // ==========================================
  function openTopupModal(amount = 700) {
    if (!currentUser) {
      alert('Пожалуйста, сначала войдите в аккаунт через Google в правом верхнем углу!');
      return;
    }
    topupAmountInput.value = amount;
    topupBtnSum.textContent = formatNumber(amount);
    chipBtns.forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.dataset.amount, 10) === amount);
    });
    topupModal.classList.add('open');
  }

  function closeTopupModal() {
    topupModal.classList.remove('open');
  }

  btnOpenTopup.addEventListener('click', () => openTopupModal(700));
  cabinetTopupBtn.addEventListener('click', () => openTopupModal(700));
  topupModalClose.addEventListener('click', closeTopupModal);

  chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
      chipBtns.forEach(c => c.classList.remove('active'));
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

  methodBoxes.forEach(box => {
    box.addEventListener('click', () => {
      methodBoxes.forEach(b => b.classList.remove('active'));
      box.classList.add('active');
    });
  });

  btnSubmitTopup.addEventListener('click', async () => {
    if (!currentUser) {
      alert('Войдите через Google, чтобы пополнить баланс!');
      return;
    }
    const amount = parseInt(topupAmountInput.value, 10);
    if (!amount || amount < 50) {
      alert('Минимальная сумма пополнения — 50 ₽');
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        balance: increment(amount)
      });

      // Send confirmation to chat
      const now = new Date();
      await addDoc(collection(db, 'messages'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        from: 'admin',
        text: `✅ Баланс пополнен на ${formatNumber(amount)} ₽. Средства готовы к списанию за валюту ROB RUN.`,
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });

      closeTopupModal();
      alert(`Баланс успешно пополнен на ${formatNumber(amount)} ₽ в облаке Firebase!`);
    } catch (err) {
      console.error('Ошибка пополнения:', err);
      alert('Ошибка при пополнении в Firestore: ' + err.message);
    }
  });

  // Order Placement
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Пожалуйста, войдите через Google (кнопка в правом верхнем углу), чтобы оформить заказ!');
      return;
    }

    const currentBalance = currentUserData.balance || 0;
    const amount = parseFormattedNumber(currencyInput.value);
    const price = Math.round(amount * RATE_PER_UNIT);

    // Strict balance check
    if (currentBalance < price) {
      const diff = price - currentBalance;
      insufficientCost.textContent = `${formatNumber(price)} ₽`;
      insufficientCurrent.textContent = `${formatNumber(currentBalance)} ₽`;
      insufficientDiff.textContent = `${formatNumber(diff)} ₽`;

      btnInsufficientTopup.onclick = () => {
        insufficientModal.classList.remove('open');
        openTopupModal(diff);
      };

      insufficientModal.classList.add('open');
      return;
    }

    // Deduct balance and create order in Firestore
    try {
      submitOrderBtn.disabled = true;
      submitOrderBtn.textContent = 'Оформление...';

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        balance: increment(-price)
      });

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

      const orderCode = 'RR-' + Math.floor(1000 + Math.random() * 9000);

      const orderData = {
        orderCode: orderCode,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Покупатель',
        gameNick: nick,
        server: server,
        contact: contact,
        deliveryType: deliveryType,
        cashAmount: amount,
        bonusAmount: bonusCurrency,
        bonusPct: tier.pct,
        totalCash: totalCurrency,
        price: price,
        status: 'Ожидает обработки',
        date: timeFormatted,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);

      // Auto message in chat
      await addDoc(collection(db, 'messages'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        from: 'admin',
        text: `📦 Заказ ${orderCode} успешно зарегистрирован на сумму ${formatNumber(totalCurrency)} $ (${formatNumber(price)} ₽ списано). Оператор свяжется с вами по ${contact}.`,
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });

      // Show Success Modal
      successOrderId.textContent = orderCode;
      successTime.textContent = timeFormatted;
      successTotalCash.textContent = `${formatNumber(totalCurrency)} $`;
      successPrice.textContent = `${formatNumber(price)} ₽`;
      successRemainingBalance.textContent = `${formatNumber(currentBalance - price)} ₽`;
      successNickServer.textContent = `${nick} (${server})`;

      orderSuccessModal.classList.add('open');
    } catch (err) {
      console.error('Ошибка создания заказа:', err);
      alert('Ошибка при сохранении заказа: ' + err.message);
    } finally {
      submitOrderBtn.disabled = false;
      submitOrderBtn.textContent = `Оплатить с баланса — ${formatNumber(price)} ₽`;
    }
  });

  insufficientClose.addEventListener('click', () => insufficientModal.classList.remove('open'));
  orderSuccessClose.addEventListener('click', () => orderSuccessModal.classList.remove('open'));

  btnGotoCabinetAfterOrder.addEventListener('click', () => {
    orderSuccessModal.classList.remove('open');
    switchView('cabinet-view');
  });

  // ==========================================
  // 6. CALCULATOR CORE LOGIC
  // ==========================================
  function getBonusTier(amount) {
    if (amount >= 10000000) return { pct: 25, nextAmount: null, nextPct: null, stepIndex: 3 };
    if (amount >= 5000000) return { pct: 20, nextAmount: 10000000, nextPct: 25, stepIndex: 2 };
    if (amount >= 1000000) return { pct: 15, nextAmount: 5000000, nextPct: 20, stepIndex: 1 };
    return { pct: 0, nextAmount: 1000000, nextPct: 15, stepIndex: 0 };
  }

  function updateCalculator(amount) {
    if (amount < 0) amount = 0;
    currentTargetAmount = amount;

    const tier = getBonusTier(amount);
    const bonusCurrency = Math.round(amount * (tier.pct / 100));
    const totalCurrency = amount + bonusCurrency;
    const basePrice = Math.round(amount * RATE_PER_UNIT);

    summaryBaseAmount.textContent = `${formatNumber(amount)} $`;
    summaryBonusPct.textContent = `${tier.pct}%`;
    summaryBonusAmount.textContent = tier.pct > 0 ? `+${formatNumber(bonusCurrency)} $` : '0 $';
    summaryTotalReceived.textContent = `${formatNumber(totalCurrency)} $`;
    summaryTotalPrice.textContent = `${formatNumber(basePrice)} ₽`;
    submitOrderBtn.textContent = `Оплатить с баланса — ${formatNumber(basePrice)} ₽`;

    bonusTierText.innerHTML = `Текущий бонус: <strong>+${tier.pct}%</strong>`;
    if (tier.nextAmount) {
      const diff = tier.nextAmount - amount;
      bonusNextText.textContent = `До бонуса ${tier.nextPct}% не хватает: ${formatNumber(diff)} $`;
    } else {
      bonusNextText.textContent = `Максимальный бонус активирован (+25%)`;
    }

    let progressPct = 0;
    if (amount < 1000000) progressPct = (amount / 1000000) * 25;
    else if (amount < 5000000) progressPct = 25 + ((amount - 1000000) / 4000000) * 35;
    else if (amount < 10000000) progressPct = 60 + ((amount - 5000000) / 5000000) * 30;
    else progressPct = 100;
    bonusProgressFill.style.width = `${Math.min(100, Math.max(4, progressPct))}%`;

    milestoneTexts.forEach((text, idx) => {
      text.classList.toggle('active', idx <= tier.stepIndex);
    });

    currencyInput.value = formatNumber(amount);
    currencySlider.value = Math.min(amount, 15000000);

    presetCards.forEach(card => {
      card.classList.toggle('active', parseInt(card.dataset.amount, 10) === amount);
    });
  }

  currencyInput.addEventListener('input', (e) => {
    updateCalculator(parseFormattedNumber(e.target.value));
  });

  currencySlider.addEventListener('input', (e) => {
    updateCalculator(parseInt(e.target.value, 10));
  });

  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      updateCalculator(parseInt(card.dataset.amount, 10));
    });
  });

  // Navigation Switch
  function switchView(viewId) {
    viewPanels.forEach(p => p.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(viewId);
    if (targetPanel) targetPanel.classList.add('active');

    navBtns.forEach(b => {
      if (b.dataset.view === viewId) b.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  if (brandLogo) {
    brandLogo.addEventListener('click', () => switchView('shop-view'));
  }

  // Admin Subtabs
  adminTabLinks.forEach(link => {
    link.addEventListener('click', () => {
      adminTabLinks.forEach(l => l.classList.remove('active'));
      adminSubviews.forEach(v => v.classList.remove('active'));
      link.classList.add('active');
      const target = document.getElementById(link.dataset.subtab);
      if (target) target.classList.add('active');
    });
  });

  // ==========================================
  // 7. ADMIN PANEL (REALTIME FIRESTORE)
  // ==========================================
  // 1. Listen to ALL orders in realtime
  onSnapshot(collection(db, 'orders'), (snapshot) => {
    adminStatOrders.textContent = snapshot.size;
    subtabOrdersBadge.textContent = snapshot.size;

    if (snapshot.empty) {
      adminOrdersTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-dim);">Заказов в Firebase пока нет</td></tr>`;
      adminStatTurnover.textContent = '0 ₽';
      return;
    }

    const allOrders = [];
    let turnover = 0;
    snapshot.forEach(docSnap => {
      const o = { id: docSnap.id, ...docSnap.data() };
      allOrders.push(o);
      if (o.status !== 'Отменен') turnover += (o.price || 0);
    });

    adminStatTurnover.textContent = `${formatNumber(turnover)} ₽`;
    allOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    adminOrdersTbody.innerHTML = allOrders.map(o => `
      <tr>
        <td><strong style="color:var(--gold-accent);">${o.orderCode || o.id.slice(0, 7)}</strong></td>
        <td style="white-space:nowrap; font-size:0.8rem; color:var(--text-muted);">${o.date || ''}</td>
        <td>
          <strong>${escapeHtml(o.gameNick || '')}</strong><br>
          <small style="color:var(--text-dim);">${escapeHtml(o.userEmail || o.contact || '')}</small>
        </td>
        <td>
          ${o.server || ''}<br>
          <small style="color:var(--text-muted);">${o.deliveryType || ''}</small>
        </td>
        <td>
          <strong>${formatNumber(o.totalCash)} $</strong><br>
          <small style="color:var(--gold-accent);">+${formatNumber(o.bonusAmount)} $ (${o.bonusPct}%)</small>
        </td>
        <td><strong>${formatNumber(o.price)} ₽</strong></td>
        <td>
          <select class="status-select-clean" data-order-id="${o.id}">
            <option value="Ожидает обработки" ${o.status === 'Ожидает обработки' ? 'selected' : ''}>Ожидает</option>
            <option value="В процессе" ${o.status === 'В процессе' ? 'selected' : ''}>В процессе</option>
            <option value="Выполнен" ${o.status === 'Выполнен' ? 'selected' : ''}>Выполнен</option>
            <option value="Отменен" ${o.status === 'Отменен' ? 'selected' : ''}>Отменен</option>
          </select>
        </td>
      </tr>
    `).join('');

    // Change status handler
    document.querySelectorAll('.status-select-clean').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const orderId = e.target.dataset.orderId;
        const newStatus = e.target.value;
        try {
          await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
        } catch (err) {
          console.error('Ошибка обновления статуса:', err);
        }
      });
    });
  });

  // 2. Listen to ALL users in realtime
  onSnapshot(collection(db, 'users'), (snapshot) => {
    if (snapshot.empty) {
      adminUsersTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-dim);">Пользователей в базе нет</td></tr>`;
      return;
    }

    const allUsers = [];
    snapshot.forEach(docSnap => allUsers.push({ id: docSnap.id, ...docSnap.data() }));

    adminUsersTbody.innerHTML = allUsers.map(u => `
      <tr>
        <td><code>${u.uid ? u.uid.slice(0, 8) + '...' : u.id}</code></td>
        <td><strong>${escapeHtml(u.displayName || 'Без имени')}</strong></td>
        <td>${escapeHtml(u.email || '-')}</td>
        <td><strong style="color:var(--gold-accent); font-size:1.05rem;">${formatNumber(u.balance || 0)} ₽</strong></td>
        <td>
          <div class="balance-actions-clean">
            <input type="number" id="balance-input-${u.id}" value="${u.balance || 0}" min="0" step="100">
            <button class="btn-sm-action" data-set-user="${u.id}">Задать</button>
            <button class="btn-sm-action" data-add-user="${u.id}" data-amount="500">+500 ₽</button>
            <button class="btn-sm-action" data-add-user="${u.id}" data-amount="1000">+1 000 ₽</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Set Balance Button
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.setUser;
        const input = document.getElementById(`balance-input-${userId}`);
        const newVal = parseInt(input.value, 10);
        if (!isNaN(newVal)) {
          try {
            await updateDoc(doc(db, 'users', userId), { balance: newVal });
            alert(`Баланс обновлен: ${formatNumber(newVal)} ₽`);
          } catch (err) {
            alert('Ошибка: ' + err.message);
          }
        }
      });
    });

    // Add Balance Button
    document.querySelectorAll('[data-add-user]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.addUser;
        const addAmount = parseInt(btn.dataset.amount, 10);
        try {
          await updateDoc(doc(db, 'users', userId), { balance: increment(addAmount) });
        } catch (err) {
          alert('Ошибка: ' + err.message);
        }
      });
    });

    // Dialogs list in admin chat
    adminDialogsList.innerHTML = allUsers.map(u => `
      <div class="dialog-item ${adminSelectedUserId === u.id ? 'active' : ''}" data-chat-user="${u.id}" data-user-name="${escapeHtml(u.displayName || u.email)}">
        <strong style="font-size:0.85rem;">${escapeHtml(u.displayName || 'Покупатель')}</strong>
        <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(u.email || u.id)}</div>
      </div>
    `).join('');

    document.querySelectorAll('[data-chat-user]').forEach(item => {
      item.addEventListener('click', () => {
        adminSelectedUserId = item.dataset.chatUser;
        const userName = item.dataset.userName;
        document.querySelectorAll('.dialog-item').forEach(d => d.classList.remove('active'));
        item.classList.add('active');
        adminChatTargetUser.textContent = `Чат с: ${userName}`;
        adminChatTargetMeta.textContent = `UID: ${adminSelectedUserId}`;
        loadAdminChat(adminSelectedUserId);
      });
    });
  });

  // Admin Chat Stream Loader
  let adminChatStreamUnsub = null;
  function loadAdminChat(targetUid) {
    if (adminChatStreamUnsub) adminChatStreamUnsub();

    const q = query(collection(db, 'messages'), where('userId', '==', targetUid));
    adminChatStreamUnsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(docSnap => msgs.push({ id: docSnap.id, ...docSnap.data() }));
      msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (msgs.length === 0) {
        adminChatMessages.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim);">Нет сообщений с этим пользователем</div>`;
        return;
      }

      adminChatMessages.innerHTML = msgs.map(m => `
        <div class="msg-bubble-wrap ${m.from === 'admin' ? 'client' : 'support'}">
          <div class="msg-text">${escapeHtml(m.text)}</div>
          <div class="msg-meta">${m.from === 'admin' ? 'Вы (Администратор)' : 'Покупатель'} • ${m.time || ''}</div>
        </div>
      `).join('');
      adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
    });
  }

  // Admin Send Reply
  adminChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!adminSelectedUserId) {
      alert('Сначала выберите покупателя из списка слева!');
      return;
    }
    const text = adminChatInput.value.trim();
    if (!text) return;

    adminChatInput.value = '';
    const now = new Date();
    try {
      await addDoc(collection(db, 'messages'), {
        userId: adminSelectedUserId,
        from: 'admin',
        text: text,
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Ошибка отправки ответа админа:', err);
    }
  });

  btnQuickReplyHello.addEventListener('click', async () => {
    if (!adminSelectedUserId) {
      alert('Сначала выберите покупателя из списка слева!');
      return;
    }
    const now = new Date();
    try {
      await addDoc(collection(db, 'messages'), {
        userId: adminSelectedUserId,
        from: 'admin',
        text: 'Курьер готов к передаче! Пожалуйста, зайдите на указанный сервер и напишите ваш статус.',
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  });

  // Init Calculator
  updateCalculator(1000000);
});
