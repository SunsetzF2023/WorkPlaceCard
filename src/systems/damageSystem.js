// damageSystem.js

import { GameState } from '../core/gameState.js';
import { EffectResolver } from '../core/effectResolver.js';
import { RuleEngine } from '../core/ruleEngine.js';

export const DamageSystem = {

  dealDamageToCard(side, card, amount) {
    if (amount <= 0) return;
    if (card.sleeping) {
      GameState.addLog(`${card.nameZh} 沉睡中，免疫此次伤害`, 'info');
      return;
    }
    card.health -= amount;
    if (card.health <= 0) {
      this.destroyCard(side, card);
    }
  },

  dealDamageToHero(side, amount) {
    const p = GameState.getPlayer(side);
    // 三班倒：无法治疗，但伤害正常
    if (p.armor > 0) {
      const absorbed = Math.min(p.armor, amount);
      p.armor -= absorbed;
      amount -= absorbed;
    }
    p.health -= amount;
    if (p.health <= 0) {
      p.health = 0;
      // Check for game over
      const opponent = side === 'player' ? 'opponent' : 'player';
      GameState.gameOver = true;
      GameState.winner = opponent;
      console.log(`Game Over! ${opponent} wins!`);
      GameState.addLog(`🎮 游戏结束！${side === 'player' ? '你' : '对手'}被击败了！`, 'info');
    }
  },

  destroyCard(side, card) {
    const p = GameState.getPlayer(side);
    const idx = p.board.indexOf(card);
    if (idx > -1) {
      p.board.splice(idx, 1);
      p.graveyard.push(card);
      GameState.addLog(`💼 ${card.nameZh} 已离职，进入【离职档案】`, 'death');
      // 触发离职补偿/遗留Bug
      EffectResolver.resolveOnDeath(side, card);
    }
  },

  healCard(side, card, amount) {
    // 三班倒效果：无法治疗
    const p = GameState.getPlayer(side);
    const threeShift = p.board.some(c => c.passiveId === 'three_shift_active');
    if (threeShift) {
      GameState.addLog(`⚠️ 三班倒效果：无法治疗`, 'info');
      return;
    }
    card.health += amount;
  },

  healHero(side, amount) {
    const p = GameState.getPlayer(side);
    const threeShift = p.board.some(c => c._threeShiftBonus);
    if (!threeShift) {
      p.health = Math.min(30, p.health + amount);
    }
  }
};
