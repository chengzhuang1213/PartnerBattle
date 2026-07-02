function renderGame() {
  const hotseat = state.mode === "hotseat";
  const competitive = state.battleMode === "competitive";
  const activeSide = activeBuildSide();
  const playerInteractive = !hotseat || activeSide === "player";
  const enemyInteractive = hotseat && activeSide === "enemy";
  const playerTitle = hotseat ? "玩家 A 技能池" : "我的技能池";
  const enemyTitle = hotseat ? "玩家 B 技能池" : "对方技能池（AI）";
  const readyText = hotseat ? (activeSide === "player" ? "玩家 A 确认 Build" : "玩家 B 确认 Build") : "确认分配";
  const pageTitle = competitive ? "竞技模式 Build" : hotseat ? "双人同屏 Build" : "战前准备";
  const pageHint = competitive
    ? (hotseat ? (activeSide === "player" ? "玩家 A 分配 3 名角色的技能" : "玩家 B 分配 3 名角色的技能") : "双方 3 名角色，初始属性固定为 HP 90 / ATK 20 / DEF 10 / SPD 10")
    : hotseat ? (activeSide === "player" ? "玩家 A 分配技能" : "玩家 B 分配技能") : "在下方选择技能并分配给你的伙伴";
  const footerHint = hotseat
    ? (activeSide === "player" ? "玩家 A 正在 Build。玩家 B 请不要观看屏幕。" : "玩家 B 正在 Build。只能查看玩家 A 的技能池和伙伴属性，看不到 A 的技能分配。")
    : competitive ? "竞技模式：3v3 BO3；全队最多 4 个高级技能；每人最多 2 高 + 3 初；同组技能不可重复。" : "提示：你可以看到 AI 的完整技能池，但看不到 AI 最终把技能装给了谁。";
  app.innerHTML = `
    <section class="prep-screen">
      <header class="prep-header">
        <div>
          <h1>${pageTitle}</h1>
          <p>${pageHint}</p>
        </div>
        <button class="rules-button" data-rules type="button">规则说明</button>
      </header>

      <main class="prep-board">
        <section class="side-panel player-side">
          ${skillPool(state.playerSkills, state.playerTeam, playerTitle, playerInteractive)}
          ${teamPanel(state.playerTeam, state.playerSkills, hotseat ? "玩家 A 伙伴" : "我的伙伴", playerInteractive)}
        </section>

        <section class="versus-panel">
          <div class="versus-mark">VS</div>
        </section>

        <section class="side-panel enemy-side">
          ${skillPool(state.enemySkills, state.enemyTeam, enemyTitle, enemyInteractive)}
          ${teamPanel(state.enemyTeam, state.enemySkills, hotseat ? "玩家 B 伙伴" : "对方伙伴", enemyInteractive)}
        </section>
      </main>

      <footer class="prep-footer">
        <div class="prep-footer-left">
          <button class="prep-back" data-confirm-home type="button">返回</button>
          ${hotseat || competitive ? "" : `<button class="reroll-button" data-reroll-player type="button">重新随机</button>`}
        </div>
        <p>${footerHint}</p>
        <div class="prep-actions">
          <button class="recommend-button" data-random-skills>一键推荐</button>
          <button class="ready-button" data-fight>${readyText}</button>
        </div>
      </footer>
      <div class="prep-floating-tooltip" role="tooltip" hidden></div>
      ${state.showRules ? rulesModal() : ""}
      ${state.equipWarning ? equipWarningModal(state.equipWarning) : ""}
      ${state.confirmHome ? homeConfirmModal() : ""}
      ${state.confirmBuild ? buildConfirmModal() : ""}
      ${privacyGateOverlay()}
    </section>
  `;
}

function activeBuildSide() {
  return state.mode === "hotseat" ? state.buildSide : "player";
}

function activeBuildTeam() {
  return activeBuildSide() === "enemy" ? state.enemyTeam : state.playerTeam;
}

function activeBuildSkills() {
  return activeBuildSide() === "enemy" ? state.enemySkills : state.playerSkills;
}

function homeConfirmModal() {
  return `
    <div class="home-confirm-overlay" data-close-home-confirm>
      <section class="home-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="home-confirm-title">
        <header>
          <h2 id="home-confirm-title">确认返回首页？</h2>
          <button class="home-confirm-close" data-close-home-confirm type="button" aria-label="取消返回">×</button>
        </header>
        <p>返回首页后，当前准备进度不会保留。</p>
        <footer>
          <button class="home-confirm-cancel" data-close-home-confirm type="button">取消</button>
          <button class="home-confirm-go" data-go-home type="button">确认返回首页</button>
        </footer>
      </section>
    </div>
  `;
}

