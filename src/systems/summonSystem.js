// summonSystem.js
import { GameState } from '../core/gameState.js';
import { EffectResolver } from '../core/effectResolver.js';

export const SummonSystem = {
  summon(side, cardData) {
    const p = GameState.getPlayer(side);
    if (p.board.length >= 7) return false;
    p.board.push(cardData);
    EffectResolver.resolveOnEnter(side, cardData);
    return true;
  }
};
