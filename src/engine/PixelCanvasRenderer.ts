/**
 * HIGHFIELD - Pixel Canvas Renderer
 * High-fidelity pixel-art rendering engine replicating the visual blueprint of IMG-20260819-WA0003.jpg.
 * Expanded panoramic canvas (540x340), dynamic Earth Day/Night terminator reveal,
 * 30-45s cooldown for lunar horizon circular rotation, world phenomena rendering (Asteroids, Solar Flares,
 * Cosmic Rays, Micrometeorites, Auroras), Monumental Star-Catching Cosmic Spider-Web & Starlight Cinema Screen,
 * character states, and celestial particle systems.
 */

import {
  FacingDirection,
  HighfieldState,
  HighfieldStatus,
  ShootingStar,
  Star,
  LunarCrater,
  LunarRock,
  CosmicDustParticle,
  Footprint,
  Satellite,
  CosmicEventType,
  WorldPhenomenon,
  CosmicWebState,
} from '../types';

export class PixelCanvasRenderer {
  public readonly width = 540;
  public readonly height = 340;

  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private craters: (LunarCrater & { baseX: number; yOffset: number })[] = [];
  private rocks: (LunarRock & { baseX: number; yOffset: number })[] = [];
  private dustParticles: CosmicDustParticle[] = [];
  private footprints: Footprint[] = [];

  // Monumental Cosmic Spider-Web & Starlight Cinema Screen
  private cosmicWeb: CosmicWebState = {
    active: false,
    deployProgress: 0,
    centerX: 240,
    centerY: 115,
    radius: 130,
    rings: 6,
    spokes: 14,
    starlightEnergy: 0,
    cinemaMode: 'AURORA_CINEMA',
  };

  // Circular Lunar Rotation Engine with 30s - 45s Cooldown
  private isMoonRotating: boolean = false;
  private moonRotationTimer: number = 0;
  private moonRotationDuration: number = 5500; // 5.5s spin cycle then stops
  private lunarRotationOffset: number = 0;
  private autoRotateCooldown: number = 30000 + Math.random() * 15000; // 30s to 45s

  private satellite: Satellite = {
    x: -40,
    y: 40,
    vx: 0.38,
    vy: 0.07,
    size: 2,
    blinkTimer: 0,
    active: true,
  };

  private cosmicEvent: CosmicEventType = 'NORMAL';
  private cosmicEventTimer: number = 0;
  private eclipsePhase: number = 0; // 0 to 1

  // Dynamic Earth Day/Night Terminator phase that sweeps and reveals pristine Earth
  private earthCloudOffset: number = 0;
  private earthShadowTimer: number = 0;

  private animFrame: number = 0;
  private walkFrame: number = 0;
  private walkTimer: number = 0;
  private breatheTimer: number = 0;
  private shootingStarTimer: number = 0;

  constructor() {
    this.initCosmos();
    this.initLunarTerrain();
  }

