// renderBoard.js

import { GameState } from '../core/gameState.js';
import { RuleEngine } from '../core/ruleEngine.js';
import { ActionHandler } from '../core/actionHandler.js';
import { renderBoardCard } from './renderCard.js';
import { findValidTargets } from '../utils/findTarget.js';
import { renderGame } from './renderGame.js';

export function renderBoard(side, player) {
  const container = document.getElementById(`${side}-board`);
  if (!container) return;
  container.innerHTML = '';

  const isPlayerBoard = side === 'player';

  player.board.forEach((card) => {
    const isSelected = GameState.selectedBoardCard === card;

    let isValidTarget = false;
    if (GameState.attackPhase && side === 'opponent') {
      const { boardTargets } = findValidTargets('player');
      isValidTarget = boardTargets.includes(card);
    }

    const el = renderBoardCard(card, side, isSelected, isValidTarget);

    el.addEventListener('click', () => onBoardCardClick(side, card));
    container.appendChild(el);
  });

  // 对方英雄区域点击（攻击英雄）
  if (side === 'opponent') {
    const heroZone = document.getElementById('opponent-hero-zone');
    if (heroZone) {
      const { canHitHero } = GameState.attackPhase
        ? findValidTargets('player')
        : { canHitHero: false };
      heroZone.classList.toggle('valid-hero-target', GameState.attackPhase && canHitHero);
    }
  }
}

function onBoardCardClick(side, card) {
  if (GameState.gameOver) return;

  // 玩家自己的卡：选为攻击者
  if (side === 'player') {
    if (GameState.currentTurn !== 'player') return;

    if (GameState.selectedCard !== null) {
      // 手牌选中状态下，点击自己场上的卡不做处理
      return;
    }

    if (RuleEngine.canAttack('player', card)) {
      if (GameState.selectedBoardCard === card) {
        // 取消选中
        GameState.selectedBoardCard = null;
        GameState.attackPhase = false;
      } else {
        GameState.selectedBoardCard = card;
        GameState.attackPhase = true;
      }
      renderGame();
    }
    return;
  }

  // 对方的卡：作为攻击目标
  if (side === 'opponent' && GameState.attackPhase && GameState.selectedBoardCard) {
    const { boardTargets } = findValidTargets('player');
    if (boardTargets.includes(card)) {
      ActionHandler.attack('player', GameState.selectedBoardCard, 'opponent', card, false);
    }
    return;
  }

  // 出牌打目标（未来扩展：针对性法术）
  if (side === 'opponent' && GameState.selectedCard !== null) {
    // TODO: 法术牌指向目标
  }
}

// 供HTML直接调用：点击对方英雄
window.attackHero = function() {
  if (!GameState.attackPhase || !GameState.selectedBoardCard) return;
  const { canHitHero } = findValidTargets('player');
  if (canHitHero) {
    ActionHandler.attack('player', GameState.selectedBoardCard, 'opponent', null, true);
  }
};
