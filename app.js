const seedGuests = [
  {
    id: "jordan", platformId: "900000000000010001",
    profileUrl: "https://www.airbnb.com/users/profile/900000000000010001",
    initials: "JM", name: "Jordan M.", joined: "2019", location: "Birmingham, Alabama",
    stays: 4, wouldHost: 3,
    ratings: { communication: 4.8, cleanliness: 4.6, rules: 4.0 },
    reviews: [
      { id: 1, date: "Mar 2026", property: "3-bedroom home", text: "Great communication and left the home clean.", hostAgain: true, flags: [] },
      { id: 2, date: "Jan 2026", property: "2-bedroom townhome", text: "One unregistered overnight guest; otherwise respectful.", hostAgain: false, flags: ["Extra guests"] }
    ]
  },
  {
    id: "maya", platformId: "900000000000010002",
    profileUrl: "https://www.airbnb.com/users/profile/900000000000010002",
    initials: "MR", name: "Maya R.", joined: "2016", location: "Orlando, Florida",
    stays: 7, wouldHost: 7,
    ratings: { communication: 5.0, cleanliness: 4.9, rules: 5.0 },
    reviews: [
      { id: 3, date: "Jul 2026", property: "4-bedroom villa", text: "Clear communicator, followed checkout instructions, and treated the home with care.", hostAgain: true, flags: [] },
      { id: 4, date: "Nov 2025", property: "Pool home", text: "A smooth stay. Checkout instructions were completed and the home was left in excellent condition.", hostAgain: true, flags: [] }
    ]
  },
  {
    id: "devon", platformId: "900000000000010003",
    profileUrl: "https://www.airbnb.com/users/profile/900000000000010003",
    initials: "DK", name: "Devon K.", joined: "2021", location: "Nashville, Tennessee",
    stays: 3, wouldHost: 1,
    ratings: { communication: 3.2, cleanliness: 2.8, rules: 2.4 },
    reviews: [
      { id: 5, date: "Aug 2026", property: "Downtown loft", text: "A noise complaint was received after quiet hours and checkout was two hours late.", hostAgain: false, flags: ["Noise", "Late checkout"] },
      { id: 6, date: "Apr 2026", property: "2-bedroom condo", text: "Communication was slow; additional cleaning was required after checkout.", hostAgain: false, flags: ["Extra cleaning"] }
    ]
  }
];

const state = {
  route: "dashboard", guests: structuredClone(seedGuests), lastLookup: "", lookupStatus: "idle",
  currentGuest: null, reviewFilter: "all", reviewDraft: null, reviewStep: 1
};

const view = document.querySelector("#view");
const modalRoot = document.querySelector("#modal-root");
const toastRoot = document.querySelector("#toast-root");
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const maskPlatformId = id => `${String(id).slice(0, 4)}…${String(id).slice(-4)}`;

function parseAirbnbProfile(value) {
  const raw = String(value || "").trim();
  if (/^\d{6,24}$/.test(raw)) return { platformId: raw, profileUrl: `https://www.airbnb.com/users/profile/${raw}` };
  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(candidate);
    if (!/(^|\.)airbnb\.com$/i.test(url.hostname)) return null;
    const match = url.pathname.match(/^\/users\/(?:profile|show)\/(\d{6,24})\/?$/i);
    return match ? { platformId: match[1], profileUrl: `https://www.airbnb.com/users/profile/${match[1]}` } : null;
  } catch { return null; }
}

function findGuest(value) {
  const parsed = parseAirbnbProfile(value);
  return parsed ? state.guests.find(guest => guest.platformId === parsed.platformId) || null : null;
}

