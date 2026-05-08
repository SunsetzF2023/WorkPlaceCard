// findTarget.js
import { GameState } from '../core/gameState.js';

export function findValidTargets(attackerSide) {
  const opp = GameState.getOpponent(attackerSide);
  const hasTaunt = opp.board.some(c => c.keywords?.includes('背锅') && !c.sleeping);

  const boardTargets = opp.board.filter(c => {
    if (c.keywords?.includes('摸鱼') && !c.hasAttacked) return false;
    if (hasTaunt && !c.keywords?.includes('背锅')) return false;
    return true;
  });

  return {
    boardTargets,
    canHitHero: !hasTaunt
  };
}
