export function initClock(is24h = false) {
  const svg = document.getElementById('clock-svg');
  const markersGroup = document.getElementById('clock-markers');
  const hourHand = document.getElementById('hand-hour');
  const minuteHand = document.getElementById('hand-minute');
  const secondHand = document.getElementById('hand-second');
  const digitalEl = document.getElementById('clock-digital');

  // Draw hour markers
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 360;
    const rad = (angle - 90) * (Math.PI / 180);
    const isMain = i % 3 === 0;
    const innerR = isMain ? 82 : 86;
    const outerR = 92;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 100 + Math.cos(rad) * innerR);
    line.setAttribute('y1', 100 + Math.sin(rad) * innerR);
    line.setAttribute('x2', 100 + Math.cos(rad) * outerR);
    line.setAttribute('y2', 100 + Math.sin(rad) * outerR);
    line.setAttribute('stroke', isMain ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)');
    line.setAttribute('stroke-width', isMain ? '2' : '1');
    line.setAttribute('stroke-linecap', 'round');
    markersGroup.appendChild(line);
  }

  let use24h = is24h;

  function setHand(el, angle, length) {
    const rad = (angle - 90) * (Math.PI / 180);
    el.setAttribute('x2', 100 + Math.cos(rad) * length);
    el.setAttribute('y2', 100 + Math.sin(rad) * length);
  }

  function update() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    const smoothS = s + ms / 1000;
    const smoothM = m + smoothS / 60;
    const smoothH = (h % 12) + smoothM / 60;

    setHand(secondHand, (smoothS / 60) * 360, 70);
    setHand(minuteHand, (smoothM / 60) * 360, 65);
    setHand(hourHand, (smoothH / 12) * 360, 45);

    // Digital
    let displayH = use24h ? h : (h % 12 || 12);
    const timeStr = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const secStr = String(s).padStart(2, '0');
    const ampm = use24h ? '' : `<span class="clock-ampm">${h >= 12 ? 'PM' : 'AM'}</span>`;
    digitalEl.innerHTML = `${timeStr}<span class="clock-seconds">${secStr}</span>${ampm}`;
  }

  function toggle24h() {
    use24h = !use24h;
  }

  return { update, toggle24h };
}
