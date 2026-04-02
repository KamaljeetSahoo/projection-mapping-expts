export function createAudio() {
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let freqData = null;
  let waveData = null;

  // Beat detection state
  let beatEnergy = 0;
  let beatAvg = 0;
  let beatDecay = 0;
  const BEAT_THRESHOLD = 1.15;
  const BEAT_DECAY_RATE = 0.85;

  async function init() {
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    freqData = new Uint8Array(analyser.frequencyBinCount);
    waveData = new Uint8Array(analyser.fftSize);

    return true;
  }

  function getFrequencyData() {
    if (!analyser) return freqData;
    analyser.getByteFrequencyData(freqData);
    return freqData;
  }

  function getWaveformData() {
    if (!analyser) return waveData;
    analyser.getByteTimeDomainData(waveData);
    return waveData;
  }

  function getEnergy(startBin, endBin) {
    if (!freqData) return 0;
    let sum = 0;
    const s = Math.max(0, startBin);
    const e = Math.min(freqData.length, endBin);
    for (let i = s; i < e; i++) sum += freqData[i];
    return sum / (e - s) / 255;
  }

  // Frequency ranges (approximate for 44100Hz sample rate, 2048 FFT)
  // Each bin = sampleRate / fftSize ≈ 21.5Hz
  function getBass() { return getEnergy(1, 10); }     // ~20-215Hz
  function getMid() { return getEnergy(10, 100); }    // ~215-2150Hz
  function getTreble() { return getEnergy(100, 400); } // ~2150-8600Hz
  function getOverall() { return getEnergy(1, 400); }

  function isBeat() {
    const bass = getBass();
    beatEnergy = bass;

    if (beatDecay > 0) {
      beatDecay *= BEAT_DECAY_RATE;
      return false;
    }

    if (bass > beatAvg * BEAT_THRESHOLD && bass > 0.05) {
      beatDecay = 1;
      beatAvg = beatAvg * 0.7 + bass * 0.3;
      return true;
    }

    beatAvg = beatAvg * 0.95 + bass * 0.05;
    return false;
  }

  function update() {
    getFrequencyData();
  }

  function destroy() {
    if (source) source.disconnect();
    if (audioCtx) audioCtx.close();
  }

  return {
    init,
    update,
    getFrequencyData,
    getWaveformData,
    getBass,
    getMid,
    getTreble,
    getOverall,
    isBeat,
    destroy,
    get binCount() { return analyser ? analyser.frequencyBinCount : 0; },
    get fftSize() { return analyser ? analyser.fftSize : 0; },
  };
}
