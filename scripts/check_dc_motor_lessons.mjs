import { readFile } from "node:fs/promises";

async function importSource(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const { createPracticeLessonData, evaluateMission } = await importSource(
  "../js/modules/arduino/shared/practiceConfig.js"
);
const { lessonData: spin } = await importSource("../js/modules/arduino/dcmotor/dc-spin/lessonData.js");
const { lessonData: direction } = await importSource("../js/modules/arduino/dcmotor/dc-direction/lessonData.js");
const { lessonData: speed } = await importSource("../js/modules/arduino/dcmotor/dc-speed/lessonData.js");
const { lessonData: drive } = await importSource("../js/modules/arduino/dcmotor/two-wheel-drive/lessonData.js");
const { lessonData: turn } = await importSource("../js/modules/arduino/dcmotor/two-wheel-turn/lessonData.js");

const solutions = new Map([
  [spin.id, `#include <AFMotor.h>
AF_DCMotor motor(1);
void setup() { motor.setSpeed(180); }
void loop() {
  motor.run(FORWARD);
  delay(3000);
  motor.run(RELEASE);
  delay(1000);
}`],
  [direction.id, `#include <AFMotor.h>
AF_DCMotor motor(1);
void setup() { motor.setSpeed(180); }
void loop() {
  motor.run(FORWARD);
  delay(2000);
  motor.run(RELEASE);
  delay(1000);
  motor.run(BACKWARD);
  delay(2000);
  motor.run(RELEASE);
  delay(1000);
}`],
  [speed.id, `#include <AFMotor.h>
AF_DCMotor motor(1);
void setup() {}
void loop() {
  motor.run(FORWARD);
  motor.setSpeed(80);
  delay(2000);
  motor.setSpeed(150);
  delay(2000);
  motor.setSpeed(220);
  delay(2000);
  motor.run(RELEASE);
  delay(1000);
}`],
  [drive.id, `#include <AFMotor.h>
AF_DCMotor leftMotor(1);
AF_DCMotor rightMotor(2);
void setMotorSpeed(int speedValue) {
  leftMotor.setSpeed(speedValue);
  rightMotor.setSpeed(speedValue);
}
void goForward() {
  leftMotor.run(FORWARD);
  rightMotor.run(FORWARD);
}
void goBackward() {
  leftMotor.run(BACKWARD);
  rightMotor.run(BACKWARD);
}
void stopMotors() {
  leftMotor.run(RELEASE);
  rightMotor.run(RELEASE);
}
void setup() { setMotorSpeed(180); }
void loop() {
  goForward();
  delay(2000);
  stopMotors();
  delay(1000);
  goBackward();
  delay(2000);
  stopMotors();
}`],
  [turn.id, `#include <AFMotor.h>
AF_DCMotor leftMotor(1);
AF_DCMotor rightMotor(2);
void goForward() {
  leftMotor.run(FORWARD);
  rightMotor.run(FORWARD);
}
void turnLeft() {
  leftMotor.run(RELEASE);
  rightMotor.run(FORWARD);
}
void turnRight() {
  leftMotor.run(FORWARD);
  rightMotor.run(RELEASE);
}
void stopMotors() {
  leftMotor.run(RELEASE);
  rightMotor.run(RELEASE);
}
void setup() {
  leftMotor.setSpeed(180);
  rightMotor.setSpeed(180);
}
void loop() {
  goForward();
  delay(1500);
  turnLeft();
  delay(700);
  goForward();
  delay(1500);
  turnRight();
  delay(700);
  stopMotors();
}`]
]);

const lessons = [spin, direction, speed, drive, turn];
let failed = false;

for (const lesson of lessons) {
  const active = createPracticeLessonData(lesson);
  const starterResult = evaluateMission(active.starterCode, lesson);
  const referenceResult = evaluateMission(active.referenceCode, lesson);
  const solutionResult = evaluateMission(solutions.get(lesson.id), lesson);
  const imageMatches = active.circuit.imageBase.endsWith(
    `lesson3_${lessons.indexOf(lesson) + 1}`
  );
  const hasCustomFlow = active.practice.flow?.length === 3;

  const checks = {
    starterFails: !starterResult.missionPassed,
    referenceFails: !referenceResult.missionPassed,
    solutionPasses: solutionResult.missionPassed,
    imageMatches,
    hasCustomFlow
  };
  const passed = Object.values(checks).every(Boolean);
  failed ||= !passed;
  console.log(`${passed ? "PASS" : "FAIL"} ${lesson.id}`, checks);
  if (!solutionResult.missionPassed) console.log(solutionResult.issues);
}

if (failed) process.exit(1);
