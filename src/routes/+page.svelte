<main>
  <h1>🎼 Orchestra</h1>
  <p>Multi-project AI agent orchestrator</p>

  <nav>
    <a href="/projects">Projects</a>
    <a href="/runs">Runs</a>
  </nav>

  <section>
    <h2>Quick Stats</h2>
    <div class="stats">
      <div class="stat">
        <span class="label">Projects</span>
        <span class="value">0</span>
      </div>
      <div class="stat">
        <span class="label">Active Runs</span>
        <span class="value">0</span>
      </div>
      <div class="stat">
        <span class="label">Completed Today</span>
        <span class="value">0</span>
      </div>
    </div>
  </section>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  nav {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }

  nav a {
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    border-radius: 4px;
    text-decoration: none;
    color: inherit;
  }

  nav a:hover {
    background: #e0e0e0;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat {
    background: #f8f8f8;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
  }

  .stat .label {
    display: block;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .stat .value {
    display: block;
    font-size: 2rem;
    font-weight: bold;
  }
</style>
