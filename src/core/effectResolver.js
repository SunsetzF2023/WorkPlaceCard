// effectResolver.js - 卡牌效果解析与执行

import { GameState } from './gameState.js';
import { DamageSystem } from '../systems/damageSystem.js';
import { SummonSystem } from '../systems/summonSystem.js';
import { cloneCard } from '../utils/cloneCard.js';
import { renderGame } from '../ui/renderGame.js';

export const EffectResolver = {

  // 触发入场被动（战吼类）
  resolveOnEnter(side, card) {
    const p = GameState.getPlayer(side);
    const opp = GameState.getOpponent(side);

    switch (card.passiveId) {
      case 'summon_junior': {
        // IT Support Officer：召唤一个实习生
        const junior = {
          id: 'card_008_clone_' + Date.now(),
          name: 'Intern',
          nameZh: '实习生',
          quality: 'common',
          faction: ['IT'],
          cost: 0,
          attack: 1,
          health: 1,
          keywords: ['嗜睡'],
          passiveId: 'dormant_turn1',
          art: '🧑‍💻',
          sleeping: true,
          sleepTurns: 1,
          justSummoned: true,
          hasAttacked: false,
          _instanceId: 'junior_' + Date.now()
        };
        if (p.board.length < 7) {
          p.board.push(junior);
          GameState.addLog(`${card.nameZh} 内推了一名实习生`, 'summon');
        }
        break;
      }

      case 'dormant_turn1':
        card.sleeping = true;
        card.sleepTurns = 1;
        GameState.addLog(`${card.nameZh} 陷入【嗜睡】，首回合免疫伤害`, 'info');
        break;

      case 'big_picture_buff': {
        // Client Manager：画大饼
        const idx = p.board.indexOf(card);
        const neighbors = [p.board[idx - 1], p.board[idx + 1]].filter(Boolean);
        neighbors.forEach(n => {
          n.attack += 5;
          n.health += 5;
          GameState.addLog(`${n.nameZh} 被画大饼！+5/+5`, 'skill');
        });
        // 自身下回合+3/+3持续2回合
        card.bigPictureTurns = 2;
        card.bigPictureBuff = 3;
        card.attack += 3;
        card.health += 3;
        GameState.addLog(`${card.nameZh} 自身获得+3/+3，持续2回合`, 'skill');

        // 甩锅初始化
        card._shieldTarget = null;
        break;
      }

      case 'bounce_enemy': {
        // 清洁阿姨：弹回敌方一张卡
        if (opp.board.length > 0) {
          const idx = Math.floor(Math.random() * opp.board.length);
          const bounced = opp.board.splice(idx, 1)[0];
          // 重置状态
          bounced.hasAttacked = false;
          bounced.sleeping = false;
          opp.hand.push(bounced);
          GameState.addLog(`🧹 清洁阿姨将 ${bounced.nameZh} 扫回了对方手牌`, 'skill');
        }
        break;
      }

      case 'sleep_one': {
        // HR专员：随机让敌方一张卡沉睡
        const awake = opp.board.filter(c => !c.sleeping);
        if (awake.length > 0) {
          const target = awake[Math.floor(Math.random() * awake.length)];
          target.sleeping = true;
          target.sleepTurns = 1;
          GameState.addLog(`📎 ${card.nameZh} 使 ${target.nameZh} 陷入嗜睡1回合`, 'skill');
        }
        break;
      }

      case 'taunt':
        GameState.addLog(`${card.nameZh} 进入【背锅】状态`, 'info');
        break;

      case 'rush':
        GameState.addLog(`${card.nameZh}【紧急支援】入场，可立即攻击`, 'summon');
        break;

      case 'ops_shield':
        GameState.addLog(`🛠️ ${card.nameZh} 入场，友方IT卡牌受到的伤害-1`, 'skill');
        break;

      case 'inspiration_gain':
        break; // 回合开始处理

      case 'kpi_growth':
        GameState.addLog(`${card.nameZh} 已开启【绩效考核】模式`, 'skill');
        break;
    }
  },

  // 触发离职补偿（亡语类）
  resolveOnDeath(side, card) {
    switch (card.passiveId) {
      case 'kpi_growth':
        // CTO死亡时无额外效果（已通过战斗中动态加成）
        GameState.addLog(`${card.nameZh} 离职，技术部陷入混乱`, 'death');
        break;
      default:
        break;
    }
  },

  // 处理主动技能（攻击时触发）
  resolveActiveOnAttack(side, attacker, target, targetIsHero) {
    if (!attacker.activeId || targetIsHero) return false;

    const opp = GameState.getOpponent(side);

    switch (attacker.activeId) {
      case 'immune_counter_low': {
        // IT Support Officer
        const qualityRank = { common: 1, uncommon: 2, rare: 2, epic: 3, legendary: 4 };
        const targetRank = qualityRank[target.quality] || 1;
        if (targetRank >= 4) {
          // 高于超稀有，自毁并转移属性
          target.attack += attacker.attack;
          target.health += attacker.health;
          GameState.addLog(`💥 ${attacker.nameZh} 遭遇碾压，自毁并将属性献给 ${target.nameZh}`, 'death');
          return 'self_destruct';
        }
        attacker._immuneCounter = 1; // 免疫≤1反击
        return false;
      }

      case 'sales_dominate': {
        if (target.faction?.includes('Sales') && ['common', 'rare', 'uncommon'].includes(target.quality)) {
          attacker._doubleAttack = true;
          attacker._immuneCounter = 999;
          GameState.addLog(`👔 ${attacker.nameZh} 对销售同类施压，攻击力翻倍！`, 'skill');
        }
        return false;
      }

      case 'pua_eliminate': {
        const lowQuality = ['common', 'rare', 'uncommon'];
        if (lowQuality.includes(target.quality)) {
          // 直接消灭
          const idx = opp.board.indexOf(target);
          if (idx > -1) {
            opp.board.splice(idx, 1);
            opp.graveyard.push(target);
            GameState.addLog(`📎 【职场PUA】${attacker.nameZh} 直接消灭了 ${target.nameZh}`, 'death');
            return 'target_eliminated';
          }
        }
        return false;
      }

      case 'it_buff_all': {
        // CTO主动：友方IT卡牌+2攻击
        const p = GameState.getPlayer(side);
        p.board.filter(c => c.faction?.includes('IT') && c !== attacker).forEach(c => {
          c.attack += 2;
        });
        GameState.addLog(`👨‍💼 CTO激励友方IT职员，全体+2攻击`, 'skill');
        return false;
      }
    }
    return false;
  },

  // 甩锅：每回合Client Manager指定盾牌
  resolveShieldAssign(side) {
    const p = GameState.getPlayer(side);
    const managers = p.board.filter(c => c.passiveId === 'big_picture_buff');
    managers.forEach(mgr => {
      const others = p.board.filter(c => c !== mgr);
      if (others.length > 0) {
        mgr._shieldTarget = others[Math.floor(Math.random() * others.length)];
        GameState.addLog(`${mgr.nameZh} 将伤害甩给 ${mgr._shieldTarget.nameZh}`, 'skill');
      }
    });
  }
};
