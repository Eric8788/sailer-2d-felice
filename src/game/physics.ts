import { BOAT_CONFIGS } from '../config/boats';
import { POSITION_SCALE, WORLD_HEIGHT, WORLD_WIDTH } from '../config/world';
import type {
  BoatConfig,
  ControlState,
  EnvironmentState,
  GameState,
  HudSnapshot,
  PhysicsStepResult,
  RenderSnapshot,
  SailFlowState,
} from '../types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const RUDDER_INPUT_SPEED = 1;
const SAIL_SWING_SPEED = 4;
const MINIMUM_LUFF_DRAG = 0.03;
const LIFT_TO_HEEL_SCALE = 1.9;

interface SailForceResult {
  driveForce: number;
  heelingForce: number;
  lateralForce: number;
  liftForce: number;
  dragForce: number;
  angleOfAttack: number;
  flowState: SailFlowState;
}

interface DerivedValues {
  aws: number;
  awaRelativeToBoat: number;
  absAwaRel: number;
  absTwaRel: number;
  tackSign: number;
  windFlowRad: number;
  currentFlowRad: number;
  headingRad: number;
  driveForceBase: number;
  heelingForce: number;
  sailLiftForce: number;
  sailDragForce: number;
  sailAngleOfAttack: number;
  sailFlowState: SailFlowState;
  waterResistance: number;
  leewayAngle: number;
  moveRad: number;
}

