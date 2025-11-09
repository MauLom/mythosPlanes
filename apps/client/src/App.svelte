<script lang="ts">
  import Play from './routes/Play.svelte';

  let currentRoute = window.location.pathname;

  function navigate(path: string) {
    currentRoute = path;
    window.history.pushState({}, '', path);
  }

  window.addEventListener('popstate', () => {
    currentRoute = window.location.pathname;
  });
</script>

{#if currentRoute === '/play'}
  <Play />
{:else}
  <main>
    <h1>Mythos Planes</h1>
    <div class="nav">
      <button on:click={() => navigate('/play')}>Go to Play View</button>
    </div>
    <p>Click the button above to start the interactive board.</p>
  </main>
{/if}

<style>
  main {
    text-align: center;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    font-size: 3rem;
    font-weight: 100;
    margin-bottom: 2rem;
  }

  .nav {
    margin: 2rem 0;
  }

  button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: #ff5722;
  }

  p {
    font-size: 1.2rem;
    color: #888;
  }
</style>
