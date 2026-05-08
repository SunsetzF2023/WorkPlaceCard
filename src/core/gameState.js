// gameState.js - 全局游戏状态管理

export const GameState = {
  // 当前回合玩家 'player' | 'opponent'
  currentTurn: 'player',
  turnNumber: 1,
  phase: 'main', // 'start' | 'main' | 'attack' | 'end'
  gameOver: false,
  winner: null,

  player: {
    id: 'player',
    hero: null,
    health: 30,
    armor: 0,
    maxMana: 1,
    currentMana: 1,
    hand: [],
    deck: [],
    board: [],       // 场上最多7张
    graveyard: [],   // 离职档案
    inspiration: 0,  // 灵感值
    projectEffects: [], // 项目方案持续效果
    fatigueDamage: 0,
  },

  opponent: {
    id: 'opponent',
    hero: null,
    health: 30,
    armor: 0,
    maxMana: 1,
    currentMana: 1,
    hand: [],
    deck: [],
    board: [],
    graveyard: [],
    inspiration: 0,
    projectEffects: [],
    fatigueDamage: 0,
  },

  // 选中状态
  selectedCard: null,       // 手牌中选中的卡
  selectedBoardCard: null,  // 场上选中的卡（攻击者）
  attackPhase: false,       // 是否在选攻击目标

  // 日志
  log: [],

  // 全局效果
  globalEffects: [],

  // 重置状态
  reset() {
    this.currentTurn = 'player';
    this.turnNumber = 1;
    this.phase = 'main';
    this.gameOver = false;
    this.winner = null;
    this.selectedCard = null;
    this.selectedBoardCard = null;
    this.attackPhase = false;
    this.log = [];
    this.globalEffects = [];

    ['player', 'opponent'].forEach(side => {
      this[side].health = 30;
      this[side].armor = 0;
      this[side].maxMana = 0;
      this[side].currentMana = 0;
      this[side].hand = [];
      this[side].deck = [];
      this[side].board = [];
      this[side].graveyard = [];
      this[side].inspiration = 0;
      this[side].projectEffects = [];
      this[side].fatigueDamage = 0;
    });
  },

  getPlayer(side) {
    return this[side];
  },

  getOpponent(side) {
    return side === 'player' ? this.opponent : this.player;
  },

  addLog(message, type = 'info') {
    this.log.unshift({
      message,
      type, // 'info' | 'damage' | 'death' | 'summon' | 'skill'
      turn: this.turnNumber,
      timestamp: Date.now()
    });
    if (this.log.length > 50) this.log.pop();
  }
};
