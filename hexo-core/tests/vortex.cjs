async function measureVortex({ send, evaluate }) {
  const visibility = await evaluate(() => {
    const { style } = document.querySelector('.vortex-bg');
    return [style.getPropertyValue('visibility'), style.getPropertyPriority('visibility')];
  });
  // Reduced motion already keeps the vortex static.
  const animated = await evaluate(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (animated) await send('Animation.setPlaybackRate', { playbackRate: 0 });
  const screenshot = { format: 'png', captureBeyondViewport: false };
  try {
    const { data: visible } = await send('Page.captureScreenshot', screenshot);
    await evaluate(async () => {
      document.querySelector('.vortex-bg').style.setProperty('visibility', 'hidden');
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const { data: hidden } = await send('Page.captureScreenshot', screenshot);
    return await evaluate(async (visible, hidden) => {
      async function pixels(data) {
        const image = new Image();
        image.src = 'data:image/png;base64,' + data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        // Sample clear margins away from the home title and footer controls.
        const regions = [[8, 0.27], [image.width - 40, 0.38], [image.width - 40, 0.72], [8, 0.8]];
        return regions.map(([x, y]) => context.getImageData(x, Math.floor(image.height * y), 32, 32).data);
      }

      const [shown, concealed] = await Promise.all([pixels(visible), pixels(hidden)]);
      return shown.map((region, index) => {
        const comparison = concealed[index];
        let changed = 0;
        for (let i = 0; i < region.length; i += 4) {
          // Two RGB levels tolerate rasterization noise while detecting Acid v3's subtle gradient.
          if (Math.abs(region[i] - comparison[i]) >= 2 ||
              Math.abs(region[i + 1] - comparison[i + 1]) >= 2 ||
              Math.abs(region[i + 2] - comparison[i + 2]) >= 2) changed++;
        }
        return Math.round(changed * 100 / (region.length / 4));
      });
    }, visible, hidden);
  } finally {
    await evaluate(([value, priority]) => {
      document.querySelector('.vortex-bg').style.setProperty('visibility', value, priority);
    }, visibility);
    if (animated) await send('Animation.setPlaybackRate', { playbackRate: 1 });
  }
}

module.exports = { measureVortex };
