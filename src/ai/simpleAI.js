// simpleAI.js - 电脑对手AI

import { GameState } from '../core/gameState.js';
import { RuleEngine } from '../core/ruleEngine.js';
import { ActionHandler } from '../core/actionHandler.js';
import { TurnManager } from '../core/turnManager.js';
import { renderGame } from '../ui/renderGame.js';

export const SimpleAI = {
  async takeTurn() {
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // 出牌阶段
    let played = true;
    while (played) {
      played = false;
      const opp = GameState.opponent;
      // 按费用从低到高出牌
      const sortedHand = opp.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter(({ card }) => RuleEngine.canPlayCard('opponent', card))
        .sort((a, b) => RuleEngine.getActualCost(a.card) - RuleEngine.getActualCost(b.card));

      if (sortedHand.length > 0) {
        const { index } = sortedHand[0];
        await delay(600);
        ActionHandler.playCard('opponent', index);
        played = true;
        renderGame();
      }
    }

    await delay(500);

    // 攻击阶段
    for (let i = 0; i < 10; i++) {
      const opp = GameState.opponent;
      const player = GameState.player;

      const attackers = opp.board.filter(c =>
        !c.hasAttacked && !c.sleeping && c.attack > 0
      );
      if (attackers.length === 0) break;

      const attacker = attackers[0];

      // 优先攻击嘲讽，否则打血量最低的随从，若无随从打英雄
      const tauntTargets = player.board.filter(c =>
        c.keywords?.includes('背锅') && !c.sleeping
      );
      const targets = tauntTargets.length > 0 ? tauntTargets : player.board.filter(c =>
        !c.keywords?.includes('摸鱼') || c.hasAttacked
      );

      if (targets.length > 0) {
        const target = targets.reduce((a, b) => a.health < b.health ? a : b);
        await delay(500);
        ActionHandler.attack('opponent', attacker, 'player', target, false);
      } else {
        // 打英雄
        if (RuleEngine.isValidTarget('opponent', null, true)) {
          await delay(500);
          ActionHandler.attack('opponent', attacker, 'player', null, true);
        }
      }

      if (GameState.gameOver) return;
      renderGame();
    }

    await delay(400);
    TurnManager.endTurn();
  }
};
