const SKILL_GROUPS = [
  ["crit", "必杀", "暴击率 +15%", "高级必杀", "暴击率 +30%"],
  ["sneak", "偷袭", "攻击时不会触发对方反击，无视目标10%防御", "高级偷袭", "攻击时不会触发对方反击，无视目标30%防御"],
  ["combo", "连击", "攻击力降低25%，45%概率追加一次普通攻击，追加攻击不会触发对方反震", "高级连击", "攻击力降低15%，55%概率追加一次普通攻击，追加攻击不会触发对方反震"],
  ["power", "强力", "攻击力 +12%，防御 -10%", "高级强力", "攻击力 +22%，防御 -5%"],
  ["lifesteal", "吸血", "造成伤害的15%转化为生命", "高级吸血", "造成伤害的30%转化为生命"],
  ["revive", "神佑复生", "死亡时20%概率复活，每场最多一次", "高级神佑复生", "死亡时35%概率复活，每场最多一次"],
  ["lucky", "幸运", "受到暴击时，暴击伤害降低40%", "高级幸运", "受到暴击时，暴击伤害降低60%"],
  ["parry", "招架", "本场第一次受到攻击完全免疫", "高级招架", "本场前两次受到攻击完全免疫"],
  ["defense", "防御", "防御提高30%，攻击力降低10%", "高级防御", "防御提高50%，攻击力降低10%"],
  ["regen", "再生", "每回合恢复最大生命3%", "高级再生", "每回合恢复最大生命7%"],
  ["reflect", "反震", "受到攻击时，有35%概率反弹本次伤害的35%。反震为真实伤害，不触发吸血、反震、反击。", "高级反震", "受到攻击时，有35%概率反弹本次伤害的65%。反震为真实伤害，不触发吸血、反震、反击。"],
  ["counter", "反击", "受到攻击时，有20%概率立即发动一次普通攻击。反击不会再次触发反击或连击。", "高级反击", "受到攻击时，有35%概率立即发动一次普通攻击。反击不会再次触发反击或连击。"],
  ["agile", "敏捷", "速度提高20%", "高级敏捷", "速度提高40%"],
  ["unyielding", "不屈", "生命低于50%时，造成伤害提高20%", "高级不屈", "生命低于50%时，造成伤害提高40%"],
  ["poison", "毒", "攻击时有25%概率使目标中毒2回合", "高级毒", "攻击时有45%概率使目标中毒2回合，免疫中毒"],
  ["flight", "飞行", "受到攻击时5%概率免疫本次攻击", "高级飞行", "受到攻击时15%概率免疫本次攻击；若本次攻击来自连击追加攻击，免疫率改为50%"],
].map(([group, basicName, basicDescription, highName, highDescription]) => ({
  group,
  basic: { tier: "basic", name: basicName, description: basicDescription },
  high: { tier: "high", name: highName, description: highDescription },
}));

const SKILL_LIMITS = {
  orange: { high: 2, basic: 3, text: "最多 2 高级 + 3 初级" },
  purple: { high: 1, basic: 3, text: "最多 1 高级 + 3 初级" },
  blue: { high: 1, basic: 3, text: "3 初级，或 1 高级 + 1 初级" },
};

const COMPETITIVE_SKILL_LIMITS = {
  perPet: { high: 2, basic: 3 },
  teamHigh: 4,
};

let nextSkillId = 1;

function createSkillHand(owner) {
  const highGroups = shuffle(SKILL_GROUPS).slice(0, 6);
  const basicGroups = shuffle(SKILL_GROUPS).slice(0, 12);
  const highSkills = highGroups.map((group) => createSkill(owner, group, group.high));
  const basicSkills = basicGroups.map((group) => createSkill(owner, group, group.basic));
  return shuffle([...highSkills, ...basicSkills]);
}

function createSkill(owner, group, template) {
  return {
    id: `${owner}-${template.tier}-${nextSkillId++}`,
    owner,
    group: group.group,
    tier: template.tier,
    name: template.name,
    description: template.description,
    assignedPetId: null,
  };
}

