// cloneCard.js
export function cloneCard(card) {
  return {
    ...JSON.parse(JSON.stringify(card)),
    _instanceId: card.id + '_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    hasAttacked: false,
    sleeping: false,
    justSummoned: true,
  };
}
