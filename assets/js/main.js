// ==============================
// STARFIELD BACKGROUND
// ==============================
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        flicker: Math.random() * 0.02 + 0.005,
        flickerDir: 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.alpha += s.flicker * s.flickerDir;
      if (s.alpha >= 1 || s.alpha <= 0.1) s.flickerDir *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 230, 255, ${s.alpha})`;
      ctx.fill();
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(draw);
  }

  resize();
  createStars(200);
  draw();
  window.addEventListener('resize', () => { resize(); createStars(200); });
}

// ==============================
// PLACEHOLDER LINKS — daftar kata yang berarti "belum diisi"
// ==============================
const PLACEHOLDER_PATTERNS = [
  'LINK_BLUEPRINT',
  'DISINI',
  '#',
  'javascript:',
  'contoh.com',
  'example.com'
];

function isPlaceholderLink(href) {
  if (!href) return true;
  const h = href.trim().toLowerCase();
  if (h === '' || h === '#') return true;
  return PLACEHOLDER_PATTERNS.some(p => href.toUpperCase().includes(p.toUpperCase()));
}

// ==============================
// BLUEPRINT DOWNLOAD COUNTER + DISABLE PLACEHOLDER
// ==============================

// Semua BP ID yang terdaftar di seluruh website
const ALL_BP_IDS = [
  'artemis-1','artemis-2','artemis-3',
  'apollo-1',
  'spacex-1','spacex-2','spacex-3','spacex-4',
  'sat-1','sat-2','sat-3','sat-4'
];

function getTotalBP() {
  return ALL_BP_IDS.length;
}

function getTotalDownloads() {
  let total = 0;
  ALL_BP_IDS.forEach(id => {
    total += parseInt(localStorage.getItem(`sfs_bp_uses_${id}`) || '0', 10);
  });
  return total;
}

function initBlueprintCounters() {
  document.querySelectorAll('.bp-card').forEach(card => {
    const id = card.dataset.bpId;
    if (!id) return;

    const KEY = `sfs_bp_uses_${id}`;
    let count = parseInt(localStorage.getItem(KEY) || '0', 10);
    const countEl = card.querySelector('.use-count strong');
    if (countEl) countEl.textContent = count;

    const link = card.querySelector('.btn-download');
    if (!link) return;

    const href = link.getAttribute('href');

    if (isPlaceholderLink(href)) {
      // Tombol disabled — belum ada link
      link.classList.add('disabled');
      link.removeAttribute('href');
      link.setAttribute('title', 'Blueprint belum tersedia');
      link.innerHTML = '🔒 Segera';

      // Tambahkan badge "Segera" di atas tombol
      const footer = card.querySelector('.bp-card-footer');
      if (footer && !footer.querySelector('.coming-soon-badge')) {
        const badge = document.createElement('span');
        badge.className = 'coming-soon-badge';
        badge.textContent = 'SEGERA';
        footer.insertBefore(badge, footer.firstChild);
      }
    } else {
      // Tombol aktif — hitung download saat diklik
      link.addEventListener('click', () => {
        count += 1;
        localStorage.setItem(KEY, count);
        if (countEl) {
          countEl.textContent = count;
          countEl.style.color = '#00ffcc';
          setTimeout(() => countEl.style.color = '', 600);
        }
        // Update total download di sidebar jika ada
        const totalEl = document.getElementById('statTotalDownloads');
        if (totalEl) totalEl.textContent = getTotalDownloads();
      });
    }
  });
}

// ==============================
// VISITOR COUNTER (unique per device)
// ==============================
function initVisitorCounter() {
  const KEY_COUNT = 'sfs_visitor_count';
  const KEY_VISITED = 'sfs_has_visited';

  let count = parseInt(localStorage.getItem(KEY_COUNT) || '0', 10);
  const alreadyVisited = localStorage.getItem(KEY_VISITED);

  if (!alreadyVisited) {
    count += 1;
    localStorage.setItem(KEY_COUNT, count);
    localStorage.setItem(KEY_VISITED, '1');
  }

  // Update semua elemen yang menampilkan visitor count
  function animateCount(el, target) {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 30);
  }

  document.querySelectorAll('#statVisitors').forEach(el => animateCount(el, count));

  // Total BP
  document.querySelectorAll('#statTotalBP').forEach(el => {
    el.textContent = getTotalBP();
  });

  // Total downloads
  document.querySelectorAll('#statTotalDownloads').forEach(el => {
    animateCount(el, getTotalDownloads());
  });
}

// ==============================
// HAMBURGER MENU
// ==============================
function initMenu() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!hamburger || !sidebar || !overlay) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  // Active link highlight
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list a').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === current) link.classList.add('active');
  });
}

// ==============================
// LIGHTBOX
// ==============================
function initLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.id = 'lightboxOverlay';
  overlay.innerHTML = `
    <div class="lightbox-content" id="lightboxContent">
      <button class="lightbox-close" id="lightboxClose">✕</button>
      <div id="lightboxMedia"></div>
      <div class="lightbox-caption" id="lightboxCaption"></div>
      <div class="lightbox-hint">Klik di luar atau tekan ESC untuk menutup</div>
    </div>
  `;
  document.body.appendChild(overlay);

  function openLightbox(src, caption, isEmoji) {
    const media = document.getElementById('lightboxMedia');
    const cap = document.getElementById('lightboxCaption');
    media.innerHTML = isEmoji
      ? `<div class="lightbox-emoji">${src}</div>`
      : `<img src="${src}" alt="${caption}">`;
    cap.textContent = caption;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Expose ke window agar bisa dipakai oleh card yang dibuat secara dinamis (random page)
  window._openLightbox = openLightbox;

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.bp-card-img').forEach(img => {
    img.addEventListener('click', () => {
      const card = img.closest('.bp-card');
      const title = card?.querySelector('h3')?.textContent || img.alt;
      openLightbox(img.src, title, false);
    });
  });

  document.querySelectorAll('.bp-card-img-placeholder').forEach(el => {
    el.addEventListener('click', () => {
      const card = el.closest('.bp-card');
      const title = card?.querySelector('h3')?.textContent || 'Blueprint';
      openLightbox(el.textContent.trim(), title, true);
    });
  });

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

// ==============================
// RANDOM PAGE
// ==============================
function initRandomPage() {
  const btn = document.getElementById('btnRandom');
  const resultSection = document.getElementById('randomResult');
  if (!btn || !resultSection) return;

  // Data disesuaikan langsung dari file HTML masing-masing halaman
  const allBps = [
    { id: 'artemis-1', name: 'Artemis I SLS',        category: 'NASA',    icon: '🚀', img: '../assets/img/nasa/Artemis1.jpg',       desc: 'Space Launch System Block 1.',            author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/8lJQGj_rEfG0EI2ciX4zyg' },
    { id: 'artemis-2', name: 'Orion Capsule',         category: 'NASA',    icon: '🛸', img: '../assets/img/nasa/orioncapsule.jpg',   desc: 'Kapsul kru Orion untuk misi bulan.',      author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/9RnA4j_qEfG0EI2ciX4zyg' },
    { id: 'artemis-3', name: 'Artemis II — Crewed',   category: 'NASA',    icon: '🌕', img: '../assets/img/nasa/Artemis2.jpg',       desc: 'Misi Artemis II dengan kru penuh.',       author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/aiAHHkCzEfG0s42ciX4zyg' },
    { id: 'apollo-1',  name: 'Saturn V (Apollo 11)',  category: 'NASA',    icon: '🚀', img: '../assets/img/nasa/SaturnV.jpg',        desc: 'Roket terkuat yang pernah dibuat.',       author: 'Keandre',    link: 'https://sharing.spaceflightsimulator.app/rocket/zu4wChmoEfGNnNsmxpcUUg' },
    { id: 'spacex-1',  name: 'Falcon 9',              category: 'SpaceX',  icon: '🚀', img: '../assets/img/spacex/falcon9.jpg',      desc: 'Roket reusable dua tahap.',               author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/1oH1cklOEfG7gI2ciX4zyg' },
    { id: 'spacex-2',  name: 'Starship',              category: 'SpaceX',  icon: '🌟', img: '../assets/img/spacex/Starship.jpg',     desc: 'Roket super-heavy terbesar.',             author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/PP2vv0epEfG6c42ciX4zyg' },
    { id: 'spacex-3',  name: 'Falcon Heavy',          category: 'SpaceX',  icon: '🔱', img: '../assets/img/spacex/falconheavy.jpg', desc: 'Versi triple-core dari Falcon 9.',        author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/859L2kNREfG3Fo2ciX4zyg' },
    { id: 'spacex-4',  name: 'Dragon Capsule',        category: 'SpaceX',  icon: '🐉', img: '../assets/img/spacex/dragoncapsule.jpg',desc: 'Kapsul kru SpaceX untuk ISS.',           author: 'Allstar BP', link: 'https://sharing.spaceflightsimulator.app/rocket/xB_d2koDEfG71I2ciX4zyg' },
    { id: 'sat-1',     name: 'Hubble Telescope',      category: 'Satelit', icon: '🔭', img: '../assets/img/ps.png',                  desc: 'Teleskop luar angkasa ikonik.',           author: '???',        link: null },
    { id: 'sat-2',     name: 'ISS',                   category: 'Satelit', icon: '🛸', img: '../assets/img/ps.png',                  desc: 'Stasiun luar angkasa internasional.',     author: '???',        link: null },
    { id: 'sat-3',     name: 'Satria 1',              category: 'Satelit', icon: '🌌', img: '../assets/img/ps.png',                  desc: 'Satelit komunikasi Indonesia.',           author: '???',        link: null },
    { id: 'sat-4',     name: 'Starlink Satellite',    category: 'Satelit', icon: '📡', img: '../assets/img/CS.png',                  desc: 'Jaringan satelit internet SpaceX.',       author: '???',        link: null },
  ];

  btn.addEventListener('click', () => {
    const pick = allBps[Math.floor(Math.random() * allBps.length)];
    const KEY = `sfs_bp_uses_${pick.id}`;
    let count = parseInt(localStorage.getItem(KEY) || '0', 10);

    // Tentukan tampilan gambar: pakai <img> jika ada, pakai emoji jika tidak
    const mediaHTML = pick.img
      ? `<img src="${pick.img}" class="bp-card-img" alt="${pick.name}" style="cursor:zoom-in;">`
      : `<div class="bp-card-img-placeholder" style="cursor:zoom-in;">${pick.icon}</div>`;

    // Tentukan tampilan tombol: aktif jika link ada, disabled jika tidak
    const hasLink = pick.link && !isPlaceholderLink(pick.link);
    const btnHTML = hasLink
      ? `<a href="${pick.link}" class="btn-download" target="_blank">⬇ Ambil BP</a>`
      : `<span class="coming-soon-badge">SEGERA</span><button class="btn-download disabled" style="cursor:not-allowed;">🔒 Segera</button>`;

    resultSection.innerHTML = `
      <div class="bp-card fade-in" data-bp-id="${pick.id}" style="max-width:360px;margin:0 auto;">
        ${mediaHTML}
        <div class="bp-card-body">
          <p style="font-size:11px;letter-spacing:2px;color:var(--accent-cyan);font-family:'Orbitron',sans-serif;margin-bottom:6px;">${pick.category.toUpperCase()}</p>
          <span class="bp-author"><span class="author-icon">👤</span> By ${pick.author}</span>
          <h3>${pick.name}</h3>
          <p class="desc">${pick.desc}</p>
        </div>
        <div class="bp-card-footer">
          <div class="use-count">📥 Digunakan: <strong>${count}</strong>x</div>
          ${btnHTML}
        </div>
      </div>
    `;
    resultSection.classList.add('visible');

    // Pasang event download counter pada tombol yang aktif
    if (hasLink) {
      const dlBtn = resultSection.querySelector('.btn-download');
      const countEl = resultSection.querySelector('.use-count strong');
      dlBtn?.addEventListener('click', () => {
        count += 1;
        localStorage.setItem(KEY, count);
        if (countEl) {
          countEl.textContent = count;
          countEl.style.color = '#00ffcc';
          setTimeout(() => countEl.style.color = '', 600);
        }
        const totalEl = document.getElementById('statTotalDownloads');
        if (totalEl) totalEl.textContent = getTotalDownloads();
      });
    }

    // Pasang lightbox pada card yang baru dibuat
    const newImg = resultSection.querySelector('.bp-card-img');
    const newPlaceholder = resultSection.querySelector('.bp-card-img-placeholder');
    const openLightboxFn = window._openLightbox;
    if (openLightboxFn) {
      if (newImg) newImg.addEventListener('click', () => openLightboxFn(newImg.src, pick.name, false));
      if (newPlaceholder) newPlaceholder.addEventListener('click', () => openLightboxFn(pick.icon, pick.name, true));
    }
  });
}

// ==============================
// INIT ALL
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initMenu();
  initVisitorCounter();
  initBlueprintCounters();
  initLightbox();
  initRandomPage();
});
