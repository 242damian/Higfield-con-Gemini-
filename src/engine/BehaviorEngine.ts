/**
 * HIGHFIELD - Autonomous Behavior Engine
 * Controls Highfield's state machine, autonomous exploration walks across the expanded lunar panorama (540px),
 * acrobatic web jumps, sitting on ridge viewpoints, mineral inspection, and visitor interaction.
 */

import {
  HighfieldState,
  FacingDirection,
  HighfieldStatus,
  LunarWaypoint,
  Vector2D
} from '../types';
import { memorySystem } from './MemorySystem';

export class BehaviorEngine {
  private status: HighfieldStatus;
  private waypoints: LunarWaypoint[] = [
    {
      id: 'ridge_crest',
      x: 130,
      name: 'Observatory Ridge',
      type: 'viewpoint',
      description: 'The prime overlook facing the blue planet.',
      observationFocus: 'earth'
    },
    {
      id: 'crater_rim_west',
      x: 55,
      name: 'Western Caldera Rim',
      type: 'crater_rim',
      description: 'A deep shadowed crater on the western edge.',
      observationFocus: 'ground'
    },
    {
      id: 'central_plateau',
      x: 230,
      name: 'Central Overlook',
      type: 'plateau',
      description: 'A flat expanse illuminated by blue planet-glow.',
      observationFocus: 'space'
    },
    {
      id: 'eastern_rock',
      x: 330,
      name: 'Comet Vista',
      type: 'rock_formation',
      description: 'High rock outcrop where shooting stars cross the horizon.',
      observationFocus: 'earth'
    },
    {
      id: 'far_east_crater',
      x: 420,
      name: 'Eastern Crater Slope',
      type: 'viewpoint',
      description: 'The eastern slope descending into cosmic shadow.',
      observationFocus: 'ground'
    },
    {
      id: 'far_horizon',
      x: 490,
      name: 'Far Lunar Horizon',
      type: 'viewpoint',
      description: 'The edge of the visible lunar hemisphere.',
      observationFocus: 'space'
    }
  ];

  private stateTimer: number = 0;
  private nextDecisionDelay: number = 600;
  private walkSpeed: number = 38; // pixels per second
  private currentWaypoint: LunarWaypoint | null = null;
  private visitorPosition: Vector2D | null = null;
  private wasNearVisitor: boolean = false;
  private interactionRadius: number = 44;
  private playerAcknowledgeCooldown: number = 0;

  // Jump animation state
  private jumpStartX: number = 0;
  private jumpTargetX: number = 0;
  private jumpDuration: number = 1800; // ms
  private jumpElapsed: number = 0;

  // Autonomous thoughts pool
  private thoughtsPool = [
    "La canica azul se ve serena esta noche...",
    "Millones de luces respirando bajo la misma atmósfera.",
    "La gravedad lunar hace que cada salto se sienta como volar.",
    "El horizonte lunar gira bajo mis pies... la órbita sigue su curso.",
    "¿Alguien en la Tierra estará mirando hacia la Luna justo ahora?",
    "Ese meteoro dejó una estela dorada en la oscuridad.",
    "El traje arácnido responde perfecto al frío del vacío.",
    "El silencio cósmico tiene su propio compás.",
    "Highfield... montando guardia en el borde del mundo.",
    "El regolito brilla con microcristales cuando la Tierra lo ilumina.",
    "Una noche tranquila en el mar de la tranquilidad."
  ];

  constructor(initialX: number = 130, initialY: number = 248) {
    this.status = {
      state: HighfieldState.IDLE,
      position: { x: initialX, y: initialY },
      targetPosition: null,
      facing: FacingDirection.RIGHT,
      currentAction: 'Patrullando el perímetro lunar panorámico',
      thought: "La canica azul se ve serena esta noche...",
      thoughtTimer: 3500,
      emotion: 'wondrous',
      isInteracting: false,
      distanceToVisitor: 999,
      nearVisitor: false,
    };
    this.currentWaypoint = this.waypoints[0];
  }

