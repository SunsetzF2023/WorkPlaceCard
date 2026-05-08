// renderLog.js

export function renderLog(logs) {
  const el = document.getElementById('game-log');
  if (!el) return;
  el.innerHTML = logs.slice(0, 20).map(entry => `
    <div class="log-entry log-${entry.type}">
      <span class="log-turn">T${entry.turn}</span>
      <span class="log-msg">${entry.message}</span>
    </div>
  `).join('');
}