  private initCosmos() {
    this.stars = [];
    const count = 230;
    const starColors = ['#ffffff', '#eaf2ff', '#ffd480', '#ff9f43', '#70d6ff', '#54a0ff'];

    for (let i = 0; i < count; i++) {
      const isCross = Math.random() < 0.09;
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.72),
        size: isCross ? 3 : Math.random() < 0.25 ? 2 : 1,
        color,
        twinkleSpeed: 1.5 + Math.random() * 3,
        twinklePhase: Math.random() * Math.PI * 2,
        isCross,
      });
    }
  }

  private initLunarTerrain() {
    this.craters = [
      { baseX: 70, x: 70, y: 260, yOffset: 12, radiusX: 28, radiusY: 9, depth: 3, highlightColor: '#9bbbe3', shadowColor: '#0b162c' },
      { baseX: 175, x: 175, y: 274, yOffset: 16, radiusX: 48, radiusY: 14, depth: 4, highlightColor: '#96b6de', shadowColor: '#081224' },
      { baseX: 300, x: 300, y: 266, yOffset: 14, radiusX: 36, radiusY: 11, depth: 3, highlightColor: '#8eaed6', shadowColor: '#0c1830' },
      { baseX: 430, x: 430, y: 278, yOffset: 15, radiusX: 40, radiusY: 12, depth: 3, highlightColor: '#7d9ec9', shadowColor: '#081122' },
      { baseX: 520, x: 520, y: 288, yOffset: 10, radiusX: 22, radiusY: 7, depth: 2, highlightColor: '#6f8fb8', shadowColor: '#060d1b' },
    ];

    this.rocks = [
      { baseX: 45, x: 45, y: 248, yOffset: -3, width: 9, height: 7, color: '#4a6282' },
      { baseX: 130, x: 130, y: 254, yOffset: -4, width: 13, height: 8, color: '#3d526e' },
      { baseX: 245, x: 245, y: 258, yOffset: -3, width: 11, height: 9, color: '#425875' },
      { baseX: 375, x: 375, y: 256, yOffset: -5, width: 15, height: 10, color: '#4a6282' },
      { baseX: 490, x: 490, y: 272, yOffset: -3, width: 10, height: 7, color: '#3d526e' },
    ];
  }

  /**
   * Calculates terrain height with lunar spherical curvature and active circular rotation
   */
  public getTerrainHeight(x: number): number {
    const baseHeight = 248;
    const distFromCenter = x - this.width / 2;
    const circularDrop = (distFromCenter * distFromCenter) / (this.width * 2.8);

    const rot = this.lunarRotationOffset;
    const wave1 = Math.sin((x + rot) * 0.012) * 9;
    const wave2 = Math.cos((x + rot) * 0.028 + 1.2) * 6;
    const wave3 = Math.sin((x + rot) * 0.06) * 2.5;

    return baseHeight + circularDrop + wave1 + wave2 + wave3;
  }

  public addFootprint(x: number, y: number, facing: FacingDirection) {
    this.footprints.push({ x, y, alpha: 0.6, facing });
    if (this.footprints.length > 45) {
      this.footprints.shift();
    }
  }

  public toggleCosmicWeb(onWebSound?: () => void): boolean {
    this.cosmicWeb.active = !this.cosmicWeb.active;
    if (this.cosmicWeb.active && onWebSound) {
      onWebSound();
    }
    return this.cosmicWeb.active;
  }

  public deployCosmicWeb(onWebSound?: () => void) {
    this.cosmicWeb.active = true;
    if (onWebSound) onWebSound();
  }

  public cycleCinemaMode(): string {
    const modes: ('AURORA_CINEMA' | 'CONSTELLATIONS' | 'EARTH_MEMORIES')[] = [
      'AURORA_CINEMA',
      'CONSTELLATIONS',
      'EARTH_MEMORIES',
    ];
    const currentIndex = modes.indexOf(this.cosmicWeb.cinemaMode);
    this.cosmicWeb.cinemaMode = modes[(currentIndex + 1) % modes.length];
    return this.cosmicWeb.cinemaMode;
  }

  public getCosmicWeb(): CosmicWebState {
    return { ...this.cosmicWeb };
  }

  public triggerMoonRotation(onRotationSound?: () => void) {
    if (this.isMoonRotating) return;
    this.isMoonRotating = true;
    this.moonRotationTimer = 0;
    this.autoRotateCooldown = 30000 + Math.random() * 15000;
    if (onRotationSound) onRotationSound();
  }

  public getIsMoonRotating(): boolean {
    return this.isMoonRotating;
  }

  public getMoonRotationCooldownSeconds(): number {
    return Math.max(0, Math.ceil(this.autoRotateCooldown / 1000));
  }

  public spawnShootingStar(onCometSound?: () => void) {
    const startX = 80 + Math.random() * (this.width - 160);
    const startY = 15 + Math.random() * 95;
    const speed = 7.5 + Math.random() * 4.5;

    this.shootingStars.push({
      x: startX,
      y: startY,
      vx: -speed * 0.85,
      vy: speed * 0.52,
      length: 32 + Math.random() * 36,
      alpha: 1.0,
      color: Math.random() > 0.3 ? '#ffffff' : '#ffd077',
      speed,
      active: true,
    });

    if (onCometSound) onCometSound();
  }

  public triggerMeteorShower(onCometSound?: () => void) {
    this.cosmicEvent = 'METEOR_SHOWER';
    this.cosmicEventTimer = 8000;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.spawnShootingStar(i === 0 ? onCometSound : undefined);
      }, i * 650);
    }
  }

  public triggerEclipse() {
    this.cosmicEvent = 'ECLIPSE';
    this.cosmicEventTimer = 12000;
    this.eclipsePhase = 0;
  }

  public getCosmicEvent(): CosmicEventType {
    return this.cosmicEvent;
  }

  public update(deltaMs: number, highfieldStatus: HighfieldStatus, onComet?: () => void) {
    const deltaSec = deltaMs / 1000;
    this.earthCloudOffset += deltaSec * 0.8;
    this.earthShadowTimer += deltaSec * 0.22;
    this.breatheTimer += deltaSec * 3;
    this.animFrame++;

    // Cosmic Web deploy animation
    if (this.cosmicWeb.active) {
      this.cosmicWeb.deployProgress = Math.min(1, this.cosmicWeb.deployProgress + deltaSec * 0.9);
      this.cosmicWeb.starlightEnergy += deltaMs * 0.0025;
    } else {
      this.cosmicWeb.deployProgress = Math.max(0, this.cosmicWeb.deployProgress - deltaSec * 1.5);
    }

    // Periodic autonomous circular rotation of the moon every 30 to 45 seconds
    this.autoRotateCooldown -= deltaMs;
    if (this.autoRotateCooldown <= 0 && !this.isMoonRotating) {
      this.triggerMoonRotation();
    }

    // Circular Lunar Rotation physics with smooth sine deceleration
    if (this.isMoonRotating) {
      this.moonRotationTimer += deltaMs;
      const progress = Math.min(1, this.moonRotationTimer / this.moonRotationDuration);

      const speedFactor = Math.sin(progress * Math.PI);
      const rotationStep = speedFactor * 36 * (deltaMs / 1000);
      this.lunarRotationOffset += rotationStep;

      for (const fp of this.footprints) {
        fp.x -= rotationStep * 0.4;
      }

      if (progress >= 1) {
        this.isMoonRotating = false;
        this.moonRotationTimer = 0;
        this.autoRotateCooldown = 30000 + Math.random() * 15000;
      }
    }

    // Cosmic event timer
    if (this.cosmicEventTimer > 0) {
      this.cosmicEventTimer -= deltaMs;
      if (this.cosmicEvent === 'ECLIPSE') {
        this.eclipsePhase = Math.sin((1 - this.cosmicEventTimer / 12000) * Math.PI);
      }
      if (this.cosmicEventTimer <= 0) {
        this.cosmicEvent = 'NORMAL';
        this.eclipsePhase = 0;
      }
    }

    // Satellite transit update
    if (this.satellite.active) {
      this.satellite.x += this.satellite.vx * (deltaMs / 16);
      this.satellite.y += this.satellite.vy * (deltaMs / 16);
      this.satellite.blinkTimer += deltaMs;
      if (this.satellite.x > this.width + 50) {
        this.satellite.x = -50;
        this.satellite.y = 25 + Math.random() * 60;
      }
    }

    // Footprints gradual fading
    for (const fp of this.footprints) {
      fp.alpha = Math.max(0, fp.alpha - deltaSec * 0.02);
    }

    // Walk animation timer
    if (highfieldStatus.state === HighfieldState.EXPLORING) {
      this.walkTimer += deltaMs;
      if (this.walkTimer > 150) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkFrame = 0;
    }

    // Periodic shooting stars
    this.shootingStarTimer += deltaMs;
    if (this.shootingStarTimer > 11000 + Math.random() * 7000) {
      this.shootingStarTimer = 0;
      this.spawnShootingStar(onComet);
    }

    // Update active shooting stars
    for (const star of this.shootingStars) {
      if (!star.active) continue;
      star.x += star.vx;
      star.y += star.vy;
      star.alpha -= 0.025;
      if (star.alpha <= 0 || star.x < 0 || star.y > this.height) {
        star.active = false;
      }
    }
    this.shootingStars = this.shootingStars.filter((s) => s.active);

    // Dust particles
    if (highfieldStatus.state === HighfieldState.EXPLORING && Math.random() < 0.35) {
      this.dustParticles.push({
        x: highfieldStatus.position.x + (Math.random() * 8 - 4),
        y: highfieldStatus.position.y - 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.4,
        size: 1,
        alpha: 0.8,
        maxAlpha: 0.8,
        life: 0,
        maxLife: 400 + Math.random() * 300,
      });
    }

    for (const p of this.dustParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life += deltaMs;
      p.alpha = p.maxAlpha * (1 - p.life / p.maxLife);
    }
    this.dustParticles = this.dustParticles.filter((p) => p.life < p.maxLife);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    highfieldStatus: HighfieldStatus,
    visitorProbe: { x: number; y: number } | null,
    activePhenomena: WorldPhenomenon[] = []
  ) {
    // 1. Deep Space Cosmic Background
    this.renderSpaceBackdrop(ctx);

    // 2. Stars & Twinkling Constellations
    this.renderStars(ctx);

    // 3. Orbital Satellite Transit
    this.renderSatellite(ctx);

    // 4. Planet Earth & Atmosphere
    this.renderEarth(ctx);

    // 5. Monumental Star-Catching Cosmic Spider-Web & Starlight Cinema Screen
    this.renderCosmicWeb(ctx, highfieldStatus);

    // 6. Minor World Phenomena (Asteroids, Solar Flares, Cosmic Rays, Auroras)
    this.renderPhenomena(ctx, activePhenomena);

    // 7. Shooting Stars & Meteors
    this.renderShootingStars(ctx);

    // 8. Lunar Surface & Rotating Horizons
    this.renderLunarTerrain(ctx);

    // 9. Footprints in the regolith
    this.renderFootprints(ctx);

    // 10. Cosmic Dust Particles
    this.renderCosmicDust(ctx);

    // 11. Highfield Character Sprite & Weaving Beams
    this.renderHighfield(ctx, highfieldStatus);

    // 12. Visitor Probe Marker
    if (visitorProbe) {
      this.renderVisitorProbe(ctx, visitorProbe);
    }

    // 13. Eclipse Overlay Effect
    if (this.eclipsePhase > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 78, 0, ${this.eclipsePhase * 0.18})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  private renderSpaceBackdrop(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (this.eclipsePhase > 0) {
      grad.addColorStop(0, '#020205');
      grad.addColorStop(0.5, '#050308');
      grad.addColorStop(1, '#090812');
    } else {
      grad.addColorStop(0, '#02030a');
      grad.addColorStop(0.35, '#040714');
      grad.addColorStop(0.68, '#060c22');
      grad.addColorStop(1, '#0c1432');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const star of this.stars) {
      const alpha = 0.4 + 0.6 * Math.sin(this.animFrame * 0.04 * star.twinkleSpeed + star.twinklePhase);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.15, alpha);

      // If star is trapped inside the cosmic web, add refraction glow & diffraction flare
      if (this.cosmicWeb.deployProgress > 0.3) {
        const dx = star.x - this.cosmicWeb.centerX;
        const dy = star.y - this.cosmicWeb.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.cosmicWeb.radius * this.cosmicWeb.deployProgress) {
          ctx.fillStyle = '#67e8f9';
          ctx.globalAlpha = Math.min(1, alpha * 1.5);
          // Diffraction cross flare
          ctx.fillRect(star.x - 3, star.y, 7, 1);
          ctx.fillRect(star.x, star.y - 3, 1, 7);
        }
      }

      if (star.isCross) {
        ctx.fillRect(star.x - 1, star.y, 3, 1);
        ctx.fillRect(star.x, star.y - 1, 1, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x, star.y, 1, 1);
      } else {
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    }
    ctx.restore();
  }

  private renderCosmicWeb(ctx: CanvasRenderingContext2D, _highfieldStatus: HighfieldStatus) {
    const progress = this.cosmicWeb.deployProgress;
    if (progress <= 0.01) return;

    const { centerX, centerY, radius, rings, spokes, starlightEnergy, cinemaMode } = this.cosmicWeb;
    const curRadius = radius * progress;

    ctx.save();

    // Anchor points on distant lunar ridges and space coordinates
    const anchorPoints = [
      { x: 35, y: 250 },
      { x: 495, y: 260 },
      { x: 140, y: 30 },
      { x: 380, y: 25 },
    ];

    // 1. Structural Tensile Anchor Cables
    ctx.strokeStyle = `rgba(103, 232, 249, ${0.45 * progress})`;
    ctx.lineWidth = 1;
    for (const anchor of anchorPoints) {
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.quadraticCurveTo((anchor.x + centerX) / 2, (anchor.y + centerY) / 2 + 10, centerX, centerY);
      ctx.stroke();
    }

    // 2. Holographic Starlight Cinema Screen Canvas Background
    const cinemaAlpha = 0.22 * progress;
    const cinemaGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, curRadius);
    cinemaGrad.addColorStop(0, `rgba(56, 189, 248, ${cinemaAlpha * 1.5})`);
    cinemaGrad.addColorStop(0.6, `rgba(168, 85, 247, ${cinemaAlpha * 0.8})`);
    cinemaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cinemaGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, curRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cinema Screen Holographic Projection Content
    if (progress > 0.4) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, curRadius * 0.9, 0, Math.PI * 2);
      ctx.clip();

      if (cinemaMode === 'AURORA_CINEMA') {
        // Celestial Cinema Wave Curtain
        for (let wave = 0; wave < 3; wave++) {
          ctx.strokeStyle = wave === 0 ? '#34d399' : wave === 1 ? '#38bdf8' : '#e879f9';
          ctx.globalAlpha = 0.4 * progress * (0.6 + 0.4 * Math.sin(starlightEnergy * 2 + wave));
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let px = centerX - curRadius * 0.85; px <= centerX + curRadius * 0.85; px += 8) {
            const py =
              centerY -
              20 +
              wave * 18 +
              Math.sin(px * 0.035 + starlightEnergy * 2.5 + wave) * 16;
            if (px === centerX - curRadius * 0.85) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      } else if (cinemaMode === 'CONSTELLATIONS') {
        // Arachne & Orion Cosmic Constellation Mesh
        const constNodes = [
          { x: centerX - 45, y: centerY - 30 },
          { x: centerX - 10, y: centerY - 45 },
          { x: centerX + 35, y: centerY - 25 },
          { x: centerX + 50, y: centerY + 15 },
          { x: centerX + 10, y: centerY + 40 },
          { x: centerX - 35, y: centerY + 30 },
          { x: centerX, y: centerY },
        ];

        ctx.strokeStyle = 'rgba(255, 230, 100, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < constNodes.length; i++) {
          const next = constNodes[(i + 1) % constNodes.length];
          ctx.moveTo(constNodes[i].x, constNodes[i].y);
          ctx.lineTo(next.x, next.y);
          ctx.lineTo(centerX, centerY);
        }
        ctx.stroke();

        // Shimmering constellation stars
        for (const n of constNodes) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(n.x - 2, n.y - 2, 4, 4);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(n.x - 1, n.y - 1, 2, 2);
        }
      } else if (cinemaMode === 'EARTH_MEMORIES') {
        // Holographic Memory Projector of Earth
        const timePulse = Math.sin(starlightEnergy * 3);
        ctx.strokeStyle = `rgba(50, 200, 255, ${0.65 * progress})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(centerX - 35, centerY - 25, 70, 50);

        // Scanlines across movie frame
        for (let y = centerY - 25; y <= centerY + 25; y += 4) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + timePulse * 0.04})`;
          ctx.fillRect(centerX - 35, y, 70, 1);
        }
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(centerX - 10, centerY - 8, 20, 16);
      }
      ctx.restore();
    }

    // 4. Radial Web Spokes
    for (let s = 0; s < spokes; s++) {
      const angle = (s / spokes) * Math.PI * 2;
      const endX = centerX + Math.cos(angle) * curRadius;
      const endY = centerY + Math.sin(angle) * curRadius;

      ctx.strokeStyle = `rgba(215, 245, 255, ${0.55 * progress})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // 5. Concentric Spiral Web Rings with Catenary Sagging
    for (let r = 1; r <= rings; r++) {
      const ringRadius = (curRadius * r) / rings;
      ctx.strokeStyle = `rgba(180, 235, 255, ${0.62 * progress})`;
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let s = 0; s <= spokes; s++) {
        const angle = (s / spokes) * Math.PI * 2;
        const sag = Math.sin(s * 2 + starlightEnergy) * 2.2;
        const px = centerX + Math.cos(angle) * (ringRadius + sag);
        const py = centerY + Math.sin(angle) * (ringRadius + sag);

        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);

        // Glowing micro-diamond nodes at web intersections
        if (progress > 0.7) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Center Core Crystal Node
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(centerX - 1, centerY - 1, 2, 2);

    ctx.restore();
  }

  private renderSatellite(ctx: CanvasRenderingContext2D) {
    if (!this.satellite.active) return;
    ctx.save();
    const sx = Math.round(this.satellite.x);
    const sy = Math.round(this.satellite.y);

    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(sx - 3, sy - 1, 2, 3);
    ctx.fillRect(sx + 2, sy - 1, 2, 3);

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(sx - 1, sy, 3, 2);

    const isBlink = (this.satellite.blinkTimer % 800) < 200;
    if (isBlink) {
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(sx, sy - 1, 1, 1);
    }
    ctx.restore();
  }

  private renderEarth(ctx: CanvasRenderingContext2D) {
    const cx = 395;
    const cy = 105;
    const radius = 62;

    ctx.save();

    // Solar Corona during Eclipse
    if (this.eclipsePhase > 0) {
      const corona = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.8);
      corona.addColorStop(0, `rgba(255, 120, 40, ${this.eclipsePhase * 0.9})`);
      corona.addColorStop(0.5, `rgba(255, 60, 0, ${this.eclipsePhase * 0.4})`);
      corona.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = corona;
      ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);
    }

    // Outer Atmospheric Glow
    const atmosGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.45);
    atmosGrad.addColorStop(0, 'rgba(50, 130, 240, 0.55)');
    atmosGrad.addColorStop(0.4, 'rgba(30, 90, 200, 0.28)');
    atmosGrad.addColorStop(0.8, 'rgba(15, 45, 130, 0.09)');
    atmosGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = atmosGrad;
    ctx.fillRect(cx - radius * 1.5, cy - radius * 1.5, radius * 3, radius * 3);

    // Earth Base Sphere
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.2, cx, cy, radius);
    oceanGrad.addColorStop(0, '#1c62cb');
    oceanGrad.addColorStop(0.7, '#0e3477');
    oceanGrad.addColorStop(1, '#06163a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    // Procedural Continents & Swirling Clouds
    const pixelSize = 2;
    const startX = cx - radius;
    const startY = cy - radius;
    const size = radius * 2;

    for (let py = 0; py < size; py += pixelSize) {
      const worldY = (py - radius) / radius;
      for (let px = 0; px < size; px += pixelSize) {
        const worldX = (px - radius) / radius;
        const distSq = worldX * worldX + worldY * worldY;
        if (distSq > 0.98) continue;

        const longitude = Math.asin(worldX / Math.sqrt(1 - worldY * worldY + 0.001)) + this.earthCloudOffset * 0.04;
        const latitude = Math.asin(worldY);

        const n1 = Math.sin(longitude * 3.2) * Math.cos(latitude * 3.8);
        const n2 = Math.cos(longitude * 6.5 + latitude * 2.1) * 0.45;
        const landVal = n1 + n2;

        const cLong = longitude * 4.2 + this.earthCloudOffset * 0.25;
        const cLat = latitude * 3.6;
        const cloudVal = Math.sin(cLong) * Math.cos(cLat);

        const screenX = startX + px;
        const screenY = startY + py;

        if (landVal > 0.25) {
          ctx.fillStyle = landVal > 0.6 ? '#4e823b' : '#309c4d';
          ctx.fillRect(screenX, screenY, pixelSize, pixelSize);
        } else if (landVal > 0.1) {
          ctx.fillStyle = '#32e2e8';
          ctx.fillRect(screenX, screenY, pixelSize, pixelSize);
        }

        if (cloudVal > 0.38) {
          ctx.fillStyle = cloudVal > 0.7 ? '#ffffff' : 'rgba(225, 242, 255, 0.88)';
          ctx.fillRect(screenX, screenY, pixelSize, pixelSize);
        }
      }
    }

    // Dynamic Moving Day/Night Terminator that sweeps across and fully clears
    const rawCycle = Math.sin(this.earthShadowTimer);
    const shadowIntensity = Math.max(0, rawCycle * 1.2);

    if (shadowIntensity > 0.02) {
      const shadowOffsetX = Math.cos(this.earthShadowTimer * 0.6) * (radius * 0.65);
      const shadowOffsetY = Math.sin(this.earthShadowTimer * 0.6) * (radius * 0.35);

      const shadowGrad = ctx.createRadialGradient(
        cx - shadowOffsetX * 0.7,
        cy - shadowOffsetY * 0.7,
        radius * 0.3,
        cx + shadowOffsetX,
        cy + shadowOffsetY,
        radius * 1.2
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.5, `rgba(5, 15, 45, ${0.28 * shadowIntensity})`);
      shadowGrad.addColorStop(1, `rgba(1, 3, 12, ${0.94 * shadowIntensity})`);
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }

    ctx.restore();
  }

  private renderPhenomena(ctx: CanvasRenderingContext2D, phenomena: WorldPhenomenon[]) {
    if (!phenomena || phenomena.length === 0) return;

    ctx.save();
    for (const p of phenomena) {
      if (!p.active) continue;

      switch (p.type) {
        case 'PASSING_ASTEROID': {
          const { x, y, size, rotation, tailColor, vx } = p.params;
          const ax = Math.round(x);
          const ay = Math.round(y);

          // Ion tail
          const tailLen = 38 * p.intensity;
          const tailGrad = ctx.createLinearGradient(ax, ay, ax - Math.sign(vx) * tailLen, ay - 4);
          tailGrad.addColorStop(0, `${tailColor}`);
          tailGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = size * 0.75;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - Math.sign(vx) * tailLen, ay - 4);
          ctx.stroke();

          // Asteroid Body
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(rotation);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-size / 2 + 1, -size / 2 + 1, size - 2, 2);
          ctx.fillStyle = '#334155';
          ctx.fillRect(0, 0, 2, 2);
          ctx.restore();
          break;
        }

        case 'SOLAR_FLARE': {
          const { wavePhase } = p.params;
          const alpha = p.intensity * 0.45;
          const flareGrad = ctx.createRadialGradient(
            this.width * 0.7,
            0,
            20,
            this.width * 0.7,
            0,
            this.height * 0.85
          );
          flareGrad.addColorStop(0, `rgba(255, 140, 40, ${alpha})`);
          flareGrad.addColorStop(0.4, `rgba(255, 80, 0, ${alpha * 0.5})`);
          flareGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = flareGrad;
          ctx.fillRect(0, 0, this.width, this.height);

          ctx.strokeStyle = `rgba(255, 200, 100, ${p.intensity * 0.7})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let rx = 0; rx <= this.width; rx += 8) {
            const ry = 40 + Math.sin(rx * 0.03 + wavePhase) * 16;
            if (rx === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.stroke();
          break;
        }

        case 'COSMIC_RAY_BURST': {
          const { rays } = p.params;
          for (const ray of rays) {
            if (ray.alpha <= 0) continue;
            ctx.save();
            ctx.strokeStyle = ray.color;
            ctx.globalAlpha = ray.alpha * p.intensity;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ray.x, ray.y);
            ctx.lineTo(ray.x - ray.vx * 3, ray.y - ray.vy * 3);
            ctx.stroke();
            ctx.restore();
          }
          break;
        }

        case 'MICROMETEORITE_IMPACT': {
          const { impactX, sparks, flashIntensity } = p.params;
          const groundY = this.getTerrainHeight(impactX);

          if (flashIntensity > 0.05) {
            const flashGrad = ctx.createRadialGradient(impactX, groundY, 1, impactX, groundY, 18 * flashIntensity);
            flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
            flashGrad.addColorStop(0.5, `rgba(255, 180, 50, ${flashIntensity * 0.6})`);
            flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = flashGrad;
            ctx.fillRect(impactX - 20, groundY - 20, 40, 40);
          }

          for (const sp of sparks) {
            if (sp.alpha <= 0) continue;
            ctx.fillStyle = '#ffedd5';
            ctx.globalAlpha = sp.alpha * p.intensity;
            ctx.fillRect(Math.round(sp.x), Math.round(groundY + sp.y), sp.size, sp.size);
          }
          ctx.globalAlpha = 1.0;
          break;
        }

        case 'SOLAR_WIND_AURORA': {
          const { waveOffset } = p.params;
          const alpha = p.intensity * 0.32;
          ctx.save();
          for (let layer = 0; layer < 2; layer++) {
            const auroraGrad = ctx.createLinearGradient(0, 10 + layer * 20, 0, 110 + layer * 30);
            auroraGrad.addColorStop(0, `rgba(52, 211, 153, ${alpha})`);
            auroraGrad.addColorStop(0.5, `rgba(34, 211, 238, ${alpha * 0.7})`);
            auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = auroraGrad;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let x = 0; x <= this.width; x += 12) {
              const y = 35 + layer * 25 + Math.sin(x * 0.02 + waveOffset + layer) * 18;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, 0);
            ctx.fill();
          }
          ctx.restore();
          break;
        }
      }
    }
    ctx.restore();
  }

  private renderShootingStars(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const star of this.shootingStars) {
      if (!star.active || star.alpha <= 0) continue;

      const tailX = star.x - (star.vx / star.speed) * star.length;
      const tailY = star.y - (star.vy / star.speed) * star.length;

      const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${star.alpha})`);
      grad.addColorStop(0.4, `rgba(255, 180, 80, ${star.alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(255, 78, 0, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(star.x) - 1, Math.round(star.y) - 1, 2, 2);
    }
    ctx.restore();
  }

  private renderLunarTerrain(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Distant mountain silhouette with rotation
    ctx.fillStyle = '#081022';
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width; x += 10) {
      const rot = this.lunarRotationOffset * 0.4;
      const y = 230 + Math.sin((x + rot) * 0.015) * 14 + Math.cos((x + rot) * 0.04) * 7;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.fill();

    // Foreground Lunar surface
    const terrainGrad = ctx.createLinearGradient(0, 230, 0, this.height);
    terrainGrad.addColorStop(0, '#5a7394');
    terrainGrad.addColorStop(0.3, '#32445e');
    terrainGrad.addColorStop(0.7, '#1b263b');
    terrainGrad.addColorStop(1, '#0e1626');

    ctx.fillStyle = terrainGrad;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width; x += 3) {
      ctx.lineTo(x, this.getTerrainHeight(x));
    }
    ctx.lineTo(this.width, this.height);
    ctx.fill();

    // Illuminated Rim Highlights
    ctx.strokeStyle = '#9dbbe0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += 3) {
      const y = this.getTerrainHeight(x);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Craters shifting circularly along lunar surface
    const wrapWidth = this.width + 120;
    for (const crater of this.craters) {
      const shiftX = ((crater.baseX + this.lunarRotationOffset) % wrapWidth + wrapWidth) % wrapWidth - 60;
      const curY = this.getTerrainHeight(shiftX) + crater.yOffset;
      this.renderCrater(ctx, { ...crater, x: shiftX, y: curY });
    }

    // Rocks shifting circularly
    for (const rock of this.rocks) {
      const shiftX = ((rock.baseX + this.lunarRotationOffset) % wrapWidth + wrapWidth) % wrapWidth - 60;
      const curY = this.getTerrainHeight(shiftX) + rock.yOffset;
      ctx.fillStyle = rock.color;
      ctx.fillRect(shiftX, curY, rock.width, rock.height);
      ctx.fillStyle = '#b0c8ea';
      ctx.fillRect(shiftX + 2, curY, rock.width - 2, 2);
    }

    ctx.restore();
  }

  private renderFootprints(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const fp of this.footprints) {
      if (fp.alpha <= 0) continue;
      ctx.fillStyle = `rgba(10, 20, 38, ${fp.alpha})`;
      ctx.fillRect(Math.round(fp.x) - 2, Math.round(fp.y) - 1, 4, 2);
      ctx.fillStyle = `rgba(180, 200, 230, ${fp.alpha * 0.5})`;
      ctx.fillRect(Math.round(fp.x) - 1, Math.round(fp.y), 2, 1);
    }
    ctx.restore();
  }

  private renderCosmicDust(ctx: CanvasRenderingContext2D) {
    for (const p of this.dustParticles) {
      if (p.alpha <= 0) continue;
      ctx.fillStyle = '#9dc0f0';
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderHighfield(ctx: CanvasRenderingContext2D, status: HighfieldStatus) {
    const x = Math.round(status.position.x);
    const y = Math.round(status.position.y);
    const facing = status.facing;

    // If Highfield is in WEAVING_WEB state, draw high-tension laser filament beams shooting to the web!
    if (status.state === HighfieldState.WEAVING_WEB) {
      ctx.save();
      const beamGrad = ctx.createLinearGradient(x, y - 35, this.cosmicWeb.centerX, this.cosmicWeb.centerY);
      beamGrad.addColorStop(0, '#ffffff');
      beamGrad.addColorStop(0.5, '#67e8f9');
      beamGrad.addColorStop(1, 'rgba(103, 232, 249, 0)');

      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 36);
      ctx.lineTo(this.cosmicWeb.centerX - 15, this.cosmicWeb.centerY);
      ctx.moveTo(x + 3, y - 36);
      ctx.lineTo(this.cosmicWeb.centerX + 15, this.cosmicWeb.centerY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);

    if (facing === FacingDirection.LEFT) {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(6, 12, 28, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- STATE: WEAVING MONUMENTAL WEB ---
    if (status.state === HighfieldState.WEAVING_WEB) {
      // Extended upright stance with hands raised
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -3, 6, 3);
      ctx.fillRect(1, -3, 6, 3);

      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-5, -9, 3, 6);
      ctx.fillRect(2, -9, 3, 6);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -14, 13, 6);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-7, -27, 14, 13);

      // Arms raised high casting filament beams
      ctx.fillStyle = '#1b5b35';
      ctx.fillRect(-8, -36, 4, 11);
      ctx.fillRect(5, -36, 4, 11);

      // Mask looking directly upward
      ctx.fillStyle = '#161922';
      ctx.fillRect(-5, -42, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, -40, 5, 5);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, -40.5, 6, 6);

      ctx.restore();
      return;
    }

    // --- STATE: SITTING ON RIDGE ---
    if (status.state === HighfieldState.SITTING) {
      const legSwing = Math.sin(this.breatheTimer * 1.5) * 1.5;

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, 3 + legSwing, 4, 3);
      ctx.fillRect(3, 4 - legSwing, 4, 3);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-2, 5 + legSwing, 4, 1);
      ctx.fillRect(3, 6 - legSwing, 4, 1);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-7, -4, 14, 6);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-7, -18, 14, 14);
      ctx.fillStyle = '#17512e';
      ctx.fillRect(-7, -18, 4, 14);

      ctx.fillStyle = '#1b5b35';
      ctx.fillRect(2, -12, 4, 10);

      ctx.fillStyle = '#161922';
      ctx.fillRect(-4, -28, 11, 10);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -26, 4, 5);
      ctx.strokeStyle = '#ff4e00';
      ctx.lineWidth = 1;
      ctx.strokeRect(1.5, -26.5, 5, 6);

      ctx.restore();
      return;
    }

    // --- STATE: INSPECTING MINERALS ---
    if (status.state === HighfieldState.INSPECTING) {
      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -8, 12, 5);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-6, -18, 12, 11);

      ctx.fillStyle = '#161922';
      ctx.fillRect(1, -22, 10, 9);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, -19, 3, 4);

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, -12);
      ctx.lineTo(16, 0);
      ctx.stroke();

      ctx.fillStyle = '#00ffff';
      ctx.fillRect(15, -1, 3, 3);

      ctx.restore();
      return;
    }

    // --- STATE: WEB JUMP ---
    if (status.state === HighfieldState.WEB_JUMP) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(4, -15);
      ctx.quadraticCurveTo(25, -45, 60, -10);
      ctx.stroke();

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -14, 12, 6);
      ctx.fillStyle = '#227242';
      ctx.fillRect(-6, -26, 12, 12);
      ctx.fillStyle = '#161922';
      ctx.fillRect(-4, -36, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -34, 4, 5);

      ctx.restore();
      return;
    }

    // --- IDLE STATE: SCANNING GROUND (30s+ Inactivity) ---
    if (status.state === HighfieldState.SCANNING_GROUND) {
      const scanPhase = (this.animFrame % 60) / 60;
      const scanSweepX = 8 + scanPhase * 26;

      // Draw crouched body
      ctx.fillStyle = '#10141f';
      ctx.fillRect(-5, -5, 6, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -3, 8, 3);

      ctx.fillStyle = '#10141f';
      ctx.fillRect(4, -7, 6, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(3, -5, 8, 3);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -12, 14, 6);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-5, -22, 14, 11);

      ctx.fillStyle = '#161922';
      ctx.fillRect(2, -28, 11, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, -25, 4, 4);

      // Optical scanning cone & beam
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(9, -23);
      ctx.lineTo(scanSweepX, 0);
      ctx.stroke();

      // Scanner area grid projection
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(9, -23);
      ctx.lineTo(6, 0);
      ctx.lineTo(34, 0);
      ctx.closePath();
      ctx.fill();

      // Ground scan particle sparks
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(scanSweepX - 1, -1, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(scanSweepX, -2, 1, 1);

      ctx.restore();
      return;
    }

    // --- IDLE STATE: ADJUSTING SENSORS (30s+ Inactivity) ---
    if (status.state === HighfieldState.ADJUSTING_SENSORS) {
      const pulse = Math.sin(this.animFrame * 0.15) * 0.5 + 0.5;

      const drawSneaker = (offsetX: number, offsetY: number) => {
        ctx.fillStyle = '#10141f';
        ctx.fillRect(offsetX + 1, offsetY - 5, 4, 3);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(offsetX, offsetY - 3, 7, 3);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(offsetX - 1, offsetY - 1, 8, 2);
      };

      drawSneaker(-5, 0);
      drawSneaker(2, 0);

      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-4, -9, 3, 5);
      ctx.fillRect(3, -9, 3, 5);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -14, 13, 6);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-7, -27, 14, 13);
      ctx.fillStyle = '#17512e';
      ctx.fillRect(-7, -27, 4, 13);

      // Arm raised adjusting visor helmet
      ctx.fillStyle = '#227242';
      ctx.fillRect(3, -33, 4, 8);
      ctx.fillStyle = '#10141f';
      ctx.fillRect(4, -36, 4, 4);

      ctx.fillStyle = '#161922';
      ctx.fillRect(-5, -39, 12, 12);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -36, 4, 6);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(1.5, -36.5, 5, 7);

      // Holographic Sensor Diagnostic Reticle
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(8, -34, 5 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, -38, 2, 1);
      ctx.fillRect(11, -35, 3, 1);

      ctx.restore();
      return;
    }

    // --- IDLE STATE: CONTEMPLATING DEEP (30s+ Inactivity) ---
    if (status.state === HighfieldState.CONTEMPLATING_DEEP) {
      const breatheOffset = Math.sin(this.breatheTimer * 0.7) * 0.9;

      const drawSneaker = (offsetX: number, offsetY: number) => {
        ctx.fillStyle = '#10141f';
        ctx.fillRect(offsetX + 1, offsetY - 5, 4, 3);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(offsetX, offsetY - 3, 7, 3);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(offsetX - 1, offsetY - 1, 8, 2);
      };

      drawSneaker(-5, 0);
      drawSneaker(2, 0);

      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-4, -9, 3, 5);
      ctx.fillRect(3, -9, 3, 5);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -14, 13, 6);

      // Hoodie with hands tucked in front pouch
      ctx.fillStyle = '#227242';
      ctx.fillRect(-7, -27 + breatheOffset, 14, 13);
      ctx.fillStyle = '#1b5b35';
      ctx.fillRect(-3, -21 + breatheOffset, 8, 5);

      // Head tilted slightly toward Earth
      ctx.fillStyle = '#161922';
      ctx.fillRect(-5, -40 + breatheOffset, 12, 12);

      // Glowing lens with Earth reflection
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -37 + breatheOffset, 4, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(3, -36 + breatheOffset, 2, 3);

      // Gentle aura of contemplation
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath();
      ctx.arc(0, -26 + breatheOffset, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    // --- IDLE STATE: STRETCHING BOOTS (30s+ Inactivity) ---
    if (status.state === HighfieldState.STRETCHING_BOOTS) {
      const stretchPhase = Math.sin(this.animFrame * 0.12);
      const kneeDip = Math.max(0, stretchPhase * 3);

      const drawSneaker = (offsetX: number, offsetY: number) => {
        ctx.fillStyle = '#10141f';
        ctx.fillRect(offsetX + 1, offsetY - 5, 4, 3);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(offsetX, offsetY - 3, 7, 3);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(offsetX - 1, offsetY - 1, 8, 2);
      };

      drawSneaker(-6, kneeDip > 1 ? -1 : 0);
      drawSneaker(3, kneeDip > 1 ? -1 : 0);

      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-5, -8 + kneeDip, 3, 5);
      ctx.fillRect(4, -8 + kneeDip, 3, 5);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -13 + kneeDip, 13, 6);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-7, -26 + kneeDip, 14, 13);
      ctx.fillStyle = '#161922';
      ctx.fillRect(-5, -38 + kneeDip, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -35 + kneeDip, 4, 6);

      // Small dust puff particles under sneakers on suspension bounce
      if (kneeDip < 0.5 && this.animFrame % 12 === 0) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillRect(-8, -2, 2, 2);
        ctx.fillRect(8, -2, 2, 2);
      }

      ctx.restore();
      return;
    }

    // --- IDLE STATE: CHECKING WEB SHOOTERS (30s+ Inactivity) ---
    if (status.state === HighfieldState.CHECKING_WEB_SHOOTERS) {
      const drawSneaker = (offsetX: number, offsetY: number) => {
        ctx.fillStyle = '#10141f';
        ctx.fillRect(offsetX + 1, offsetY - 5, 4, 3);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(offsetX, offsetY - 3, 7, 3);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(offsetX - 1, offsetY - 1, 8, 2);
      };

      drawSneaker(-5, 0);
      drawSneaker(2, 0);

      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-4, -9, 3, 5);
      ctx.fillRect(3, -9, 3, 5);

      ctx.fillStyle = '#c89d5f';
      ctx.fillRect(-6, -14, 13, 6);

      ctx.fillStyle = '#227242';
      ctx.fillRect(-7, -27, 14, 13);

      // Arm extended forward aiming wrist shooter
      ctx.fillStyle = '#227242';
      ctx.fillRect(5, -24, 9, 4);
      ctx.fillStyle = '#10141f';
      ctx.fillRect(14, -25, 3, 4);

      ctx.fillStyle = '#161922';
      ctx.fillRect(-5, -39, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -36, 4, 6);

      // Test filament string shooting out with sparkling tip
      const threadLength = 20 + Math.sin(this.animFrame * 0.2) * 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(17, -23);
      ctx.lineTo(17 + threadLength, -28);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(17 + threadLength - 1, -29, 3, 3);

      ctx.restore();
      return;
    }

    // --- STANDARD STANDING & WALKING SPRITE ---
    const breatheOffset =
      status.state === HighfieldState.IDLE || status.state === HighfieldState.OBSERVING
        ? Math.sin(this.breatheTimer) * 0.75
        : 0;

    let leftLegOffsetX = 0;
    let leftLegOffsetY = 0;
    let rightLegOffsetX = 0;
    let rightLegOffsetY = 0;
    let torsoBob = 0;

    if (status.state === HighfieldState.EXPLORING) {
      if (this.walkFrame === 0) {
        leftLegOffsetX = -3; leftLegOffsetY = 0;
        rightLegOffsetX = 4; rightLegOffsetY = -3;
        torsoBob = -1;
      } else if (this.walkFrame === 1) {
        leftLegOffsetX = -1; leftLegOffsetY = 0;
        rightLegOffsetX = 1; rightLegOffsetY = 0;
        torsoBob = 0;
      } else if (this.walkFrame === 2) {
        leftLegOffsetX = 4; leftLegOffsetY = -3;
        rightLegOffsetX = -3; rightLegOffsetY = 0;
        torsoBob = -1;
      } else if (this.walkFrame === 3) {
        leftLegOffsetX = 1; leftLegOffsetY = 0;
        rightLegOffsetX = -1; rightLegOffsetY = 0;
        torsoBob = 0;
      }
    }

    const drawSneaker = (offsetX: number, offsetY: number) => {
      ctx.fillStyle = '#10141f';
      ctx.fillRect(offsetX + 1, offsetY - 5, 4, 3);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(offsetX, offsetY - 3, 7, 3);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(offsetX - 1, offsetY - 1, 8, 2);
    };

    drawSneaker(-5 + leftLegOffsetX, leftLegOffsetY);
    drawSneaker(2 + rightLegOffsetX, rightLegOffsetY);

    ctx.fillStyle = '#1a202c';
    ctx.fillRect(-4 + leftLegOffsetX, -9 + leftLegOffsetY, 3, 5);
    ctx.fillRect(3 + rightLegOffsetX, -9 + rightLegOffsetY, 3, 5);

    ctx.fillStyle = '#c89d5f';
    ctx.fillRect(-6, -14 + torsoBob, 13, 6);

    ctx.fillStyle = '#227242';
    ctx.fillRect(-7, -27 + torsoBob + breatheOffset, 14, 13);
    ctx.fillStyle = '#17512e';
    ctx.fillRect(-7, -27 + torsoBob + breatheOffset, 4, 13);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-1, -23 + torsoBob + breatheOffset, 2, 4);

    ctx.fillStyle = '#1b5b35';
    ctx.fillRect(4, -25 + torsoBob + breatheOffset, 4, 10);

    ctx.fillStyle = '#161922';
    ctx.fillRect(-5, -39 + torsoBob + breatheOffset, 12, 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, -36 + torsoBob + breatheOffset, 4, 6);
    ctx.strokeStyle = '#ff4e00';
    ctx.lineWidth = 1;
    ctx.strokeRect(1.5, -36.5 + torsoBob + breatheOffset, 5, 7);

    ctx.restore();
  }

  private renderVisitorProbe(ctx: CanvasRenderingContext2D, probe: { x: number; y: number }) {
    ctx.save();
    const px = Math.round(probe.x);
    const py = Math.round(probe.y);

    ctx.strokeStyle = 'rgba(255, 78, 0, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 6 + Math.sin(this.animFrame * 0.1) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff4e00';
    ctx.fillRect(px - 1, py - 1, 3, 3);
    ctx.restore();
  }

  private renderCrater(ctx: CanvasRenderingContext2D, crater: LunarCrater) {
    ctx.save();
    ctx.fillStyle = crater.shadowColor;
    ctx.beginPath();
    ctx.ellipse(crater.x, crater.y, crater.radiusX, crater.radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = crater.highlightColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(crater.x, crater.y, crater.radiusX, crater.radiusY, 0, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();
    ctx.restore();
  }
}
