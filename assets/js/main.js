// ==============================
// STARFIELD BACKGROUND
// ==============================
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.5+0.2, alpha: Math.random()*0.8+0.2, speed: Math.random()*0.3+0.05, flicker: Math.random()*0.02+0.005, flickerDir: 1 });
    }
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      s.alpha += s.flicker*s.flickerDir;
      if (s.alpha>=1||s.alpha<=0.1) s.flickerDir*=-1;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,230,255,${s.alpha})`; ctx.fill();
      s.y+=s.speed;
      if (s.y>canvas.height) { s.y=0; s.x=Math.random()*canvas.width; }
    });
    requestAnimationFrame(draw);
  }
  resize(); createStars(200); draw();
  window.addEventListener('resize', ()=>{ resize(); createStars(200); });
}

// ==============================
// PLACEHOLDER CHECK
// ==============================
const PLACEHOLDER_PATTERNS = ['LINK_BLUEPRINT','DISINI','javascript:','contoh.com','example.com'];
function isPlaceholderLink(href) {
  if (!href) return true;
  const h = href.trim().toLowerCase();
  if (h===''||h==='#') return true;
  return PLACEHOLDER_PATTERNS.some(p => href.toUpperCase().includes(p.toUpperCase()));
}

// ==============================
// STATS — Supabase (akurat lintas device)
// ==============================
async function loadStats() {
  try {
    const [visitorTotal, stats] = await Promise.all([
      window.SFS.trackVisitor(),
      window.SFS.getTotalStats()
    ]);
    function animateCount(el, target) {
      let c=0; const step=Math.max(1,Math.ceil(target/40));
      const t=setInterval(()=>{ c=Math.min(c+step,target); el.textContent=c.toLocaleString(); if(c>=target) clearInterval(t); }, 30);
    }
    document.querySelectorAll('#statVisitors').forEach(el => animateCount(el, visitorTotal));
    document.querySelectorAll('#statTotalBP').forEach(el => { el.textContent = stats.totalBP; });
    document.querySelectorAll('#statTotalDownloads').forEach(el => animateCount(el, stats.totalDownloads));
  } catch(e) { console.warn('Stats error:', e); }
}

// ==============================
// HELPER: base path
// ==============================
function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}

// ==============================
// AUTH UI — sidebar nav items
// ==============================
async function initAuthUI() {
  const user = await window.SFS.getCurrentUser();
  document.querySelectorAll('.nav-auth-area').forEach(area => {
    if (user) {
      const username = user.user_metadata?.username || user.email;
      area.innerHTML = `
        <li class="nav-username">👤 ${username}</li>
        <li><a href="${getBasePath()}pages/my-blueprints.html"><span class="nav-icon">🗂️</span> Blueprint Saya</a></li>
        <li><a href="${getBasePath()}pages/upload.html"><span class="nav-icon">⬆️</span> Upload Blueprint</a></li>
        <li><a href="#" id="btnLogout"><span class="nav-icon">🚪</span> Logout</a></li>
      `;
      document.getElementById('btnLogout')?.addEventListener('click', async(e) => {
        e.preventDefault();
        await window.SFS.logoutUser();
        location.reload();
      });
    } else {
      area.innerHTML = `
        <li><a href="${getBasePath()}pages/upload.html"><span class="nav-icon">⬆️</span> Upload Blueprint</a></li>
        <li><a href="${getBasePath()}pages/login.html"><span class="nav-icon">🔑</span> Login / Register</a></li>
      `;
    }
  });
}

// ==============================
// BUILD CARD HTML
// ==============================
function buildCardHTML(bp) {
  const imgHTML = bp.image_url
    ? `<img src="${bp.image_url}" class="bp-card-img" alt="${bp.name}" style="cursor:zoom-in;">`
    : `<div class="bp-card-img-placeholder" style="cursor:zoom-in;">🚀</div>`;

  const hasLink = bp.link && !isPlaceholderLink(bp.link);
  const btnHTML = hasLink
    ? `<a href="${bp.link}" class="btn-download" target="_blank" data-bp-id="${bp.id}">⬇ Ambil BP</a>`
    : `<span class="coming-soon-badge">SEGERA</span><button class="btn-download disabled" style="cursor:not-allowed;">🔒 Segera</button>`;

  return `
    <div class="bp-card" data-bp-id="${bp.id}">
      ${imgHTML}
      <div class="bp-card-body">
        <span class="bp-author"><span class="author-icon">👤</span> By ${bp.author_name}</span>
        <h3>${bp.name}</h3>
        <p class="desc">${bp.description || ''}</p>
      </div>
      <div class="bp-card-footer">
        <div class="use-count">📥 Digunakan: <strong>${bp.download_count||0}</strong>x</div>
        ${btnHTML}
      </div>
    </div>`;
}

// ==============================
// RENDER BLUEPRINTS dari Supabase
// ==============================
async function renderBlueprints(containerSelector, category) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = `<div class="loading-bp">⏳ Memuat blueprint...</div>`;
  const { data, error } = await window.SFS.getBlueprints(category);
  if (error || !data.length) {
    container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:2rem;">Belum ada blueprint di kategori ini.</p>`;
    return;
  }
  container.innerHTML = data.map(bp => buildCardHTML(bp)).join('');
  attachDownloadListeners(container);
  initLightboxForContainer(container);
}

