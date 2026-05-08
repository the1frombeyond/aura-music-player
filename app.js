// =============================================================
//  AURA Music Player — app.js
// =============================================================

// ── DOM ───────────────────────────────────────────────────────
const musicInput          = document.getElementById('music-input');
const uploadView          = document.getElementById('upload-view');
const playerView          = document.getElementById('player-view');
const coverflowContainer  = document.getElementById('coverflow');
const trackTitleElem      = document.getElementById('track-title');
const trackArtistElem     = document.getElementById('track-artist');
const timeElapsedElem     = document.getElementById('time-elapsed');
const timeTotalElem       = document.getElementById('time-total');
const progressFillElem    = document.getElementById('progress-fill');
const progressBgElem      = document.getElementById('progress-bg');
const audioPlayer         = document.getElementById('audio-player');
const statusText          = document.getElementById('status-text');
const statusDot           = document.getElementById('status-dot');
const btnPlay             = document.getElementById('btn-play');
const btnPrev             = document.getElementById('btn-prev');
const btnNext             = document.getElementById('btn-next');
const btnShuffle          = document.getElementById('btn-shuffle');
const btnRepeat           = document.getElementById('btn-repeat');
const iconPlay            = document.getElementById('icon-play');
const iconPause           = document.getElementById('icon-pause');
const queueList           = document.getElementById('queue-list');
const queueCount          = document.getElementById('queue-count');
const albumBackdrop       = document.getElementById('album-backdrop');
const volumeSlider        = document.getElementById('volume-slider');
const volPct              = document.getElementById('vol-pct');
const vizCanvas           = document.getElementById('visualizer-canvas');
const particleCanvas      = document.getElementById('particle-canvas');

// ── State ─────────────────────────────────────────────────────
let parsedAlbums     = [];
let flatQueue        = [];   // { title, albumName, coverDataUrl, albumIdx, trackIdx }
let currentQueuePos  = 0;
let currentAlbumIndex= 0;
let isPlaying        = false;
let isShuffle        = false;
let repeatMode       = 0;    // 0=off 1=all 2=one
let shuffledOrder    = [];

// ── Audio Context & Visualizer ────────────────────────────────
let audioCtx, analyser, source, dataArray;

function ensureAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source = audioCtx.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    drawVisualizer();
}