function canAssignSkill(pet, skill, skillList, limits = null) {
  const assigned = getPetSkills(pet, skillList);
  const highCount = assigned.filter((item) => item.tier === "high").length;
  const basicCount = assigned.filter((item) => item.tier === "basic").length;
  const hasSameGroup = assigned.some((item) => item.group === skill.group);

  if (hasSameGroup) return false;

  if (limits) {
    const teamHighCount = skillList.filter((item) => item.tier === "high" && item.assignedPetId).length;
    if (skill.tier === "high" && teamHighCount >= limits.teamHigh) return false;
    return skill.tier === "high" ? highCount < limits.perPet.high : basicCount < limits.perPet.basic;
  }

  if (pet.poolKey === "blue") {
    if (skill.tier === "high") return highCount < 1 && basicCount <= 1;
    if (highCount > 0) return basicCount < 1;
    return basicCount < 3;
  }

  const limit = SKILL_LIMITS[pet.poolKey];
  return skill.tier === "high" ? highCount < limit.high : basicCount < limit.basic;
}

function getPetSkills(pet, skillList) {
  return pet.skills.map((id) => skillList.find((skill) => skill.id === id)).filter(Boolean);
}

function displaySkillOrder(skills) {
  return [...skills].sort((a, b) => {
    if (a.tier === b.tier) return a.name.localeCompare(b.name, "zh-Hans-CN");
    return a.tier === "high" ? -1 : 1;
  });
}

function hasSkill(combatant, group) {
  return combatant.skills.find((skill) => skill.group === group);
}

function skillTierValue(combatant, group, basicValue, highValue, fallback = 0) {
  const skill = hasSkill(combatant, group);
  if (!skill) return fallback;
  return skill.tier === "high" ? highValue : basicValue;
}

function createCombatant(pet, skillList, side) {
  const skills = getPetSkills(pet, skillList);

  return {
    side,
    pet,
    name: pet.name,
    skills,
    maxHp: pet.stats.hp,
    hp: pet.stats.hp,
    atk: pet.stats.atk,
    def: pet.stats.def,
    spd: pet.stats.spd,
    baseAtk: pet.stats.atk,
    baseDef: pet.stats.def,
    baseSpd: pet.stats.spd,
    parryLeft: skillTierValue({ skills }, "parry", 1, 2),
    poisonTurns: 0,
    revived: false,
    reviveAttempted: false,
    unyieldingActive: false,
  };
}

function openingModifiedStats(baseStats, skills) {
  const skillHolder = { skills };
  const power = hasSkill(skillHolder, "power");
  const defense = hasSkill(skillHolder, "defense");
  const agile = hasSkill(skillHolder, "agile");
  const combo = hasSkill(skillHolder, "combo");

  const atkBonus = power ? (power.tier === "high" ? 1.22 : 1.12) : 1;
  const defBonus = defense ? (defense.tier === "high" ? 1.5 : 1.3) : 1;
  const powerDefPenalty = power ? (power.tier === "high" ? 0.95 : 0.9) : 1;
  const spdBonus = agile ? (agile.tier === "high" ? 1.4 : 1.2) : 1;
  const defenseAtkPenalty = defense ? 0.9 : 1;
  const comboPenalty = combo ? (combo.tier === "high" ? 0.85 : 0.75) : 1;

  return {
    hp: baseStats.hp,
    atk: Math.round(baseStats.atk * atkBonus * comboPenalty * defenseAtkPenalty),
    def: Math.round(baseStats.def * defBonus * powerDefPenalty),
    spd: Math.round(baseStats.spd * spdBonus),
  };
}

function petOpeningStats(pet, skillList) {
  return openingModifiedStats(pet.stats, getPetSkills(pet, skillList));
}

function applyOpeningStatModifiers(combatant, ctx) {
  const before = combatStats(combatant);
  const power = hasSkill(combatant, "power");
  const defense = hasSkill(combatant, "defense");
  const agile = hasSkill(combatant, "agile");
  const combo = hasSkill(combatant, "combo");
  const modifiedStats = openingModifiedStats(
    { hp: combatant.maxHp, atk: combatant.baseAtk, def: combatant.baseDef, spd: combatant.baseSpd },
    combatant.skills,
  );

  combatant.atk = modifiedStats.atk;
  combatant.def = modifiedStats.def;
  combatant.spd = modifiedStats.spd;
  combatant.baseAtk = combatant.atk;
  combatant.baseDef = combatant.def;
  combatant.baseSpd = combatant.spd;

  const changedSkills = [power, defense, agile, combo].filter(Boolean);
  if (!changedSkills.length || !statChanged(before, combatant)) return;

  triggerSkill(ctx, combatant, statChangeBubbleText(changedSkills, before, combatant), `${combatant.name} 的战斗属性发生变化。`, {
    type: "statChange",
    statChangeSide: combatant.side,
  });
}