function buildConfirmModal() {
  const hotseat = state.mode === "hotseat";
  const activeSide = activeBuildSide();
  const playerLabel = hotseat ? (activeSide === "player" ? "玩家 A" : "玩家 B") : "当前分配";
  const nextText = hotseat
    ? (activeSide === "player" ? "确认后会进入玩家 B 的 Build 遮屏。" : "确认后会进入出战选择遮屏。")
    : "确认后会进入出战选择。";
  return `
    <div class="home-confirm-overlay build-confirm-overlay" data-close-build-confirm>
      <section class="home-confirm-modal build-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="build-confirm-title">
        <header>
          <h2 id="build-confirm-title">确认提交 ${playerLabel} 的 Build？</h2>
          <button class="home-confirm-close build-confirm-close" data-close-build-confirm type="button" aria-label="取消提交">×</button>
        </header>
        <p>${nextText} 提交后本轮技能分配不能再修改。</p>
        <footer>
          <button class="home-confirm-cancel build-confirm-cancel" data-close-build-confirm type="button">取消</button>
          <button class="home-confirm-go" data-confirm-build type="button">确认提交</button>
        </footer>
      </section>
    </div>
  `;
}

function equipWarningModal(warning) {
  return `
    <div class="equip-warning-overlay" data-close-equip-warning>
      <section class="equip-warning-modal" role="alertdialog" aria-modal="true" aria-labelledby="equip-warning-title">
        <header>
          <h2 id="equip-warning-title">无法装备</h2>
          <button class="equip-warning-close" data-close-equip-warning type="button" aria-label="关闭警告">×</button>
        </header>
        <div class="equip-warning-content">
          <strong>${warning.skillName}</strong>
          <p>无法装备原因：${warning.reason}。</p>
        </div>
        <footer>
          <button class="equip-warning-back" data-close-equip-warning type="button">返回</button>
        </footer>
      </section>
    </div>
  `;
}

function skillPool(skills, team, title, interactive) {
  const highSkills = displaySkillOrder(skills.filter((skill) => skill.tier === "high"));
  const basicSkills = displaySkillOrder(skills.filter((skill) => skill.tier === "basic"));
  const sideClass = interactive ? "player" : "enemy";
  const teamHighCount = skills.filter((skill) => skill.tier === "high" && skill.assignedPetId).length;
  const highCountText = state.battleMode === "competitive" ? `高级技能 ${teamHighCount}/${COMPETITIVE_SKILL_LIMITS.teamHigh}` : "6/6";

  return `
    <section class="prep-card skill-pool ${sideClass}-pool">
      <h2>${title}</h2>
      ${skillTierBlock("高级技能", highSkills, highCountText, team, interactive)}
      ${skillTierBlock("初级技能", basicSkills, "12/12", team, interactive)}
    </section>
  `;
}

function skillTierBlock(title, skills, countText, team, interactive) {
  return `
    <div class="skill-tier-block">
      <h3>${title} <span>${countText}</span></h3>
      <div class="prep-skill-grid">
        ${skills.map((skill) => skillButton(skill, team, interactive)).join("")}
      </div>
    </div>
  `;
}

function skillButton(skill, team, interactive) {
  const assignedPet = interactive ? team.find((pet) => pet.id === skill.assignedPetId) : null;
  const selected = interactive && state.selectedSkillId === skill.id;
  const disabled = Boolean(assignedPet);

  return `
    <button
      class="prep-skill ${skill.tier} ${selected ? "selected" : ""} ${interactive ? "" : "is-readonly"}"
      ${interactive && !disabled ? `data-skill="${skill.id}" draggable="true"` : ""}
      data-tooltip="${skillTooltipText(skill)}"
      ${disabled || !interactive ? "disabled" : ""}
      type="button"
    >
      <span class="skill-gem">${skillIconText(skill)}</span>
      <span class="skill-name">${skill.name}</span>
    </button>
  `;
}