  public getStatus(): HighfieldStatus {
    return { ...this.status };
  }

  public setVisitorPosition(pos: Vector2D | null) {
    this.visitorPosition = pos;
  }

  public startInteraction() {
    this.status.state = HighfieldState.INTERACTING;
    this.status.isInteracting = true;
    this.status.currentAction = 'Canal de radio cuántico abierto';
    this.status.emotion = 'friendly';
    this.status.targetPosition = null;
    if (this.visitorPosition) {
      this.status.facing = this.visitorPosition.x < this.status.position.x ? FacingDirection.LEFT : FacingDirection.RIGHT;
    }
  }

  public endInteraction() {
    this.status.isInteracting = false;
    this.status.state = HighfieldState.IDLE;
    this.status.currentAction = 'Reanudando patrulla autónoma';
    this.stateTimer = 0;
    this.nextDecisionDelay = 2000;
  }

  public triggerThought(customText?: string) {
    const text = customText || this.thoughtsPool[Math.floor(Math.random() * this.thoughtsPool.length)];
    this.status.thought = text;
    this.status.thoughtTimer = 4500;
  }

  public triggerImmediateWalk(targetX?: number) {
    if (this.status.isInteracting) return;

    let destX: number;
    if (typeof targetX === 'number') {
      destX = Math.max(40, Math.min(500, targetX));
      this.status.currentAction = `Inspeccionando coordenadas [X: ${Math.round(destX)}]`;
      this.triggerThought('Explorando ese sector del terreno...');
    } else {
      const candidates = this.waypoints.filter(wp => Math.abs(wp.x - this.status.position.x) > 35);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || this.waypoints[1];
      this.currentWaypoint = chosen;
      destX = chosen.x;
      this.status.currentAction = `Caminando hacia ${chosen.name}`;
      this.triggerThought(`Rumbo a ${chosen.name}...`);
    }

    this.status.state = HighfieldState.EXPLORING;
    this.status.targetPosition = { x: destX, y: 0 };
    this.status.facing = destX < this.status.position.x ? FacingDirection.LEFT : FacingDirection.RIGHT;
    this.status.emotion = 'curious';
    this.stateTimer = 0;
    this.nextDecisionDelay = 16000;
  }

  public triggerWebJump() {
    if (this.status.isInteracting || this.status.state === HighfieldState.WEB_JUMP) return;

    this.jumpStartX = this.status.position.x;
    // Jump either left or right depending on position
    const jumpDist = this.status.position.x > 270 ? -140 : 140;
    this.jumpTargetX = Math.max(50, Math.min(490, this.status.position.x + jumpDist));
    this.jumpElapsed = 0;
    this.status.state = HighfieldState.WEB_JUMP;
    this.status.facing = this.jumpTargetX < this.jumpStartX ? FacingDirection.LEFT : FacingDirection.RIGHT;
    this.status.currentAction = 'Salto parabólico en gravedad reducida (1/6g)';
    this.status.emotion = 'wondrous';
    this.triggerThought('¡Filamento tensado! Disfrutando la microgravedad.');
  }

  public triggerWeaveWeb() {
    if (this.status.isInteracting) return;
    this.status.state = HighfieldState.WEAVING_WEB;
    this.status.currentAction = 'Desplegando Red Monumental de Filamentos (Pantalla de Cine Estelar)';
    this.status.emotion = 'wondrous';
    this.status.targetPosition = null;
    this.stateTimer = 0;
    this.nextDecisionDelay = 4500;
    this.triggerThought('¡Tejiendo la gran red cósmica! Atrapando la luz de las estrellas para el cine en el vacío.');
  }

