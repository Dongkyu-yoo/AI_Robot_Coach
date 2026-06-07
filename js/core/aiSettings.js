const AI_SETTINGS_KEY = "robotCoach:aiSettings";

const defaultAiSettings = {
  apiEnabled: true
};

export function getAiSettings() {
  try {
    return {
      ...defaultAiSettings,
      ...(JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || "{}"))
    };
  } catch {
    return { ...defaultAiSettings };
  }
}

export function saveAiSettings(settings = {}) {
  const nextSettings = {
    ...getAiSettings(),
    ...settings
  };
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(nextSettings));
  return nextSettings;
}

export function isApiEnabled() {
  return true;
}
