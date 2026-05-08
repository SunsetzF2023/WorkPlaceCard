// drawSystem.js

import { GameState } from '../core/gameState.js';

export const DrawSystem = {
  drawCards(side, count) {
    const p = GameState.getPlayer(side);
    for (let i = 0; i < count; i++) {
      if (p.deck.length === 0) {
        p.fatigueDamage = (p.fatigueDamage || 0) + 1;
        p.health -= p.fatigueDamage;
        GameState.addLog(`💀 ${side === 'player' ? '你' : '对手'} 牌库耗尽，受到 ${p.fatigueDamage} 点疲劳伤害`, 'damage');
      } else {
        const card = p.deck.shift();
        if (p.hand.length < 10) {
          p.hand.push(card);
          if (side === 'player') {
            GameState.addLog(`🃏 抽到 ${card.nameZh}`, 'info');
          }
        } else {
          p.graveyard.push(card);
          GameState.addLog(`⚠️ 手牌已满，${card.nameZh} 被丢弃到【离职档案】`, 'info');
        }
      }
    }
  }
};
