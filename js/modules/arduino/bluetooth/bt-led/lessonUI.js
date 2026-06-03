import { createArduinoLesson } from "../../shared/lessonUIFactory.js";
import { lessonData } from "./lessonData.js";
import { simulator } from "./lessonSimulator.js";

export const bluetoothLedLesson = createArduinoLesson({ lessonData, simulator });
