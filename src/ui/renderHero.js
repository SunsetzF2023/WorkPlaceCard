// renderHero.js

import { GameState } from '../core/gameState.js';
import { ActionHandler } from '../core/actionHandler.js';

export function renderHero(side, player) {
  const el = document.getElementById(`${side}-hero`);
  if (!el || !player.hero) return;

  const hero = player.hero;
  const canUseSkill = side === 'player'
    && GameState.currentTurn === 'player'
    && player.currentMana >= hero.heroSkill.cost
    && !GameState.gameOver;

  el.innerHTML = `
    <div class="hero-portrait">${hero.art}</div>
    <div class="hero-info">
      <div class="hero-name">${hero.name}</div>
      <div class="hero-hp ${player.health <= 10 ? 'low' : ''}">
        ${player.armor > 0 ? `<span class="hero-armor">🛡️${player.armor}</span>` : ''}
        ❤️ ${player.health}
      </div>
    </div>
    ${side === 'player' ? `
      <button class="hero-skill-btn ${canUseSkill ? 'usable' : ''}"
        onclick="useHeroSkill()"
        ${canUseSkill ? '' : 'disabled'}>
        <div class="skill-cost">${hero.heroSkill.cost}</div>
        <div class="skill-name">${hero.heroSkill.name}</div>
      </button>
    ` : ''}
  `;
}

window.useHeroSkill = function() {
  ActionHandler.useHeroSkill('player');
};
