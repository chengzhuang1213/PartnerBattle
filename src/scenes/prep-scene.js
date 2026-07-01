function selectPet(id) {
  if (!state.selectedSkillId) return;
  assignSkillToPet(state.selectedSkillId, id);
}

function selectSkill(id) {
  const skill = activeBuildSkills().find((item) => item.id === id);
  state.selectedSkillId = skill && !skill.assignedPetId ? id : null;
  renderGame();
}

function assignSkillToPet(skillId, petId, requiredTier = null) {
  const skills = activeBuildSkills();
  const team = activeBuildTeam();
  const skill = skills.find((item) => item.id === skillId);
  const pet = team.find((item) => item.id === petId);
  if (requiredTier && skill?.tier !== requiredTier) return;
  if (!skill || !pet || skill.assignedPetId) return;

  const blockedReason = skillAssignBlockedReason(pet, skill);
  if (blockedReason) {
    state.equipWarning = {
      skillName: skill.name,
      petName: pet.name,
      reason: blockedReason,
    };
    renderGame();
    return;
  }

  skill.assignedPetId = pet.id;
  pet.skills.push(skill.id);
  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function skillAssignBlockedReason(pet, skill) {
  const assigned = getPetSkills(pet, activeBuildSkills());
  const sameGroupSkill = assigned.find((item) => item.group === skill.group);
  if (sameGroupSkill) return `已经有${baseSkillName(sameGroupSkill)}`;

  if (!canAssignSkill(pet, skill, activeBuildSkills())) {
    if (skill.tier === "high") return "高级技能栏位已满";
    return "初级技能栏位已满";
  }

  return "";
}

function baseSkillName(skill) {
  return skill.name.replace(/^高级/, "");
}

function assignSelectedSkill(petId) {
  if (!state.selectedSkillId) return;
  assignSkillToPet(state.selectedSkillId, petId);
}

function removeSkill(skillId) {
  const skills = activeBuildSkills();
  const team = activeBuildTeam();
  const skill = skills.find((item) => item.id === skillId);
  if (!skill) return;

  const pet = team.find((item) => item.id === skill.assignedPetId);
  if (pet) pet.skills = pet.skills.filter((id) => id !== skill.id);
  skill.assignedPetId = null;
  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function autoAssignEnemySkills(team, skills) {
  for (const skill of shuffle(skills)) {
    const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }
}

function randomAssignPlayerSkills() {
  stopBattleReplay();
  const team = activeBuildTeam();
  const skills = activeBuildSkills();
  for (const pet of team) pet.skills = [];
  for (const skill of skills) skill.assignedPetId = null;

  for (const skill of shuffle(skills)) {
    const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }

  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function rerollPlayerStats() {
  stopBattleReplay();
  for (const pet of state.playerTeam) {
    const rolled = rollStats(POOLS[pet.poolKey]);
    pet.stats = rolled.stats;
    pet.power = rolled.power;
  }

  state.selectedSkillId = null;
  state.pendingPlayerId = null;
  state.battlePickMode = false;
  state.result = null;
  renderGame();
}

function handleSkillDragStart(event) {
  const button = event.target.closest("[data-skill]");
  if (!button) return;

  hidePrepTooltip();
  state.selectedSkillId = button.dataset.skill;
  event.dataTransfer.setData("text/plain", button.dataset.skill);
  event.dataTransfer.setData("application/x-skill-id", button.dataset.skill);
  event.dataTransfer.effectAllowed = "move";
}

function handleSkillDragOver(event) {
  const target = event.target.closest("[data-drop-pet]");
  if (!target) return;
  const skillId = event.dataTransfer.getData("text/plain") || state.selectedSkillId;
  const skill = activeBuildSkills().find((item) => item.id === skillId);
  if (target.dataset.dropTier && skill?.tier !== target.dataset.dropTier) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleSkillDrop(event) {
  const target = event.target.closest("[data-drop-pet]");
  if (!target) return;

  event.preventDefault();
  const skillId = event.dataTransfer.getData("application/x-skill-id") || event.dataTransfer.getData("text/plain") || state.selectedSkillId;
  assignSkillToPet(skillId, target.dataset.dropPet, target.dataset.dropTier || null);
}

function renderGame() {
  const hotseat = state.mode === "hotseat";
  const activeSide = activeBuildSide();
  const playerInteractive = !hotseat || activeSide === "player";
  const enemyInteractive = hotseat && activeSide === "enemy";
  const playerTitle = hotseat ? "玩家 A 技能池" : "我的技能池";
  const enemyTitle = hotseat ? "玩家 B 技能池" : "对方技能池（AI）";
  const readyText = hotseat ? (activeSide === "player" ? "玩家 A 确认 Build" : "玩家 B 确认 Build") : "确认分配";
  const footerHint = hotseat
    ? (activeSide === "player" ? "玩家 A 正在 Build。玩家 B 请不要观看屏幕。" : "玩家 B 正在 Build。只能查看玩家 A 的技能池和伙伴属性，看不到 A 的技能分配。")
    : "提示：你可以看到 AI 的完整技能池，但看不到 AI 最终把技能装给了谁。";
  app.innerHTML = `
    <section class="prep-screen">
      <header class="prep-header">
        <div>
          <h1>${hotseat ? "双人同屏 Build" : "战前准备"}</h1>
          <p>${hotseat ? (activeSide === "player" ? "玩家 A 分配技能" : "玩家 B 分配技能") : "在下方选择技能并分配给你的伙伴"}</p>
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
          ${hotseat ? "" : `<button class="reroll-button" data-reroll-player type="button">重新随机</button>`}
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

function rulesModal() {
  return `
    <div class="rules-overlay" data-close-rules>
      <section class="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <header>
          <h2 id="rules-title">规则说明</h2>
          <button class="rules-close" data-close-rules type="button" aria-label="关闭规则说明">×</button>
        </header>
        <div class="rules-content">
          <section>
            <h3>战前准备</h3>
            <p>每方随机获得 3 名伙伴：橙、紫、蓝各 1 名。你可以为我方伙伴分配技能，AI 会自动分配自己的技能。</p>
          </section>
          <section>
            <h3>技能池</h3>
            <p>每方拥有 6 个高级技能和 12 个初级技能。高级技能优先显示，同一伙伴不能重复装备同一技能组。</p>
          </section>
          <section>
            <h3>装备限制</h3>
            <ul>
              <li>橙色伙伴：最多 2 个高级技能 + 3 个初级技能。</li>
              <li>紫色伙伴：最多 1 个高级技能 + 3 个初级技能。</li>
              <li>蓝色伙伴：可装 3 个初级技能，或 1 个高级技能 + 1 个初级技能。</li>
            </ul>
          </section>
          <section>
            <h3>重新随机</h3>
            <p>左下角“重新随机”只会重随我方伙伴属性，保留当前角色、技能池、已装备技能和 AI 阵容。</p>
          </section>
          <section>
            <h3>战斗流程</h3>
            <p>确认分配后进入 BO3。每局你选择 1 名未上场伙伴，AI 随机派出未上场伙伴，先赢 2 局的一方获胜。</p>
          </section>
        </div>
      </section>
    </div>
  `;
}

function handlePrepTooltipMove(event) {
  const screen = event.target.closest(".prep-screen");
  if (!screen) {
    hidePrepTooltip();
    return;
  }

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".prep-skill[data-tooltip], .prep-slot[data-tooltip]");
  if (!target || !screen.contains(target)) {
    hidePrepTooltip();
    return;
  }

  showPrepTooltip(target.dataset.tooltip, event.clientX, event.clientY);
}

function handlePrepTooltipFocus(event) {
  const target = event.target.closest(".prep-skill[data-tooltip], .prep-slot[data-tooltip]");
  if (!target) return;

  const rect = target.getBoundingClientRect();
  showPrepTooltip(target.dataset.tooltip, rect.left + rect.width / 2, rect.top);
}

let prepTouchTooltipTimer = null;

function handlePrepTooltipTouchStart(event) {
  const target = event.target.closest(".prep-skill[data-tooltip], .prep-slot[data-tooltip]");
  if (!target || !event.target.closest(".prep-screen")) return;

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

function skillPool(skills, team, title, interactive) {
  const highSkills = displaySkillOrder(skills.filter((skill) => skill.tier === "high"));
  const basicSkills = displaySkillOrder(skills.filter((skill) => skill.tier === "basic"));
  const sideClass = interactive ? "player" : "enemy";

  return `
    <section class="prep-card skill-pool ${sideClass}-pool">
      <h2>${title}</h2>
      ${skillTierBlock("高级技能", highSkills, "6/6", team, interactive)}
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
  const canReceive = interactive && selectedSkill ? canAssignSkill(pet, selectedSkill, activeBuildSkills()) : false;

  return `
    <article class="prep-partner ${pet.poolClass} ${canReceive ? "can-receive-skill" : ""}" ${interactive ? `data-select="${pet.id}" data-drop-pet="${pet.id}"` : ""}>
      <span class="pool-ribbon">${poolShortName(pet.poolKey)}</span>
      <div class="partner-main">
        <span class="prep-portrait">${partnerArt(pet)}</span>
        <div class="partner-stats">
          ${compactStatRows(pet, interactive ? skillList : [])}
        </div>
      </div>
      ${slotTray(pet, skills, interactive)}
      <p class="equip-rule">${equipRuleText(pet.poolKey)}</p>
    </article>
  `;
}

function slotTray(pet, skills, interactive) {
  const highSkills = skills.filter((skill) => skill.tier === "high");
  const basicSkills = skills.filter((skill) => skill.tier === "basic");
  const highSlots = pet.poolKey === "blue" ? (highSkills.length ? 1 : 0) : SKILL_LIMITS[pet.poolKey].high;
  const basicSlots = pet.poolKey === "blue" && highSkills.length ? 1 : SKILL_LIMITS[pet.poolKey].basic;

  return `
    <div class="slot-tray">
      <div class="slot-row high-row">${renderSlots(highSkills, highSlots, interactive, "high", pet.id)}</div>
      <div class="slot-row basic-row">${renderSlots(basicSkills, basicSlots, interactive, "basic", pet.id)}</div>
    </div>
  `;
}

function renderSlots(skills, count, removable, tier, petId) {
  return Array.from({ length: count }, (_, index) => {
    const skill = skills[index];
    if (!skill) return `<span class="prep-slot ${tier} empty" ${removable ? `data-drop-pet="${petId}" data-drop-tier="${tier}"` : ""}><span class="slot-shape"></span></span>`;

    return `
      <button class="prep-slot ${tier} filled" data-tooltip="${skillTooltipText(skill)}" ${removable ? `data-remove-skill="${skill.id}"` : ""} type="button">
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
  return {
    orange: "可装备：2 高 3 初",
    purple: "可装备：1 高 3 初",
    blue: "可装备：3 初 或 1 高 1 初",
  }[poolKey];
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

function skillTooltipText(skill) {
  return `${skill.name}：${skill.description}`;
}
