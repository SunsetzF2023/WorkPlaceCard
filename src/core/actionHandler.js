// actionHandler.js - 玩家操作处理

import { GameState } from './gameState.js';
import { RuleEngine } from './ruleEngine.js';
import { EffectResolver } from './effectResolver.js';
import { DamageSystem } from '../systems/damageSystem.js';
import { cloneCard } from '../utils/cloneCard.js';
import { renderGame } from '../ui/renderGame.js';
import { TurnManager } from './turnManager.js';

export const ActionHandler = {

  // 出牌
  playCard(side, handIndex) {
    const p = GameState.getPlayer(side);
    const card = p.hand[handIndex];
    if (!card) return false;
    if (!RuleEngine.canPlayCard(side, card)) return false;

    const cost = RuleEngine.getActualCost(card);
    p.currentMana -= cost;
    p.hand.splice(handIndex, 1);

    // 克隆卡牌实例
    const instance = cloneCard(card);
    instance.justSummoned = true;
    instance.hasAttacked = false;

    // 紧急支援：可立即攻击
    if (instance.keywords?.includes('紧急支援')) {
      instance.hasAttacked = false;
      instance.justSummoned = false;
    }

    p.board.push(instance);

    GameState.addLog(`▶ 打出 ${instance.nameZh}（费用${cost}）`, 'summon');

    // 触发入场效果
    EffectResolver.resolveOnEnter(side, instance);

    // 检查三班倒
    TurnManager.checkThreeShiftEffect(side);

    GameState.selectedCard = null;
    renderGame();
    return true;
  },

  // 攻击
  attack(attackerSide, attackerCard, targetSide, targetCard, targetIsHero = false) {
    if (!RuleEngine.canAttack(attackerSide, attackerCard)) return false;
    if (!RuleEngine.isValidTarget(attackerSide, targetCard, targetIsHero)) return false;

    // 处理主动技能（攻击前触发）
    const activeResult = EffectResolver.resolveActiveOnAttack(attackerSide, attackerCard, targetCard, targetIsHero);

    if (activeResult === 'self_destruct') {
      const p = GameState.getPlayer(attackerSide);
      const idx = p.board.indexOf(attackerCard);
      if (idx > -1) p.board.splice(idx, 1);
      p.graveyard.push(attackerCard);
      renderGame();
      return true;
    }

    if (activeResult === 'target_eliminated') {
      attackerCard.hasAttacked = true;
      renderGame();
      return true;
    }

    // 绩效考核（CTO）：受到伤害时+2/+2
    const handleKpi = (card, dmg) => {
      if (card.passiveId === 'kpi_growth' && dmg > 0) {
        card.attack += 2;
        card.health += 2;
        GameState.addLog(`${card.nameZh}【绩效考核】+2/+2`, 'skill');
      }
    };

    // 计算攻击力
    let atkPower = attackerCard.attack;
    if (attackerCard._doubleAttack) {
      atkPower *= 2;
      delete attackerCard._doubleAttack;
    }
    // 三班倒加成
    if (attackerCard._threeShiftBonus) atkPower *= 2;

    if (targetIsHero) {
      // 攻击英雄
      const opp = GameState.getOpponent(attackerSide);
      DamageSystem.dealDamageToHero(targetSide, atkPower);
      GameState.addLog(`⚔️ ${attackerCard.nameZh} 攻击对方英雄造成 ${atkPower} 伤害`, 'damage');
    } else {
      // 攻击随从
      // 甩锅检查
      const oppPlayer = GameState.getOpponent(attackerSide);
      let actualTarget = targetCard;
      const shieldSource = oppPlayer.board.find(c => c._shieldTarget === targetCard);
      if (shieldSource) {
        actualTarget = shieldSource;
        GameState.addLog(`🛡️ ${shieldSource.nameZh} 替 ${targetCard.nameZh} 挡下了伤害`, 'skill');
      }

      // 运维老王护盾：IT卡受到的伤害-1
      const hasOpsShield = oppPlayer.board.some(c => c.passiveId === 'ops_shield');
      let incomingDmg = atkPower;
      if (hasOpsShield && actualTarget.faction?.includes('IT')) {
        incomingDmg = Math.max(0, incomingDmg - 1);
      }

      handleKpi(actualTarget, incomingDmg);
      DamageSystem.dealDamageToCard(targetSide, actualTarget, incomingDmg);

      // 反击伤害
      let counterDmg = actualTarget.attack;
      // 免疫反击≤1
      if (attackerCard._immuneCounter !== undefined) {
        if (counterDmg <= attackerCard._immuneCounter) counterDmg = 0;
        delete attackerCard._immuneCounter;
      }
      if (counterDmg > 0) {
        handleKpi(attackerCard, counterDmg);
        DamageSystem.dealDamageToCard(attackerSide, attackerCard, counterDmg);
        GameState.addLog(`⚔️ ${attackerCard.nameZh} 攻击 ${actualTarget.nameZh}（${atkPower}↔${counterDmg}）`, 'damage');
      } else {
        GameState.addLog(`⚔️ ${attackerCard.nameZh} 攻击 ${actualTarget.nameZh}（${atkPower} 伤害，无反击）`, 'damage');
      }
    }

    attackerCard.hasAttacked = true;
    attackerCard._immuneCounter = undefined;

    GameState.selectedBoardCard = null;
    GameState.attackPhase = false;

    renderGame();
    return true;
  },

  // 使用英雄技能
  useHeroSkill(side) {
    const p = GameState.getPlayer(side);
    const opp = GameState.getOpponent(side);
    if (!p.hero) return;

    const skill = p.hero.heroSkill;
    const cost = skill.cost;
    if (p.currentMana < cost) return;

    p.currentMana -= cost;

    switch (skill.id) {
      case 'overtime_rush': {
        // 使一张友方卡牌再次攻击
        const rested = p.board.filter(c => c.hasAttacked && !c.sleeping);
        if (rested.length > 0) {
          const target = rested[Math.floor(Math.random() * rested.length)];
          target.hasAttacked = false;
          GameState.addLog(`⚡ 英雄技能【加班冲刺】：${target.nameZh} 可再次攻击`, 'skill');
        }
        break;
      }
      case 'false_promise': {
        // 随机友方卡牌+2/+2，下回合结束消失
        if (p.board.length > 0) {
          const target = p.board[Math.floor(Math.random() * p.board.length)];
          target.attack += 2;
          target.health += 2;
          target._falsePledge = true;
          GameState.addLog(`🥧 英雄技能【画大饼】：${target.nameZh} 获得+2/+2（临时）`, 'skill');
        }
        break;
      }
    }

    renderGame();
  }
};