function updateDynamicStats(combatant, ctx) {
  const unyielding = hasSkill(combatant, "unyielding");
  if (!unyielding) return;

  const before = combatStats(combatant);
  const shouldActivate = combatant.hp > 0 && combatant.hp < combatant.maxHp * 0.5;
  if (shouldActivate === combatant.unyieldingActive) return;

  combatant.unyieldingActive = shouldActivate;
  const bonus = unyielding.tier === "high" ? 0.4 : 0.2;
  combatant.atk = Math.round(combatant.baseAtk * (shouldActivate ? 1 + bonus : 1));

  triggerSkill(ctx, combatant, statChangeBubbleText([unyielding], before, combatant), `${combatant.name} 的不屈${shouldActivate ? "触发" : "失效"}。`, {
    type: "statChange",
    statChangeSide: combatant.side,
    effectName: shouldActivate ? "unyielding" : "",
    effectSide: shouldActivate ? combatant.side : "",
  });
}

function statChanged(before, combatant) {
  return before.atk !== combatant.atk || before.def !== combatant.def || before.spd !== combatant.spd;
}

function statChangeBubbleText(skills, before, combatant) {
  const changes = [];
  if (before.atk !== combatant.atk) changes.push(`ATK ${before.atk}→${combatant.atk}`);
  if (before.def !== combatant.def) changes.push(`DEF ${before.def}→${combatant.def}`);
  if (before.spd !== combatant.spd) changes.push(`SPD ${before.spd}→${combatant.spd}`);
  return `${skills.map((skill) => skill.name).join(" / ")}：${changes.join("，")}`;
}

function applyRegen(combatant, ctx) {
  const percent = skillTierValue(combatant, "regen", 3, 7);
  if (!percent || combatant.hp <= 0 || combatant.hp >= combatant.maxHp) return;

  const beforeHp = combatant.hp;
  const heal = Math.max(1, Math.round(combatant.maxHp * (percent / 100)));
  combatant.hp = Math.min(combatant.maxHp, combatant.hp + heal);
  const healed = combatant.hp - beforeHp;
  triggerSkill(ctx, combatant, hasSkill(combatant, "regen").name, `${combatant.name} 触发再生，恢复 ${healed} 生命。`, {
    heal: healed,
    healSide: combatant.side,
  });
  updateDynamicStats(combatant, ctx);
}

function applyLifesteal(attacker, damage, ctx) {
  const percent = skillTierValue(attacker, "lifesteal", 15, 30);
  if (!percent || attacker.hp <= 0) return;

  const beforeHp = attacker.hp;
  const heal = Math.max(1, Math.round(damage * (percent / 100)));
  attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
  const healed = attacker.hp - beforeHp;
  triggerSkill(ctx, attacker, hasSkill(attacker, "lifesteal").name, `${attacker.name} 触发吸血，恢复 ${healed} 生命。`, {
    heal: healed,
    healSide: attacker.side,
  });
  updateDynamicStats(attacker, ctx);
}

function applyReflect(attacker, defender, damage, ctx) {
  const skill = hasSkill(defender, "reflect");
  if (!skill || defender.hp <= 0) return;

  if (!chance(35)) return;

  const percent = skill.tier === "high" ? 65 : 35;
  const reflectDamage = Math.max(1, Math.round(damage * (percent / 100)));
  attacker.hp -= reflectDamage;
  triggerSkill(ctx, defender, skill.name, `${defender.name} 触发反震，反弹 ${reflectDamage} 伤害。`, {
    targetSide: attacker.side,
    damage: reflectDamage,
    effectName: "reflect",
    effectSide: attacker.side,
  });
  updateDynamicStats(attacker, ctx);
}

