const seedGuests = [
  {
    id: "jordan",
    initials: "JM",
    name: "Jordan M.",
    searchKeys: ["jordan.m@example.com", "2055550146", "+12055550146"],
    masked: "jordan.m***@example.com · (***) ***-0146",
    score: 82,
    stays: 4,
    wouldHost: 3,
    ratings: { communication: 4.8, cleanliness: 4.6, rules: 4.0 },
    reviews: [
      { id: 1, date: "Mar 2026", property: "3-bedroom home", text: "Great communication and left the home clean.", hostAgain: true, flags: [] },
      { id: 2, date: "Jan 2026", property: "2-bedroom townhome", text: "One unregistered overnight guest; otherwise respectful.", hostAgain: false, flags: ["Extra guests"] }
    ]
  },
  {
    id: "maya",
    initials: "MR",
    name: "Maya R.",
    searchKeys: ["maya.r@example.com", "4075550188", "+14075550188"],
    masked: "maya.r***@example.com · (***) ***-0188",
    score: 96,
    stays: 7,
    wouldHost: 7,
    ratings: { communication: 5.0, cleanliness: 4.9, rules: 5.0 },
    reviews: [
      { id: 3, date: "Jul 2026", property: "4-bedroom villa", text: "Clear communicator, followed checkout instructions, and treated the home with care.", hostAgain: true, flags: [] },
      { id: 4, date: "Nov 2025", property: "Pool home", text: "A model guest. We would gladly host Maya again.", hostAgain: true, flags: [] }
    ]
  },
  {
    id: "devon",
    initials: "DK",
    name: "Devon K.",
    searchKeys: ["devon.k@example.com", "6155550112", "+16155550112"],
    masked: "devon.k***@example.com · (***) ***-0112",
    score: 58,
    stays: 3,
    wouldHost: 1,
    ratings: { communication: 3.2, cleanliness: 2.8, rules: 2.4 },
    reviews: [
      { id: 5, date: "Aug 2026", property: "Downtown loft", text: "Noise complaint after quiet hours and checkout was two hours late.", hostAgain: false, flags: ["Noise", "Late checkout"] },
      { id: 6, date: "Apr 2026", property: "2-bedroom condo", text: "Communication was slow; additional cleaning was required after checkout.", hostAgain: false, flags: ["Extra cleaning"] }
    ]
  }
];

const state = {
  route: "dashboard",
  guests: structuredClone(seedGuests),
  lastSearch: "",
  currentGuest: null,
  reviewFilter: "all",
  reviewDraft: null,
  reviewStep: 1
};

const view = document.querySelector("#view");
const modalRoot = document.querySelector("#modal-root");
const toastRoot = document.querySelector("#toast-root");

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s().-]/g, "");