  public update(deltaMs: number, getTerrainHeight: (x: number) => number): { stepped: boolean; footprintPos?: { x: number; y: number } } {
    let stepped = false;
    let footprintPos: { x: number; y: number } | undefined = undefined;
    const deltaSec = deltaMs / 1000;

    // Update thought bubble timer
    if (this.status.thoughtTimer > 0) {
      this.status.thoughtTimer -= deltaMs;
      if (this.status.thoughtTimer <= 0) {
        this.status.thought = null;
      }
    }

    if (this.playerAcknowledgeCooldown > 0) {
      this.playerAcknowledgeCooldown -= deltaMs;
    }

    // Check visitor proximity
    if (this.visitorPosition) {
      const dx = this.visitorPosition.x - this.status.position.x;
      const dy = this.visitorPosition.y - this.status.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.status.distanceToVisitor = dist;
      const isNowNear = dist <= this.interactionRadius;
      this.status.nearVisitor = isNowNear;

      if (isNowNear && !this.wasNearVisitor && !this.status.isInteracting && this.playerAcknowledgeCooldown <= 0) {
        this.playerAcknowledgeCooldown = 12000;
        if (this.status.state !== HighfieldState.EXPLORING && this.status.state !== HighfieldState.WEB_JUMP) {
          this.status.state = HighfieldState.PLAYER_DETECTED;
          this.status.currentAction = 'Detectó señal del visitante';
          this.status.emotion = 'curious';
          this.status.facing = dx < 0 ? FacingDirection.LEFT : FacingDirection.RIGHT;
          this.stateTimer = 0;
          this.nextDecisionDelay = 2500;
        }
      }
      this.wasNearVisitor = isNowNear;
    } else {
      this.status.nearVisitor = false;
      this.status.distanceToVisitor = 999;
      this.wasNearVisitor = false;
    }

    if (this.status.isInteracting) {
      this.status.position.y = getTerrainHeight(this.status.position.x);
      return { stepped: false };
    }

    // WEB JUMP physics state
    if (this.status.state === HighfieldState.WEB_JUMP) {
      this.jumpElapsed += deltaMs;
      const progress = Math.min(1, this.jumpElapsed / this.jumpDuration);
      this.status.jumpProgress = progress;

      // Parabolic Arc
      this.status.position.x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * progress;
      const groundY = getTerrainHeight(this.status.position.x);
      const arcHeight = 52 * Math.sin(progress * Math.PI);
      this.status.position.y = groundY - arcHeight;

      if (progress >= 1) {
        this.status.position.x = this.jumpTargetX;
        this.status.position.y = getTerrainHeight(this.status.position.x);
        this.status.state = HighfieldState.IDLE;
        this.status.currentAction = 'Aterrizaje suave en el regolito';
        this.stateTimer = 0;
        this.nextDecisionDelay = 2000;
        footprintPos = { x: this.status.position.x, y: this.status.position.y };
      }
      return { stepped: false, footprintPos };
    }

    this.stateTimer += deltaMs;

    // State machine
    switch (this.status.state) {
      case HighfieldState.PLAYER_DETECTED:
      case HighfieldState.IDLE:
      case HighfieldState.OBSERVING:
      case HighfieldState.SITTING:
      case HighfieldState.INSPECTING:
      case HighfieldState.WEAVING_WEB: {
        if (this.stateTimer > this.nextDecisionDelay) {
          this.decideNextAutonomousAction();
        }
        break;
      }

      case HighfieldState.EXPLORING: {
        if (this.status.targetPosition) {
          const dx = this.status.targetPosition.x - this.status.position.x;
          const dist = Math.abs(dx);

          if (dist > 1.5) {
            const dir = Math.sign(dx);
            const move = dir * Math.min(this.walkSpeed * deltaSec, dist);
            this.status.position.x += move;
            this.status.facing = dir < 0 ? FacingDirection.LEFT : FacingDirection.RIGHT;
            stepped = true;

            // Leave occasional footprint in lunar dust
            if (Math.random() < 0.08) {
              footprintPos = { x: this.status.position.x, y: this.status.position.y };
            }

            this.status.position.y = getTerrainHeight(this.status.position.x);
          } else {
            this.status.position.x = this.status.targetPosition.x;
            this.status.position.y = getTerrainHeight(this.status.position.x);
            this.status.targetPosition = null;
            this.onReachedWaypoint();
          }
        } else {
          this.decideNextAutonomousAction();
        }
        break;
      }
    }

    this.status.position.y = getTerrainHeight(this.status.position.x);
    return { stepped, footprintPos };
  }