function applyCounter(defender, attacker, ctx) {
  const rate = skillTierValue(defender, "counter", 20, 35);
  if (!rate || defender.hp <= 0 || attacker.hp <= 0 || !chance(rate)) return;

  triggerSkill(ctx, defender, hasSkill(defender, "counter").name, `${defender.name} 触发反击。`, {
    attackAnimationSide: defender.side,
    effectName: "counter",
    effectSide: attacker.side,
    targetSide: attacker.side,
  });
  performAttack(defender, attacker, ctx, { canCombo: false, canCounter: false, canReflect: true });
}

function applyCombo(attacker, defender, ctx) {
  const rate = skillTierValue(attacker, "combo", 45, 55);
  if (!rate || attacker.hp <= 0 || defender.hp <= 0 || !chance(rate)) return;

  triggerSkill(ctx, attacker, hasSkill(attacker, "combo").name, `${attacker.name} 触发连击。`);
  performAttack(attacker, defender, ctx, { canCombo: false, canCounter: true, canReflect: false, isComboAttack: true });
}

function applyFlightEvasion(attacker, defender, ctx, isComboAttack = false) {
  const skill = hasSkill(defender, "flight");
  if (!skill || defender.hp <= 0) return false;

  const rate = skill.tier === "high" ? (isComboAttack ? 50 : 15) : 5;
  if (!chance(rate)) return false;

  triggerSkill(ctx, defender, `-${skill.name}`, `${defender.name} 触发${skill.name}，免疫本次攻击。`, {
    blocked: true,
    attackAnimationSide: attacker.side,
    evaded: true,
    targetSide: defender.side,
  });
  return true;
}

function canPoison(target) {
  return target.hp > 0 && !hasHighSkill(target, "poison");
}

function hasHighSkill(combatant, group) {
  return combatant.skills.some((skill) => skill.group === group && skill.tier === "high");
}

function applyPoison(target, source, ctx, reason) {
  if (!canPoison(target)) return;

  target.poisonTurns = 2;
  triggerSkill(ctx, source, hasSkill(source, "poison")?.name || "中毒", `${target.name} 陷入中毒，持续 2 回合。${reason ? `（${reason}）` : ""}`);
  Object.assign(ctx.events[ctx.events.length - 1], {
    effectName: "poison",
    effectSide: target.side,
  });
}

function applyPoisonOnHit(attacker, defender, ctx, targetWasPoisoned) {
  const poisonSkill = hasSkill(attacker, "poison");
  if (poisonSkill && chance(poisonSkill.tier === "high" ? 45 : 25)) {
    applyPoison(defender, attacker, ctx);
  }

  if (targetWasPoisoned && hasSkill(attacker, "lifesteal")) {
    applyPoison(attacker, attacker, ctx, "毒污染");
  }
}

function applyPoisonTick(combatant, ctx) {
  if (combatant.hp <= 0 || combatant.poisonTurns <= 0) return false;

  const damage = Math.max(1, Math.round(combatant.hp * 0.1));
  combatant.hp -= damage;
  combatant.poisonTurns -= 1;
  recordEvent(ctx, `${combatant.name} 受到中毒伤害，损失 ${damage} 生命。`, {
    type: "skill",
    side: combatant.side,
    targetSide: combatant.side,
    damage,
    skillName: "中毒",
  });
  Object.assign(ctx.events[ctx.events.length - 1], {
    effectName: "poison",
    effectSide: combatant.side,
  });
  updateDynamicStats(combatant, ctx);
  return combatant.hp <= 0;
}

function isDefeated(combatant, ctx) {
  if (combatant.hp > 0) return false;

  const rate = skillTierValue(combatant, "revive", 20, 35);
  if (rate && !combatant.reviveAttempted) {
    combatant.reviveAttempted = true;
    if (!chance(rate)) return true;

    combatant.revived = true;
    combatant.hp = Math.max(1, Math.round(combatant.maxHp * 0.35));
    triggerSkill(ctx, combatant, hasSkill(combatant, "revive").name, `${combatant.name} 触发神佑复生，恢复 ${combatant.hp} 生命。`, {
      heal: combatant.hp,
      healSide: combatant.side,
    });
    updateDynamicStats(combatant, ctx);
    return false;
  }

  return true;
}
