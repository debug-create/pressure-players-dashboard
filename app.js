const state = { role: 'batters', selected: null, query: '', data: null };
const $ = (selector) => document.querySelector(selector);
const fmt = (value, digits = 2) => `${value < 0 ? '−' : value > 0 ? '+' : ''}${Math.abs(value).toFixed(digits)}`;
const pct = (value) => `${Math.round(value * 100)}%`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const position = (value) => Math.max(0, Math.min(100, (value + 5) / 20 * 100));

function render() {
  if (!state.data) return;
  const players = state.data[state.role];
  const shown = players.filter(p => `${p.name} ${p.teams}`.toLowerCase().includes(state.query));
  if (!shown.some(p => p.id === state.selected)) state.selected = shown[0]?.id ?? null;
  $('#rank-list').innerHTML = shown.length ? shown.map(p => {
    const left = position(p.low), right = position(p.high), point = position(p.rating);
    return `<button type="button" class="rank-row ${p.id === state.selected ? 'selected' : ''}" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.name)}, rank ${p.rank}, rating ${fmt(p.rating)}">
      <span class="rank-player"><span class="rank-index">${String(p.rank).padStart(2, '0')}</span><span><span class="rank-name">${escapeHtml(p.name)}</span><span class="rank-sub">${p.balls} pressure balls</span></span></span>
      <span class="mini-chart"><span class="mini-range ${p.low < 0 ? 'negative' : ''}" style="left:${left}%;width:${Math.max(1,right-left)}%"></span><span class="mini-point" style="left:calc(${point}% - 6px)"></span><span class="mini-value">${fmt(p.rating)}</span></span>
    </button>`;
  }).join('') : '<div class="empty">No player matches that search.</div>';
  $('#rank-list').querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => { state.selected = button.dataset.id; render(); }));
  const player = players.find(p => p.id === state.selected);
  $('#player-card').innerHTML = player ? playerCard(player) : '<div class="empty">Search for a player to view their evidence.</div>';
}

function playerCard(p) {
  const max = Math.max(Math.abs(p.pressureRate), Math.abs(p.normalRate), 3);
  const width = x => `${Math.min(100, Math.abs(x) / max * 100)}%`;
  const comparison = p.pressureBetterProbability >= .8 ? 'pressure record trends above normal play' : p.pressureBetterProbability <= .2 ? 'pressure record trends below normal play' : 'pressure and normal records are not clearly separated';
  return `<div class="player-top"><div class="player-topline"><span>#${String(p.rank).padStart(2,'0')} ${state.role === 'batters' ? 'BATTER' : 'BOWLER'}</span><span>FINAL SHORTLIST ↗</span></div><h3>${escapeHtml(p.name)}</h3><div class="player-teams">${escapeHtml(p.teams)}</div><div class="player-score"><strong>${fmt(p.rating)}</strong><span>×10⁻³ WPA / ball</span></div><div class="player-ci">80% interval ${fmt(p.low)} to ${fmt(p.high)}</div></div>
    <div class="player-body"><div class="metric-pair"><div><strong>${p.balls}</strong><span>pressure balls</span></div><div><strong>${p.matches}</strong><span>pressure matches</span></div></div>
    <div class="comparison-title">OBSERVED VALUE: PRESSURE VS NORMAL</div>
    <div class="comparison-row"><span>Pressure</span><span class="comparison-track"><span class="comparison-fill" style="width:${width(p.pressureRate)}"></span></span><b>${fmt(p.pressureRate)}</b></div>
    <div class="comparison-row normal"><span>Normal</span><span class="comparison-track"><span class="comparison-fill" style="width:${width(p.normalRate)}"></span></span><b>${fmt(p.normalRate)}</b></div>
    <div class="card-note"><strong>${pct(p.pressureBetterProbability)} chance</strong> that the observed pressure rate exceeds the normal rate in the match bootstrap; ${comparison}. These observed rates differ from the selected, quality-adjusted rating above.</div>
    <div class="badge-row"><span class="badge ${p.low <= 0 ? 'warn' : ''}">${p.low > 0 ? 'Interval above zero' : 'Interval crosses zero'}</span><span class="badge ${p.survivesBest ? '' : 'warn'}">${p.survivesBest ? 'Top 10 without best match' : `Rank ${p.leaveBestRank} without best match`}</span></div></div>`;
}

document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => {
  state.role = button.dataset.role;
  state.selected = null;
  document.querySelectorAll('[data-role]').forEach(tab => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); });
  render();
}));
$('#search').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); state.selected = null; render(); });
fetch('data.json').then(response => { if (!response.ok) throw Error('Data unavailable'); return response.json(); }).then(data => { state.data = data; render(); }).catch(() => { $('#rank-list').innerHTML = '<div class="empty">The player data could not be loaded. Please refresh the page.</div>'; $('#player-card').innerHTML = ''; });
