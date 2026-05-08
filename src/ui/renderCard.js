// renderCard.js

import { RuleEngine } from '../core/ruleEngine.js';

const qualityColors = {
  common: '#8a9bb0',
  uncommon: '#4fc3f7',
  rare: '#7c4dff',
  epic: '#ff6d00',
  legendary: '#ffd600'
};

const qualityNames = {
  common: '普通',
  uncommon: '罕见',
  rare: '精英',
  epic: '史诗',
  legendary: '传说'
};

export function renderCard(card, index, side) {
  const el = document.createElement('div');
  el.className = `card card-${card.quality || 'common'}`;
  el.dataset.index = index;
  el.dataset.instanceId = card._instanceId || '';

  const cost = RuleEngine.getActualCost(card);
  const qColor = qualityColors[card.quality] || qualityColors.common;

  const keywordBadges = (card.keywords || []).map(k =>
    `<span class="keyword-badge">${k}</span>`
  ).join('');

  el.innerHTML = `
    <div class="card-cost">${cost}</div>
    <div class="card-art">${card.art || '🃏'}</div>
    <div class="card-name" style="border-color:${qColor}">${card.nameZh || card.name}</div>
    <div class="card-keywords">${keywordBadges}</div>
    <div class="card-stats">
      <span class="card-atk">⚔️${card.attack}</span>
      <span class="card-hp ${card.health <= 1 ? 'low-hp' : ''}">❤️${card.health}</span>
    </div>
    <div class="card-quality" style="color:${qColor}">${qualityNames[card.quality] || ''}</div>
  `;

  // tooltip
  el.title = `${card.nameZh}\n${card.description || ''}\n${card.passive || ''}`;

  // 状态叠加
  if (card.sleeping) {
    el.classList.add('sleeping');
    const zz = document.createElement('div');
    zz.className = 'sleep-overlay';
    zz.textContent = '💤';
    el.appendChild(zz);
  }
  if (card.hasAttacked) el.classList.add('exhausted');

  return el;
}

export function renderBoardCard(card, side, isSelected, isValidTarget) {
  const el = renderCard(card, null, side);
  el.classList.add('board-card');
  if (isSelected) el.classList.add('selected-attacker');
  if (isValidTarget) el.classList.add('valid-target');
  if (card.keywords?.includes('背锅')) el.classList.add('has-taunt');
  return el;
}
