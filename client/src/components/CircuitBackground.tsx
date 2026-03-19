import { useEffect, useRef } from "react";

/**
 * CircuitBackground — Fundo animado de circuito eletrônico
 *
 * Gera dinamicamente:
 *  - Linhas de circuito ortogonais (horizontal + vertical) com estilo PCB
 *  - Nós circulares brilhantes nos cruzamentos
 *  - Pulsos de dados que percorrem as linhas (efeito de "sinal viajando")
 *  - Partículas flutuantes (poeira de luz)
 *  - Gradiente de fundo azul profundo com brilho central
 *
 * Tudo renderizado em Canvas 2D — zero dependências externas.
 */

interface Node {
  x: number;
  y: number;
  radius: number;
  glowIntensity: number;
  glowDir: number;
  pulsePhase: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isHorizontal: boolean;
}

interface Pulse {
  lineIndex: number;
  progress: number; // 0 → 1
  speed: number;
  color: string;
  size: number;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaDir: number;
}

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Redimensionamento ──────────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Geração do circuito ───────────────────────────────────────────────────
    const GRID_COLS = 14;
    const GRID_ROWS = 9;
    const MARGIN_X = 60;
    const MARGIN_Y = 60;

    const getGrid = () => {
      const W = canvas.width;
      const H = canvas.height;
      const stepX = (W - MARGIN_X * 2) / (GRID_COLS - 1);
      const stepY = (H - MARGIN_Y * 2) / (GRID_ROWS - 1);
      return { W, H, stepX, stepY };
    };

    // Gera nós em posições de grade com leve jitter
    const buildCircuit = () => {
      const { W, H, stepX, stepY } = getGrid();
      const nodes: Node[] = [];
      const lines: Line[] = [];

      // Selecionar ~40% dos pontos da grade como nós ativos
      const activeGrid: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
        Array.from({ length: GRID_COLS }, () => Math.random() < 0.42)
      );

      // Garantir cantos ativos para efeito de circuito nas bordas
      activeGrid[0][0] = true;
      activeGrid[0][GRID_COLS - 1] = true;
      activeGrid[GRID_ROWS - 1][0] = true;
      activeGrid[GRID_ROWS - 1][GRID_COLS - 1] = true;

      const nodeMap: (number | null)[][] = Array.from({ length: GRID_ROWS }, () =>
        Array(GRID_COLS).fill(null)
      );

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (!activeGrid[r][c]) continue;
          const jx = (Math.random() - 0.5) * stepX * 0.3;
          const jy = (Math.random() - 0.5) * stepY * 0.3;
          const x = MARGIN_X + c * stepX + jx;
          const y = MARGIN_Y + r * stepY + jy;
          nodeMap[r][c] = nodes.length;
          nodes.push({
            x,
            y,
            radius: 2 + Math.random() * 2.5,
            glowIntensity: 0.4 + Math.random() * 0.6,
            glowDir: Math.random() > 0.5 ? 1 : -1,
            pulsePhase: Math.random() * Math.PI * 2,
          });
        }
      }

      // Conectar nós adjacentes horizontalmente e verticalmente
      // Usa traçado ortogonal estilo PCB (linha reta + curva de 90°)
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS - 1; c++) {
          if (nodeMap[r][c] !== null && nodeMap[r][c + 1] !== null) {
            if (Math.random() < 0.75) {
              const n1 = nodes[nodeMap[r][c]!];
              const n2 = nodes[nodeMap[r][c + 1]!];
              lines.push({ x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y, isHorizontal: true });
            }
          }
        }
      }
      for (let r = 0; r < GRID_ROWS - 1; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (nodeMap[r][c] !== null && nodeMap[r + 1][c] !== null) {
            if (Math.random() < 0.65) {
              const n1 = nodes[nodeMap[r][c]!];
              const n2 = nodes[nodeMap[r + 1][c]!];
              lines.push({ x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y, isHorizontal: false });
            }
          }
        }
      }

      return { nodes, lines };
    };

    let { nodes, lines } = buildCircuit();

    // ── Pulsos ────────────────────────────────────────────────────────────────
    const PULSE_COLORS = [
      "rgba(43,222,253,",   // ciano principal
      "rgba(100,200,255,",  // azul claro
      "rgba(43,253,190,",   // verde-turquesa
      "rgba(150,230,255,",  // azul muito claro
    ];

    const pulses: Pulse[] = [];
    const spawnPulse = () => {
      if (lines.length === 0) return;
      pulses.push({
        lineIndex: Math.floor(Math.random() * lines.length),
        progress: 0,
        speed: 0.004 + Math.random() * 0.006,
        color: PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)],
        size: 2 + Math.random() * 3,
        alpha: 0.7 + Math.random() * 0.3,
      });
    };

    // Inicializar com alguns pulsos
    for (let i = 0; i < 18; i++) spawnPulse();

    // ── Partículas flutuantes ─────────────────────────────────────────────────
    const particles: Particle[] = [];
    const NUM_PARTICLES = 55;
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 1920),
        y: Math.random() * (canvas.height || 1080),
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.5,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    // ── Loop de animação ──────────────────────────────────────────────────────
    let frame = 0;
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      frame++;
      const W = canvas.width;
      const H = canvas.height;

      // ── Fundo: gradiente azul profundo ────────────────────────────────────
      const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W * 0.75);
      bgGrad.addColorStop(0, "#0a1f3d");
      bgGrad.addColorStop(0.45, "#061428");
      bgGrad.addColorStop(1, "#020810");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Brilho central sutil (como na imagem de referência)
      const centerGlow = ctx.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.38, W * 0.45);
      centerGlow.addColorStop(0, "rgba(10,50,100,0.35)");
      centerGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, W, H);

      // ── Linhas de circuito ────────────────────────────────────────────────
      lines.forEach((line) => {
        ctx.save();
        ctx.strokeStyle = "rgba(43,150,200,0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();

        // Linha tracejada sobreposta (estilo PCB)
        ctx.strokeStyle = "rgba(43,222,253,0.08)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // ── Nós ───────────────────────────────────────────────────────────────
      nodes.forEach((node) => {
        // Animar brilho do nó
        node.glowIntensity += node.glowDir * 0.008;
        if (node.glowIntensity > 1) { node.glowIntensity = 1; node.glowDir = -1; }
        if (node.glowIntensity < 0.25) { node.glowIntensity = 0.25; node.glowDir = 1; }

        const alpha = node.glowIntensity;
        const r = node.radius;

        // Halo externo
        const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 5);
        halo.addColorStop(0, `rgba(43,222,253,${(alpha * 0.35).toFixed(2)})`);
        halo.addColorStop(1, "rgba(43,222,253,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 5, 0, Math.PI * 2);
        ctx.fill();

        // Círculo principal
        const nodeGrad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        nodeGrad.addColorStop(0, `rgba(200,245,255,${alpha.toFixed(2)})`);
        nodeGrad.addColorStop(0.5, `rgba(43,222,253,${(alpha * 0.85).toFixed(2)})`);
        nodeGrad.addColorStop(1, `rgba(10,80,140,${(alpha * 0.5).toFixed(2)})`);
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Borda brilhante
        ctx.strokeStyle = `rgba(150,230,255,${(alpha * 0.7).toFixed(2)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // ── Pulsos de dados ───────────────────────────────────────────────────
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.progress += pulse.speed;

        if (pulse.progress > 1) {
          pulses.splice(i, 1);
          // Spawn novo pulso para manter densidade
          if (Math.random() < 0.85) spawnPulse();
          continue;
        }

        const line = lines[pulse.lineIndex];
        if (!line) { pulses.splice(i, 1); continue; }

        const px = line.x1 + (line.x2 - line.x1) * pulse.progress;
        const py = line.y1 + (line.y2 - line.y1) * pulse.progress;

        // Cauda do pulso
        const tailLen = 0.12;
        const tailStart = Math.max(0, pulse.progress - tailLen);
        const tx = line.x1 + (line.x2 - line.x1) * tailStart;
        const ty = line.y1 + (line.y2 - line.y1) * tailStart;

        const tailGrad = ctx.createLinearGradient(tx, ty, px, py);
        tailGrad.addColorStop(0, `${pulse.color}0)`);
        tailGrad.addColorStop(1, `${pulse.color}${pulse.alpha.toFixed(2)})`);
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = pulse.size * 0.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Cabeça brilhante do pulso
        const headGlow = ctx.createRadialGradient(px, py, 0, px, py, pulse.size * 3);
        headGlow.addColorStop(0, `${pulse.color}${pulse.alpha.toFixed(2)})`);
        headGlow.addColorStop(0.4, `${pulse.color}${(pulse.alpha * 0.4).toFixed(2)})`);
        headGlow.addColorStop(1, `${pulse.color}0)`);
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(px, py, pulse.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Ponto central
        ctx.fillStyle = `${pulse.color}1)`;
        ctx.beginPath();
        ctx.arc(px, py, pulse.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Partículas flutuantes ─────────────────────────────────────────────
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir * 0.003;
        if (p.alpha > 0.6) { p.alpha = 0.6; p.alphaDir = -1; }
        if (p.alpha < 0.05) { p.alpha = 0.05; p.alphaDir = 1; }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.fillStyle = `rgba(100,200,255,${p.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Vinheta nas bordas ────────────────────────────────────────────────
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.85);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,5,15,0.65)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    };

    draw();

    // Rebuild do circuito ao redimensionar
    const handleResize = () => {
      const built = buildCircuit();
      nodes = built.nodes;
      lines = built.lines;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", handleResize);
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
