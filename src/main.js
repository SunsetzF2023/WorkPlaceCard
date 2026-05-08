// main.js - 游戏入口

import { GameState } from './core/gameState.js';
import { TurnManager } from './core/turnManager.js';
import { shuffle } from './utils/shuffle.js';
import { cloneCard } from './utils/cloneCard.js';
import { renderGame } from './ui/renderGame.js';

async function loadData() {
  try {
    console.log('Loading game data...');
    
    const [cardsRes, decksRes, heroesRes] = await Promise.all([
      fetch('./data/cards.json'),
      fetch('./data/decks.json'),
      fetch('./data/heroes.json'),
    ]);
    
    if (!cardsRes.ok || !decksRes.ok || !heroesRes.ok) {
      throw new Error('Failed to load game data files');
    }
    
    const data = {
      cards: await cardsRes.json(),
      decks: await decksRes.json(),
      heroes: await heroesRes.json(),
    };
    
    console.log('Data loaded successfully:', {
      cardsCount: data.cards.length,
      decksCount: data.decks.length,
      heroesCount: data.heroes.length
    });
    
    return data;
  } catch (error) {
    console.error('Error loading game data:', error);
    throw error;
  }
}

function buildDeck(deckData, allCards) {
  const cardMap = Object.fromEntries(allCards.map(c => [c.id, c]));
  return shuffle(deckData.cards.map(id => cloneCard(cardMap[id])).filter(Boolean));
}

async function initGame() {
  try {
    console.log('Initializing game...');
    
    const { cards, decks, heroes } = await loadData();
    const heroMap = Object.fromEntries(heroes.map(h => [h.id, h]));

    const playerDeck = decks[0];
    const opponentDeck = decks[1];
    
    console.log('Decks selected:', {
      player: playerDeck.name,
      opponent: opponentDeck.name,
      playerHero: heroMap[playerDeck.heroId]?.name,
      opponentHero: heroMap[opponentDeck.heroId]?.name
    });

    // Reset game state FIRST
    GameState.reset();

    // Set heroes
    GameState.player.hero = { ...heroMap[playerDeck.heroId] };
    GameState.opponent.hero = { ...heroMap[opponentDeck.heroId] };

    // Apply hero health to players
    GameState.player.health = GameState.player.hero.health;
    GameState.opponent.health = GameState.opponent.hero.health;
    GameState.player.armor = GameState.player.hero.armor || 0;
    GameState.opponent.armor = GameState.opponent.hero.armor || 0;

    // Build decks AFTER reset
    GameState.player.deck = buildDeck(playerDeck, cards);
    GameState.opponent.deck = buildDeck(opponentDeck, cards);
    
    console.log('Deck built:', {
      playerDeckSize: GameState.player.deck.length,
      opponentDeckSize: GameState.opponent.deck.length
    });

    console.log('Starting game...');
    // Start game WITHOUT calling reset again
    startGameWithoutReset();
    
  } catch (error) {
    console.error('Error initializing game:', error);
  }
}

function startGameWithoutReset() {
  // 双方各抽3张起手牌
  DrawSystem.drawCards('player', 3);
  DrawSystem.drawCards('opponent', 3);

  // 先手
  GameState.currentTurn = 'player';
  TurnManager.startTurn('player');
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