function resolveBoat(state: GameState): BoatConfig {
  return BOAT_CONFIGS[state.boatId];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeDegrees(value: number): number {
  return (value % 360 + 360) % 360;
}

export function computeRelativeAngle(angle: number, reference: number): number {
  return (angle - reference + 540) % 360 - 180;
}

export function computeNoGoFactor(absTwaRel: number, boat: BoatConfig): number {
  if (absTwaRel >= boat.noGoMax) {
    return 1;
  }

  if (absTwaRel <= boat.noGoMin) {
    return 0;
  }

  const progress = (absTwaRel - boat.noGoMin) / (boat.noGoMax - boat.noGoMin);
  return progress * progress * (3 - 2 * progress);
}

function vectorDirectionDegrees(x: number, y: number): number {
  return normalizeDegrees(Math.atan2(x, -y) * RAD_TO_DEG);
}

function computeSailSideMismatch(awaRelativeToBoat: number, sailAngle: number): boolean {
  if (Math.abs(awaRelativeToBoat) < 3 || Math.abs(sailAngle) < 3) {
    return false;
  }

  return Math.sign(awaRelativeToBoat) !== Math.sign(sailAngle);
}

function computeRudderTurnRate(state: GameState, boat: BoatConfig, dt: number): number {
  const speed = Math.abs(state.boatSpeed);
  const rudderFraction = Math.abs(state.rudderAngle) / boat.maxRudder;
  const speedAuthority = speed / (speed + 2.5);
  const rudderStallPenalty = 1 - clamp((rudderFraction - 0.72) / 0.28, 0, 1) * 0.38;
  const heelPenalty = 1 - clamp(Math.abs(state.heelAngle) / boat.capsizeAngle, 0, 1) * 0.35;
  const reverseMultiplier = state.boatSpeed >= 0 ? 1 : -1;
  const rawTurnRate =
    -state.rudderAngle *
    speed *
    boat.turnCoeff *
    speedAuthority *
    rudderStallPenalty *
    heelPenalty *
    reverseMultiplier;
  const maxTurnRate = 0.48 * speedAuthority;

  return clamp(rawTurnRate, -maxTurnRate, maxTurnRate) * dt;
}

function computeSailForces(
  state: GameState,
  boat: BoatConfig,
  awx: number,
  awy: number,
  aws: number,
  headingRad: number,
  absAwaRel: number,
  absTwaRel: number,
  tackSign: number,
): SailForceResult {
  if (aws < 0.01) {
    return {
      driveForce: 0,
      heelingForce: 0,
      lateralForce: 0,
      liftForce: 0,
      dragForce: 0,
      angleOfAttack: 0,
      flowState: 'luffing',
    };
  }

  const forwardX = Math.sin(headingRad);
  const forwardY = -Math.cos(headingRad);
  const rightX = Math.cos(headingRad);
  const rightY = Math.sin(headingRad);
  const flowRight = (awx * rightX + awy * rightY) / aws;
  const flowForward = (awx * forwardX + awy * forwardY) / aws;

  const noGoFactor = computeNoGoFactor(absTwaRel, boat);
  const sailAngle = Math.abs(state.currentSailAngle);
  const rawAngleOfAttack = absAwaRel - sailAngle;
  const angleOfAttack = clamp(rawAngleOfAttack, -20, 85);
  const positiveAngleOfAttack = clamp(angleOfAttack, 0, 85);
  const angleOfAttackRad = positiveAngleOfAttack * DEG_TO_RAD;
  const backwinded = computeSailSideMismatch(absAwaRel * (tackSign < 0 ? 1 : -1), state.currentSailAngle);
  const headToWindDepth = clamp((boat.noGoMin - absTwaRel) / boat.noGoMin, 0, 1);
  const sailExposure = clamp(sailAngle / 75, 0.12, 1);
  const liftRightUnit = flowForward * -tackSign;
  const liftForwardUnit = -flowRight * -tackSign;

  if (backwinded) {
    const backwindAngleFactor = clamp((130 - absAwaRel) / 95, 0, 1);
    const backingLoad =
      aws *
      boat.driveCoeff *
      (0.18 + backwindAngleFactor * 0.32 + headToWindDepth * 0.18) *
      sailExposure;
    const backedLift = backingLoad * 0.9;
    const backedDrag = backingLoad * 0.35;
    const lateralForce = -liftRightUnit * backedLift + flowRight * backedDrag;
    const driveForce = -liftForwardUnit * backedLift + flowForward * backedDrag;

    return {
      driveForce,
      heelingForce: Math.abs(lateralForce) * LIFT_TO_HEEL_SCALE,
      lateralForce,
      liftForce: -backedLift,
      dragForce: backedDrag,
      angleOfAttack,
      flowState: 'backwinded',
    };
  }

  if (noGoFactor <= 0) {
    const luffDrag =
      aws *
      boat.driveCoeff *
      (MINIMUM_LUFF_DRAG + headToWindDepth * 0.035 * (0.35 + state.sailTrim / 140)) *
      (0.4 + sailExposure * 0.6);
    const lateralForce = flowRight * luffDrag;
    const driveForce = flowForward * luffDrag;

    return {
      driveForce,
      heelingForce: Math.abs(lateralForce) * LIFT_TO_HEEL_SCALE * 0.55,
      lateralForce,
      liftForce: 0,
      dragForce: luffDrag,
      angleOfAttack,
      flowState: 'luffing',
    };
  }

  const luffFactor = clamp((8 - angleOfAttack) / 16, 0, 1);
  const stallFactor = clamp((angleOfAttack - 52) / 30, 0, 1);
  const downwindFactor = clamp((absAwaRel - 115) / 65, 0, 1);
  const attachedFlow = (1 - luffFactor) * (1 - stallFactor * 0.58) * (1 - downwindFactor * 0.45);
  const liftCoefficient = Math.sin(Math.min(positiveAngleOfAttack, 45) * 2 * DEG_TO_RAD) * attachedFlow;
  const profileDragCoefficient =
    0.045 +
    Math.pow(Math.sin(angleOfAttackRad), 2) * 0.28 +
    luffFactor * 0.12 +
    stallFactor * 0.48;
  const downwindDragCoefficient = downwindFactor * (0.5 + sailExposure * 0.35);
  const dynamicLoad = aws * boat.driveCoeff * noGoFactor;
  const liftForce = dynamicLoad * liftCoefficient;
  const dragForce = dynamicLoad * (profileDragCoefficient + downwindDragCoefficient) * (0.55 + sailExposure * 0.45);
  const lateralForce = liftRightUnit * liftForce + flowRight * dragForce;
  const driveForce = liftForwardUnit * liftForce + flowForward * dragForce;
  const flowState: SailFlowState = luffFactor > 0.6 ? 'luffing' : stallFactor > 0.45 ? 'stalled' : 'attached';

  return {
    driveForce,
    heelingForce: Math.abs(lateralForce) * LIFT_TO_HEEL_SCALE,
    lateralForce,
    liftForce,
    dragForce,
    angleOfAttack,
    flowState,
  };
}

function deriveValues(state: GameState, environment: EnvironmentState, boat: BoatConfig): DerivedValues {
  const trueWindRad = environment.twd * DEG_TO_RAD;
  const windFlowRad = trueWindRad + Math.PI;
  const twx = environment.tws * Math.sin(windFlowRad);
  const twy = -environment.tws * Math.cos(windFlowRad);

  const headingRad = state.boatHeading * DEG_TO_RAD;
  const bvx = state.boatSpeed * Math.sin(headingRad);
  const bvy = -state.boatSpeed * Math.cos(headingRad);

  const awx = twx - bvx;
  const awy = twy - bvy;
  const aws = Math.sqrt(awx * awx + awy * awy);

  const awaFlowDirection = vectorDirectionDegrees(awx, awy);
  const apparentWindDirection = (awaFlowDirection + 180) % 360;
  const awaRelativeToBoat = computeRelativeAngle(apparentWindDirection, state.boatHeading);
  const absAwaRel = Math.abs(awaRelativeToBoat);

  const twaRelativeToBoat = computeRelativeAngle(environment.twd, state.boatHeading);
  const absTwaRel = Math.abs(twaRelativeToBoat);
  const tackSign = awaRelativeToBoat < 0 ? 1 : -1;

  const sailForces = computeSailForces(state, boat, awx, awy, aws, headingRad, absAwaRel, absTwaRel, tackSign);
  const driveForceBase = sailForces.driveForce;
  const heelingForce = sailForces.heelingForce * boat.heelCoeff;

  const cbResist = state.centerboardDown / 100;
  const rudderFraction = Math.abs(state.rudderAngle) / boat.maxRudder;
  const heelDragBonus = Math.pow(clamp(Math.abs(state.heelAngle) / boat.capsizeAngle, 0, 1), 2) * 0.04;
  const cbDragBonus = cbResist * 0.006;
  const rudderDragBonus = rudderFraction * rudderFraction * 0.028;
  const leewayDragBonus = Math.pow(1 - cbResist, 2) * Math.min(0.025, Math.abs(sailForces.lateralForce) * 0.002);
  const waterResistance =
    state.boatSpeed *
    Math.abs(state.boatSpeed) *
    (boat.dragCoeff + cbDragBonus + rudderDragBonus + heelDragBonus + leewayDragBonus);
  const speedForLeeway = Math.sqrt(Math.max(Math.abs(state.boatSpeed), 0.8));
  const lateralLoad = Math.abs(sailForces.lateralForce) + (sailForces.flowState === 'backwinded' ? Math.abs(driveForceBase) * 1.4 : 0);
  const leewayAngle = clamp(lateralLoad * (1 - cbResist * 0.88) * 0.35 / speedForLeeway, 0, 18);
  const moveRad = headingRad + leewayAngle * DEG_TO_RAD * tackSign;

  return {
    aws,
    awaRelativeToBoat,
    absAwaRel,
    absTwaRel,
    tackSign,
    windFlowRad,
    currentFlowRad: environment.currentDir * Math.PI / 180,
    headingRad,
    driveForceBase,
    heelingForce,
    sailLiftForce: sailForces.liftForce,
    sailDragForce: sailForces.dragForce,
    sailAngleOfAttack: sailForces.angleOfAttack,
    sailFlowState: sailForces.flowState,
    waterResistance,
    leewayAngle,
    moveRad,
  };
}

function buildHudSnapshot(
  state: GameState,
  environment: EnvironmentState,
  boat: BoatConfig,
  derived: DerivedValues,
): HudSnapshot {
  // SOG and COG calculation
  const bvx = state.boatSpeed * Math.sin(derived.moveRad);
  const bvy = -state.boatSpeed * Math.cos(derived.moveRad);
  
  const currentRad = environment.currentDir * Math.PI / 180;
  const cvx = environment.currentSpeed * Math.sin(currentRad);
  const cvy = -environment.currentSpeed * Math.cos(currentRad);
  
  const gvx = bvx + cvx;
  const gvy = bvy + cvy;
  
  const sog = Math.sqrt(gvx * gvx + gvy * gvy);
  let cog = Math.atan2(gvx, -gvy) * 180 / Math.PI;
  if (cog < 0) cog += 360;
  
  // TWA (True Wind Angle) relative to boat heading
  const twa = computeRelativeAngle(environment.twd, state.boatHeading);
  
  // VMG (Velocity Made Good) - speed towards/away from wind
  // VMG = SOG * cos(COG - TWD)
  const twdRad = environment.twd * Math.PI / 180;
  const cogRad = cog * Math.PI / 180;
  const vmg = sog * Math.cos(cogRad - twdRad);

  return {
    boatName: boat.name,
    twd: environment.twd,
    tws: environment.tws,
    boatPosition: { ...state.boatPosition },
    awaRelativeToBoat: derived.awaRelativeToBoat,
    aws: derived.aws,
    currentSpeed: environment.currentSpeed,
    currentDir: environment.currentDir,
    leewayAngle: derived.leewayAngle,
    boatHeading: state.boatHeading,
    boatSpeed: state.boatSpeed,
    heelAngle: state.heelAngle,
    sailTrim: state.sailTrim,
    rudderAngle: state.rudderAngle,
    crewWeightOffset: state.crewWeightOffset,
    centerboardDown: state.centerboardDown,
    vmg,
    sog,
    cog,
    twa,
  };
}

function buildRenderSnapshot(
  state: GameState,
  environment: EnvironmentState,
  derived: DerivedValues,
  driveForce: number,
): RenderSnapshot {
  const heelScale = Math.cos(state.heelAngle * Math.PI / 180);

  return {
    boatPosition: { ...state.boatPosition },
    boatHeading: state.boatHeading,
    boatSpeed: state.boatSpeed,
    tws: environment.tws,
    currentSpeed: environment.currentSpeed,
    heelAngle: state.heelAngle,
    heelScale,
    rudderAngle: state.rudderAngle,
    sailTrim: state.sailTrim,
    sailAngleDeg: state.currentSailAngle,
    crewWeightOffset: state.crewWeightOffset,
    windFlowRad: derived.windFlowRad,
    currentFlowRad: derived.currentFlowRad,
    headingRad: derived.headingRad,
    aws: derived.aws,
    awaRelativeToBoat: derived.awaRelativeToBoat,
    driveForce,
    sailLiftForce: derived.sailLiftForce,
    sailDragForce: derived.sailDragForce,
    sailAngleOfAttack: derived.sailAngleOfAttack,
    sailFlowState: derived.sailFlowState,
    waterResistance: derived.waterResistance,
    heelingForce: derived.heelingForce,
    tackSign: derived.tackSign,
    leewayAngle: derived.leewayAngle,
    moveRad: derived.moveRad,
    crewForceX: (state.crewWeightOffset / 100) * 1.5 * 15,
    capsize: state.capsize,
  };
}

function buildSnapshot(state: GameState, environment: EnvironmentState, boat: BoatConfig, driveForce: number) {
  const derived = deriveValues(state, environment, boat);
  return {
    hud: buildHudSnapshot(state, environment, boat, derived),
    render: buildRenderSnapshot(state, environment, derived, driveForce),
  };
}

function applyControls(
  state: GameState,
  controls: ControlState,
  boat: BoatConfig,
  dt: number,
): void {
  const hasRudderOverride = typeof controls.rudderAngle === 'number';
  if (hasRudderOverride && !controls.turnLeft && !controls.turnRight) {
    state.rudderAngle = clamp(controls.rudderAngle ?? 0, -boat.maxRudder, boat.maxRudder);
  } else {
    if (controls.turnLeft) {
      state.rudderAngle += RUDDER_INPUT_SPEED * dt;
    }

    if (controls.turnRight) {
      state.rudderAngle -= RUDDER_INPUT_SPEED * dt;
    }

    state.rudderAngle = clamp(state.rudderAngle, -boat.maxRudder, boat.maxRudder);

    if (!controls.turnLeft && !controls.turnRight && !hasRudderOverride) {
      const waterCenterForce = Math.abs(state.boatSpeed) * 0.0025 * dt;
      if (Math.abs(state.rudderAngle) < waterCenterForce) {
        state.rudderAngle = 0;
      } else {
        state.rudderAngle -= Math.sign(state.rudderAngle) * waterCenterForce;
      }
    }
  }

  const hasSailTrimOverride = typeof controls.sailTrim === 'number';
  if (hasSailTrimOverride && !controls.trimIn && !controls.easeOut) {
    state.sailTrim = clamp(controls.sailTrim ?? state.sailTrim, 0, 100);
  } else if (controls.trimIn) {
    state.sailTrim = clamp(state.sailTrim + 1.5 * dt, 0, 100);
  }

  if (controls.easeOut) {
    state.sailTrim = clamp(state.sailTrim - 1.5 * dt, 0, 100);
  }

  const hasCrewOverride = typeof controls.crewWeightOffset === 'number';
  if (hasCrewOverride && !controls.crewLeft && !controls.crewRight) {
    state.crewWeightOffset = clamp(controls.crewWeightOffset ?? state.crewWeightOffset, -100, 100);
  } else if (controls.crewLeft) {
    state.crewWeightOffset = clamp(state.crewWeightOffset - 2 * dt, -100, 100);
  } else if (controls.crewRight) {
    state.crewWeightOffset = clamp(state.crewWeightOffset + 2 * dt, -100, 100);
  } else if (!hasCrewOverride) {
    // Auto-centering crew weight when no keys are pressed
    const centerSpeed = 1.2 * dt;
    if (Math.abs(state.crewWeightOffset) < centerSpeed) {
      state.crewWeightOffset = 0;
    } else {
      state.crewWeightOffset -= Math.sign(state.crewWeightOffset) * centerSpeed;
    }
  }

  const hasBoardOverride = typeof controls.centerboardDown === 'number';
  if (hasBoardOverride && !controls.boardDown && !controls.boardUp) {
    state.centerboardDown = clamp(controls.centerboardDown ?? state.centerboardDown, 0, 100);
  } else if (controls.boardDown) {
    state.centerboardDown = clamp(state.centerboardDown + 2 * dt, 0, 100);
  }

  if (controls.boardUp) {
    state.centerboardDown = clamp(state.centerboardDown - 2 * dt, 0, 100);
  }
}

function updateSailAngle(state: GameState, awaRelativeToBoat: number, dt: number): void {
  let targetSailAngleDeg = (100 - state.sailTrim) * 0.9;
  if (awaRelativeToBoat < 0) {
    targetSailAngleDeg = -targetSailAngleDeg;
  }

  const sailDiff = targetSailAngleDeg - state.currentSailAngle;
  const sailSwingSpeed = SAIL_SWING_SPEED * dt;
  if (Math.abs(sailDiff) <= sailSwingSpeed) {
    state.currentSailAngle = targetSailAngleDeg;
  } else {
    state.currentSailAngle += Math.sign(sailDiff) * sailSwingSpeed;
  }
}

export function sampleFrame(state: GameState, environment: EnvironmentState) {
  const boat = resolveBoat(state);
  return buildSnapshot(state, environment, boat, deriveValues(state, environment, boat).driveForceBase);
}

export function stepPhysics(
  state: GameState,
  controls: ControlState,
  environment: EnvironmentState,
  dt: number,
): PhysicsStepResult {
  const boat = resolveBoat(state);

  if (state.capsize) {
    const staticFrame = sampleFrame(state, environment);
    return {
      nextState: { ...state, boatPosition: { ...state.boatPosition } },
      hud: staticFrame.hud,
      render: staticFrame.render,
    };
  }

  const nextState: GameState = {
    ...state,
    boatPosition: { ...state.boatPosition },
  };

  applyControls(nextState, controls, boat, dt);

  const turnRate = computeRudderTurnRate(nextState, boat, dt);
  nextState.boatHeading = normalizeDegrees(nextState.boatHeading + turnRate);

  const steeringFrame = deriveValues(nextState, environment, boat);
  updateSailAngle(nextState, steeringFrame.awaRelativeToBoat, dt);
  const derived = deriveValues(nextState, environment, boat);

  nextState.prevRudderAngle = nextState.rudderAngle;

  const driveForce = derived.driveForceBase;

  const acceleration = (driveForce - derived.waterResistance) / boat.mass;
  nextState.boatSpeed = clamp(nextState.boatSpeed + acceleration * dt, -1.5, 12);

  if (Math.abs(nextState.boatSpeed) < 0.05 && driveForce === 0) {
    nextState.boatSpeed = 0;
  }

  nextState.boatPosition.x += nextState.boatSpeed * Math.sin(derived.moveRad) * dt * POSITION_SCALE;
  nextState.boatPosition.y -= nextState.boatSpeed * Math.cos(derived.moveRad) * dt * POSITION_SCALE;

  nextState.boatPosition.x += environment.currentSpeed * Math.sin(derived.currentFlowRad) * dt * POSITION_SCALE;
  nextState.boatPosition.y -= environment.currentSpeed * Math.cos(derived.currentFlowRad) * dt * POSITION_SCALE;

  nextState.boatPosition.x = clamp(nextState.boatPosition.x, 0, WORLD_WIDTH);
  nextState.boatPosition.y = clamp(nextState.boatPosition.y, 0, WORLD_HEIGHT);

  const crewHeelMoment = (nextState.crewWeightOffset / 100) * boat.hikingPower;
  const targetHeel = (derived.heelingForce * derived.tackSign * 2) + (crewHeelMoment * 0.5);
  nextState.heelAngle += (targetHeel - nextState.heelAngle) * 0.1 * dt;

  if (Math.abs(nextState.heelAngle) > boat.capsizeAngle) {
    nextState.capsize = true;
  }

  return {
    nextState,
    hud: buildHudSnapshot(nextState, environment, boat, derived),
    render: buildRenderSnapshot(nextState, environment, derived, driveForce),
  };
}
