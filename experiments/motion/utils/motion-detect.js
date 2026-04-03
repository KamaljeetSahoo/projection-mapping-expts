export function createMotionDetector() {
  let video = null;
  let prevFrame = null;
  let motionCanvas = null;
  let motionCtx = null;
  const GRID_COLS = 32;
  const GRID_ROWS = 18;
  let motionGrid = [];
  for (let r = 0; r < GRID_ROWS; r++) motionGrid.push(new Float32Array(GRID_COLS));

  async function init() {
    video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.muted = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 180, facingMode: 'user' },
    });
    video.srcObject = stream;
    await video.play();

    motionCanvas = document.createElement('canvas');
    motionCanvas.width = GRID_COLS;
    motionCanvas.height = GRID_ROWS;
    motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });

    return true;
  }

  function update() {
    if (!video || !motionCtx || video.readyState < 2) return;

    // Draw video frame at grid resolution (very small for performance)
    motionCtx.drawImage(video, 0, 0, GRID_COLS, GRID_ROWS);
    const frame = motionCtx.getImageData(0, 0, GRID_COLS, GRID_ROWS);
    const data = frame.data;

    if (prevFrame) {
      const prev = prevFrame.data;
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const i = (r * GRID_COLS + c) * 4;
          // Brightness difference
          const currBright = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const prevBright = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
          const diff = Math.abs(currBright - prevBright) / 255;

          // Smooth: fast rise, slow fall
          const target = Math.min(1, diff * 4);
          if (target > motionGrid[r][c]) {
            motionGrid[r][c] += (target - motionGrid[r][c]) * 0.6;
          } else {
            motionGrid[r][c] *= 0.85;
          }
        }
      }
    }

    prevFrame = frame;
  }

  function getGrid() { return motionGrid; }
  function getCols() { return GRID_COLS; }
  function getRows() { return GRID_ROWS; }

  // Get overall motion amount (0-1)
  function getOverallMotion() {
    let sum = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) sum += motionGrid[r][c];
    }
    return sum / (GRID_ROWS * GRID_COLS);
  }

  // Get motion center of mass (normalized 0-1)
  function getMotionCenter() {
    let totalWeight = 0, wx = 0, wy = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const w = motionGrid[r][c];
        // Mirror horizontally (webcam is mirrored)
        wx += (1 - c / GRID_COLS) * w;
        wy += (r / GRID_ROWS) * w;
        totalWeight += w;
      }
    }
    if (totalWeight < 0.01) return { x: 0.5, y: 0.5 };
    return { x: wx / totalWeight, y: wy / totalWeight };
  }

  function destroy() {
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
    }
  }

  return { init, update, getGrid, getCols, getRows, getOverallMotion, getMotionCenter, destroy };
}