function teamPanel(team, skillList, title, interactive) {
  return `
    <section class="prep-card team-panel">
      <h2>${title}${interactive ? " <small>点击或拖拽技能到伙伴栏</small>" : " <small>AI 将在分配完技能后选择出场顺序</small>"}</h2>
      <div class="prep-team-grid">
        ${team.map((pet) => partnerCard(pet, skillList, interactive)).join("")}
      </div>
    </section>
  `;
}

function partnerCard(pet, skillList, interactive) {
  const skills = interactive ? getPetSkills(pet, skillList) : [];
  const selectedSkill = activeBuildSkills().find((skill) => skill.id === state.selectedSkillId);
  const canReceive = interactive && selectedSkill ? canAssignSkill(pet, selectedSkill, activeBuildSkills(), activeSkillLimits()) : false;
  const counts = skillSlotCounts(pet, skills);
  const cardClass = state.battleMode === "competitive" ? `competitive ${partnerThemeClass(pet)}` : pet.poolClass;
  const nameClass = usePartnerThemeName() ? partnerThemeClass(pet) : pet.poolClass;
  const ribbon = state.battleMode === "competitive" ? "" : `<span class="pool-ribbon">${poolShortName(pet.poolKey)}</span>`;

  return `
    <article class="prep-partner ${cardClass} ${canReceive ? "can-receive-skill" : ""}" ${interactive ? `data-select="${pet.id}" data-drop-pet="${pet.id}"` : ""}>
      ${ribbon}
      <strong class="partner-name ${nameClass}">${pet.name}</strong>
      <div class="partner-main">
        <span class="prep-portrait">${partnerArt(pet)}</span>
        <div class="partner-stats">
          ${compactStatRows(pet, interactive ? skillList : [])}
        </div>
      </div>
      ${slotTray(pet, skills, interactive)}
      <div class="slot-counts">
        <span class="high">高级 ${counts.high.used}/${counts.high.max}</span>
        <span class="basic">初级 ${counts.basic.used}/${counts.basic.max}</span>
      </div>
      ${state.battleMode === "competitive" ? "" : `<p class="equip-rule">${equipRuleText(pet.poolKey)}</p>`}
    </article>
  `;
}

function slotTray(pet, skills, interactive) {
  const counts = skillSlotCounts(pet, skills);
  const highSkills = skills.filter((skill) => skill.tier === "high");
  const basicSkills = skills.filter((skill) => skill.tier === "basic");

  return `
    <div class="slot-tray">
      <div class="slot-row high-row">${renderSlots(highSkills, counts.high.max, interactive, "high", pet.id)}</div>
      <div class="slot-row basic-row">${renderSlots(basicSkills, counts.basic.max, interactive, "basic", pet.id)}</div>
    </div>
  `;
}

function skillSlotCounts(pet, skills) {
  const highSkills = skills.filter((skill) => skill.tier === "high");
  const basicSkills = skills.filter((skill) => skill.tier === "basic");
  const highSlots = state.battleMode === "competitive" ? COMPETITIVE_SKILL_LIMITS.perPet.high : pet.poolKey === "blue" ? (highSkills.length ? 1 : 0) : SKILL_LIMITS[pet.poolKey].high;
  const basicSlots = state.battleMode === "competitive" ? COMPETITIVE_SKILL_LIMITS.perPet.basic : pet.poolKey === "blue" && highSkills.length ? 1 : SKILL_LIMITS[pet.poolKey].basic;

  return {
    high: { used: highSkills.length, max: highSlots },
    basic: { used: basicSkills.length, max: basicSlots },
  };
}

function renderSlots(skills, count, removable, tier, petId) {
  return Array.from({ length: count }, (_, index) => {
    const skill = skills[index];
    if (!skill) return `<span class="prep-slot ${tier} empty" ${removable ? `data-drop-pet="${petId}" data-drop-tier="${tier}"` : ""}><span class="slot-shape"></span></span>`;

    return `
      <button
        class="prep-slot ${tier} filled"
        data-tooltip="${skillTooltipText(skill)}"
        ${removable ? `data-remove-skill="${skill.id}" data-drag-skill="${skill.id}" data-drop-pet="${petId}" data-drop-tier="${tier}" data-drop-skill="${skill.id}" draggable="true"` : ""}
        type="button"
      >
        <span class="slot-shape">${skillIconText(skill)}</span>
      </button>
    `;
  }).join("");
}

