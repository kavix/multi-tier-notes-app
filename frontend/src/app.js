// 5-Tier App Frontend Logic

const API_BASE = '/api';

const visitCountEl = document.getElementById('visitCount');
const noteForm = document.getElementById('noteForm');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const submitBtn = document.getElementById('submitBtn');
const submitSpinner = document.getElementById('submitSpinner');
const formAlert = document.getElementById('formAlert');
const notesContainer = document.getElementById('notesContainer');
const refreshBtn = document.getElementById('refreshBtn');
const cacheBadge = document.getElementById('cacheBadge');
const cacheText = document.getElementById('cacheText');

// System status indicators
const dotBackend = document.getElementById('dotBackend');
const textBackend = document.getElementById('textBackend');
const dotRedis = document.getElementById('dotRedis');
const textRedis = document.getElementById('textRedis');
const dotPostgres = document.getElementById('dotPostgres');
const textPostgres = document.getElementById('textPostgres');

// Helper to show alerts
function showAlert(message, type = 'success') {
  formAlert.textContent = message;
  formAlert.className = `alert alert-${type}`;
  formAlert.classList.remove('hidden');
  setTimeout(() => {
    formAlert.classList.add('hidden');
  }, 4000);
}

// Format timestamp
function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
           ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}

// 1. Fetch & increment visit count
async function fetchVisits() {
  try {
    const res = await fetch(`${API_BASE}/visits`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    visitCountEl.textContent = data.visits.toLocaleString();
  } catch (err) {
    console.error('Error fetching visits:', err);
    visitCountEl.textContent = 'Err';
  }
}

// 2. Fetch health status of tiers
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    // Backend status
    dotBackend.className = 'dot ' + (data.status === 'ok' ? 'live' : 'warn');
    textBackend.textContent = data.status === 'ok' ? 'Online' : 'Degraded';

    // Redis status
    dotRedis.className = 'dot ' + (data.redis === 'ok' ? 'live' : 'error');
    textRedis.textContent = data.redis === 'ok' ? 'Connected' : 'Disconnected';

    // Postgres status
    dotPostgres.className = 'dot ' + (data.postgres === 'ok' ? 'live' : 'error');
    textPostgres.textContent = data.postgres === 'ok' ? 'Connected' : 'Disconnected';
  } catch (err) {
    console.error('Error checking health:', err);
    dotBackend.className = 'dot error';
    textBackend.textContent = 'Offline';
    dotRedis.className = 'dot error';
    textRedis.textContent = 'Offline';
    dotPostgres.className = 'dot error';
    textPostgres.textContent = 'Offline';
  }
}

// 3. Fetch notes list with cache status
async function fetchNotes() {
  try {
    const res = await fetch(`${API_BASE}/notes`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    // Update Cache badge
    if (data.cached) {
      cacheBadge.className = 'cache-badge cached';
      cacheText.textContent = `Redis Cache Hit (TTL: ${data.ttl_remaining ?? 0}s remaining)`;
    } else {
      cacheBadge.className = 'cache-badge postgres';
      cacheText.textContent = `PostgreSQL Direct Hit (Cached for 10s)`;
    }

    // Render notes
    renderNotes(data.notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    cacheBadge.className = 'cache-badge';
    cacheText.textContent = 'Failed to load';
    notesContainer.innerHTML = `<div class="empty-state">Unable to load notes. Please verify backend connection.</div>`;
  }
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = `<div class="empty-state">No notes found. Create your first note on the left!</div>`;
    return;
  }

  notesContainer.innerHTML = notes
    .map(
      (n) => `
      <div class="note-item">
        <div class="note-item-header">
          <span class="note-item-title">${escapeHtml(n.title)}</span>
          <span class="note-item-date">${formatDate(n.created_at)}</span>
        </div>
        <div class="note-item-content">${escapeHtml(n.content)}</div>
      </div>
    `
    )
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 4. Handle form submission
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title || !content) {
    showAlert('Please fill in both title and content.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitSpinner.classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${res.status}`);
    }

    noteTitleInput.value = '';
    noteContentInput.value = '';
    showAlert('Note created and saved to PostgreSQL successfully!', 'success');

    // Immediately fetch updated notes (cache was invalidated)
    await fetchNotes();
  } catch (err) {
    console.error('Error creating note:', err);
    showAlert(err.message || 'Failed to save note.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitSpinner.classList.add('hidden');
  }
});

// Refresh button listener
refreshBtn.addEventListener('click', () => {
  fetchNotes();
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  fetchVisits();
  checkHealth();
  fetchNotes();

  // Periodically refresh health status every 15s
  setInterval(checkHealth, 15000);
});