async function renderMyBlueprints(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const user = await window.SFS.getCurrentUser();
  if (!user) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;">
        <p style="color:var(--text-muted);margin-bottom:1rem;">Kamu harus login untuk melihat blueprint kamu.</p>
        <a href="login.html" class="btn-download" style="display:inline-block;">🔑 Login Sekarang</a>
      </div>`;
    return;
  }
  container.innerHTML = `<div class="loading-bp">⏳ Memuat blueprint kamu...</div>`;
  const { data, error } = await window.SFS.getBlueprintsByUser(user.id);
  if (error || !data.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;">
        <p style="color:var(--text-muted);margin-bottom:1rem;">Kamu belum upload blueprint apapun.</p>
        <a href="upload.html" class="btn-download" style="display:inline-block;">⬆️ Upload Sekarang</a>
      </div>`;
    return;
  }
  container.innerHTML = data.map(bp => buildCardHTML(bp)).join('');
  attachDownloadListeners(container);
  initLightboxForContainer(container);
}

// ==============================
// DOWNLOAD LISTENER
// ==============================
function attachDownloadListeners(container) {
  container.querySelectorAll('.btn-download:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bpId = btn.dataset.bpId || btn.closest('.bp-card')?.dataset.bpId;
      if (!bpId) return;
      await window.SFS.recordDownload(bpId);
      const countEl = btn.closest('.bp-card')?.querySelector('.use-count strong');
      if (countEl) {
        countEl.textContent = parseInt(countEl.textContent||'0') + 1;
        countEl.style.color = '#00ffcc';
        setTimeout(() => countEl.style.color = '', 600);
      }
      const { totalDownloads } = await window.SFS.getTotalStats();
      document.querySelectorAll('#statTotalDownloads').forEach(el => el.textContent = totalDownloads.toLocaleString());
    });
  });
}

// ==============================
// HAMBURGER MENU
// ==============================
function initMenu() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!hamburger||!sidebar||!overlay) return;
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); sidebar.classList.toggle('active'); overlay.classList.toggle('active'); });
  overlay.addEventListener('click', () => { hamburger.classList.remove('active'); sidebar.classList.remove('active'); overlay.classList.remove('active'); });
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list a').forEach(link => { const href=link.getAttribute('href').split('/').pop(); if(href===current) link.classList.add('active'); });
}

// ==============================
// LIGHTBOX
// ==============================
function initLightbox() {
  if (document.getElementById('lightboxOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay'; overlay.id = 'lightboxOverlay';
  overlay.innerHTML = `<div class="lightbox-content" id="lightboxContent"><button class="lightbox-close" id="lightboxClose">✕</button><div id="lightboxMedia"></div><div class="lightbox-caption" id="lightboxCaption"></div><div class="lightbox-hint">Klik di luar atau tekan ESC untuk menutup</div></div>`;
  document.body.appendChild(overlay);
  function openLightbox(src, caption, isEmoji) {
    document.getElementById('lightboxMedia').innerHTML = isEmoji ? `<div class="lightbox-emoji">${src}</div>` : `<img src="${src}" alt="${caption}">`;
    document.getElementById('lightboxCaption').textContent = caption;
    overlay.classList.add('active'); document.body.style.overflow = 'hidden';
  }
  window._openLightbox = openLightbox;
  function closeLightbox() { overlay.classList.remove('active'); document.body.style.overflow = ''; }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  overlay.addEventListener('click', e => { if(e.target===overlay) closeLightbox(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeLightbox(); });
  initLightboxForContainer(document);
}

function initLightboxForContainer(container) {
  container.querySelectorAll?.('.bp-card-img').forEach(img => {
    img.addEventListener('click', () => { const title=img.closest('.bp-card')?.querySelector('h3')?.textContent||img.alt; window._openLightbox?.(img.src,title,false); });
  });
  container.querySelectorAll?.('.bp-card-img-placeholder').forEach(el => {
    el.addEventListener('click', () => { const title=el.closest('.bp-card')?.querySelector('h3')?.textContent||'Blueprint'; window._openLightbox?.(el.textContent.trim(),title,true); });
  });
}

// ==============================
// RANDOM PAGE
// ==============================
async function initRandomPage() {
  const btn = document.getElementById('btnRandom');
  const resultSection = document.getElementById('randomResult');
  if (!btn||!resultSection) return;
  btn.addEventListener('click', async () => {
    resultSection.innerHTML = `<div class="loading-bp">🎲 Mengambil blueprint acak...</div>`;
    resultSection.classList.add('visible');
    const { data } = await window.SFS.getBlueprints(null);
    if (!data||!data.length) { resultSection.innerHTML=`<p style="color:var(--text-muted)">Belum ada blueprint tersedia.</p>`; return; }
    const pick = data[Math.floor(Math.random()*data.length)];
    resultSection.innerHTML = buildCardHTML(pick);
    attachDownloadListeners(resultSection);
    initLightboxForContainer(resultSection);
  });
}

// ==============================
// INIT ALL
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
  initStarfield();
  initMenu();
  initLightbox();
  await initAuthUI();
  await loadStats();
  initRandomPage();

  const page = window.location.pathname.split('/').pop();
  if (page==='NASA.html')            await renderBlueprints('.bp-grid', 'nasa');
  if (page==='spacex.html')          await renderBlueprints('.bp-grid', 'spacex');
  if (page==='satelit.html')         await renderBlueprints('.bp-grid', 'satelit');
  if (page==='my-blueprints.html')   await renderMyBlueprints('.bp-grid');
});