function setRoute(route, options = {}) {
  state.route = route;
  document.querySelectorAll("[data-route]").forEach(button => button.classList.toggle("is-active", button.dataset.route === route));
  render();
  if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function pageHead(eyebrow, title, copy, action = "") {
  return `<header class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${copy}</p></div>${action}</header>`;
}

function lookupForm(kind = "main") {
  const example = seedGuests[0].profileUrl;
  return `<form class="profile-lookup ${kind === "hero" ? "profile-lookup-hero" : ""}" data-form="profile-lookup">
    <label class="lookup-field"><span class="field-label">Airbnb guest profile link or ID</span><span class="lookup-input"><span aria-hidden="true">⌕</span><input name="query" aria-label="Airbnb guest profile link or ID" placeholder="Paste Airbnb profile link" value="${escapeHtml(state.lastLookup)}" autocomplete="off"></span></label>
    <button class="button" type="submit">Check guest</button>
  </form><p class="fine-print"><strong>Private:</strong> Exact account IDs only. No name search, public profiles, or fuzzy matching.</p>
  <button class="demo-value" data-demo-search="${example}">Use fictional sample link</button>`;
}

function renderDashboard() {
  return `${pageHead("Private host network", "Check an Airbnb guest", "Paste the guest’s Airbnb profile link to see reviews tied to that exact account.")}
    <section class="card lookup-hero"><div class="lookup-hero-copy"><span class="platform-pill">A</span><div><h2>One link. One exact account.</h2><p>Copy the profile link from the guest’s Airbnb page and paste it here.</p></div></div>${lookupForm("hero")}</section>
    <section class="simple-steps" aria-label="How RateAGuest works">${simpleStep("1", "Copy the profile", "Open the guest from the booking request and copy their Airbnb profile link.")}${simpleStep("2", "Check exact history", "RateAGuest matches only the numeric Airbnb account ID—not a similar name.")}${simpleStep("3", "Decide for yourself", "Read stay-backed reports from verified hosts, then accept or decline in Airbnb.")}</section>
    <section class="card privacy-strip"><span class="trust-icon">✓</span><div><strong>Private by design</strong><p>Only verified hosts can check an account. Every lookup is logged. Reports require a completed stay.</p></div><button class="link-button" data-action="show-trust">See safeguards →</button></section>`;
}

function simpleStep(number, title, copy) {
  return `<article class="card simple-step"><span>${number}</span><h3>${title}</h3><p>${copy}</p></article>`;
}

function renderSearch() {
  let result = `<div class="card empty-card"><div class="empty-icon">⌕</div><h2 class="card-title">Paste a guest’s Airbnb profile link</h2><p class="card-copy">We use the numeric profile ID inside the link as the account key.</p></div>`;
  if (state.lookupStatus === "match" && state.currentGuest) result = renderProfile(state.currentGuest);
  if (state.lookupStatus === "no-match") result = renderNoMatch(state.lastLookup);
  if (state.lookupStatus === "invalid") result = renderInvalidLink();
  return `<div class="search-page">${pageHead("Exact account lookup", "Guest history", "Check one Airbnb account at a time.", `<button class="button button-secondary" data-action="start-review">＋ Add a review</button>`)}<section class="card search-panel">${lookupForm()}</section><div id="search-result">${result}</div></div>`;
}

function renderProfile(guest) {
  const percent = Math.round((guest.wouldHost / guest.stays) * 100);
  return `<article class="card profile-card">
    <div class="match-banner"><span>✓</span><div><strong>Exact Airbnb account match</strong><small>Matched by profile ID ${maskPlatformId(guest.platformId)}</small></div></div>
    <div class="profile-top"><div class="profile-identity"><span class="avatar avatar-large">${guest.initials}</span><div><h2>${guest.name}</h2><div class="identity-meta"><span class="status-pill status-good">✓ Account ID matched</span><span class="status-pill">▰ ${guest.stays} completed stays verified</span></div><div class="identity-detail">Airbnb member since ${guest.joined} · ${guest.location}</div></div></div><div class="recommendation"><strong>${guest.wouldHost} of ${guest.stays}</strong><span>hosts would host again</span><small>${percent}% recommendation rate</small></div></div>
    <div class="account-key"><span>Airbnb profile ID</span><code>${guest.platformId}</code><button class="link-button" data-action="copy-profile" data-profile="${guest.profileUrl}">Copy link</button></div>
    <div class="ratings-grid">${ratingBox("Communication", guest.ratings.communication)}${ratingBox("Cleanliness", guest.ratings.cleanliness)}${ratingBox("House rules", guest.ratings.rules)}</div>
    <div class="profile-section"><div class="section-head"><h3 class="card-title">Stay-backed host reports</h3><span class="status-pill">${guest.reviews.length} shown</span></div><p class="provenance-note">Reporter identity and completed stay are verified separately. Reported details are first-hand host statements, not independent findings by RateAGuest.</p><div class="review-list">${guest.reviews.map(renderReviewRow).join("")}</div></div>
    <div class="profile-actions"><button class="button" data-action="review-guest" data-guest="${guest.id}">Add a stay review</button><small>Private to verified hosts. Guests can request access, correction, or appeal.</small></div>
  </article>`;
}

function ratingBox(label, value) { return `<div class="rating-box"><span>${label}</span><strong>${Number(value).toFixed(1)}</strong></div>`; }
function renderReviewRow(review) {
  return `<div class="review-row"><span class="activity-dot">⌂</span><div><p>${escapeHtml(review.text)}</p><small>Verified host · completed stay verified · ${review.date} · ${review.property}</small></div><div class="review-badges">${review.flags.map(flag => `<span class="status-pill status-warn">⚑ Reported: ${escapeHtml(flag)}</span>`).join("")}<span class="status-pill ${review.hostAgain ? "status-good" : "status-danger"}">${review.hostAgain ? "✓ Would host again" : "× Would not host again"}</span></div></div>`;
}

function renderNoMatch(value) {
  const parsed = parseAirbnbProfile(value);
  return `<div class="card no-match"><div class="empty-icon">0</div><div><h3>No host reports yet</h3><p>This is a valid Airbnb profile ID (${maskPlatformId(parsed.platformId)}), but RateAGuest has no completed-stay reviews for it yet. Similar names are never merged.</p></div><button class="button" data-action="start-review" data-prefill="${escapeHtml(parsed.profileUrl)}">Add first review</button></div>`;
}

function renderInvalidLink() {
  return `<div class="card no-match invalid-match"><div class="empty-icon">!</div><div><h3>That doesn’t look like an Airbnb profile link</h3><p>Paste a link containing <code>airbnb.com/users/profile/…</code>, or paste the numeric profile ID by itself.</p></div></div>`;
}

function renderReviews() {
  const reviews = state.guests.flatMap(guest => guest.reviews.map(review => ({ ...review, guest })));
  const filtered = state.reviewFilter === "all" ? reviews : reviews.filter(review => state.reviewFilter === "positive" ? review.hostAgain : !review.hostAgain);
  return `${pageHead("Your contributions", "My reviews", "Manage reports tied to exact Airbnb accounts and completed stays.", `<button class="button" data-action="start-review">＋ New review</button>`)}<section class="card table-card"><div class="table-toolbar"><strong>${filtered.length} reviews</strong><div class="filter-group">${["all", "positive", "flags"].map(key => `<button class="filter-button ${state.reviewFilter === key ? "is-active" : ""}" data-filter="${key}">${key === "all" ? "All" : key === "positive" ? "Would host again" : "Has concerns"}</button>`).join("")}</div></div><table class="data-table"><thead><tr><th>Airbnb account</th><th>Stay</th><th>Recommendation</th><th>Provenance</th><th></th></tr></thead><tbody>${filtered.map(({ guest, ...review }) => `<tr><td class="guest-cell"><span class="mini-avatar">${guest.initials}</span><span><strong>${guest.name}</strong><small>ID ${maskPlatformId(guest.platformId)}</small></span></td><td data-label="Stay">${review.date} · ${review.property}</td><td data-label="Recommendation"><span class="status-pill ${review.hostAgain ? "status-good" : "status-danger"}">${review.hostAgain ? "Would host again" : "Would not host again"}</span></td><td data-label="Provenance"><span class="status-pill">✓ Stay verified</span></td><td><button class="link-button" data-view-guest="${guest.id}">View</button></td></tr>`).join("")}</tbody></table></section>`;
}

function renderAlerts() {
  return `${pageHead("Trust & safety", "Alerts", "Correct the record when new information or a guest dispute arrives.")}<section class="alert-list"><article class="card alert-card"><span class="alert-icon">!</span><div><h3>Guest requested a correction</h3><p>Account ID ${maskPlatformId(seedGuests[2].platformId)} says the reported checkout time is inaccurate. Review the stay record and respond within 5 days.</p></div><time>2 days ago</time><div></div><div><button class="button button-small" data-action="open-dispute">Review dispute</button></div></article><article class="card alert-card"><span class="alert-icon" style="background:var(--teal-soft);color:var(--teal-dark)">✓</span><div><h3>Stay verification completed</h3><p>Your report for Airbnb ID ${maskPlatformId(seedGuests[1].platformId)} is now tied to a completed reservation.</p></div><time>Yesterday</time></article></section>`;
}

function renderSettings() {
  return `${pageHead("Account", "Settings", "Manage privacy, alerts, and your verified host access.")}<section class="settings-grid"><div class="card card-pad"><h2 class="card-title">Notifications</h2>${setting("Dispute alerts", "Notify me when a guest challenges a report.", true)}${setting("Account history alerts", "Tell me when an account I reviewed receives new stay-backed feedback.", true)}${setting("Monthly digest", "Trust trends and product updates.", false)}</div><div class="card card-pad"><h2 class="card-title">Host access</h2><div class="verify-box"><span class="trust-icon">✓</span><div><strong>Reporter identity verified</strong><small>Aldrich Stays · 1 property connected</small></div></div><p class="card-copy">Account lookups and review submissions are logged. Data may only be used to evaluate a legitimate stay request.</p><button class="button button-secondary button-wide" style="margin-top:18px" data-action="show-trust">View network rules</button></div></section>`;
}

function setting(title, copy, on) { return `<div class="setting-row"><span><strong>${title}</strong><small>${copy}</small></span><button class="toggle ${on ? "is-on" : ""}" role="switch" aria-checked="${on}"></button></div>`; }
function render() { const renderers = { dashboard: renderDashboard, search: renderSearch, reviews: renderReviews, alerts: renderAlerts, settings: renderSettings }; view.innerHTML = (renderers[state.route] || renderDashboard)(); }

function openReview(guestId = null, prefill = "") {
  const guest = state.guests.find(item => item.id === guestId) || null;
  state.reviewStep = 1;
  state.reviewDraft = { guestId: guest?.id || "", profile: prefill || guest?.profileUrl || "", reservation: "", checkout: "2026-09-12", hostAgain: null, ratings: { communication: 5, cleanliness: 5, rules: 5 }, flags: [], notes: "", confirmed: false, evidenceAdded: false };
  renderReviewModal();
}

function renderReviewModal() {
  const draft = state.reviewDraft;
  const guest = state.guests.find(item => item.id === draft.guestId);
  const titles = ["Match account & stay", `Rate ${guest?.name || "this account"}`, "Review and submit"];
  modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="review-title"><header class="modal-head"><div><p class="eyebrow">Private host review</p><h2 id="review-title">${titles[state.reviewStep - 1]}</h2></div><button class="close-button" data-action="close-modal" aria-label="Close">×</button></header><div class="modal-body"><div class="stepper"><span class="step ${state.reviewStep >= 1 ? state.reviewStep > 1 ? "is-done" : "is-active" : ""}">1 · Match</span><span class="step ${state.reviewStep >= 2 ? state.reviewStep > 2 ? "is-done" : "is-active" : ""}">2 · Rate</span><span class="step ${state.reviewStep === 3 ? "is-active" : ""}">3 · Submit</span></div>${state.reviewStep === 1 ? reviewStepOne() : state.reviewStep === 2 ? reviewStepTwo(guest) : reviewStepThree(guest)}</div><footer class="modal-foot"><button class="button button-secondary" data-action="review-back">${state.reviewStep === 1 ? "Cancel" : "Back"}</button><button class="button" data-action="review-next">${state.reviewStep === 3 ? "Submit private review" : "Continue"}</button></footer></section></div>`;
}

function reviewStepOne() {
  const d = state.reviewDraft;
  return `<div class="form-grid"><label class="field-full"><span class="field-label">Airbnb guest profile link or ID</span><input class="input" data-draft="profile" value="${escapeHtml(d.profile)}" placeholder="https://www.airbnb.com/users/profile/…"></label><label><span class="field-label">Checkout date</span><input class="input" type="date" data-draft="checkout" value="${d.checkout}"></label><label><span class="field-label">Airbnb reservation code</span><input class="input" data-draft="reservation" value="${escapeHtml(d.reservation)}" placeholder="Example: HM12AB34CD"></label></div><div class="verify-box"><span class="trust-icon">✓</span><div><strong>Two things are checked separately</strong><small>The profile ID matches the account. The reservation code proves a completed stay. Neither makes every statement in a host report independently proven.</small></div></div>`;
}

function reviewStepTwo(guest) {
  const d = state.reviewDraft;
  const incidents = ["Extra guests", "Smoking", "Noise", "Party", "Damage", "Late checkout", "Extra cleaning"];
  return `<div class="guest-choice is-selected"><span class="mini-avatar">${guest?.initials || "AG"}</span><span><strong>${guest?.name || "New Airbnb account"}</strong><small>Profile ID ${guest ? maskPlatformId(guest.platformId) : "matched"}</small></span><span class="status-pill status-good">✓ Stay verified</span></div><div style="margin-top:20px"><span class="field-label">Would you host this guest again?</span><div class="host-again"><button class="choice-button ${d.hostAgain === true ? "is-selected" : ""}" data-host-again="true">Yes</button><button class="choice-button ${d.hostAgain === false ? "is-selected" : ""}" data-host-again="false">No</button></div></div>${["communication", "cleanliness", "rules"].map(key => `<div class="rating-question"><strong>${key === "rules" ? "House rules" : key[0].toUpperCase() + key.slice(1)}</strong><div class="stars" data-rating="${key}">${[1,2,3,4,5].map(value => `<button class="star ${d.ratings[key] >= value ? "is-on" : ""}" data-star="${value}" aria-label="${value} stars">★</button>`).join("")}</div></div>`).join("")}<div style="margin-top:19px"><span class="field-label">What happened during the stay?</span><div class="incident-options">${incidents.map(flag => `<button class="incident ${d.flags.includes(flag) ? "is-selected" : ""}" data-incident="${flag}">${flag}</button>`).join("")}</div></div>`;
}

function reviewStepThree(guest) {
  const d = state.reviewDraft;
  const highSeverity = d.flags.some(flag => ["Smoking", "Party", "Damage"].includes(flag));
  return `<div class="review-summary"><div class="summary-row"><span>Airbnb account</span><strong>${guest?.name || "New account"} · ${guest ? maskPlatformId(guest.platformId) : "matched ID"}</strong></div><div class="summary-row"><span>Completed stay</span><strong>Verified</strong></div><div class="summary-row"><span>Would host again</span><strong>${d.hostAgain === true ? "Yes" : "No"}</strong></div><div class="summary-row"><span>Reported concerns</span><strong>${d.flags.length ? d.flags.join(", ") : "None"}</strong></div></div><label style="display:block;margin-top:18px"><span class="field-label">First-hand notes <span style="font-weight:400;color:var(--muted)">(optional)</span></span><textarea class="textarea" data-draft="notes" maxlength="500" placeholder="Describe only what happened during this stay.">${escapeHtml(d.notes)}</textarea></label>${highSeverity ? `<div class="evidence-callout"><strong>Supporting evidence required</strong><p>High-severity reports are held for review until a message, photo, invoice, or incident record is supplied.</p></div>` : ""}<button class="button button-secondary button-wide ${d.evidenceAdded ? "attachment-added" : ""}" style="margin-top:12px" data-action="fake-upload">${d.evidenceAdded ? "✓ Supporting document added" : `⌕ Add photos or documents ${highSeverity ? "(required)" : "(optional)"}`}</button><label class="checkbox-row"><input type="checkbox" data-draft="confirmed" ${d.confirmed ? "checked" : ""}><span>I confirm this report is based on a completed stay and accurately describes my direct experience.</span></label><p class="fine-print">Guests can request access, correction, or appeal. Your identity is hidden from other hosts, but verified by RateAGuest.</p>`;
}

function modalInfo(title, body, actionLabel = "Got it") { modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true"><header class="modal-head"><h2>${title}</h2><button class="close-button" data-action="close-modal">×</button></header><div class="modal-body">${body}</div><footer class="modal-foot" style="justify-content:flex-end"><button class="button" data-action="close-modal">${actionLabel}</button></footer></section></div>`; }
function showToast(title, copy) { const toast = document.createElement("div"); toast.className = "toast"; toast.innerHTML = `<span>✓</span><div><strong>${title}</strong><small>${copy}</small></div>`; toastRoot.appendChild(toast); setTimeout(() => toast.remove(), 4200); }
function collectDraftValue(target) { const key = target.dataset.draft; if (key) state.reviewDraft[key] = target.type === "checkbox" ? target.checked : target.value; }

function validateReviewStep() {
  const d = state.reviewDraft;
  if (state.reviewStep === 1) {
    const parsed = parseAirbnbProfile(d.profile);
    if (!parsed) return "Paste a valid Airbnb profile link or numeric profile ID.";
    if (!d.reservation.trim()) return "Enter the reservation code to verify the completed stay.";
    let guest = state.guests.find(item => item.platformId === parsed.platformId);
    if (!guest) {
      guest = { id: `guest-${Date.now()}`, platformId: parsed.platformId, profileUrl: parsed.profileUrl, initials: "AG", name: "New Airbnb guest", joined: "Not shared", location: "Profile details not imported", stays: 0, wouldHost: 0, ratings: { communication: 0, cleanliness: 0, rules: 0 }, reviews: [] };
      state.guests.unshift(guest);
    }
    d.guestId = guest.id; d.profile = parsed.profileUrl; return null;
  }
  if (state.reviewStep === 2 && d.hostAgain === null) return "Choose whether you would host this guest again.";
  if (state.reviewStep === 3) {
    const highSeverity = d.flags.some(flag => ["Smoking", "Party", "Damage"].includes(flag));
    if (highSeverity && !d.evidenceAdded) return "Add supporting evidence for this high-severity report.";
    if (!d.confirmed) return "Confirm that this report is based on your completed stay.";
  }
  return null;
}

function submitReview() {
  const d = state.reviewDraft;
  const guest = state.guests.find(item => item.id === d.guestId);
  guest.reviews.unshift({ id: Date.now(), date: "Sep 2026", property: "Airbnb stay", text: d.notes.trim() || (d.hostAgain ? "Respectful guest and a smooth stay." : "Host would not accept another stay."), hostAgain: d.hostAgain, flags: [...d.flags] });
  guest.stays += 1; if (d.hostAgain) guest.wouldHost += 1;
  const n = guest.stays;
  for (const key of ["communication", "cleanliness", "rules"]) guest.ratings[key] = Number((((guest.ratings[key] * (n - 1)) + d.ratings[key]) / n).toFixed(1));
  state.currentGuest = guest; state.lastLookup = guest.profileUrl; state.lookupStatus = "match"; state.reviewDraft = null; modalRoot.innerHTML = ""; setRoute("search");
  showToast("Private review published", `The stay-backed history for ${maskPlatformId(guest.platformId)} was updated.`);
}

function runLookup(value) {
  state.lastLookup = String(value || "").trim();
  const parsed = parseAirbnbProfile(state.lastLookup);
  state.currentGuest = parsed ? state.guests.find(guest => guest.platformId === parsed.platformId) || null : null;
  state.lookupStatus = !parsed ? "invalid" : state.currentGuest ? "match" : "no-match";
  setRoute("search");
}

document.addEventListener("click", event => {
  if (event.target.matches("[data-backdrop]")) { modalRoot.innerHTML = ""; state.reviewDraft = null; return; }
  const routeButton = event.target.closest("[data-route]"); if (routeButton) return setRoute(routeButton.dataset.route);
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "start-review") return openReview(null, actionButton.dataset.prefill || "");
    if (action === "review-guest") return openReview(actionButton.dataset.guest);
    if (action === "close-modal") { modalRoot.innerHTML = ""; state.reviewDraft = null; return; }
    if (action === "review-back") { if (state.reviewStep === 1) { modalRoot.innerHTML = ""; state.reviewDraft = null; return; } state.reviewStep -= 1; return renderReviewModal(); }
    if (action === "review-next") { const error = validateReviewStep(); if (error) return showToast("One more thing", error); if (state.reviewStep === 3) return submitReview(); state.reviewStep += 1; return renderReviewModal(); }
    if (action === "copy-profile") { navigator.clipboard?.writeText(actionButton.dataset.profile); return showToast("Profile link copied", "Paste it into RateAGuest for an exact account lookup."); }
    if (action === "show-trust") return modalInfo("Trust & safety by design", `<div class="review-summary"><div class="summary-row"><span>Who can look up accounts</span><strong>Verified hosts</strong></div><div class="summary-row"><span>Match method</span><strong>Exact platform ID only</strong></div><div class="summary-row"><span>What can be reviewed</span><strong>Completed stays</strong></div><div class="summary-row"><span>Ambiguous identities</span><strong>Never merged</strong></div><div class="summary-row"><span>Public profiles</span><strong>Never</strong></div><div class="summary-row"><span>Guest rights</span><strong>Access, correction, appeal</strong></div></div><p class="card-copy">Reporter verification and stay verification establish provenance. They do not independently prove every reported detail.</p>`);
    if (action === "fake-upload") { state.reviewDraft.evidenceAdded = true; renderReviewModal(); return showToast("Supporting document added", "In production, evidence is encrypted and visible only to trust & safety staff."); }
    if (action === "open-dispute") return modalInfo("Guest correction request", `<div class="review-summary"><div class="summary-row"><span>Airbnb account</span><strong>ID ${maskPlatformId(seedGuests[2].platformId)}</strong></div><div class="summary-row"><span>Disputed detail</span><strong>Checkout time</strong></div><div class="summary-row"><span>Guest statement</span><strong>“The host approved a 12 p.m. checkout.”</strong></div></div><label style="display:block;margin-top:18px"><span class="field-label">Your response</span><textarea class="textarea" placeholder="Reference the reservation messages or update the report."></textarea></label>`, "Save response");
  }
  const demoSearch = event.target.closest("[data-demo-search]"); if (demoSearch) return runLookup(demoSearch.dataset.demoSearch);
  const viewGuest = event.target.closest("[data-view-guest]"); if (viewGuest) return runLookup(state.guests.find(item => item.id === viewGuest.dataset.viewGuest).profileUrl);
  const filter = event.target.closest("[data-filter]"); if (filter) { state.reviewFilter = filter.dataset.filter; return render(); }
  const hostAgain = event.target.closest("[data-host-again]"); if (hostAgain) { state.reviewDraft.hostAgain = hostAgain.dataset.hostAgain === "true"; return renderReviewModal(); }
  const star = event.target.closest("[data-star]"); if (star) { state.reviewDraft.ratings[star.closest("[data-rating]").dataset.rating] = Number(star.dataset.star); return renderReviewModal(); }
  const incident = event.target.closest("[data-incident]"); if (incident) { const flag = incident.dataset.incident; state.reviewDraft.flags = state.reviewDraft.flags.includes(flag) ? state.reviewDraft.flags.filter(item => item !== flag) : [...state.reviewDraft.flags, flag]; return renderReviewModal(); }
  const toggle = event.target.closest(".toggle"); if (toggle) { toggle.classList.toggle("is-on"); toggle.setAttribute("aria-checked", toggle.classList.contains("is-on")); }
});

document.addEventListener("input", event => { if (event.target.matches("[data-draft]")) collectDraftValue(event.target); });
document.addEventListener("change", event => { if (event.target.matches("[data-draft]")) collectDraftValue(event.target); });
document.addEventListener("submit", event => { event.preventDefault(); if (event.target.matches("[data-form='profile-lookup']")) runLookup(new FormData(event.target).get("query")); });
document.querySelector("#reset-demo").addEventListener("click", () => { state.guests = structuredClone(seedGuests); state.lastLookup = ""; state.lookupStatus = "idle"; state.currentGuest = null; state.reviewFilter = "all"; modalRoot.innerHTML = ""; setRoute("dashboard"); showToast("Demo reset", "All fictional sample data is back to its original state."); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && modalRoot.innerHTML) { modalRoot.innerHTML = ""; state.reviewDraft = null; } });
render();
