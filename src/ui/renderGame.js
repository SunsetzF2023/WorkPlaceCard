// renderGame.js - 主渲染入口

import { GameState } from '../core/gameState.js';
import { renderHero } from './renderHero.js';
import { renderBoard } from './renderBoard.js';
import { renderCard } from './renderCard.js';
import { renderLog } from './renderLog.js';
import { RuleEngine } from '../core/ruleEngine.js';
import { ActionHandler } from '../core/actionHandler.js';

export function renderGame() {
  // 英雄区域
  renderHero('player', GameState.player);
  renderHero('opponent', GameState.opponent);

  // 棋盘
  renderBoard('player', GameState.player);
  renderBoard('opponent', GameState.opponent);

  // 手牌
  renderHand('player', GameState.player);

  // 对手手牌（背面）
  renderOpponentHand(GameState.opponent);

  // 日志
  renderLog(GameState.log);

  // 法力值显示
  renderMana('player', GameState.player);
  renderMana('opponent', GameState.opponent);

  // 设置拖放区域
  setupBoardDropZones();

  // 全局效果显示
  renderGlobalEffects();

  if (GameState.gameOver) {
    showGameOver(GameState.winner);
  }

  // 结束回合按钮状态
  const endBtn = document.getElementById('end-turn-btn');
  if (endBtn) {
    endBtn.disabled = GameState.currentTurn !== 'player' || GameState.gameOver;
    endBtn.textContent = GameState.currentTurn === 'player' ? '结束回合' : '对手回合...';
    endBtn.classList.toggle('active-turn', GameState.currentTurn === 'player');
  }
}

function renderHand(side, player) {
  const container = document.getElementById('player-hand');
  if (!container) {
    console.error('Hand container not found!');
    return;
  }
  container.innerHTML = '';

  console.log(`Rendering ${side} hand with ${player.hand.length} cards:`, player.hand.map(c => c.nameZh));

  player.hand.forEach((card, index) => {
    const el = renderCard(card, index, side);
    const canPlay = RuleEngine.canPlayCard(side, card);
    console.log(`Card ${card.nameZh} (index ${index}) canPlay: ${canPlay}, cost: ${RuleEngine.getActualCost(card)}, currentMana: ${GameState.player.currentMana}`);
    el.classList.toggle('playable', canPlay);
    el.classList.toggle('selected', GameState.selectedCard === index);
    
    // Add drag and drop functionality
    if (side === 'player' && canPlay) {
      el.draggable = true;
      el.addEventListener('dragstart', (e) => onDragStart(e, index));
      el.addEventListener('dragend', (e) => onDragEnd(e));
    }
    
    el.addEventListener('click', () => onHandCardClick(index, canPlay));
    container.appendChild(el);
  });

  if (player.hand.length === 0) {
    container.innerHTML = '<div style="color: var(--text-dim); font-size: 0.9rem;">No cards in hand</div>';
  }
}

function renderOpponentHand(player) {
  const container = document.getElementById('opponent-hand');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < player.hand.length; i++) {
    const back = document.createElement('div');
    back.className = 'card card-back';
    back.innerHTML = `<div class="card-back-art">📄</div>`;
    container.appendChild(back);
  }
}

function renderMana(side, player) {
  const el = document.getElementById(`${side}-mana`);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < player.maxMana; i++) {
    const gem = document.createElement('div');
    gem.className = 'mana-gem' + (i < player.currentMana ? ' filled' : ' empty');
    el.appendChild(gem);
  }
  const label = document.getElementById(`${side}-mana-label`);
  if (label) label.textContent = `${player.currentMana}/${player.maxMana}`;
}

function onHandCardClick(index, canPlay) {
  if (GameState.currentTurn !== 'player' || GameState.gameOver) return;
  if (!canPlay) return;
  if (GameState.attackPhase) {
    GameState.attackPhase = false;
    GameState.selectedBoardCard = null;
  }
  
  // If card is already selected, play it
  if (GameState.selectedCard === index) {
    playSelectedCard();
  } else {
    GameState.selectedCard = index;
  }
  renderGame();
}

function playSelectedCard() {
  const index = GameState.selectedCard;
  if (index === null) return;
  
  const success = ActionHandler.playCard('player', index);
  if (success) {
    GameState.selectedCard = null;
  }
}

// Drag and drop handlers
let draggedCardIndex = null;

function onDragStart(e, index) {
  draggedCardIndex = index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
  e.target.classList.add('dragging');
}

function onDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedCardIndex = null;
}

function setupBoardDropZones() {
  const playerBoard = document.getElementById('player-board');
  if (!playerBoard) return;
  
  // Make board a drop zone
  playerBoard.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    playerBoard.classList.add('drag-over');
  });
  
  playerBoard.addEventListener('dragleave', (e) => {
    playerBoard.classList.remove('drag-over');
  });
  
  playerBoard.addEventListener('drop', (e) => {
    e.preventDefault();
    playerBoard.classList.remove('drag-over');
    
    if (draggedCardIndex !== null) {
      const card = GameState.player.hand[draggedCardIndex];
      const canPlay = RuleEngine.canPlayCard('player', card);
      
      if (canPlay) {
        const success = ActionHandler.playCard('player', draggedCardIndex);
        if (success) {
          GameState.selectedCard = null;
        }
      }
    }
  });
}

function showGameOver(winner) {
  let overlay = document.getElementById('game-over-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="game-over-box">
      <div class="game-over-title">${winner === 'player' ? '🏆 胜利！' : '💀 失败'}</div>
      <div class="game-over-sub">${winner === 'player' ? '恭喜你成功逃脱职场！' : '很遗憾，你被裁员了...'}</div>
      <button onclick="location.reload()" class="restart-btn">重新开始</button>
    </div>
  `;
  overlay.style.display = 'flex';
}

function renderGlobalEffects() {
  const el = document.getElementById('global-effects');
  if (!el) return;
  el.innerHTML = '';
  GameState.globalEffects.forEach(e => {
    const badge = document.createElement('div');
    badge.className = 'effect-badge';
    if (e.type === 'dismissal_talk') {
      badge.textContent = `📋 离职谈话 (${e.turnsLeft}回合)`;
    }
    el.appendChild(badge);
  });
}
