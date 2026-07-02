function renderStart() {
  app.innerHTML = `
    <section class="start-screen">
      <div class="start-skyline" aria-hidden="true">
        <span class="gate left"></span>
        <span class="gate right"></span>
        <span class="school-building"></span>
      </div>

      <header class="start-title">
        <div class="sparkle-row" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
        <h1>伙伴对决</h1>
        <p>随机伙伴 · 策略对决</p>
      </header>

      <main class="mode-select">
        <button class="mode-card solo" data-start type="button">
          <span class="mode-icon">●</span>
          <strong>单人模式</strong>
          <small>挑战 AI 对手</small>
        </button>
        <button class="mode-card duo" data-start-hotseat type="button">
          <span class="mode-icon">◐◑</span>
          <strong>双人同屏</strong>
          <small>热座盲眼 Build</small>
        </button>
        <button class="mode-card online" data-start-practice type="button">
          <span class="mode-icon">●</span>
          <strong>练习模式</strong>
          <small>自定义 Build · BO1</small>
        </button>
      </main>

      <footer class="start-menu">
        <button class="menu-button" type="button">
          <span>⚙</span>
          设置
        </button>
        <button class="menu-button" type="button">
          <span>↪</span>
          退出
        </button>
      </footer>
    </section>
  `;
}