function setRoute(route, options = {}) {
  state.route = route;
  document.querySelectorAll("[data-route]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  render();
  if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function pageHead(eyebrow, title, copy, action = "") {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p>${copy}</p>
      </div>
      ${action}
    </header>`;
}

function renderDashboard() {
  const totalReviews = state.guests.reduce((sum, guest) => sum + guest.reviews.length, 0);
  return `
    ${pageHead("Verified host workspace", "Good morning, Adam.", "Here’s what’s happening across your guest network.", `<button class="button" data-action="start-review">＋ Review a guest</button>`)}
    <section class="grid grid-4" aria-label="Dashboard metrics">
      ${metric("⌕", "Guest searches", "18", "+12% this month")}
      ${metric("▤", "Reviews submitted", String(totalReviews), "2 this month")}
      ${metric("✓", "Would host again", "78%", "Across your reviews")}
      ${metric("◌", "Open alerts", "2", "1 needs a response")}
    </section>
    <section class="grid grid-3" style="margin-top:20px">
      <div class="card quick-search span-2">
        <p class="eyebrow">Private guest search</p>
        <h2>Know before you accept the next booking.</h2>
        <p>Search verified stay history using an exact email address or phone number.</p>
        <form class="search-bar" data-form="quick-search">
          <input aria-label="Guest email or phone" name="query" placeholder="Try jordan.m@example.com" autocomplete="off">
          <button class="button" type="submit">Search guest</button>
        </form>
        <div class="search-help">🔒 Exact matches only. Search activity is logged for trust and safety.</div>
      </div>
      <div class="card activity-card">
        <div class="activity-head"><h2 class="card-title">Recent activity</h2><button class="link-button" data-route="alerts">View all</button></div>
        <div class="activity-list">
          ${activity("✓", "Review published", "Maya R. · Villa stay", "2h")}
          ${activity("⌕", "Guest profile viewed", "Jordan M. · Exact match", "1d")}
          ${activity("!", "Dispute received", "Devon K. · Response due", "2d")}
        </div>
      </div>
    </section>
    <section class="grid grid-2" style="margin-top:20px">
      <div class="card card-pad">
        <div class="section-head"><h2 class="card-title">How the network stays trustworthy</h2><span class="status-pill status-good">Verified</span></div>
        <p class="card-copy">Hosts are identity-checked. Reviews must connect to a completed stay. Serious claims may be asked for supporting documentation.</p>
        <button class="link-button" style="margin-top:16px" data-action="show-trust">See trust & safety flow →</button>
      </div>
      <div class="card card-pad">
        <div class="section-head"><h2 class="card-title">Feedback prompt</h2><span class="status-pill">Demo tip</span></div>
        <p class="card-copy">Ask viewers: “Would this change how you evaluate a guest—and what would you need to trust the result?”</p>
      </div>
    </section>`;
}

function metric(icon, label, value, caption) {
  return `<article class="card metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-caption">${caption}</div></article>`;
}

function activity(icon, title, copy, time) {
  return `<div class="activity-row"><span class="activity-dot">${icon}</span><span><strong>${title}</strong><small>${copy}</small></span><small>${time}</small></div>`;
}

function renderSearch() {
  const result = state.currentGuest ? renderProfile(state.currentGuest) : state.lastSearch ? renderNoMatch(state.lastSearch) : `
    <div class="card empty-card">
      <div class="empty-icon">⌕</div>
      <h2 class="card-title">Search the verified guest network</h2>
      <p class="card-copy">Only an exact email or phone match returns a profile. Partial-name browsing is intentionally disabled.</p>
    </div>`;

  return `<div class="search-page">
    ${pageHead("Private network", "Search guests", "See stay-backed reviews submitted by verified hosts.", `<button class="button button-secondary" data-action="start-review">＋ Add a review</button>`)}
    <section class="card search-panel">
      <form data-form="guest-search">
        <div class="input-wrap"><span class="input-prefix">⌕</span><input class="input" name="query" aria-label="Email address or phone number" placeholder="Email address or phone number" value="${escapeHtml(state.lastSearch)}" autocomplete="off"></div>
        <button class="button" type="submit">Search guest</button>
      </form>
      <p class="fine-print">🔒 Exact matches only. Guest contact details remain masked.</p>
      <div class="demo-values"><span>Demo searches:</span>${state.guests.map(g => `<button class="demo-value" data-demo-search="${g.searchKeys[0]}">${g.searchKeys[0]}</button>`).join("")}</div>
    </section>
    <div id="search-result">${result}</div>
  </div>`;
}

function findGuest(query) {
  const candidate = normalize(query);
  return state.guests.find(guest => guest.searchKeys.some(key => normalize(key) === candidate)) || null;
}

function renderProfile(guest) {
  const scoreLabel = guest.score >= 85 ? "Strong history" : guest.score >= 70 ? "Generally positive" : "Review details";
  return `<article class="card profile-card">
    <div class="profile-top">
      <div class="profile-identity">
        <span class="avatar avatar-large">${guest.initials}</span>
        <div><h2>${guest.name}</h2><div class="identity-meta"><span class="status-pill status-good">✓ Identity matched</span><span class="status-pill">▰ ${guest.stays} verified stays</span></div><div class="identity-detail">${guest.masked}</div></div>
      </div>
      <div class="score-wrap">
        <div class="score-ring" style="--score:${guest.score}"><strong>${guest.score}</strong></div>
        <div class="score-copy"><strong>Guest score · ${scoreLabel}</strong><small>${guest.wouldHost} of ${guest.stays} hosts would host again</small><button class="link-button" style="margin-top:7px" data-action="show-scoring">How scoring works</button></div>
      </div>
    </div>
    <div class="ratings-grid">
      ${ratingBox("Communication", guest.ratings.communication)}
      ${ratingBox("Cleanliness", guest.ratings.cleanliness)}
      ${ratingBox("House rules", guest.ratings.rules)}
    </div>
    <div class="profile-section">
      <div class="section-head"><h3 class="card-title">Verified host reviews</h3><span class="status-pill">${guest.reviews.length} shown</span></div>
      <div class="review-list">${guest.reviews.map(review => renderReviewRow(review)).join("")}</div>
    </div>
    <div class="profile-actions"><button class="button" data-action="review-guest" data-guest="${guest.id}">Review this guest</button><small>Reports are private and visible only to verified hosts.</small></div>
  </article>`;
}

function ratingBox(label, value) {
  return `<div class="rating-box"><span>${label}</span><strong>${Number(value).toFixed(1)}</strong></div>`;
}

function renderReviewRow(review) {
  return `<div class="review-row">
    <span class="activity-dot">⌂</span>
    <div><p>${escapeHtml(review.text)}</p><small>Stayed ${review.date} · ${review.property} · Stay verified</small></div>
    <div class="review-badges">${review.flags.map(flag => `<span class="status-pill status-warn">⚑ ${escapeHtml(flag)}</span>`).join("")}<span class="status-pill ${review.hostAgain ? "status-good" : "status-danger"}">${review.hostAgain ? "✓ Would host again" : "× Would not host again"}</span></div>
  </div>`;
}

function renderNoMatch(query) {
  return `<div class="card no-match"><div class="empty-icon">?</div><div><h3>No exact match found</h3><p>We found no verified profile for “${escapeHtml(query)}.” You can still add a stay-backed review and create the first record.</p></div><button class="button" data-action="start-review" data-prefill="${escapeHtml(query)}">Add first review</button></div>`;
}

function renderReviews() {
  const reviews = state.guests.flatMap(guest => guest.reviews.map(review => ({ ...review, guest })));
  const filtered = state.reviewFilter === "all" ? reviews : reviews.filter(review => state.reviewFilter === "positive" ? review.hostAgain : !review.hostAgain);
  return `
    ${pageHead("Your contributions", "My reviews", "Manage the stay-backed reviews you’ve shared with the network.", `<button class="button" data-action="start-review">＋ New review</button>`)}
    <section class="card table-card">
      <div class="table-toolbar"><strong>${filtered.length} reviews</strong><div class="filter-group">${["all", "positive", "flags"].map(key => `<button class="filter-button ${state.reviewFilter === key ? "is-active" : ""}" data-filter="${key}">${key === "all" ? "All" : key === "positive" ? "Would host again" : "Has concerns"}</button>`).join("")}</div></div>
      <table class="data-table">
        <thead><tr><th>Guest</th><th>Stay</th><th>Recommendation</th><th>Status</th><th></th></tr></thead>
        <tbody>${filtered.map(({ guest, ...review }) => `<tr><td class="guest-cell"><span class="mini-avatar">${guest.initials}</span><span><strong>${guest.name}</strong><small>${guest.masked.split(" · ")[0]}</small></span></td><td data-label="Stay">${review.date} · ${review.property}</td><td data-label="Recommendation"><span class="status-pill ${review.hostAgain ? "status-good" : "status-danger"}">${review.hostAgain ? "Would host again" : "Would not host again"}</span></td><td data-label="Status"><span class="status-pill">✓ Published</span></td><td><button class="link-button" data-view-guest="${guest.id}">View</button></td></tr>`).join("")}</tbody>
      </table>
    </section>`;
}

function renderAlerts() {
  return `
    ${pageHead("Trust & safety", "Alerts", "Keep reviews current and respond when a guest requests a correction.")}
    <section class="alert-list">
      <article class="card alert-card"><span class="alert-icon">!</span><div><h3>Guest requested a correction</h3><p>Devon K. says the reported checkout time is inaccurate. Review the stay record and respond within 5 days.</p></div><time>2 days ago</time><div></div><div><button class="button button-small" data-action="open-dispute">Review dispute</button></div></article>
      <article class="card alert-card"><span class="alert-icon" style="background:var(--teal-soft);color:var(--teal-dark)">✓</span><div><h3>Stay verification completed</h3><p>Your review of Maya R. is now marked as tied to a verified reservation.</p></div><time>Yesterday</time></article>
      <article class="card alert-card"><span class="alert-icon" style="background:var(--navy-soft);color:var(--ink-2)">i</span><div><h3>Quarterly accuracy check</h3><p>Confirm that your older reviews still reflect the facts you observed during each stay.</p></div><time>Aug 30</time></article>
    </section>`;
}

function renderSettings() {
  return `
    ${pageHead("Account", "Settings", "Manage privacy, alerts, and your verified host profile.")}
    <section class="settings-grid">
      <div class="card card-pad"><h2 class="card-title">Notifications</h2>${setting("Dispute alerts", "Notify me immediately when a guest challenges a review.", true)}${setting("Guest match alerts", "Tell me when a guest I reviewed receives new verified feedback.", true)}${setting("Monthly network digest", "Trust trends and product updates.", false)}</div>
      <div class="card card-pad"><h2 class="card-title">Host verification</h2><div class="verify-box"><span class="trust-icon">✓</span><div><strong>Identity verified</strong><small>Aldrich Stays · 1 property connected</small></div></div><p class="card-copy">Search access and review submissions are logged. Guest data may only be used to evaluate a legitimate stay request.</p><button class="button button-secondary button-wide" style="margin-top:18px" data-action="show-trust">View network rules</button></div>
    </section>`;
}

function setting(title, copy, on) {
  return `<div class="setting-row"><span><strong>${title}</strong><small>${copy}</small></span><button class="toggle ${on ? "is-on" : ""}" role="switch" aria-checked="${on}"></button></div>`;
}

function render() {
  const renderers = { dashboard: renderDashboard, search: renderSearch, reviews: renderReviews, alerts: renderAlerts, settings: renderSettings };
  view.innerHTML = (renderers[state.route] || renderDashboard)();
}

function openReview(guestId = null, prefill = "") {
  const guest = state.guests.find(item => item.id === guestId) || null;
  state.reviewStep = guest ? 2 : 1;
  state.reviewDraft = {
    guestId: guest?.id || "",
    contact: prefill || guest?.searchKeys[0] || "",
    source: "Airbnb",
    reservation: "",
    checkout: "2026-09-12",
    hostAgain: null,
    ratings: { communication: 5, cleanliness: 5, rules: 5 },
    flags: [],
    notes: "",
    confirmed: false
  };
  renderReviewModal();
}

function renderReviewModal() {
  const draft = state.reviewDraft;
  const guest = state.guests.find(item => item.id === draft.guestId);
  modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
    <header class="modal-head"><div><p class="eyebrow">Private host review</p><h2 id="review-title">${state.reviewStep === 1 ? "Verify the stay" : state.reviewStep === 2 ? `Rate ${guest?.name || "this guest"}` : "Review and submit"}</h2></div><button class="close-button" data-action="close-modal" aria-label="Close">×</button></header>
    <div class="modal-body"><div class="stepper"><span class="step ${state.reviewStep >= 1 ? state.reviewStep > 1 ? "is-done" : "is-active" : ""}">1 · Stay</span><span class="step ${state.reviewStep >= 2 ? state.reviewStep > 2 ? "is-done" : "is-active" : ""}">2 · Rating</span><span class="step ${state.reviewStep === 3 ? "is-active" : ""}">3 · Submit</span></div>${state.reviewStep === 1 ? reviewStepOne() : state.reviewStep === 2 ? reviewStepTwo(guest) : reviewStepThree(guest)}</div>
    <footer class="modal-foot"><button class="button button-secondary" data-action="review-back">${state.reviewStep === 1 ? "Cancel" : "Back"}</button><button class="button" data-action="review-next">${state.reviewStep === 3 ? "Submit private review" : "Continue"}</button></footer>
  </section></div>`;
}

function reviewStepOne() {
  const d = state.reviewDraft;
  return `<div class="form-grid">
    <label class="field-full"><span class="field-label">Guest email or phone</span><input class="input" data-draft="contact" value="${escapeHtml(d.contact)}" placeholder="jordan.m@example.com"></label>
    <label><span class="field-label">Booking source</span><select class="select" data-draft="source"><option>Airbnb</option><option>Vrbo</option><option>Direct booking</option><option>Booking.com</option></select></label>
    <label><span class="field-label">Checkout date</span><input class="input" type="date" data-draft="checkout" value="${d.checkout}"></label>
    <label class="field-full"><span class="field-label">Reservation code</span><input class="input" data-draft="reservation" value="${escapeHtml(d.reservation)}" placeholder="Prototype accepts any code"></label>
  </div><div class="verify-box"><span class="trust-icon">✓</span><div><strong>Prototype verification</strong><small>In production, a PMS connection or booking confirmation would verify the completed stay without exposing it to other hosts.</small></div></div>`;
}

function reviewStepTwo(guest) {
  const d = state.reviewDraft;
  const incidents = ["Extra guests", "Smoking", "Noise", "Party", "Damage", "Late checkout", "Extra cleaning"];
  return `<div class="guest-choice is-selected"><span class="mini-avatar">${guest?.initials || "?"}</span><span><strong>${guest?.name || "New guest"}</strong><small>${guest?.masked || escapeHtml(d.contact)}</small></span><span class="status-pill status-good">✓ Stay verified</span></div>
    <div style="margin-top:20px"><span class="field-label">Would you host this guest again?</span><div class="host-again"><button class="choice-button ${d.hostAgain === true ? "is-selected" : ""}" data-host-again="true">Yes</button><button class="choice-button ${d.hostAgain === false ? "is-selected" : ""}" data-host-again="false">No</button></div></div>
    ${["communication", "cleanliness", "rules"].map(key => `<div class="rating-question"><strong>${key === "rules" ? "House rules" : key[0].toUpperCase() + key.slice(1)}</strong><div class="stars" data-rating="${key}">${[1,2,3,4,5].map(value => `<button class="star ${d.ratings[key] >= value ? "is-on" : ""}" data-star="${value}" aria-label="${value} stars">★</button>`).join("")}</div></div>`).join("")}
    <div style="margin-top:19px"><span class="field-label">Anything other hosts should know?</span><div class="incident-options">${incidents.map(flag => `<button class="incident ${d.flags.includes(flag) ? "is-selected" : ""}" data-incident="${flag}">${flag}</button>`).join("")}</div></div>`;
}

function reviewStepThree(guest) {
  const d = state.reviewDraft;
  return `<div class="review-summary"><div class="summary-row"><span>Guest</span><strong>${guest?.name || "New matched guest"}</strong></div><div class="summary-row"><span>Would host again</span><strong>${d.hostAgain === true ? "Yes" : "No"}</strong></div><div class="summary-row"><span>Ratings</span><strong>${d.ratings.communication} / ${d.ratings.cleanliness} / ${d.ratings.rules}</strong></div><div class="summary-row"><span>Stay concerns</span><strong>${d.flags.length ? d.flags.join(", ") : "None"}</strong></div></div>
    <label style="display:block;margin-top:18px"><span class="field-label">Additional notes <span style="font-weight:400;color:var(--muted)">(optional)</span></span><textarea class="textarea" data-draft="notes" maxlength="500" placeholder="Describe only what happened during this stay.">${escapeHtml(d.notes)}</textarea></label>
    <button class="button button-secondary button-wide" style="margin-top:12px" data-action="fake-upload">⌕ Add photos or documents (optional)</button>
    <label class="checkbox-row"><input type="checkbox" data-draft="confirmed" ${d.confirmed ? "checked" : ""}><span>I confirm this review is based on a completed stay and accurately reflects my direct experience.</span></label>
    <p class="fine-print">Guests can request a copy, correction, or dispute. Your identity is hidden from other hosts, but remains verified by RateAGuest.</p>`;
}

function modalInfo(title, body, actionLabel = "Got it") {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true"><header class="modal-head"><h2>${title}</h2><button class="close-button" data-action="close-modal">×</button></header><div class="modal-body">${body}</div><footer class="modal-foot" style="justify-content:flex-end"><button class="button" data-action="close-modal">${actionLabel}</button></footer></section></div>`;
}

function showToast(title, copy) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✓</span><div><strong>${title}</strong><small>${copy}</small></div>`;
  toastRoot.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function collectDraftValue(target) {
  const key = target.dataset.draft;
  if (!key) return;
  state.reviewDraft[key] = target.type === "checkbox" ? target.checked : target.value;
}

function validateReviewStep() {
  const d = state.reviewDraft;
  if (state.reviewStep === 1) {
    if (!d.contact.trim()) return "Enter the guest’s email or phone number.";
    let guest = findGuest(d.contact);
    if (!guest) {
      const initials = d.contact.slice(0, 2).toUpperCase().replace(/\W/g, "NG") || "NG";
      guest = { id: `guest-${Date.now()}`, initials, name: "New guest", searchKeys: [d.contact], masked: d.contact.replace(/(^.{2}).+(@.*$)/, "$1***$2"), score: 75, stays: 1, wouldHost: 0, ratings: { communication: 0, cleanliness: 0, rules: 0 }, reviews: [] };
      state.guests.unshift(guest);
    }
    d.guestId = guest.id;
    return null;
  }
  if (state.reviewStep === 2 && d.hostAgain === null) return "Choose whether you would host this guest again.";
  if (state.reviewStep === 3 && !d.confirmed) return "Confirm that this review is based on a completed stay.";
  return null;
}

function submitReview() {
  const d = state.reviewDraft;
  const guest = state.guests.find(item => item.id === d.guestId);
  const review = { id: Date.now(), date: "Sep 2026", property: d.source === "Direct booking" ? "Direct-booked home" : `${d.source} stay`, text: d.notes.trim() || (d.hostAgain ? "Respectful guest and a smooth stay." : "Host would not accept another stay."), hostAgain: d.hostAgain, flags: [...d.flags] };
  guest.reviews.unshift(review);
  guest.stays += 1;
  if (d.hostAgain) guest.wouldHost += 1;
  const n = guest.stays;
  guest.ratings.communication = Number((((guest.ratings.communication * (n - 1)) + d.ratings.communication) / n).toFixed(1));
  guest.ratings.cleanliness = Number((((guest.ratings.cleanliness * (n - 1)) + d.ratings.cleanliness) / n).toFixed(1));
  guest.ratings.rules = Number((((guest.ratings.rules * (n - 1)) + d.ratings.rules) / n).toFixed(1));
  guest.score = Math.max(35, Math.min(99, Math.round(((guest.ratings.communication + guest.ratings.cleanliness + guest.ratings.rules) / 15) * 70 + (guest.wouldHost / guest.stays) * 30)));
  state.currentGuest = guest;
  state.lastSearch = guest.searchKeys[0];
  state.reviewDraft = null;
  modalRoot.innerHTML = "";
  setRoute("search");
  showToast("Private review published", `The demo profile for ${guest.name} was updated.`);
}

document.addEventListener("click", event => {
  if (event.target.matches("[data-backdrop]")) {
    modalRoot.innerHTML = "";
    state.reviewDraft = null;
    return;
  }

  const routeButton = event.target.closest("[data-route]");
  if (routeButton) return setRoute(routeButton.dataset.route);

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "start-review") return openReview(null, actionButton.dataset.prefill || "");
    if (action === "review-guest") return openReview(actionButton.dataset.guest);
    if (action === "close-modal") { modalRoot.innerHTML = ""; state.reviewDraft = null; return; }
    if (action === "review-back") {
      if (state.reviewStep === 1) { modalRoot.innerHTML = ""; state.reviewDraft = null; return; }
      state.reviewStep -= 1; return renderReviewModal();
    }
    if (action === "review-next") {
      const error = validateReviewStep();
      if (error) return showToast("One more thing", error);
      if (state.reviewStep === 3) return submitReview();
      state.reviewStep += 1; return renderReviewModal();
    }
    if (action === "show-scoring") return modalInfo("How the guest score works", `<p class="card-copy">The prototype score combines completed-stay ratings, host-again recommendations, recency, and confidence from the number of verified stays.</p><div class="verify-box"><span class="trust-icon">i</span><div><strong>It is a decision aid, not an automatic ban.</strong><small>Hosts see the underlying reviews and make their own booking decision.</small></div></div>`);
    if (action === "show-trust") return modalInfo("Trust & safety by design", `<div class="review-summary"><div class="summary-row"><span>Who can search</span><strong>Verified hosts</strong></div><div class="summary-row"><span>What can be reviewed</span><strong>Completed stays</strong></div><div class="summary-row"><span>Who can dispute</span><strong>Any reviewed guest</strong></div><div class="summary-row"><span>Public profiles</span><strong>Never</strong></div></div><p class="card-copy">Every search is logged. Reviews focus on stay-related conduct, and high-severity claims can be paused until documentation is supplied.</p>`);
    if (action === "fake-upload") return showToast("Prototype attachment added", "A real product would encrypt the evidence and restrict access to trust & safety staff.");
    if (action === "open-dispute") return modalInfo("Guest correction request", `<div class="review-summary"><div class="summary-row"><span>Guest</span><strong>Devon K.</strong></div><div class="summary-row"><span>Disputed detail</span><strong>Checkout time</strong></div><div class="summary-row"><span>Guest statement</span><strong>“The host approved a 12 p.m. checkout.”</strong></div></div><label style="display:block;margin-top:18px"><span class="field-label">Your response</span><textarea class="textarea" placeholder="Reference the reservation messages or update the review."></textarea></label>`, "Save response");
  }

  const demoSearch = event.target.closest("[data-demo-search]");
  if (demoSearch) {
    state.lastSearch = demoSearch.dataset.demoSearch;
    state.currentGuest = findGuest(state.lastSearch);
    render();
    document.querySelector("#search-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const viewGuest = event.target.closest("[data-view-guest]");
  if (viewGuest) {
    state.currentGuest = state.guests.find(guest => guest.id === viewGuest.dataset.viewGuest);
    state.lastSearch = state.currentGuest.searchKeys[0];
    return setRoute("search");
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) { state.reviewFilter = filter.dataset.filter; return render(); }

  const hostAgain = event.target.closest("[data-host-again]");
  if (hostAgain) { state.reviewDraft.hostAgain = hostAgain.dataset.hostAgain === "true"; return renderReviewModal(); }

  const star = event.target.closest("[data-star]");
  if (star) { state.reviewDraft.ratings[star.closest("[data-rating]").dataset.rating] = Number(star.dataset.star); return renderReviewModal(); }

  const incident = event.target.closest("[data-incident]");
  if (incident) {
    const flag = incident.dataset.incident;
    state.reviewDraft.flags = state.reviewDraft.flags.includes(flag) ? state.reviewDraft.flags.filter(item => item !== flag) : [...state.reviewDraft.flags, flag];
    return renderReviewModal();
  }

  const toggle = event.target.closest(".toggle");
  if (toggle) { toggle.classList.toggle("is-on"); toggle.setAttribute("aria-checked", toggle.classList.contains("is-on")); }
});

document.addEventListener("input", event => { if (event.target.matches("[data-draft]")) collectDraftValue(event.target); });
document.addEventListener("change", event => { if (event.target.matches("[data-draft]")) collectDraftValue(event.target); });

document.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target;
  if (!form.matches("[data-form]")) return;
  const query = new FormData(form).get("query") || "";
  state.lastSearch = String(query).trim();
  state.currentGuest = findGuest(query);
  setRoute("search");
});

document.querySelector("#reset-demo").addEventListener("click", () => {
  state.guests = structuredClone(seedGuests);
  state.lastSearch = "";
  state.currentGuest = null;
  state.reviewFilter = "all";
  modalRoot.innerHTML = "";
  setRoute("dashboard");
  showToast("Demo reset", "All sample data is back to its original state.");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modalRoot.innerHTML) {
    modalRoot.innerHTML = "";
    state.reviewDraft = null;
  }
});

render();
