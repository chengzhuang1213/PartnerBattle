function handlePrepTooltipMove(event) {
  const screen = event.target.closest(".prep-screen, .practice-screen");
  if (!screen) {
    hidePrepTooltip();
    return;
  }

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(tooltipTargetSelector());
  if (!target || !screen.contains(target)) {
    hidePrepTooltip();
    return;
  }

  showPrepTooltip(target.dataset.tooltip, event.clientX, event.clientY);
}

function handlePrepTooltipFocus(event) {
  const target = event.target.closest(tooltipTargetSelector());
  if (!target) return;

  const rect = target.getBoundingClientRect();
  showPrepTooltip(target.dataset.tooltip, rect.left + rect.width / 2, rect.top);
}

let prepTouchTooltipTimer = null;

function handlePrepTooltipTouchStart(event) {
  const target = event.target.closest(tooltipTargetSelector());
  if (!target || !event.target.closest(".prep-screen, .practice-screen")) return;

  clearTimeout(prepTouchTooltipTimer);
  prepTouchTooltipTimer = setTimeout(() => {
    const touch = event.touches[0];
    const rect = target.getBoundingClientRect();
    showPrepTooltip(target.dataset.tooltip, touch?.clientX || rect.left + rect.width / 2, touch?.clientY || rect.top);
  }, 320);
}

function handlePrepTooltipTouchEnd() {
  clearTimeout(prepTouchTooltipTimer);
  setTimeout(hidePrepTooltip, 1200);
}

function hidePrepTooltip() {
  const tooltip = document.querySelector(".prep-floating-tooltip");
  if (!tooltip) return;
  tooltip.hidden = true;
  tooltip.textContent = "";
}

function showPrepTooltip(text, x, y) {
  const tooltip = document.querySelector(".prep-floating-tooltip");
  if (!tooltip || !text) return;

  tooltip.textContent = text;
  tooltip.hidden = false;

  const margin = 12;
  const gap = 16;
  const rect = tooltip.getBoundingClientRect();
  let left = x + gap;
  let top = y + gap;

  if (left + rect.width + margin > window.innerWidth) {
    left = x - rect.width - gap;
  }
  if (top + rect.height + margin > window.innerHeight) {
    top = y - rect.height - gap;
  }

  tooltip.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin))}px`;
  tooltip.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin))}px`;
}

function tooltipTargetSelector() {
  return ".prep-skill[data-tooltip], .prep-slot[data-tooltip], .practice-skill[data-tooltip], .practice-slot[data-tooltip], .skill-capsule[data-tooltip], .status-capsule[data-tooltip]";
}

const SKILL_MATCHUPS = {
  crit: {
    strong: "高防御目标、低血量收割",
    weak: "幸运、招架、闪躲",
  },
  sneak: {
    strong: "反击、防御",
    weak: "招架、闪躲",
  },
  combo: {
    strong: "招架、反震",
    weak: "闪躲、反击",
  },
  power: {
    strong: "再生、防御不足的目标",
    weak: "反震、反击、招架",
  },
  lifesteal: {
    strong: "消耗战、反震后的续航",
    weak: "毒、招架、闪躲",
  },
  revive: {
    strong: "爆发伤害、暴击收割",
    weak: "毒、持续压血",
  },
  lucky: {
    strong: "必杀、高暴击爆发",
    weak: "毒、反震、稳定普攻",
  },
  parry: {
    strong: "必杀、强力、首段高伤",
    weak: "连击、毒、消耗战",
  },
  defense: {
    strong: "强力、连击、反击",
    weak: "偷袭、毒、反震",
  },
  regen: {
    strong: "消耗战、毒的持续压血",
    weak: "必杀、强力、连击爆发",
  },
  reflect: {
    strong: "强力、必杀、高伤攻击",
    weak: "连击追加段、招架、闪躲",
  },
  counter: {
    strong: "连击、强力、吸血",
    weak: "偷袭、招架、闪躲",
  },
  agile: {
    strong: "低速目标、抢先手",
    weak: "招架、闪躲、防御",
  },
  unyielding: {
    strong: "消耗战、残血反打",
    weak: "必杀、毒、快速收割",
  },
  poison: {
    strong: "吸血、神佑复生、再生",
    weak: "高级毒、爆发速攻",
  },
  flight: {
    strong: "连击、必杀、高伤攻击",
    weak: "毒、再生、稳定消耗",
  },
};

function skillTooltipText(skill) {
  const matchup = SKILL_MATCHUPS[skill.group];
  const ruleText = state.battleMode === "competitive"
    ? "\n竞技限制：每人最多 2 高 + 3 初，全队最多 4 高；同组不可重复。"
    : "\n限制：同一伙伴不能同时携带同组初级和高级技能。";
  if (!matchup) return `${skill.name}：${skill.description}${ruleText}`;
  return `${skill.name}：${skill.description}\n克制：${matchup.strong}\n怕：${matchup.weak}${ruleText}`;
}
