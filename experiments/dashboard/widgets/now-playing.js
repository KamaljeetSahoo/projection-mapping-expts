export function initNowPlaying() {
  const container = document.getElementById('np-content');

  function renderIdle() {
    container.innerHTML = `
      <div class="np-idle">
        <div class="np-bars">
          <div class="np-bar" style="height: 8px;"></div>
          <div class="np-bar" style="height: 14px;"></div>
          <div class="np-bar" style="height: 10px;"></div>
          <div class="np-bar" style="height: 16px;"></div>
          <div class="np-bar" style="height: 6px;"></div>
        </div>
        No media playing
      </div>
    `;
  }

  function renderPlaying(title, artist) {
    container.innerHTML = `
      <div class="np-content">
        <div class="np-art">\uD83C\uDFB5</div>
        <div class="np-info">
          <div class="np-title">${title}</div>
          <div class="np-artist">${artist}</div>
        </div>
      </div>
    `;
  }

  function update() {
    if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
      const meta = navigator.mediaSession.metadata;
      renderPlaying(
        meta.title || 'Unknown Track',
        meta.artist || 'Unknown Artist'
      );
    } else {
      renderIdle();
    }
  }

  update();
  setInterval(update, 2000);

  return { update };
}
