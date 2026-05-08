// main.js - 游戏入口

import { GameState } from './core/gameState.js';
import { TurnManager } from './core/turnManager.js';
import { shuffle } from './utils/shuffle.js';
import { cloneCard } from './utils/cloneCard.js';
import { renderGame } from './ui/renderGame.js';

async function loadData() {
  const [cardsRes, decksRes, heroesRes] = await Promise.all([
    fetch('./data/cards.json'),
    fetch('./data/decks.json'),
    fetch('./data/heroes.json'),
  ]);
  return {
    cards: await cardsRes.json(),
    decks: await decksRes.json(),
    heroes: await heroesRes.json(),
  };
}

function buildDeck(deckData, allCards) {
  const cardMap = Object.fromEntries(allCards.map(c => [c.id, c]));
  return shuffle(deckData.cards.map(id => cloneCard(cardMap[id])).filter(Boolean));
}

async function initGame() {
  const { cards, decks, heroes } = await loadData();
  const heroMap = Object.fromEntries(heroes.map(h => [h.id, h]));

  const playerDeck = decks[0];
  const opponentDeck = decks[1];

  GameState.reset();

  GameState.player.hero = { ...heroMap[playerDeck.heroId] };
  GameState.opponent.hero = { ...heroMap[opponentDeck.heroId] };

  GameState.player.deck = buildDeck(playerDeck, cards);
  GameState.opponent.deck = buildDeck(opponentDeck, cards);

  TurnManager.startGame();
}

// 结束回合按钮
window.endTurn = function() {
  if (GameState.currentTurn !== 'player' || GameState.gameOver) return;
  TurnManager.endTurn();
};

// 游戏开始
document.addEventListener('DOMContentLoaded', () => {
  initGame().catch(console.error);
});
