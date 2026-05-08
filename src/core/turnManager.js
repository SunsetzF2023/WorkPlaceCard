// turnManager.js - 回合流程控制

import { GameState } from './gameState.js';
import { DrawSystem } from '../systems/drawSystem.js';
import { renderGame } from '../ui/renderGame.js';
import { SimpleAI } from '../ai/simpleAI.js';

export const TurnManager = {

  // 开始游戏
  startGame() {
    GameState.reset();

    // 双方各抽3张起手牌
    DrawSystem.drawCards('player', 3);
    DrawSystem.drawCards('opponent', 3);

    // 先手
    GameState.currentTurn = 'player';
    this.startTurn('player');
  },

  // 开始某一方的回合
  startTurn(side) {
    const p = GameState.getPlayer(side);
    GameState.currentTurn = side;
    GameState.phase = 'main';

    // 增加法力值上限（最多10）
    p.maxMana = Math.min(10, p.maxMana + 1);
    p.currentMana = p.maxMana;

    // 抽一张牌
    DrawSystem.drawCards(side, 1);

    // 重置场上卡牌的攻击状态
    p.board.forEach(card => {
      card.hasAttacked = false;
      // 处理嗜睡
      if (card.sleeping) {
        card.sleepTurns = (card.sleepTurns || 1) - 1;
        if (card.sleepTurns <= 0) {
          card.sleeping = false;
          GameState.addLog(`${card.nameZh} 从沉睡中醒来`, 'info');
        }
      }
      // 紧急支援：入场回合可直接攻击
      if (card.justSummoned && card.keywords?.includes('紧急支援')) {
        card.hasAttacked = false;
      } else if (card.justSummoned) {
        card.hasAttacked = true; // 新入场普通卡本回合不能攻击
      }
      card.justSummoned = false;

      // 画大饼buff计时
      if (card.bigPictureTurns !== undefined) {
        card.bigPictureTurns--;
        if (card.bigPictureTurns <= 0) {
          card.attack = Math.max(0, card.attack - card.bigPictureBuff || 0);
          card.health = Math.max(1, card.health - card.bigPictureBuff || 0);
          delete card.bigPictureTurns;
          delete card.bigPictureBuff;
        }
      }
    });

    // 产品经理灵感积累
    p.board.forEach(card => {
      if (card.passiveId === 'inspiration_gain') {
        p.inspiration++;
        GameState.addLog(`${card.nameZh} 获得1点灵感（共${p.inspiration}点）`, 'skill');
      }
    });

    // HR三人组：离职谈话效果
    this.checkHREffect();

    if (side === 'player') {
      GameState.addLog(`⚡ 第${GameState.turnNumber}回合 - 你的回合开始`, 'info');
    } else {
      GameState.addLog(`🤖 第${GameState.turnNumber}回合 - 对手回合开始`, 'info');
    }

    renderGame();

    // 如果是AI回合，触发AI
    if (side === 'opponent') {
      setTimeout(() => SimpleAI.takeTurn(), 800);
    }
  },

  // 结束当前回合
  endTurn() {
    if (GameState.gameOver) return;
    const current = GameState.currentTurn;

    // 离职谈话全局效果倒计时
    GameState.globalEffects = GameState.globalEffects.filter(e => {
      if (e.type === 'dismissal_talk') {
        e.turnsLeft--;
        return e.turnsLeft > 0;
      }
      return true;
    });

    GameState.addLog(`✅ 回合结束`, 'info');

    const next = current === 'player' ? 'opponent' : 'player';
    if (next === 'player') GameState.turnNumber++;

    this.startTurn(next);
  },

  // 检查HR三人组 - 离职谈话效果
  checkHREffect() {
    const allBoard = [...GameState.player.board, ...GameState.opponent.board];
    const hrCount = allBoard.filter(c => c.faction?.includes('HR')).length;
    const alreadyActive = GameState.globalEffects.find(e => e.type === 'dismissal_talk');

    if (hrCount >= 3 && !alreadyActive) {
      GameState.globalEffects.push({ type: 'dismissal_talk', turnsLeft: 3 });
      GameState.addLog('⚠️ 【离职谈话】触发！双方费用消耗翻倍，持续3回合', 'skill');
    }
  },

  // 检查三班倒效果
  checkThreeShiftEffect(side) {
    const p = GameState.getPlayer(side);
    const itCount = p.board.filter(c => c.faction?.includes('IT')).length;
    if (itCount >= 3) {
      p.board.forEach(c => { c._threeShiftBonus = true; });
      GameState.addLog('🔥 【三班倒】激活！友方攻击力翻倍，但无法治疗', 'skill');
      return true;
    }
    p.board.forEach(c => { c._threeShiftBonus = false; });
    return false;
  }
};