function drawVisualizer() {
    const ctx = vizCanvas.getContext('2d');
    const W = vizCanvas.width = vizCanvas.offsetWidth;
    const H = vizCanvas.height = vizCanvas.offsetHeight;
    requestAnimationFrame(drawVisualizer);
    ctx.clearRect(0, 0, W, H);
    if (!analyser || !isPlaying) return;
    analyser.getByteFrequencyData(dataArray);
    const bars = 48;
    const bw = W / bars;
    for (let i = 0; i < bars; i++) {
        const val = dataArray[Math.floor(i * dataArray.length / bars)];
        const bh = (val / 255) * H;
        const grad = ctx.createLinearGradient(0, H - bh, 0, H);
        grad.addColorStop(0, 'rgba(124,58,237,0.9)');
        grad.addColorStop(1, 'rgba(6,182,212,0.6)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.rect(i * bw + 1, H - bh, bw - 2, bh);
        ctx.fill();
    }
}

// ── Particle System ───────────────────────────────────────────
(function initParticles() {
    const cvs = particleCanvas;
    const ctx = cvs.getContext('2d');
    let W, H, particles = [];

    const resize = () => {
        W = cvs.width  = window.innerWidth;
        H = cvs.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * 1920, y: Math.random() * 1080,
            r: Math.random() * 1.5 + 0.3,
            dx: (Math.random() - 0.5) * 0.3,
            dy: -Math.random() * 0.4 - 0.1,
            alpha: Math.random() * 0.4 + 0.05
        });
    }

    const tick = () => {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,160,255,${p.alpha})`;
            ctx.fill();
            p.x += p.dx; p.y += p.dy;
            if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
            if (p.x < -5) p.x = W + 5;
            if (p.x > W + 5) p.x = -5;
        });
        requestAnimationFrame(tick);
    };
    tick();
})();

// ── Utilities ─────────────────────────────────────────────────
function formatTime(s) {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function pathBasename(p) {
    return p.split(/[/\\]/).pop().replace(/\.mp3$/i, '');
}

function arrayBufferToBase64(buf) {
    let b = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
    return btoa(b);
}

// ── ID3 Parsing ───────────────────────────────────────────────
function parseID3Async(file) {
    return new Promise((resolve, reject) => {
        if (!window.jsmediatags) { reject(new Error('jsmediatags not loaded')); return; }
        window.jsmediatags.read(file, {
            onSuccess: t => resolve(t.tags),
            onError:   e => reject(e)
        });
    });
}

// ── File Loading ──────────────────────────────────────────────
musicInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).filter(f =>
        f.type.includes('audio') || f.name.toLowerCase().endsWith('.mp3'));
    await parseAndLoadFiles(files);
});

async function parseAndLoadFiles(items) {
    if (!items.length) { alert('No MP3 files found.'); return; }

    setStatus(`Scanning ${items.length} files…`);

    const albumsMap     = new Map();
    const existingNames = new Set();
    parsedAlbums.forEach(a => { albumsMap.set(a.albumName, a); a.tracks.forEach(t => existingNames.add(t.rawName)); });

    const todo = items.filter(item => {
        const raw = typeof item === 'string'
            ? decodeURIComponent(item.replace(/.*\/music\//, ''))
            : item.name;
        return !existingNames.has(raw);
    });

    if (!todo.length) { if (parsedAlbums.length) initPlayer(); return; }

    let done = 0;
    const CHUNK = 5;
    for (let i = 0; i < todo.length; i += CHUNK) {
        const chunk = todo.slice(i, i + CHUNK);
        await Promise.all(chunk.map(async item => {
            const isUrl = typeof item === 'string';
            const rawName = isUrl ? decodeURIComponent(item.replace(/.*\/music\//, '')) : item.name;
            try {
                const tags = await parseID3Async(item);
                let albumName  = tags.album  || rawName.split(/[/\\]/)[rawName.split(/[/\\]/).length - 2] || 'Unknown Album';
                let artistName = tags.artist || 'Unknown Artist';
                let title      = tags.title  || pathBasename(rawName);
                let coverDataUrl = null;
                if (tags.picture) {
                    coverDataUrl = `data:${tags.picture.format};base64,${arrayBufferToBase64(tags.picture.data)}`;
                }
                if (!albumsMap.has(albumName)) {
                    albumsMap.set(albumName, { albumName, artistName, coverDataUrl, tracks: [] });
                }
                const alb = albumsMap.get(albumName);
                if (!alb.coverDataUrl && coverDataUrl) alb.coverDataUrl = coverDataUrl;
                alb.tracks.push({ title, rawName, url: isUrl ? item : null, file: isUrl ? null : item });
            } catch {
                const key = 'Unknown Album';
                if (!albumsMap.has(key)) albumsMap.set(key, { albumName: key, artistName: 'Unknown', coverDataUrl: null, tracks: [] });
                albumsMap.get(key).tracks.push({ title: pathBasename(rawName), rawName, url: isUrl ? item : null, file: isUrl ? null : item });
            }
            done++;
            setStatus(`Scanning ${Math.round((done / todo.length) * 100)}%`);
        }));

        parsedAlbums = Array.from(albumsMap.values());
        providePlaceholders();
        if (i === 0) initPlayer(true);
    }

    parsedAlbums = Array.from(albumsMap.values());
    providePlaceholders();
    buildFlatQueue();
    initPlayer();
}

function providePlaceholders() {
    parsedAlbums.forEach(a => {
        if (!a.coverDataUrl) {
            a.coverDataUrl = generatePlaceholderSvg(a.albumName);
        }
    });
}

function generatePlaceholderSvg(name) {
    const hue = Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;
    const c1  = `hsl(${hue},55%,25%)`;
    const c2  = `hsl(${(hue + 60) % 360},55%,18%)`;
    const initial = (name[0] || '?').toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
        <rect width="180" height="180" fill="url(#g)" rx="12"/>
        <text x="90" y="105" font-family="Space Grotesk,Inter,sans-serif" font-size="72" font-weight="700"
              fill="rgba(255,255,255,0.25)" text-anchor="middle">${initial}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ── Flat Queue Builder ────────────────────────────────────────
function buildFlatQueue() {
    flatQueue = [];
    parsedAlbums.forEach((album, ai) => {
        album.tracks.forEach((track, ti) => {
            flatQueue.push({ title: track.title, albumName: album.albumName, coverDataUrl: album.coverDataUrl, albumIdx: ai, trackIdx: ti });
        });
    });
    if (isShuffle) rebuildShuffleOrder();
    renderQueue();
    queueCount.textContent = `${flatQueue.length} track${flatQueue.length !== 1 ? 's' : ''}`;
}

function rebuildShuffleOrder() {
    shuffledOrder = flatQueue.map((_, i) => i);
    for (let i = shuffledOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
    }
}

function getQueueIndex(albumIdx, trackIdx) {
    return flatQueue.findIndex(q => q.albumIdx === albumIdx && q.trackIdx === trackIdx);
}

// ── Player Init ───────────────────────────────────────────────
function initPlayer(silent = false) {
    if (!silent) {
        uploadView.classList.add('hidden');
        playerView.classList.remove('hidden');
    }
    if (parsedAlbums.length > 0 && currentAlbumIndex === 0 && !isPlaying && !audioPlayer.src) {
        currentAlbumIndex = Math.floor(parsedAlbums.length / 2);
    }
    buildFlatQueue();
    renderCoverflow();
    updateTrackInfo();
    if (!silent) setStatus('Ready');
}

// ── CoverFlow ─────────────────────────────────────────────────
function renderCoverflow() {
    coverflowContainer.innerHTML = '';
    parsedAlbums.forEach((album, idx) => {
        const el  = document.createElement('div');
        el.className = 'cover-item';
        el.dataset.idx = idx;
        const img = document.createElement('img');
        img.src = album.coverDataUrl;
        img.alt = album.albumName;
        img.draggable = false;
        el.appendChild(img);
        coverflowContainer.appendChild(el);
    });
    updateCoverflowTransforms();
}

function updateCoverflowTransforms() {
    Array.from(coverflowContainer.children).forEach((cover, idx) => {
        const diff = idx - currentAlbumIndex;
        cover.className = 'cover-item';
        if      (diff ===  0) cover.classList.add('cover-center');
        else if (diff === -1) cover.classList.add('cover-left-1');
        else if (diff === -2) cover.classList.add('cover-left-2');
        else if (diff  <  -2) cover.classList.add('cover-left-hidden');
        else if (diff ===  1) cover.classList.add('cover-right-1');
        else if (diff ===  2) cover.classList.add('cover-right-2');
        else if (diff  >   2) cover.classList.add('cover-right-hidden');
    });
    applyAlbumColor();
    updateTrackInfo();
}

// ── Dynamic Color Backdrop ────────────────────────────────────
function applyAlbumColor() {
    const album = parsedAlbums[currentAlbumIndex];
    if (!album) return;
    const src = album.coverDataUrl;
    if (src.startsWith('data:image/svg')) {
        albumBackdrop.style.background = 'transparent';
        return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        c.getContext('2d').drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = c.getContext('2d').getImageData(0, 0, 1, 1).data;
        albumBackdrop.style.background =
            `radial-gradient(ellipse at 50% 0%, rgba(${r},${g},${b},0.8) 0%, transparent 70%)`;
    };
    img.src = src;
}

// ── Queue Panel ───────────────────────────────────────────────
function renderQueue() {
    queueList.innerHTML = '';
    flatQueue.forEach((item, qi) => {
        const row = document.createElement('div');
        row.className = 'queue-item' + (qi === currentQueuePos ? ' active' : '');
        row.dataset.qi = qi;

        const thumb = document.createElement('img');
        thumb.className = 'queue-thumb';
        thumb.src = item.coverDataUrl;
        thumb.alt = item.albumName;

        const meta = document.createElement('div');
        meta.className = 'queue-meta';
        meta.innerHTML = `<div class="queue-track-name">${escHtml(item.title)}</div>
                          <div class="queue-album-name">${escHtml(item.albumName)}</div>`;

        const viz = document.createElement('div');
        viz.className = 'viz-bars';
        viz.innerHTML = '<div class="viz-bar"></div>'.repeat(4);

        row.appendChild(thumb);
        row.appendChild(meta);
        row.appendChild(viz);
        row.addEventListener('click', () => jumpToQueueItem(qi));
        queueList.appendChild(row);
    });
    scrollQueueToActive();
}

function scrollQueueToActive() {
    const active = queueList.querySelector('.queue-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Track Info ────────────────────────────────────────────────
function updateTrackInfo() {
    if (!parsedAlbums.length) return;
    const album = parsedAlbums[currentAlbumIndex];
    const qi    = flatQueue[currentQueuePos];
    if (audioPlayer.src && qi && qi.albumIdx === currentAlbumIndex) {
        trackTitleElem.textContent  = qi.title;
        trackArtistElem.textContent = album.artistName;
    } else {
        trackTitleElem.textContent  = album.albumName;
        trackArtistElem.textContent = album.artistName;
    }
}

function setStatus(txt, playing = null) {
    statusText.textContent = txt;
    if (playing !== null) {
        statusDot.classList.toggle('playing', playing);
    }
}

// ── Playback ──────────────────────────────────────────────────
function getEffectiveQueuePos(pos) {
    if (isShuffle && shuffledOrder.length) return shuffledOrder[pos];
    return pos;
}

function playByQueuePos(pos) {
    currentQueuePos = pos;
    const qi = flatQueue[getEffectiveQueuePos(pos)];
    if (!qi) return;
    currentAlbumIndex = qi.albumIdx;
    const track = parsedAlbums[qi.albumIdx].tracks[qi.trackIdx];
    ensureAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (track.url) {
        audioPlayer.src = track.url;
    } else {
        if (audioPlayer.src?.startsWith('blob:')) URL.revokeObjectURL(audioPlayer.src);
        audioPlayer.src = URL.createObjectURL(track.file);
    }
    audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayIcon();
        updateCoverflowTransforms();
        updateTrackInfo();
        renderQueue();
        setStatus('Playing', true);
    }).catch(err => console.error('Playback error:', err));
}

function jumpToQueueItem(qi) {
    playByQueuePos(qi);
}

function togglePlayPause() {
    if (!flatQueue.length) return;
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        setStatus('Paused', false);
    } else {
        if (!audioPlayer.src) {
            playByQueuePos(currentQueuePos);
        } else {
            ensureAudioContext();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            audioPlayer.play();
            isPlaying = true;
            setStatus('Playing', true);
        }
    }
    updatePlayIcon();
}

function nextTrack() {
    if (!flatQueue.length) return;
    if (repeatMode === 2) { audioPlayer.currentTime = 0; audioPlayer.play(); return; }
    const next = currentQueuePos + 1;
    if (next < flatQueue.length) {
        playByQueuePos(next);
    } else if (repeatMode === 1) {
        playByQueuePos(0);
    } else {
        isPlaying = false;
        updatePlayIcon();
        setStatus('Ready', false);
    }
}

function prevTrack() {
    if (!flatQueue.length) return;
    if (audioPlayer.currentTime > 3) { audioPlayer.currentTime = 0; return; }
    const prev = currentQueuePos - 1;
    if (prev >= 0) playByQueuePos(prev);
    else if (repeatMode === 1) playByQueuePos(flatQueue.length - 1);
}

function updatePlayIcon() {
    iconPlay.style.display  = isPlaying ? 'none' : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
}

// ── Audio Events ──────────────────────────────────────────────
audioPlayer.addEventListener('timeupdate', () => {
    const dur = audioPlayer.duration || 0;
    timeElapsedElem.textContent = formatTime(audioPlayer.currentTime);
    timeTotalElem.textContent   = formatTime(dur);
    if (dur > 0) progressFillElem.style.width = `${(audioPlayer.currentTime / dur) * 100}%`;
});

audioPlayer.addEventListener('ended', nextTrack);

audioPlayer.addEventListener('play',  () => { isPlaying = true;  updatePlayIcon(); setStatus('Playing', true); });
audioPlayer.addEventListener('pause', () => { isPlaying = false; updatePlayIcon(); setStatus('Paused', false); });

// ── Controls ──────────────────────────────────────────────────
btnPlay.addEventListener('click', togglePlayPause);
btnNext.addEventListener('click', nextTrack);
btnPrev.addEventListener('click', prevTrack);

btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle('active', isShuffle);
    if (isShuffle) rebuildShuffleOrder();
});

btnRepeat.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    btnRepeat.classList.toggle('active', repeatMode > 0);
    btnRepeat.title = ['Repeat: Off', 'Repeat: All', 'Repeat: One'][repeatMode];
    btnRepeat.style.opacity = repeatMode === 0 ? '' : '1';
});

// Progress seek
progressBgElem.addEventListener('click', e => {
    if (!audioPlayer.src || !audioPlayer.duration) return;
    const r = progressBgElem.getBoundingClientRect();
    audioPlayer.currentTime = ((e.clientX - r.left) / r.width) * audioPlayer.duration;
});

// Drag-to-seek
let seeking = false;
progressBgElem.addEventListener('mousedown', () => seeking = true);
window.addEventListener('mousemove', e => {
    if (!seeking || !audioPlayer.duration) return;
    const r = progressBgElem.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    audioPlayer.currentTime = pct * audioPlayer.duration;
});
window.addEventListener('mouseup', () => seeking = false);

// CoverFlow click
coverflowContainer.addEventListener('click', e => {
    const el = e.target.closest('.cover-item');
    if (!el) return;
    const idx = parseInt(el.dataset.idx);
    if (idx === currentAlbumIndex) {
        togglePlayPause();
    } else {
        currentAlbumIndex = idx;
        updateCoverflowTransforms();
    }
});

// Wheel scroll
coverflowContainer.addEventListener('wheel', e => {
    if (!parsedAlbums.length) return;
    e.preventDefault();
    if (e.deltaY > 0 && currentAlbumIndex < parsedAlbums.length - 1) currentAlbumIndex++;
    else if (e.deltaY < 0 && currentAlbumIndex > 0) currentAlbumIndex--;
    updateCoverflowTransforms();
}, { passive: false });

// Swipe / drag coverflow
let dragStartX = null, dragAlbum = null;
coverflowContainer.addEventListener('mousedown', e => { dragStartX = e.clientX; dragAlbum = currentAlbumIndex; });
window.addEventListener('mousemove', e => {
    if (dragStartX === null || !parsedAlbums.length) return;
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) > 50) {
        currentAlbumIndex = Math.max(0, Math.min(parsedAlbums.length - 1, dragAlbum + (delta > 0 ? -1 : 1)));
        dragStartX = e.clientX;
        dragAlbum  = currentAlbumIndex;
        updateCoverflowTransforms();
    }
});
window.addEventListener('mouseup', () => { dragStartX = null; });

// Keyboard shortcuts
window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.code) {
        case 'Space':     e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': nextTrack(); break;
        case 'ArrowLeft':  prevTrack(); break;
        case 'ArrowUp':
            e.preventDefault();
            audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.05);
            volumeSlider.value = Math.round(audioPlayer.volume * 100);
            volPct.textContent = volumeSlider.value + '%';
            break;
        case 'ArrowDown':
            e.preventDefault();
            audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.05);
            volumeSlider.value = Math.round(audioPlayer.volume * 100);
            volPct.textContent = volumeSlider.value + '%';
            break;
    }
});

// Volume
volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value / 100;
    volPct.textContent = volumeSlider.value + '%';
});
audioPlayer.volume = 0.8;

// ── Server / SSE ──────────────────────────────────────────────
async function fetchServerLibrary() {
    try {
        const res = await fetch('/api/library');
        if (!res.ok) return false;
        const files = await res.json();
        if (files.length > 0) {
            const urls = files.map(f => `${window.location.origin}/music/${encodeURIComponent(f)}`);
            await parseAndLoadFiles(urls);
        } else {
            if (!uploadView.classList.contains('hidden'))
                uploadView.querySelector('p').textContent = 'Your Music folder is empty. Choose a folder below.';
        }
        return true;
    } catch { return false; }
}

function setupSSE() {
    const ev = new EventSource('/events');
    ev.onmessage = e => { if (e.data === 'update') fetchServerLibrary(); };
}

window.addEventListener('load', async () => {
    const ok = await fetchServerLibrary();
    if (ok) { setupSSE(); return; }

    // Fallback: direct file via VBS
    if (typeof window.startupFile !== 'undefined' && window.startupFile) {
        const url = 'file:///' + window.startupFile.replace(/\\/g, '/');
        try {
            const blob = await (await fetch(url)).blob();
            const filename = window.startupFile.split('\\').pop();
            const file = new File([blob], filename, { type: 'audio/mpeg' });
            await parseAndLoadFiles([file]);
            if (parsedAlbums.length) playByQueuePos(0);
        } catch (err) {
            console.error('Could not load direct file:', err);
        }
    }
});

// Listen for file open events from Electron main process
try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('open-file', (event, filePath) => {
        handleExternalFile(filePath);
    });

    async function handleExternalFile(filePath) {
        const fs = require('fs');
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = filePath.split(/[/\\]/).pop();
            const file = new File([fileBuffer], fileName, { type: 'audio/mpeg' });
            await parseAndLoadFiles([file]);
            if (parsedAlbums.length) playByQueuePos(0);
        } catch (err) {
            console.error('Error loading external file:', err);
        }
    }
} catch (e) {
    // Not in Electron environment
}
