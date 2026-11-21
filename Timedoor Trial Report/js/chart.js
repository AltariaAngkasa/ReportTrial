/**
 * Menggambar Spider / Radar Chart untuk 5 aspek penilaian utama
 * Digunakan baik untuk UI Card maupun Canvas tajam pada halaman PDF.
 */
function renderSpiderChart(canvas, scoresObj, options = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // High-DPI scaling agar hasil render PDF & Retina tajam tidak pecah
  const dpr = options.dpr || window.devicePixelRatio || 2;
  const logicalW = options.width || 380;
  const logicalH = options.height || 340;

  if (canvas.width !== logicalW * dpr || canvas.height !== logicalH * dpr) {
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, logicalW, logicalH);

  const axes = [
    { key: "logic", label: ["Logic"] },
    { key: "programming", label: ["Programming"] },
    { key: "agility", label: ["Agility", "Learning"] },
    { key: "literacy", label: ["Literacy", "Safety"] },
    { key: "creativity", label: ["Creativity"] }
  ];

  const numAxes = axes.length;
  const maxVal = 5;
  const centerX = logicalW / 2;
  const centerY = logicalH / 2 + 4;
  const radius = Math.min(logicalW, logicalH) * 0.400;
  const startAngle = -Math.PI / 2;

  // 1. Gambar Jaring Laba-laba (5 Level Pentagon)
  for (let level = 1; level <= maxVal; level++) {
    const r = (radius / maxVal) * level;
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / numAxes;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = level % 2 === 0 ? "rgba(235, 244, 253, 0.55)" : "rgba(255, 255, 255, 0.8)";
    ctx.fill();
    ctx.strokeStyle = level === maxVal ? "#93B7DF" : "#CBD9EA";
    ctx.lineWidth = level === maxVal ? 1.8 : 1.1;
    ctx.stroke();

    // Angka skala 1-5 di sepanjang sumbu atas
    ctx.fillStyle = "#7B90A8";
    ctx.font = "600 10px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(level), centerX + 10, centerY - r + 3);
  }

  // 2. Gambar Garis Sumbu & Label Sumbu
  axes.forEach((axis, i) => {
    const angle = startAngle + (i * 2 * Math.PI) / numAxes;
    const endX = centerX + radius * Math.cos(angle);
    const endY = centerY + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "#B8CCE2";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Posisi label luar
    const labelDist = radius + 22;
    const lx = centerX + labelDist * Math.cos(angle);
    const ly = centerY + labelDist * Math.sin(angle);

    ctx.fillStyle = "#142B4A";
    ctx.font = "700 12.5px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const val = scoresObj[axis.key] || 0;
    const lineHeight = 14;
    const totalH = (axis.label.length - 1) * lineHeight;

    axis.label.forEach((lineText, lineIdx) => {
      const textWithScore =
        lineIdx === axis.label.length - 1 ? `${lineText} (${val}/5)` : lineText;
      ctx.fillText(textWithScore, lx, ly - totalH / 2 + lineIdx * lineHeight);
    });
  });

  // 3. Gambar Poligon Data Penilaian Siswa
  const hasAnyScore = axes.some((a) => (scoresObj[a.key] || 0) > 0);
  if (hasAnyScore) {
    ctx.beginPath();
    axes.forEach((axis, i) => {
      const val = Math.max(0, Math.min(5, scoresObj[axis.key] || 0));
      const r = (radius / maxVal) * val;
      const angle = startAngle + (i * 2 * Math.PI) / numAxes;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(35, 101, 168, 0.28)";
    ctx.fill();
    ctx.strokeStyle = "#2365A8";
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Titik simpul (data nodes)
    axes.forEach((axis, i) => {
      const val = Math.max(0, Math.min(5, scoresObj[axis.key] || 0));
      const r = (radius / maxVal) * val;
      const angle = startAngle + (i * 2 * Math.PI) / numAxes;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#F7941D";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
    });
  }

  ctx.restore();
}