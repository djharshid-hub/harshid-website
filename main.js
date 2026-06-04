// ============================================================
//  HARSHID — main.js (Supabase Edition)
//  Public site interactivity. Reads saved data from Supabase.
//  Admin panel is at /admin.html — password protected.
// ============================================================

const SUPABASE_URL = 'https://iteskszntcqpmekygwia.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXNrc3pudGNxcG1la3lnd2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjYxNTAsImV4cCI6MjA5NjEwMjE1MH0.qFgamuHtaVocusHD4XW2WKRPEh8nisl0v1bMJnnCzKo';
const HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

// ── HELPERS ──────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

async function dbGet(key) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_config?key=eq.${encodeURIComponent(key)}&select=value&order=id.desc&limit=1`, { headers: HEADERS });
    const d = await r.json();
    if (!d.length) return null;
    return JSON.parse(d[0].value);
  } catch { return null; }
}

async function dbGetEvents() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events?select=*&order=sort_order.asc`, { headers: HEADERS });
    return await r.json();
  } catch { return []; }
}

async function dbGetGallery() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/gallery?select=*&order=sort_order.asc`, { headers: HEADERS });
    return await r.json();
  } catch { return []; }
}

// ── MOBILE NAV ───────────────────────────────────────────────
const navToggle  = $('#navToggle');
const navLinks   = $('#navLinks');
const navOverlay = $('#navOverlay');

function openNav()  {
  if (navLinks)   navLinks.classList.add('open');
  if (navOverlay) navOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (navToggle)  navToggle.textContent = '✕';
}
function closeNav() {
  if (navLinks)   navLinks.classList.remove('open');
  if (navOverlay) navOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if (navToggle)  navToggle.textContent = '☰';
}

// Only bind nav in main.js if index.html hasn't already bound it (index has inline script)
if (navToggle && navLinks && !navToggle.dataset.bound) {
  navToggle.dataset.bound = '1';
  navToggle.addEventListener('click', () => navLinks.classList.contains('open') ? closeNav() : openNav());
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
}
if (navOverlay && !navOverlay.dataset.bound) {
  navOverlay.dataset.bound = '1';
  navOverlay.addEventListener('click', closeNav);
}

// ── ACTIVE NAV ───────────────────────────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
$$('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) a.classList.add('active');
  else a.classList.remove('active');
});

// ── SCROLL ANIMATIONS ────────────────────────────────────────
const scrollObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); e.target.classList.add('in'); }
  });
}, { threshold: 0.08 });
$$('.fade-in, .reveal').forEach(el => scrollObs.observe(el));

// ── GALLERY FILTER ───────────────────────────────────────────
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    $$('.gallery-item').forEach(item => {
      item.style.display = (filter === 'all' || item.getAttribute('data-cat') === filter) ? '' : 'none';
    });
  });
});

// ── GALLERY LIGHTBOX ─────────────────────────────────────────
const lightbox    = $('#lightbox');
const lightboxImg = $('#lightboxImg');
if (lightbox && lightboxImg) {
  document.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (item) {
      const img = item.querySelector('img');
      if (img) { lightboxImg.src = img.src; lightbox.classList.add('open'); }
    }
  });
  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
}

// ── EVENT CARDS EXPAND ───────────────────────────────────────
function bindEventCards() {
  $$('.event-card[data-target]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-target');
      const panel = document.getElementById(id);
      if (!panel) return;
      const isOpen = panel.classList.contains('open');
      $$('.event-expanded').forEach(p => p.classList.remove('open'));
      $$('.event-card').forEach(c => c.classList.remove('expanded-open'));
      if (!isOpen) { panel.classList.add('open'); card.classList.add('expanded-open'); }
    });
  });
}
bindEventCards();

// ── CONTACT FORM ─────────────────────────────────────────────
const contactForm = $('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    const btn = contactForm.querySelector('button[type=submit]');
    if (btn) {
      setTimeout(() => { btn.textContent = 'Message Sent ✓'; btn.style.background = 'linear-gradient(135deg,#00d4ff,#1a6aff)'; }, 100);
      setTimeout(() => { btn.textContent = 'Send Message'; btn.style.background = ''; contactForm.reset(); }, 4000);
    }
  });
}

// ── REVEAL (index hero) ──────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
}, { threshold: 0.08 });
$$('.reveal').forEach(el => revealObs.observe(el));


// ============================================================
//  LOAD & APPLY SAVED CONFIG FROM SUPABASE
// ============================================================

async function loadSiteData() {
  const [cfg, evRows, galRows] = await Promise.all([
    dbGet('config'),
    dbGetEvents(),
    dbGetGallery(),
  ]);

  if (cfg) applyConfig(cfg);

  // Events
  const upcoming = evRows.filter(e => e.type === 'upcoming').map(e => ({ name: e.name, day: e.day, month: e.month, venue: e.venue, location: e.location, desc: e.description, ticketLink: e.ticket_link, posterUrl: e.poster_url||'' }));
  const past     = evRows.filter(e => e.type === 'past').map(e => ({ name: e.name, day: e.day, month: e.month, venue: e.venue, location: e.location, desc: e.description, posterUrl: e.poster_url||'', photos: e.photos||[] }));
  const today = new Date(); today.setHours(0,0,0,0);

  function parseEventDate(ev) {
    if (!ev.day || !ev.month) return null;
    return new Date(`${ev.month} ${ev.day}`);
  }

  const stillUpcoming = [];
  const autoMovedPast = [];
  upcoming.forEach(ev => {
    const d = parseEventDate(ev);
    if (d && d < today) autoMovedPast.push(ev);
    else stillUpcoming.push(ev);
  });

  // Merge auto-moved + manual past, sort newest first
  const allPast = [...autoMovedPast, ...past].sort((a, b) => {
    const da = parseEventDate(a) || new Date(0);
    const db = parseEventDate(b) || new Date(0);
    return db - da;
  });

  const pastExpandEnabled = cfg ? cfg.pastExpandEnabled !== false : true;
  applyEventsToPage(stillUpcoming, allPast, pastExpandEnabled);

  // Gallery
  const galleryItems = galRows.map(r => ({ url: r.url, caption: r.caption, cat: r.category }));
  applyGalleryToPage(galleryItems);

  // Logo / bio photo from Supabase (stored as base64)
  const logoDataUrl    = await dbGet('logoDataUrl');
  const bioPhotoDataUrl = await dbGet('bioPhotoDataUrl');
  if (logoDataUrl && cfg?.heroMode === 'logo') applyLogoMode(cfg, logoDataUrl);
  if (bioPhotoDataUrl) applyBioPhoto(cfg?.bioPhotoUrl, bioPhotoDataUrl);

  // Album art
  if (cfg?.albums) {
    const cards = $$('.album-card');
    for (let i = 0; i < cfg.albums.length && i < cards.length; i++) {
      const artData = await dbGet('albumArt_' + i);
      applyAlbumArt(cards[i], cfg.albums[i].artUrl, artData);
    }
  }
}

loadSiteData();


// ── APPLY CONFIG ─────────────────────────────────────────────
function applyConfig(cfg) {
  if (!cfg) return;

  if (cfg.accentColor) document.documentElement.style.setProperty('--blue', cfg.accentColor);

  // Apply visibility toggles
  const vis = cfg.visToggles || {};

  // ── Helper: hide element + nearest section-label above it ──
  function hideWithLabel(el) {
    if (!el) return;
    el.style.display = 'none';
    // Walk backwards in parent's children to find preceding .section-label
    let prev = el.previousElementSibling;
    while (prev) {
      if (prev.classList.contains('section-label')) { prev.style.display = 'none'; break; }
      prev = prev.previousElementSibling;
    }
  }

  // Events page
  const allSectionLabels = $$('.section-label');
  if (vis.showUpcomingEvents === false) {
    const upList = $('#upcomingEventsList');
    if (upList) {
      upList.style.display = 'none';
      allSectionLabels.forEach(l => { if (l.textContent.trim().toLowerCase().includes('upcoming')) l.style.display = 'none'; });
    }
  }
  if (vis.showPastEvents === false) {
    const pastList = $('#pastEventsList');
    if (pastList) {
      pastList.style.display = 'none';
      allSectionLabels.forEach(l => { if (l.textContent.trim().toLowerCase().includes('past')) l.style.display = 'none'; });
    }
  }

  // Music page
  if (vis.showMusicLatest === false || vis.showMusicPrevious === false) {
    const cards = $$('.album-card');
    // Also hide the section-label "Latest Release" / "Previous Releases"
    const musicLabels = $$('.section-label');
    cards.forEach((card, idx) => {
      if (idx === 0 && vis.showMusicLatest === false) {
        card.style.display = 'none';
        musicLabels.forEach(l => { if (l.textContent.trim().toLowerCase().includes('latest')) l.style.display = 'none'; });
      }
      if (idx > 0 && vis.showMusicPrevious === false) {
        card.style.display = 'none';
        musicLabels.forEach(l => { if (l.textContent.trim().toLowerCase().includes('previous')) l.style.display = 'none'; });
      }
    });
  }

  // Contact page
  if (vis.showContactForm === false) {
    const form = $('#contactForm');
    if (form) form.closest('.fade-in')?.parentElement && (form.closest('.fade-in').style.display = 'none');
  }
  if (vis.showContactInfo === false) {
    const info = document.querySelector('.contact-info');
    if (info) info.style.display = 'none';
  }

  // EPK page
  if (vis.showEpkDownloads === false) {
    // Find the press downloads block — it's the last .epk-block
    const dlRow = document.querySelector('.epk-download-row');
    if (dlRow) {
      const block = dlRow.closest('.epk-block');
      if (block) block.style.display = 'none';
    }
  }
  if (vis.showEpkQuotes === false) {
    const q1 = $('#pressQ1El');
    if (q1) {
      const block = q1.closest('.epk-block');
      if (block) block.style.display = 'none';
    }
  }

  // Gallery — hide live shows category
  if (vis.showGalleryLive === false) {
    $$('.gallery-item[data-cat="live"]').forEach(el => el.style.display = 'none');
    // Also hide the "Live Shows" filter button
    $$('.filter-btn').forEach(btn => { if (btn.dataset.filter === 'live') btn.style.display = 'none'; });
  }

  if (cfg.artistName) {
    $$('.nav-logo, .footer-logo').forEach(el => { if (!el.querySelector('img')) el.textContent = cfg.artistName; });
  }

  const tagline = $('.hero-tagline');   if (tagline && cfg.heroTagline) tagline.textContent = cfg.heroTagline;
  const heroSub = $('.hero-sub');       if (heroSub && cfg.heroSub) heroSub.textContent = cfg.heroSub;
  const cta1 = $('.hero-cta-1');
  if (cta1 && cfg.heroCta1Text) { cta1.textContent = cfg.heroCta1Text; if (cfg.heroCta1Link) cta1.href = cfg.heroCta1Link; }
  const cta2 = $('.hero-cta-2');
  if (cta2 && cfg.heroCta2Text) cta2.textContent = cfg.heroCta2Text;
  const latestStrip = $('.latest-release-text');
  if (latestStrip && cfg.latestRelease) latestStrip.textContent = cfg.latestRelease;

  // Stat cards — numbers
  const s1 = $('#statNum1'); if (s1 && cfg.heroStat1) s1.textContent = cfg.heroStat1;
  const s2 = $('#statNum2'); if (s2 && cfg.heroStat2) s2.textContent = cfg.heroStat2;
  const s3 = $('#statNum3'); if (s3 && cfg.heroStat3) s3.textContent = cfg.heroStat3;
  // Stat cards — labels
  const l1 = $('#statLbl1'); if (l1 && cfg.heroStatLbl1) l1.textContent = cfg.heroStatLbl1;
  const l2 = $('#statLbl2'); if (l2 && cfg.heroStatLbl2) l2.textContent = cfg.heroStatLbl2;
  const l3 = $('#statLbl3'); if (l3 && cfg.heroStatLbl3) l3.textContent = cfg.heroStatLbl3;
  // Stat cards — icons
  const ic1 = $('#statIcon1'); if (ic1 && cfg.heroStatIcon1) ic1.textContent = cfg.heroStatIcon1;
  const ic2 = $('#statIcon2'); if (ic2 && cfg.heroStatIcon2) ic2.textContent = cfg.heroStatIcon2;
  const ic3 = $('#statIcon3'); if (ic3 && cfg.heroStatIcon3) ic3.textContent = cfg.heroStatIcon3;
  // Stat cards — individual show/hide
  const sc1 = $('#statCard1'); if (sc1) sc1.style.display = cfg.showStat1 === false ? 'none' : '';
  const sc2 = $('#statCard2'); if (sc2) sc2.style.display = cfg.showStat2 === false ? 'none' : '';
  const sc3 = $('#statCard3'); if (sc3) sc3.style.display = cfg.showStat3 === false ? 'none' : '';

  // Marquee — custom text
  if (cfg.marqueeText) {
    const track = $('#marqueeTrack');
    if (track) {
      const items = cfg.marqueeText.split('|').map(s => s.trim()).filter(Boolean);
      if (items.length) {
        const doubled = [...items, ...items];
        track.innerHTML = doubled.map(t => `<span>${t}</span><span class="dot">✦</span>`).join('');
      }
    }
  }

  const latestEl = $('.latest-release-strip');
  if (latestEl && cfg.showLatestStrip === false) latestEl.style.display = 'none';
  const marquee = $('#marqueeWrap');
  if (marquee && cfg.showMarquee === false) marquee.style.display = 'none';

  // Genre tags — custom order/labels
  if (cfg.genreTags) {
    const tagsRow = $('#genreTagsRow');
    if (tagsRow) {
      const tags = cfg.genreTags.split('|').map(s => s.trim()).filter(Boolean);
      if (tags.length) {
        tagsRow.innerHTML = tags.map((t, i) => `<span class="tag-pill${i===0?' active':''}">${t}</span>`).join('');
      }
    }
  }

  if (cfg.heroVideoUrl) applyHeroVideo(cfg.heroVideoUrl);
  if (cfg.heroVideoOpacity) { const vid = $('video'); if (vid) vid.style.opacity = cfg.heroVideoOpacity / 100; }

  // Bio
  const bioH = $('.bio-text h2');
  if (bioH && cfg.bioHeading) bioH.textContent = cfg.bioHeading;
  [1,2,3].forEach(n => { const el = document.querySelector('.bio-para-' + n); if (el && cfg['bioPara'+n]) el.innerHTML = cfg['bioPara'+n]; });
  const pullQ = $('.bio-pull-quote');
  if (pullQ && cfg.bioPullQuote) pullQ.textContent = cfg.bioPullQuote;

  const bioFactKeys = ['bioCity','bioGenre','bioSince','bioInstruments','bioReleases'];
  const bioFacts = $$('.bio-facts li span:last-child');
  bioFactKeys.forEach((key, i) => { if (cfg[key] && bioFacts[i]) bioFacts[i].textContent = cfg[key]; });

  // Social — footer
  const socialMap = { socialIG: 'fl-instagram', socialSpotify: 'fl-spotify', socialYT: 'fl-youtube', socialSC: 'fl-soundcloud' };
  Object.entries(socialMap).forEach(([cfgKey, elId]) => { const a = document.getElementById(elId); if (a && cfg[cfgKey]) a.href = cfg[cfgKey]; });
  if (cfg.socialIG)      { const a = $('#bio-ig'); if (a) a.href = cfg.socialIG; }
  if (cfg.socialSpotify) { const a = $('#bio-sp'); if (a) a.href = cfg.socialSpotify; }
  if (cfg.socialYT)      { const a = $('#bio-yt'); if (a) a.href = cfg.socialYT; }
  if (cfg.socialSpotify) { const a = $('#epk-sp'); if (a) a.href = cfg.socialSpotify; }
  if (cfg.socialAM)      { const a = $('#epk-am'); if (a) a.href = cfg.socialAM; }
  if (cfg.socialYT)      { const a = $('#epk-yt'); if (a) a.href = cfg.socialYT; }
  if (cfg.socialIG)      { const a = $('#epk-ig'); if (a) a.href = cfg.socialIG; }
  if (cfg.socialSC)      { const a = $('#epk-sc'); if (a) a.href = cfg.socialSC; }

  // Emails
  if (cfg.emailBooking) { const el = $('#emailBookingEl'); if (el) { el.href = 'mailto:' + cfg.emailBooking; el.textContent = cfg.emailBooking; } }
  if (cfg.emailPress)   { const el = $('#emailPressEl');   if (el) { el.href = 'mailto:' + cfg.emailPress;   el.textContent = cfg.emailPress;   } }
  if (cfg.emailGeneral) { const el = $('#emailGeneralEl'); if (el) { el.href = 'mailto:' + cfg.emailGeneral; el.textContent = cfg.emailGeneral; } }

  // Footer copyright
  $$('.footer-copy, #footerCopy').forEach(el => { if (cfg.copyrightText) el.textContent = cfg.copyrightText; });

  // Music — albums from config
  if (cfg.albums) {
    const cards = $$('.album-card');
    cfg.albums.forEach((alb, i) => {
      if (!cards[i]) return;
      const t = cards[i].querySelector('h2'); if (t && alb.title) t.textContent = alb.title;
      const at = cards[i].querySelector('.album-type'); if (at && alb.type) at.textContent = alb.type;
      const d = cards[i].querySelector('p'); if (d && alb.desc) d.textContent = alb.desc;
      if (alb.tracks) {
        const tl = cards[i].querySelector('.tracklist');
        if (tl) tl.innerHTML = alb.tracks.split('\n').filter(Boolean).map((t,j)=>`<li><span>${String(j+1).padStart(2,'0')}</span><span>${t}</span></li>`).join('');
      }
      // Download button
      const dl = cards[i].querySelector('.btn-primary');
      if (dl) {
        if (alb.downloadLink) dl.href = alb.downloadLink;
        if (alb.downloadBtnLabel) dl.textContent = alb.downloadBtnLabel;
        dl.style.display = alb.showDownloadBtn === false ? 'none' : '';
      }
      // Stream button
      const st = cards[i].querySelector('.btn-ghost');
      if (st) {
        if (alb.streamLink) st.href = alb.streamLink;
        if (alb.streamBtnLabel) st.textContent = alb.streamBtnLabel;
        st.style.display = alb.showStreamBtn === false ? 'none' : '';
      }
      if (alb.artUrl) { const artEl = cards[i].querySelector('.album-art'); if (artEl) artEl.innerHTML = `<img src="${alb.artUrl}" alt="Album Art">`; }
    });
  }

  // EPK
  const epkStreams = $('#epk-stat-streams'); if (epkStreams && cfg.statStreams) epkStreams.textContent = cfg.statStreams;
  const epkIG = $('#epk-stat-ig'); if (epkIG && cfg.statIG) epkIG.textContent = cfg.statIG;
  const epkYT = $('#epk-stat-yt'); if (epkYT && cfg.statYT) epkYT.textContent = cfg.statYT;
  const epkRel = $('#epk-stat-releases'); if (epkRel && cfg.statReleases) epkRel.textContent = cfg.statReleases;
  const epkOv = $('#epkOverviewText'); if (epkOv && cfg.epkOverview) epkOv.textContent = cfg.epkOverview;
  const pq1 = $('#pressQ1El'); if (pq1 && cfg.pressQ1) pq1.textContent = '"' + cfg.pressQ1 + '"';
  const pq1s = $('#pressQ1SrcEl'); if (pq1s && cfg.pressQ1Src) pq1s.textContent = cfg.pressQ1Src;
  const pq2 = $('#pressQ2El'); if (pq2 && cfg.pressQ2) pq2.textContent = '"' + cfg.pressQ2 + '"';
  const pq2s = $('#pressQ2SrcEl'); if (pq2s && cfg.pressQ2Src) pq2s.textContent = cfg.pressQ2Src;
  const epkDlPdf  = $('#epkDl-pdf');    if (epkDlPdf  && cfg.epkPdfLink)    epkDlPdf.href    = cfg.epkPdfLink;
  const epkDlPh   = $('#epkDl-photos'); if (epkDlPh   && cfg.epkPhotosLink) epkDlPh.href     = cfg.epkPhotosLink;
  const epkDlBio  = $('#epkDl-bio');    if (epkDlBio  && cfg.epkBioLink)    epkDlBio.href    = cfg.epkBioLink;
  const epkDlLogo = $('#epkDl-logo');   if (epkDlLogo && cfg.epkLogoLink)   epkDlLogo.href   = cfg.epkLogoLink;

  // Logo mode
  applyLogoMode(cfg, null);
}

function applyAlbumArt(card, urlFromCfg, dataUrl) {
  const artEl = card.querySelector('.album-art');
  if (!artEl) return;
  const url = dataUrl || urlFromCfg;
  if (url) artEl.innerHTML = `<img src="${url}" alt="Album Art">`;
}

function applyBioPhoto(urlFromCfg, dataUrl) {
  const ph = $('.bio-photo-placeholder');
  const existing = $('.bio-photo');
  const url = dataUrl || urlFromCfg;
  if (url) {
    if (ph) {
      const img = document.createElement('img');
      img.src = url; img.alt = 'Artist Photo'; img.className = 'bio-photo';
      ph.replaceWith(img);
    } else if (existing) { existing.src = url; }
  }
}

function applyHeroVideo(url) {
  const vid = $('video');
  if (vid && url) { vid.src = url; vid.load(); vid.play().catch(() => {}); const ph = $('.hero-video-placeholder'); if (ph) ph.style.display = 'none'; }
}

function applyLogoMode(cfg, logoDataUrl) {
  if (!cfg) return;
  const mode = cfg.heroMode;
  const logoUrl = logoDataUrl || cfg.heroLogoUrl;
  $$('.nav-logo, .footer-logo').forEach(el => {
    if (mode === 'logo' && logoUrl) {
      el.innerHTML = `<img src="${logoUrl}" alt="Logo" style="height:38px;width:auto;display:block">`;
    } else {
      if (!el.querySelector('img')) el.textContent = cfg.artistName || 'HARSHID';
    }
  });
  const bgName = $('.hero-bg-name');
  if (bgName && cfg.artistName) bgName.textContent = cfg.artistName;
}

function applyEventsToPage(upcoming, past, pastExpandEnabled) {
  const upEl   = $('#upcomingEventsList');
  const pastEl = $('#pastEventsList');

  const posterThumb = (url, emoji) => url
    ? `<div class="event-poster-thumb"><img src="${url}" alt="Event Poster"></div>`
    : `<div class="event-poster-thumb"><span class="event-poster-emoji">${emoji}</span></div>`;

  if (upEl && upcoming.length) {
    upEl.innerHTML = upcoming.map((ev, i) => `
      <div class="event-card fade-in" data-target="uev${i}">
        ${posterThumb(ev.posterUrl, '🎤')}
        <div style="display:flex;align-items:center;gap:.9rem;flex:1">
          <div class="event-date-block"><div class="event-day">${ev.day||'TBD'}</div><div class="event-month">${ev.month||''}</div></div>
          <div class="event-info"><h3>${ev.name||'Event'}</h3><div class="event-venue">${ev.venue||''}</div><div class="event-location">${ev.location||''}</div></div>
          <span class="event-toggle-icon">+</span>
        </div>
      </div>
      <div class="event-expanded" id="uev${i}">
        <p>${ev.desc||''}</p>
        ${ev.ticketLink ? `<a href="${ev.ticketLink}" class="btn-primary" style="display:inline-block;margin-bottom:1.5rem" target="_blank">Get Tickets</a>` : ''}
      </div>
    `).join('');
    $$('.fade-in', upEl).forEach(el => scrollObs.observe(el));
    bindEventCards();
  }

  if (pastEl && past.length) {
    const canExpand = pastExpandEnabled !== false;
    pastEl.innerHTML = past.map((ev, i) => {
      const photos = (ev.photos || []).filter(Boolean);
      const photoHtml = photos.length
        ? photos.map(url => `<div class="event-photo-placeholder-lg"><img src="${url}" alt="Show Photo"></div>`).join('')
        : '';
      return `
        <div class="event-card fade-in past-event-card${canExpand ? '' : ' no-expand'}" ${canExpand ? `data-target="pev${i}"` : ''}>
          ${posterThumb(ev.posterUrl, '📸')}
          <div style="display:flex;align-items:center;gap:.9rem;flex:1">
            <div class="event-date-block"><div class="event-day">${ev.day||'TBD'}</div><div class="event-month">${ev.month||''}</div></div>
            <div class="event-info"><h3>${ev.name||'Event'}</h3><div class="event-venue">${ev.venue||''}</div><div class="event-location">${ev.location||''}</div></div>
            ${canExpand ? '<span class="event-toggle-icon past-toggle">+</span>' : '<span></span>'}
          </div>
        </div>
        ${canExpand ? `
        <div class="event-expanded" id="pev${i}">
          ${ev.desc ? `<p>${ev.desc}</p>` : ''}
          ${photoHtml ? `<div class="event-expanded-inner">${photoHtml}</div>` : ''}
        </div>` : ''}
      `;
    }).join('');
    $$('.fade-in', pastEl).forEach(el => scrollObs.observe(el));
    if (canExpand) bindEventCards();
  }
}

function applyGalleryToPage(galleryItems) {
  const grid = $('#galleryGrid');
  if (!grid || !galleryItems.length) return;
  $$('.gallery-item', grid).forEach(item => { if (item.querySelector('.gallery-placeholder')) item.remove(); });
  galleryItems.forEach((item, i) => {
    if (document.querySelector(`.gallery-item[data-gid="${i}"]`)) return;
    const div = document.createElement('div');
    div.className = 'gallery-item fade-in';
    div.dataset.cat = item.cat || 'promo';
    div.dataset.gid = i;
    div.innerHTML = `<img src="${item.url}" alt="${item.caption||''}"><div class="gallery-item-overlay"></div><div class="gallery-caption">${item.caption||''}</div>`;
    grid.insertBefore(div, grid.firstChild);
    scrollObs.observe(div);
  });
}
