/**
 * ROBRUN CASH - Minimalist Luxury Edition Engine
 * Pricing: 70 RUB per 100,000 in-game currency
 * Bonus:
 *   >= 1 000 000  : +15%
 *   >= 5 000 000  : +20%
 *   >= 10 000 000 : +25%
 *
 * Core Features:
 *   1. Wallet top-up & balance-only purchasing
 *   2. Personal cabinet with exact timestamp order history & live chat
 *   3. Admin panel with user balance modification, orders management, and chat console
 *   4. Persistent localStorage storage + cross-tab synchronization
 */

// ==========================================
// 1. DATA STORE (LocalStorage)
// ==========================================
const DB = {
  getUsers() {
    const data = localStorage.getItem('robrun_users');
    if (!data) {
      const defaultUsers = [
        { id: 'usr_1', name: 'Игрок #1 (Вы)', contact: '@robber_main', balance: 0 }
      ];
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
          text: 'Здравствуйте! Добро пожаловать в ROBRUN CASH. Если у вас возникнут вопросы по доставке валюты или серверам — пишите сюда.',
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
    const newMsg = {
      id: Date.now(),
      userId,
      from,
      text,
      time: timeStr
    };
    messages.push(newMsg);
    this.saveMessages(messages);
    return newMsg;
  }
};

// ==========================================
// 2. UI CONTROLLER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // Elements
  const headerBalanceVal = document.getElementById('header-balance-val');
  const cabinetBalanceVal = document.getElementById('cabinet-balance-val');
  const summaryUserBalance = document.getElementById('summary-user-balance');
  const btnOpenTopup = document.getElementById('btn-open-topup');
  const cabinetTopupBtn = document.getElementById('cabinet-topup-btn');

  // Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewPanels = document.querySelectorAll('.view-panel');
  const brandLogo = document.getElementById('nav-brand');

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

  // Calculator
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

  // Cabinet & Chat
  const cabinetOrdersList = document.getElementById('cabinet-orders-list');
  const cabinetOrdersCount = document.getElementById('cabinet-orders-count');
  const customerChatMessages = document.getElementById('customer-chat-messages');
  const customerChatForm = document.getElementById('customer-chat-form');
  const customerChatInput = document.getElementById('customer-chat-input');

  // Admin
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

  // Rate constant: 70 RUB per 100,000 in-game currency
  const RATE_PER_UNIT = 70 / 100000;

  function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function parseFormattedNumber(str) {
    const clean = str.toString().replace(/[^\d]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  }

  // View Navigation
  function switchView(viewId) {
    viewPanels.forEach(p => p.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(viewId);
    if (targetPanel) targetPanel.classList.add('active');

    navBtns.forEach(b => {
      if (b.dataset.view === viewId) b.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderAll();
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

  // Top-Up Modal
  function openTopupModal(amount = 700) {
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

  btnSubmitTopup.addEventListener('click', () => {
    const amount = parseInt(topupAmountInput.value, 10);
    if (!amount || amount < 50) {
      alert('Минимальная сумма пополнения — 50 ₽');
      return;
    }

    const updatedUser = DB.updateCurrentUserBalance(amount, true);
    closeTopupModal();

    DB.addMessage('admin', `✅ Баланс пополнен на ${formatNumber(amount)} ₽. Текущий баланс: ${formatNumber(updatedUser.balance)} ₽.`);
    renderAll();
    alert(`Баланс успешно пополнен на ${formatNumber(amount)} ₽!`);
  });

  // Calculator Logic
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

  // Order Placement
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentUser = DB.getCurrentUser();
    const amount = parseFormattedNumber(currencyInput.value);
    const price = Math.round(amount * RATE_PER_UNIT);

    if (currentUser.balance < price) {
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

    const updatedUser = DB.updateCurrentUserBalance(-price, true);

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

    DB.addMessage('admin', `📦 Заказ ${newOrder.id} успешно оформлен на сумму ${formatNumber(newOrder.totalCash)} $. Ожидайте связи оператора.`);

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

  // Support Chat Senders
  customerChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = customerChatInput.value.trim();
    if (!text) return;
    DB.addMessage('user', text);
    customerChatInput.value = '';
    renderChat();
  });

  adminChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = adminChatInput.value.trim();
    if (!text) return;
    DB.addMessage('admin', text);
    adminChatInput.value = '';
    renderChat();
  });

  btnQuickReplyHello.addEventListener('click', () => {
    DB.addMessage('admin', 'Курьер готов к передаче! Пожалуйста, зайдите на указанный сервер и напишите ваш статус.');
    renderChat();
  });

  // Rendering
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
        <div style="text-align:center; padding: 48px 20px; color: var(--text-dim);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📦</div>
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
        <div class="order-entry">
          <div class="order-entry-top">
            <span class="order-code">${o.id}</span>
            <span class="status-badge ${statusClass}">${o.status}</span>
          </div>
          <div class="order-time">Время оформления: <strong>${o.date}</strong></div>
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
  }

  function renderChat() {
    const messages = DB.getMessages();

    const html = messages.map(m => `
      <div class="msg-bubble-wrap ${m.from === 'user' ? 'client' : 'support'}">
        <div class="msg-text">${escapeHtml(m.text)}</div>
        <div class="msg-meta">${m.from === 'admin' ? 'Администратор' : 'Вы'} • ${m.time}</div>
      </div>
    `).join('');

    customerChatMessages.innerHTML = html;
    customerChatMessages.scrollTop = customerChatMessages.scrollHeight;

    adminChatMessages.innerHTML = html;
    adminChatMessages.scrollTop = adminChatMessages.scrollHeight;

    const lastMsg = messages[messages.length - 1];
    adminDialogsList.innerHTML = `
      <div class="dialog-item active">
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
          <strong style="font-size:0.85rem;">Игрок #1</strong>
          <small style="color:var(--text-dim);">${lastMsg ? lastMsg.time : ''}</small>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
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

    if (orders.length === 0) {
      adminOrdersTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-dim);">Заказов пока нет</td></tr>`;
    } else {
      adminOrdersTbody.innerHTML = orders.map(o => `
        <tr>
          <td><strong style="color:var(--gold-accent);">${o.id}</strong></td>
          <td style="white-space:nowrap; font-size:0.8rem; color:var(--text-muted);">${o.date}</td>
          <td>
            <strong>${escapeHtml(o.gameNick)}</strong><br>
            <small style="color:var(--text-dim);">${escapeHtml(o.contact)}</small>
          </td>
          <td>
            ${o.server}<br>
            <small style="color:var(--text-muted);">${o.deliveryType}</small>
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

      document.querySelectorAll('.status-select-clean').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const orderId = e.target.dataset.orderId;
          const newStatus = e.target.value;
          DB.updateOrderStatus(orderId, newStatus);
          DB.addMessage('admin', `Статус вашего заказа ${orderId} изменен на: «${newStatus}».`);
          renderAll();
        });
      });
    }

    adminUsersTbody.innerHTML = users.map(u => `
      <tr>
        <td><code>${u.id}</code></td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.contact)}</td>
        <td><strong style="color:var(--gold-accent); font-size:1.05rem;">${formatNumber(u.balance)} ₽</strong></td>
        <td>
          <div class="balance-actions-clean">
            <input type="number" id="balance-input-${u.id}" value="${u.balance}" min="0" step="100">
            <button class="btn-sm-action" data-set-user="${u.id}">Задать</button>
            <button class="btn-sm-action" data-add-user="${u.id}" data-amount="500">+500 ₽</button>
            <button class="btn-sm-action" data-add-user="${u.id}" data-amount="1000">+1 000 ₽</button>
          </div>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', () => {
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

  window.addEventListener('storage', () => renderAll());

  // Init
  updateCalculator(1000000);
  renderAll();
});
