import { createArduinoLesson } from "../../shared/lessonUIFactory.js";
import { lessonData } from "./lessonData.js";
import { simulator } from "./lessonSimulator.js";

export const servo90Lesson = createArduinoLesson({ lessonData, simulator });