  private onReachedWaypoint() {
    this.stateTimer = 0;
    const focus = this.currentWaypoint?.observationFocus || 'earth';

    if (focus === 'earth') {
      const roll = Math.random();
      if (roll < 0.5) {
        // Sit down on the ridge with swinging legs
        this.status.state = HighfieldState.SITTING;
        this.status.currentAction = `Sentado en ${this.currentWaypoint?.name || 'la cresta'} contemplando la Tierra`;
        this.status.facing = FacingDirection.RIGHT;
        this.status.emotion = 'wondrous';
        this.nextDecisionDelay = 6000 + Math.random() * 3000;
        this.triggerThought("Desde esta roca la vista de nuestro hogar es inolvidable.");
      } else {
        this.status.state = HighfieldState.OBSERVING;
        this.status.currentAction = `Observando la Tierra desde ${this.currentWaypoint?.name || 'la cresta'}`;
        this.status.facing = FacingDirection.RIGHT;
        this.status.emotion = 'wondrous';
        this.nextDecisionDelay = 4000 + Math.random() * 2000;
        if (Math.random() > 0.3) this.triggerThought();
      }
    } else if (focus === 'ground') {
      this.status.state = HighfieldState.INSPECTING;
      this.status.currentAction = `Analizando minerales en ${this.currentWaypoint?.name || 'el cráter'}`;
      this.status.emotion = 'focused';
      this.nextDecisionDelay = 4500 + Math.random() * 2000;
      this.triggerThought("El escáner detecta microcristales de sílice fundida.");
      memorySystem.unlockDiscovery({
        id: 'mineral_quartz_regolith',
        name: 'Fragmento de Cuarzo Regolítico',
        category: 'mineral',
        description: 'Muestra analizada con escáner de alta frecuencia en el cráter oriental.',
        iconName: 'Sparkles',
      });
    } else {
      this.status.state = HighfieldState.IDLE;
      this.status.currentAction = `Haciendo guardia en ${this.currentWaypoint?.name || 'la meseta'}`;
      this.status.emotion = 'calm';
      this.nextDecisionDelay = 3000 + Math.random() * 2000;
    }
  }

  private decideNextAutonomousAction() {
    this.stateTimer = 0;
    const roll = Math.random();

    // 15% chance of doing an acrobatic low gravity web jump
    if (roll < 0.15) {
      this.triggerWebJump();
      return;
    }

    if (roll < 0.80) {
      const availableWaypoints = this.waypoints.filter(
        wp => Math.abs(wp.x - this.status.position.x) > 30
      );
      const chosen = availableWaypoints[Math.floor(Math.random() * availableWaypoints.length)] || this.waypoints[0];
      this.currentWaypoint = chosen;

      this.status.state = HighfieldState.EXPLORING;
      this.status.targetPosition = { x: chosen.x, y: 0 };
      this.status.currentAction = `Caminando hacia ${chosen.name}`;
      this.status.facing = chosen.x < this.status.position.x ? FacingDirection.LEFT : FacingDirection.RIGHT;
      this.status.emotion = 'curious';
      this.nextDecisionDelay = 14000;
    } else if (roll < 0.92) {
      this.status.state = HighfieldState.OBSERVING;
      this.status.currentAction = 'Mirando la inmensidad del espacio';
      this.status.facing = Math.random() > 0.3 ? FacingDirection.RIGHT : FacingDirection.LEFT;
      this.status.emotion = 'wondrous';
      this.nextDecisionDelay = 3000 + Math.random() * 2000;
      if (Math.random() > 0.4) this.triggerThought();
    } else {
      this.status.state = HighfieldState.IDLE;
      this.status.currentAction = 'Descansando en baja gravedad';
      this.status.emotion = 'calm';
      this.nextDecisionDelay = 2500 + Math.random() * 1500;
    }
  }
}