function compactStatRows(pet, skillList) {
  const currentStats = petOpeningStats(pet, skillList);
  return ["hp", "atk", "def", "spd"]
    .map((key) => {
      const baseValue = pet.stats[key];
      const currentValue = currentStats[key];
      const statClass = currentValue > baseValue ? "stat-up" : currentValue < baseValue ? "stat-down" : "";
      return `<span>${key.toUpperCase()} <strong class="${statClass}">${currentValue}</strong></span>`;
    })
    .join("");
}

function poolShortName(poolKey) {
  return { orange: "橙", purple: "紫", blue: "蓝" }[poolKey];
}

function equipRuleText(poolKey) {
  if (state.battleMode === "competitive") return `竞技：每人 2 高 + 3 初；全队最多 ${COMPETITIVE_SKILL_LIMITS.teamHigh} 高；同组不可重复`;
  return {
    orange: "可装备：2 高 3 初",
    purple: "可装备：1 高 3 初",
    blue: "可装备：3 初 或 1 高 1 初",
  }[poolKey];
}

function brawlEquipRules() {
  return `
    <li>橙色伙伴：最多 2 个高级技能 + 3 个初级技能。</li>
    <li>紫色伙伴：最多 1 个高级技能 + 3 个初级技能。</li>
    <li>蓝色伙伴：可装 3 个初级技能，或 1 个高级技能 + 1 个初级技能。</li>
  `;
}

function competitiveEquipRules() {
  return `
    <li>每个角色：最多 2 个高级技能 + 3 个初级技能。</li>
    <li>全队限制：最多装备 ${COMPETITIVE_SKILL_LIMITS.teamHigh} 个高级技能。</li>
    <li>同组不可重复：不能同时携带初级和高级版本，例如“连击 + 高级连击”。</li>
    <li>初级技能不设全队总数限制，只受单个角色栏位限制。</li>
  `;
}

function shortSkillName(skill) {
  return skill.name.replace(/^高级/, "").slice(0, 4);
}

function skillIconText(skill) {
  const iconSrc = skillIconSrc(skill);
  if (iconSrc) {
    return `<img class="skill-icon-img" src="${iconSrc}" alt="${skill.name}" />`;
  }

  return shortSkillName(skill).slice(0, 2);
}

function skillIconSrc(skill) {
  const icons = {
    "crit:basic": "assets/skill-icons/crit-basic.png",
    "crit:high": "assets/skill-icons/crit-high.png",
    "combo:basic": "assets/skill-icons/combo-basic.png",
    "combo:high": "assets/skill-icons/combo-high.png",
    "lifesteal:basic": "assets/skill-icons/lifesteal-basic.png",
    "lifesteal:high": "assets/skill-icons/lifesteal-high.png",
    "sneak:basic": "assets/skill-icons/sneak-basic.png",
    "sneak:high": "assets/skill-icons/sneak-high.png",
    "power:basic": "assets/skill-icons/power-basic.png",
    "power:high": "assets/skill-icons/power-high.png",
    "revive:basic": "assets/skill-icons/revive-basic.png",
    "revive:high": "assets/skill-icons/revive-high.png",
    "lucky:basic": "assets/skill-icons/lucky-basic.png",
    "lucky:high": "assets/skill-icons/lucky-high.png",
    "parry:basic": "assets/skill-icons/parry-basic.png",
    "parry:high": "assets/skill-icons/parry-high.png",
    "defense:basic": "assets/skill-icons/defense-basic.png",
    "defense:high": "assets/skill-icons/defense-high.png",
    "regen:basic": "assets/skill-icons/regen-basic.png",
    "regen:high": "assets/skill-icons/regen-high.png",
    "reflect:basic": "assets/skill-icons/reflect-basic.png",
    "reflect:high": "assets/skill-icons/reflect-high.png",
    "counter:basic": "assets/skill-icons/counter-basic.png",
    "counter:high": "assets/skill-icons/counter-high.png",
    "agile:basic": "assets/skill-icons/agile-basic.png",
    "agile:high": "assets/skill-icons/agile-high.png",
    "unyielding:basic": "assets/skill-icons/unyielding-basic.png",
    "unyielding:high": "assets/skill-icons/unyielding-high.png",
    "poison:basic": "assets/skill-icons/poison-basic.png",
    "poison:high": "assets/skill-icons/poison-high.png",
    "flight:basic": "assets/skill-icons/flight-basic.png",
    "flight:high": "assets/skill-icons/flight-high.png",
  };
  return icons[`${skill.group}:${skill.tier}`] || "";
}
