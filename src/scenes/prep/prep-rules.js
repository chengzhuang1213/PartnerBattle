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
            <p>${state.battleMode === "competitive" ? "竞技模式为 3v3 BO3。每方选择 3 名角色，开局属性统一为 HP 90 / ATK 20 / DEF 10 / SPD 10。" : "每方随机获得 3 名伙伴：橙、紫、蓝各 1 名。你可以为我方伙伴分配技能，AI 会自动分配自己的技能。"}</p>
          </section>
          <section>
            <h3>技能池</h3>
            <p>每方拥有 6 个高级技能和 12 个初级技能。高级技能优先显示，同一角色不能重复装备同一技能组，例如不能同时携带“连击”和“高级连击”。</p>
          </section>
          <section>
            <h3>装备限制</h3>
            <ul>
              ${state.battleMode === "competitive" ? competitiveEquipRules() : brawlEquipRules()}
            </ul>
          </section>
          <section>
            <h3>重新随机</h3>
            <p>${state.battleMode === "competitive" ? "竞技模式使用固定属性，不提供重新随机。" : "左下角“重新随机”只会重随我方伙伴属性，保留当前角色、技能池、已装备技能和 AI 阵容。"}</p>
          </section>
          <section>
            <h3>战斗流程</h3>
            <p>${state.battleMode === "brawl" ? "确认分配后进入 KOF3 擂台赛。胜者继续守擂，败者换下一名伙伴上场；任意一方 3 名伙伴全部失败后判负。" : "确认分配后进入 3v3 BO3。每局双方各选择 1 名未上场角色，先赢 2 局的一方获胜。"}</p>
          </section>
        </div>
      </section>
    </div>
  `;
}
