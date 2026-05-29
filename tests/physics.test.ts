import { describe, expect, it } from 'vitest';

import { BOAT_CONFIGS, DEFAULT_BOAT_ID } from '../src/config/boats';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../src/config/world';
import { computeNoGoFactor, computeRelativeAngle, sampleFrame, stepPhysics } from '../src/game/physics';
import { createInitialEnvironment, createInitialGameState } from '../src/game/state';

const IDLE_CONTROLS = {
  turnLeft: false,
  turnRight: false,
  trimIn: false,
  easeOut: false,
  crewLeft: false,
  crewRight: false,
  boardDown: false,
  boardUp: false,
};

describe('physics helpers', () => {
  it('detects port and starboard apparent wind correctly', () => {
    const portState = createInitialGameState(DEFAULT_BOAT_ID);
    portState.boatHeading = 0;

    const portEnvironment = createInitialEnvironment();
    portEnvironment.twd = 270;

    const portFrame = sampleFrame(portState, portEnvironment);
    expect(portFrame.hud.awaRelativeToBoat).toBeLessThan(0);
    expect(portFrame.render.tackSign).toBe(1);

    const starboardEnvironment = createInitialEnvironment();
    starboardEnvironment.twd = 90;

    const starboardFrame = sampleFrame(portState, starboardEnvironment);
    expect(starboardFrame.hud.awaRelativeToBoat).toBeGreaterThan(0);
    expect(starboardFrame.render.tackSign).toBe(-1);
  });

  it('blends through the no-go zone progressively', () => {
    const boat = BOAT_CONFIGS[DEFAULT_BOAT_ID];

    expect(computeNoGoFactor(10, boat)).toBe(0);
    expect(computeNoGoFactor(boat.noGoMin, boat)).toBe(0);
    expect(computeNoGoFactor((boat.noGoMin + boat.noGoMax) / 2, boat)).toBeCloseTo(0.5);
    expect(computeNoGoFactor(boat.noGoMax + 5, boat)).toBe(1);
  });

  it('backs the sail when apparent wind changes side before the boom crosses', () => {
    const state = createInitialGameState(DEFAULT_BOAT_ID);
    state.boatHeading = 0;
    state.boatSpeed = 2;
    state.currentSailAngle = 45;

    const environment = createInitialEnvironment();
    environment.twd = 270;
    environment.tws = 15;
    environment.currentSpeed = 0;

    const frame = sampleFrame(state, environment);

    expect(frame.hud.awaRelativeToBoat).toBeLessThan(0);
    expect(frame.render.driveForce).toBeLessThan(0);
    expect(frame.render.sailFlowState).toBe('backwinded');
  });

  it('converts apparent wind into lift-driven forward force on a reach', () => {
    const state = createInitialGameState(DEFAULT_BOAT_ID);
    state.boatHeading = 90;
    state.boatSpeed = 4;
    state.currentSailAngle = -45;

    const environment = createInitialEnvironment();
    environment.twd = 0;
    environment.tws = 15;
    environment.currentSpeed = 0;

    const frame = sampleFrame(state, environment);

    expect(frame.hud.awaRelativeToBoat).toBeLessThan(0);
    expect(frame.render.sailFlowState).toBe('attached');
    expect(frame.render.sailLiftForce).toBeGreaterThan(frame.render.sailDragForce);
    expect(frame.render.driveForce).toBeGreaterThan(0);
  });

  it('keeps lift while pinching and peaks around the best upwind angle', () => {
    const environment = createInitialEnvironment();
    environment.twd = 0;
    environment.tws = 15;
    environment.currentSpeed = 0;

    const pinchingState = createInitialGameState(DEFAULT_BOAT_ID);
    pinchingState.boatHeading = 30;
    pinchingState.boatSpeed = 0;
    pinchingState.sailTrim = 100;
    pinchingState.currentSailAngle = 0;

    const bestUpwindState = createInitialGameState(DEFAULT_BOAT_ID);
    bestUpwindState.boatHeading = 42;
    bestUpwindState.boatSpeed = 0;
    bestUpwindState.sailTrim = 100;
    bestUpwindState.currentSailAngle = 0;

    const pinchingFrame = sampleFrame(pinchingState, environment);
    const bestUpwindFrame = sampleFrame(bestUpwindState, environment);

    expect(pinchingFrame.render.sailFlowState).toBe('attached');
    expect(pinchingFrame.render.driveForce).toBeGreaterThan(0);
    expect(bestUpwindFrame.render.driveForce).toBeGreaterThan(pinchingFrame.render.driveForce);
  });

  it('shows luffing when the sail is eased too far for the apparent wind', () => {
    const trimmedState = createInitialGameState(DEFAULT_BOAT_ID);
    trimmedState.boatHeading = 90;
    trimmedState.boatSpeed = 4;
    trimmedState.currentSailAngle = -45;

    const easedState = createInitialGameState(DEFAULT_BOAT_ID);
    easedState.boatHeading = 90;
    easedState.boatSpeed = 4;
    easedState.currentSailAngle = -84;

    const environment = createInitialEnvironment();
    environment.twd = 0;
    environment.tws = 15;
    environment.currentSpeed = 0;

    const trimmedFrame = sampleFrame(trimmedState, environment);
    const easedFrame = sampleFrame(easedState, environment);

    expect(easedFrame.render.sailFlowState).toBe('luffing');
    expect(easedFrame.render.sailLiftForce).toBeLessThan(trimmedFrame.render.sailLiftForce);
  });

  it('carries momentum through head-to-wind instead of hard stopping', () => {
    const state = createInitialGameState(DEFAULT_BOAT_ID);
    state.boatHeading = 0;
    state.boatSpeed = 4;
    state.sailTrim = 90;

    const environment = createInitialEnvironment();
    environment.twd = 0;
    environment.tws = 15;
    environment.currentSpeed = 0;

    const result = stepPhysics(state, IDLE_CONTROLS, environment, 1);

    expect(result.nextState.boatSpeed).toBeGreaterThan(3.85);
    expect(result.nextState.boatSpeed).toBeLessThan(4);
  });

  it('limits rudder authority so fast tacks happen gradually', () => {
    const state = createInitialGameState(DEFAULT_BOAT_ID);
    state.boatHeading = 90;
    state.boatSpeed = 8;
    state.rudderAngle = BOAT_CONFIGS[DEFAULT_BOAT_ID].maxRudder;

    const environment = createInitialEnvironment();
    environment.tws = 0;
    environment.currentSpeed = 0;

    const result = stepPhysics(state, IDLE_CONTROLS, environment, 1);
    const headingDelta = Math.abs(computeRelativeAngle(result.nextState.boatHeading, state.boatHeading));

    expect(headingDelta).toBeGreaterThan(0.2);
    expect(headingDelta).toBeLessThan(0.5);
  });

  it('uses crew weight as a heel moment that counters windward hiking', () => {
    const centeredState = createInitialGameState(DEFAULT_BOAT_ID);
    centeredState.boatHeading = 90;
    centeredState.boatSpeed = 4;
    centeredState.currentSailAngle = -45;
    centeredState.crewWeightOffset = 0;

    const windwardCrewState = createInitialGameState(DEFAULT_BOAT_ID);
    windwardCrewState.boatHeading = 90;
    windwardCrewState.boatSpeed = 4;
    windwardCrewState.currentSailAngle = -45;
    windwardCrewState.crewWeightOffset = -100;

    const leewardCrewState = createInitialGameState(DEFAULT_BOAT_ID);
    leewardCrewState.boatHeading = 90;
    leewardCrewState.boatSpeed = 4;
    leewardCrewState.currentSailAngle = -45;
    leewardCrewState.crewWeightOffset = 100;

    const environment = createInitialEnvironment();
    environment.twd = 0;
    environment.tws = 15;
    environment.currentSpeed = 0;

    const centeredResult = stepPhysics(centeredState, IDLE_CONTROLS, environment, 1);
    const windwardResult = stepPhysics(windwardCrewState, IDLE_CONTROLS, environment, 1);
    const leewardResult = stepPhysics(leewardCrewState, IDLE_CONTROLS, environment, 1);

    expect(centeredResult.nextState.heelAngle).toBeGreaterThan(0);
    expect(windwardResult.nextState.heelAngle).toBeLessThan(centeredResult.nextState.heelAngle);
    expect(leewardResult.nextState.heelAngle).toBeGreaterThan(centeredResult.nextState.heelAngle);
  });

  it('applies stronger leeway when the centerboard is raised', () => {
    const boardDownState = createInitialGameState(DEFAULT_BOAT_ID);
    boardDownState.boatHeading = 0;
    boardDownState.boatSpeed = 3;
    boardDownState.centerboardDown = 100;

    const boardUpState = createInitialGameState(DEFAULT_BOAT_ID);
    boardUpState.boatHeading = 0;
    boardUpState.boatSpeed = 3;
    boardUpState.centerboardDown = 0;

    const environment = createInitialEnvironment();
    environment.twd = 270;
    environment.tws = 20;
    environment.currentSpeed = 0;

    const controls = {
      turnLeft: false,
      turnRight: false,
      trimIn: false,
      easeOut: false,
      crewLeft: false,
      crewRight: false,
      boardDown: false,
      boardUp: false,
    };

    const boardDownResult = stepPhysics(boardDownState, controls, environment, 1);
    const boardUpResult = stepPhysics(boardUpState, controls, environment, 1);

    const boardDownDrift = boardDownResult.nextState.boatPosition.x - boardDownState.boatPosition.x;
    const boardUpDrift = boardUpResult.nextState.boatPosition.x - boardUpState.boatPosition.x;

    expect(Math.abs(boardUpDrift)).toBeGreaterThan(Math.abs(boardDownDrift));
  });

  it('adds current drift independently from boat drive', () => {
    const stillState = createInitialGameState(DEFAULT_BOAT_ID);
    stillState.boatHeading = 0;
    stillState.boatSpeed = 0;

    const calmEnvironment = createInitialEnvironment();
    calmEnvironment.tws = 0;
    calmEnvironment.currentSpeed = 0;

    const currentEnvironment = createInitialEnvironment();
    currentEnvironment.tws = 0;
    currentEnvironment.currentSpeed = 1;
    currentEnvironment.currentDir = 90;

    const controls = {
      turnLeft: false,
      turnRight: false,
      trimIn: false,
      easeOut: false,
      crewLeft: false,
      crewRight: false,
      boardDown: false,
      boardUp: false,
    };

    const calmResult = stepPhysics(stillState, controls, calmEnvironment, 1);
    const currentResult = stepPhysics(stillState, controls, currentEnvironment, 1);
    const driftDifference = currentResult.nextState.boatPosition.x - calmResult.nextState.boatPosition.x;

    expect(driftDifference).toBeCloseTo(0.3);
  });

  it('clamps rudder angle and world bounds', () => {
    const state = createInitialGameState(DEFAULT_BOAT_ID);
    state.rudderAngle = 34.8;
    state.boatHeading = 315;
    state.boatSpeed = 8;
    state.boatPosition = { x: 1, y: 1 };

    const environment = createInitialEnvironment();
    environment.tws = 0;
    environment.currentSpeed = 0;

    const result = stepPhysics(
      state,
      {
        turnLeft: true,
        turnRight: false,
        trimIn: false,
        easeOut: false,
        crewLeft: false,
        crewRight: false,
        boardDown: false,
        boardUp: false,
      },
      environment,
      10,
    );

    expect(result.nextState.rudderAngle).toBeLessThanOrEqual(BOAT_CONFIGS[DEFAULT_BOAT_ID].maxRudder);
    expect(result.nextState.boatPosition.x).toBeGreaterThanOrEqual(0);
    expect(result.nextState.boatPosition.y).toBeGreaterThanOrEqual(0);
    expect(result.nextState.boatPosition.x).toBeLessThanOrEqual(WORLD_WIDTH);
    expect(result.nextState.boatPosition.y).toBeLessThanOrEqual(WORLD_HEIGHT);
  });
});
