export function createWaveform() {
  let smoothedBass = 0;

  return {
    name: 'Waveform',

    init(canvas) {
      canvas.clear('#000');
      smoothedBass = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.85)');

      const waveform = audio.getWaveformData();
      if (!waveform || !waveform.length) return;

      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      smoothedBass += (bass - smoothedBass) * 0.15;

      const centerY = height / 2;
      const amplitude = height * 0.35;

      // Draw multiple layered waves
      const layers = [
        { offset: 0, alpha: 0.8, widthMul: 1, hueShift: 0 },
        { offset: 0.02, alpha: 0.4, widthMul: 0.6, hueShift: 40 },
        { offset: -0.02, alpha: 0.3, widthMul: 0.4, hueShift: -40 },
      ];

      for (const layer of layers) {
        const hue = (200 + smoothedBass * 120 + layer.hueShift) % 360;
        const sat = 70 + mid * 30;
        const light = 45 + treble * 25;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${layer.alpha})`;
        ctx.lineWidth = (2 + smoothedBass * 6) * layer.widthMul;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        const sliceWidth = width / waveform.length;

        for (let i = 0; i < waveform.length; i++) {
          const v = (waveform[i] / 128.0 - 1.0) + layer.offset;
          const x = i * sliceWidth;
          const y = centerY + v * amplitude * (1 + smoothedBass * 0.5);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Glow behind the wave on beats
      if (audio.isBeat()) {
        const gradient = ctx.createRadialGradient(
          width / 2, centerY, 0,
          width / 2, centerY, width * 0.4
        );
        const hue = (200 + smoothedBass * 120) % 360;
        gradient.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.12)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    },

    destroy() {},
  };
}
