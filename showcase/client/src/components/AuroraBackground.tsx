import { useEffect, useRef } from "react";

/**
 * AuroraBackground — Fundo "Aurora Profunda" para o showcase
 * 
 * Conceito visual: aurora boreal em escala micro sobre fundo #020810
 * 
 * Elementos:
 *  - Nebulosa central: gradiente radial difuso, cria profundidade OLED
 *  - Ondas de aurora: 4 camadas sinusoidais suaves em ciano/azul/violeta
 *    com opacidade muito baixa (3–8%) — impactante mas não invasivo
 *  - Partículas mínimas: 22 pontos de luz flutuantes, lentos e discretos
 *  - Linhas de horizonte: 2–3 linhas horizontais muito finas e longas,
 *    estilo "scan line" de tela profissional
 *  - Vinheta forte nas bordas: garante legibilidade dos cards
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaDir: number;
  color: string;
}

interface AuroraWave {
  amplitude: number;
  frequency: number;
  phaseOffset: number;
  speed: number;
  yBase: number;
  color: string;
  lineWidth: number;
  alpha: number;
}

interface ScanLine {
  y: number;
  speed: number;
  alpha: number;
  width: number;
}

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redimensionamento
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Ondas de Aurora
    const auroraWaves: AuroraWave[] = [
      {
        amplitude: 0.055,
        frequency: 0.0018,
        phaseOffset: 0,
        speed: 0.0004,
        yBase: 0.18,
        color: "43,222,253",
        lineWidth: 120,
        alpha: 0.045,
      },
      {
        amplitude: 0.04,
        frequency: 0.0025,
        phaseOffset: Math.PI * 0.7,
        speed: 0.0006,
        yBase: 0.32,
        color: "80,160,255",
        lineWidth: 90,
        alpha: 0.038,
      },
      {
        amplitude: 0.035,
        frequency: 0.0015,
        phaseOffset: Math.PI * 1.3,
        speed: 0.0003,
        yBase: 0.52,
        color: "120,80,220",
        lineWidth: 70,
        alpha: 0.028,
      },
      {
        amplitude: 0.025,
        frequency: 0.002,
        phaseOffset: Math.PI * 0.4,
        speed: 0.0005,
        yBase: 0.72,
        color: "20,180,200",
        lineWidth: 50,
        alpha: 0.022,
      },
    ];

    let auroraPhase = 0;

    // Scan Lines
    const scanLines: ScanLine[] = [
      { y: 0.15, speed: 0.00012, alpha: 0.06, width: 1 },
      { y: 0.55, speed: 0.00008, alpha: 0.04, width: 0.5 },
      { y: 0.82, speed: 0.00015, alpha: 0.05, width: 0.8 },
    ];

    // Partículas
    const PARTICLE_COLORS = [
      "43,222,253",
      "100,180,255",
      "180,140,255",
      "43,253,190",
    ];

    const particles: Particle[] = [];
    const NUM_PARTICLES = 22;
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const W = canvas.width || 390;
      const H = canvas.height || 844;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.12,
        radius: 0.5 + Math.random() * 1.2,
        alpha: 0.08 + Math.random() * 0.25,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      });
    }

    // Nebulosa
    const nebulaeConfig = [
      { xRatio: 0.5, yRatio: 0.22, r1Ratio: 0.0, r2Ratio: 0.65, color1: "rgba(10,60,120,0.22)", color2: "rgba(0,0,0,0)" },
      { xRatio: 0.1, yRatio: 0.45, r1Ratio: 0.0, r2Ratio: 0.35, color1: "rgba(6,30,80,0.14)", color2: "rgba(0,0,0,0)" },
      { xRatio: 0.9, yRatio: 0.35, r1Ratio: 0.0, r2Ratio: 0.3, color1: "rgba(15,20,60,0.12)", color2: "rgba(0,0,0,0)" },
      { xRatio: 0.5, yRatio: 0.85, r1Ratio: 0.0, r2Ratio: 0.45, color1: "rgba(5,20,50,0.10)", color2: "rgba(0,0,0,0)" },
    ];

    // Loop de animação
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;

      // 1. Fundo sólido
      ctx.fillStyle = "#020810";
      ctx.fillRect(0, 0, W, H);

      // 2. Nebulosas
      nebulaeConfig.forEach((n) => {
        const gx = W * n.xRatio;
        const gy = H * n.yRatio;
        const gr = W * n.r2Ratio;
        const grad = ctx.createRadialGradient(gx, gy, W * n.r1Ratio, gx, gy, gr);
        grad.addColorStop(0, n.color1);
        grad.addColorStop(1, n.color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // 3. Ondas de Aurora
      auroraPhase += 0.001;
      auroraWaves.forEach((wave) => {
        const baseY = H * wave.yBase;
        const amp = H * wave.amplitude;
        const halfLW = wave.lineWidth / 2;

        ctx.save();
        ctx.beginPath();

        ctx.moveTo(0, baseY - halfLW);
        for (let x = 0; x <= W; x += 3) {
          const y = baseY + Math.sin(x * wave.frequency + auroraPhase * (1 / wave.speed) * 0.001 + wave.phaseOffset) * amp;
          ctx.lineTo(x, y - halfLW);
        }
        for (let x = W; x >= 0; x -= 3) {
          const y = baseY + Math.sin(x * wave.frequency + auroraPhase * (1 / wave.speed) * 0.001 + wave.phaseOffset) * amp;
          ctx.lineTo(x, y + halfLW);
        }
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, baseY - halfLW, 0, baseY + halfLW);
        waveGrad.addColorStop(0, `rgba(${wave.color},0)`);
        waveGrad.addColorStop(0.5, `rgba(${wave.color},${wave.alpha})`);
        waveGrad.addColorStop(1, `rgba(${wave.color},0)`);
        ctx.fillStyle = waveGrad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= W; x += 3) {
          const y = baseY + Math.sin(x * wave.frequency + auroraPhase * (1 / wave.speed) * 0.001 + wave.phaseOffset) * amp;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${wave.color},${(wave.alpha * 2.5).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      });

      // 4. Scan Lines
      scanLines.forEach((sl) => {
        sl.y += sl.speed;
        if (sl.y > 1.05) sl.y = -0.05;
        const sy = H * sl.y;
        const grad = ctx.createLinearGradient(0, sy, W, sy);
        grad.addColorStop(0, "rgba(43,222,253,0)");
        grad.addColorStop(0.2, `rgba(43,222,253,${sl.alpha})`);
        grad.addColorStop(0.5, `rgba(100,200,255,${sl.alpha * 1.5})`);
        grad.addColorStop(0.8, `rgba(43,222,253,${sl.alpha})`);
        grad.addColorStop(1, "rgba(43,222,253,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = sl.width;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(W, sy);
        ctx.stroke();
      });

      // 5. Partículas flutuantes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir * 0.002;
        if (p.alpha > 0.32) { p.alpha = 0.32; p.alphaDir = -1; }
        if (p.alpha < 0.04) { p.alpha = 0.04; p.alphaDir = 1; }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        halo.addColorStop(0, `rgba(${p.color},${(p.alpha * 0.6).toFixed(3)})`);
        halo.addColorStop(1, `rgba(${p.color},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${p.color},${p.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Vinheta
      const vignette = ctx.createRadialGradient(W / 2, H * 0.4, H * 0.15, W / 2, H * 0.4, W * 0.9);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.6, "rgba(2,8,16,0.2)");
      vignette.addColorStop(1, "rgba(2,8,16,0.75)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      const bottomVig = ctx.createLinearGradient(0, H * 0.6, 0, H);
      bottomVig.addColorStop(0, "rgba(2,8,16,0)");
      bottomVig.addColorStop(1, "rgba(2,8,16,0.45)");
      ctx.fillStyle = bottomVig;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
