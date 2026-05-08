// ruleEngine.js - 游戏规则合法性判断

import { GameState } from './gameState.js';

export const RuleEngine = {

  // 是否可以出牌
  canPlayCard(side, card) {
    if (GameState.currentTurn !== side) return false;
    if (GameState.gameOver) return false;

    const p = GameState.getPlayer(side);

    // 计算实际费用（加班 -1；离职谈话 翻倍）
    let cost = this.getActualCost(card);
    if (p.currentMana < cost) return false;

    // 场上最多7张
    if (p.board.length >= 7) return false;

    return true;
  },

  // 获取卡牌实际费用
  getActualCost(card) {
    let cost = card.cost;

    // 加班关键字
    if (card.keywords?.includes('加班')) cost = Math.max(0, cost - 1);

    // 离职谈话全局效果
    const dismissal = GameState.globalEffects.find(e => e.type === 'dismissal_talk');
    if (dismissal) cost = cost * 2;

    return cost;
  },

  // 是否可以攻击
  canAttack(side, attackerCard) {
    if (GameState.currentTurn !== side) return false;
    if (GameState.gameOver) return false;
    if (!attackerCard) return false;

    // 已攻击过
    if (attackerCard.hasAttacked) return false;

    // 沉睡状态
    if (attackerCard.sleeping) return false;

    // 攻击力必须大于0
    if (attackerCard.attack <= 0) return false;

    return true;
  },

  // 是否是合法攻击目标
  isValidTarget(attackerSide, targetCard, targetIsHero = false) {
    const opponent = GameState.getOpponent(attackerSide);

    if (targetIsHero) {
      // 若敌方有背锅卡，不能直接打英雄
      const hasTaunt = opponent.board.some(c => c.keywords?.includes('背锅') && !c.sleeping);
      return !hasTaunt;
    }

    // 摸鱼：未攻击前不能被选中
    if (targetCard.keywords?.includes('摸鱼') && !targetCard.hasAttacked) return false;

    // 背锅：若场上有背锅，必须优先打背锅
    const hasTaunt = opponent.board.some(c => c.keywords?.includes('背锅') && !c.sleeping);
    if (hasTaunt && !targetCard.keywords?.includes('背锅')) return false;

    return true;
  },

  // 检查游戏是否结束
  checkGameOver() {
    if (GameState.player.health <= 0) {
      GameState.gameOver = true;
      GameState.winner = 'opponent';
      return true;
    }
    if (GameState.opponent.health <= 0) {
      GameState.gameOver = true;
      GameState.winner = 'player';
      return true;
    }
    return false;
  },

  // 卡牌品质等级（用于职场PUA判断）
  qualityRank: {
    'common': 1,
    'rare': 2,
    'epic': 3,
    'legendary': 4,
    'uncommon': 2
  },

  isLowerQuality(cardA, cardB) {
    return (this.qualityRank[cardA.quality] || 1) < (this.qualityRank[cardB.quality] || 1);
  }
};
