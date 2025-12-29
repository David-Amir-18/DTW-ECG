import { useEffect, useRef } from 'react';

function ECGChart({ data, title, width = 800, height = 200, color = '#2563eb', showGrid = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;

    if (showGrid) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = padding + (chartHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minVal) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Time (ms)', width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude (mV)', 0, 0);
    ctx.restore();

  }, [data, width, height, color, showGrid]);

  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>{title}</h3>}
      <canvas
        ref={canvasRef}
        className="border rounded-lg shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      />
    </div>
  );
}

export default ECGChart;
