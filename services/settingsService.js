import AsyncStorage from "@react-native-async-storage/async-storage";

const ESP32_IP_KEY = "ESP32_IP";
const MODEL_URL_KEY = "MODEL_URL";
const AUTO_SEND_KEY = "AUTO_SEND";
const LOGS_ENABLED_KEY = "LOGS_ENABLED";

export const DEFAULT_MODEL_URL =
  "https://teachablemachine.withgoogle.com/models/jFaZibuwF/";

export async function loadSettings() {
  const configuration = {
    ip: "",
    autoSend: false,
    logsEnabled: true,
    url: DEFAULT_MODEL_URL,
  };

  try {
    const [savedIp, savedModel, savedAutoSend, savedLogsEnabled] =
      await Promise.all([
        AsyncStorage.getItem(ESP32_IP_KEY),
        AsyncStorage.getItem(MODEL_URL_KEY),
        AsyncStorage.getItem(AUTO_SEND_KEY),
        AsyncStorage.getItem(LOGS_ENABLED_KEY),
      ]);

    configuration.ip = savedIp || "";
    configuration.autoSend = savedAutoSend === "true";
    configuration.logsEnabled = savedLogsEnabled !== "false";
    configuration.url = savedModel || DEFAULT_MODEL_URL;
  } catch (error) {
    console.log("Error cargando configuración:", error);
  }

  return configuration;
}

export async function saveSettings({ ip, autoSend, logsEnabled = true, url }) {
  await Promise.all([
    AsyncStorage.setItem(ESP32_IP_KEY, ip || ""),
    AsyncStorage.setItem(MODEL_URL_KEY, url.trim()),
    AsyncStorage.setItem(AUTO_SEND_KEY, String(!!autoSend)),
    AsyncStorage.setItem(LOGS_ENABLED_KEY, String(!!logsEnabled)),
  ]);
}

export async function saveAutoSendSetting(autoSend) {
  await AsyncStorage.setItem(AUTO_SEND_KEY, String(!!autoSend));
}