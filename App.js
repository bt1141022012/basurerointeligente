import React, { useEffect, useState } from "react";
import { Alert, View, Text, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import HomeScreen from "./components/HomeScreen";
import CameraScreen from "./components/CameraScreen";
import SettingsScreen from "./components/SettingsScreen";
import TestESP32Screen from "./components/TestESP32Screen";
import ESP32ViewerScreen from "./components/ESP32ViewerScreen";
import {
  checkESP32,
  sendToESP32 as sendESP32Request,
} from "./services/esp32Service";
import {
  deleteDownloadedModel as deleteDownloadedModelService,
  downloadModel as downloadModelService,
  getDownloadedModelInfo,
  loadDownloadedModel,
  predictImage,
} from "./services/modelService";
import {
  DEFAULT_MODEL_URL,
  loadSettings as loadSettingsService,
  saveAutoSendSetting,
  saveSettings as saveSettingsService,
} from "./services/settingsService";


const Stack = createNativeStackNavigator();


// ======================================================
// CONFIGURACIÓN
// ======================================================

// ======================================================
// APP
// ======================================================

export default function App() {

  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);

  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [downloadedModelInfo, setDownloadedModelInfo] = useState(null);

  const [esp32Ip, setEsp32Ip] = useState("");
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL);

  const [isProcessing, setIsProcessing] = useState(false);

  const [detectedClass, setDetectedClass] = useState("");
  const [confidence, setConfidence] = useState(0);

  const [logs, setLogs] = useState([]);
  const [logsEnabled, setLogsEnabled] = useState(true);
  const logsEnabledRef = React.useRef(true);

  const [autoSend, setAutoSend] = useState(false);


  // ======================================================
  // LOG
  // ======================================================

  const addLog = (message) => {
    if (!logsEnabledRef.current) {
      return;
    }

    console.log(message);

    setLogs((previous) => [
      ...previous,
      {
        id: Date.now().toString() + Math.random(),
        message,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };


  // ======================================================
  // CARGAR CONFIGURACIÓN
  // ======================================================

  useEffect(() => {
    const initialize = async () => {
      await loadSettings();
      const savedModelInfo = await getDownloadedModelInfo();
      setDownloadedModelInfo(savedModelInfo);

      if (savedModelInfo?.labels?.length) {
        await loadSavedModel();
      }
    };

    initialize();
  }, []);


  const loadSettings = async () => {
    const configuration = await loadSettingsService();
    logsEnabledRef.current = configuration.logsEnabled;
    setLogsEnabled(configuration.logsEnabled);
    setEsp32Ip(configuration.ip);
    setAutoSend(configuration.autoSend);
    setModelUrl(configuration.url);
    addLog(`IP ESP32: ${configuration.ip || "no configurada"}`);
    addLog(`URL del modelo: ${configuration.url}`);
    return configuration;
  };


  // ======================================================
  // CARGAR MODELO
  // ======================================================

  const runModelAction = async (loadOperation) => {
    setModelLoading(true);
    setModelError("");
    try {
      const loaded = await loadOperation();
      setModel(loaded.model);
      setLabels(loaded.labels);
      if (loaded.modelInfo) {
        setDownloadedModelInfo(loaded.modelInfo);
      }
      setModelError("");
      return true;
    } catch (error) {
      console.error(
        "Error cargando modelo:",
        error
      );

      setModelError(
        error?.message || "No se pudo cargar el modelo."
      );
      addLog(`ERROR: ${error?.message || "No se pudo cargar el modelo."}`);
      Alert.alert(
        "Modelo",
        error?.message || "No se pudo cargar el modelo."
      );
      return false;
    } finally {
      setModelLoading(false);
    }
  };

  const downloadConfiguredModel = () =>
    runModelAction(() => downloadModelService(modelUrl, addLog));

  const loadSavedModel = async () => {
    const loaded = await runModelAction(() => loadDownloadedModel(addLog));
    if (!loaded) {
      setDownloadedModelInfo(await getDownloadedModelInfo());
    }
    return loaded;
  };

  const removeDownloadedModel = async () => {
    setModelLoading(true);
    setModelError("");
    try {
      await deleteDownloadedModelService();
      model?.dispose();
      setModel(null);
      setLabels([]);
      setDownloadedModelInfo(null);
      setDetectedClass("");
      setConfidence(0);
      addLog("Modelo descargado eliminado del dispositivo.");
      Alert.alert("Modelo", "El modelo descargado se eliminó del dispositivo.");
    } catch (error) {
      console.error("Error eliminando el modelo descargado:", error);
      const message =
        error?.message || "No se pudo eliminar el modelo descargado.";
      setModelError(message);
      addLog(`ERROR: ${message}`);
      Alert.alert("Error", message);
    } finally {
      setModelLoading(false);
    }
  };


  // ======================================================
  // PREDICCIÓN
  // ======================================================

  // ======================================================
  // CAPTURAR + ANALIZAR
  // ======================================================

  const captureAndSendToModel =
    async (photo) => {

      if (isProcessing) {
        return;
      }


      try {

        setIsProcessing(true);


        if (!model) {

          Alert.alert(
            "Modelo no disponible",
            "Espera a que termine de cargar el modelo."
          );

          return;

        }


        addLog(
          "Foto capturada. Analizando..."
        );


        const result =
          await predictImage(model, labels, photo, addLog);

        setDetectedClass(result.className);
        setConfidence(result.confidence);


        // ------------------------------------------------
        // ENVÍO AUTOMÁTICO AL ESP32
        // ------------------------------------------------

        if (
          autoSend &&
          esp32Ip
        ) {

          await sendToESP32(
            result.className,
            result.confidence
          );

        }


      } catch (error) {

        console.error(
          "Error analizando:",
          error
        );


        addLog(
          `ERROR: ${error?.message}`
        );


        Alert.alert(
          "Error",
          error?.message ||
          "No se pudo analizar la imagen."
        );

      } finally {

        setIsProcessing(false);

      }

    };


  // ======================================================
  // ENVIAR AL ESP32
  // ======================================================

  const sendToESP32 =
    async (
      className = detectedClass,
      porcentaje = confidence
    ) => {

      if (!esp32Ip) {

        Alert.alert(
          "ESP32",
          "Primero configura la IP del ESP32."
        );

        return;

      }


      if (!className) {
        Alert.alert(
          "ESP32",
          "Primero realiza una predicción o usa Test ESP32."
        );

        return;
      }


      let sendStartedAt = null;
      try {

        const numericPercentage = Number(porcentaje);
        addLog(
          `Enviando al ESP32: ${className} / ${numericPercentage.toFixed(2)}%`
        );

        sendStartedAt = Date.now();
        const response = await sendESP32Request(
          esp32Ip,
          className,
          numericPercentage
        );

        addLog(`Tiempo de respuesta del ESP32: ${Date.now() - sendStartedAt} ms`);
        addLog(`ESP32 respondió: ${response.text}`);


       /* Alert.alert(
          "ESP32",
          "Datos enviados correctamente."
        );*/


      } catch (error) {

        console.error(
          "Error ESP32:",
          error
        );

        if (sendStartedAt !== null) {
          addLog(`Tiempo hasta error del ESP32: ${Date.now() - sendStartedAt} ms`);
        }


        addLog(
          `ERROR ESP32: ${error?.message}`
        );


       /* Alert.alert(
          "Error ESP32",
          error?.message ||
          "No se pudo conectar con el ESP32."
        );*/

      }

    };

  const pingESP32 = async () => {
    if (!esp32Ip) {
      Alert.alert("ESP32", "Primero configura la IP del ESP32.");
      return;
    }

    try {
      const response = await checkESP32(esp32Ip);
      addLog(`ESP32 disponible: ${response}`);
      Alert.alert("ESP32", "Conexión correcta.");
    } catch (error) {
      addLog(`ERROR ESP32: ${error?.message}`);
      Alert.alert(
        "Error ESP32",
        error?.message || "No se pudo conectar con el ESP32."
      );
    }
  };


  // ======================================================
  // GUARDAR CONFIGURACIÓN
  // ======================================================

  const saveSettings = async (
    newIp,
    newAutoSend,
    newModelUrl,
    newLogsEnabled
  ) => {

    try {
      if (!newModelUrl.trim()) {
        Alert.alert("Modelo", "Ingresa la URL base del modelo.");
        return;
      }

      const modelConfigurationChanged = newModelUrl.trim() !== modelUrl.trim();

      await saveSettingsService({
        ip: newIp,
        autoSend: newAutoSend,
        logsEnabled: newLogsEnabled,
        url: newModelUrl,
      });


      setEsp32Ip(newIp || "");
      setAutoSend(!!newAutoSend);
      logsEnabledRef.current = !!newLogsEnabled;
      setLogsEnabled(!!newLogsEnabled);
      setModelUrl(newModelUrl.trim());
      if (modelConfigurationChanged) {
        setModel(null);
        setLabels([]);
        setModelError("");
      }


      addLog(
        "Configuración guardada."
      );


    } catch (error) {

      console.error(
        "Error guardando configuración:",
        error
      );

    }

  };


  // ======================================================
  // LIMPIAR LOGS
  // ======================================================

  const clearLogs = () => {
    setLogs([]);
  };

  const updateLogsEnabled = (enabled) => {
    logsEnabledRef.current = enabled;
    setLogsEnabled(enabled);
  };

  const updateAutoSend = (enabled) => {
    setAutoSend(enabled);
    saveAutoSendSetting(enabled).catch((error) => {
      console.error("Error guardando envío automático:", error);
    });
  };


  // ======================================================
  // NAVEGACIÓN
  // ======================================================

  return (

    <SafeAreaProvider>
    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          headerTitleStyle: { color: "#f8fafc" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      >

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Inicio",
          }}
        />


        <Stack.Screen
          name="Camera"
          options={{
            title: "Cámara",
          }}
        >

          {(props) => (

            <CameraScreen
              {...props}

              esp32Status={
                esp32Ip
                  ? `ESP32: ${esp32Ip}`
                  : "ESP32 no configurado"
              }

              isProcessing={
                isProcessing || modelLoading
              }

              autoSend={autoSend}

              modelReady={Boolean(model)}

              detectedClass={
                detectedClass
              }

              confidence={
                confidence
              }

              logs={
                logs
              }

              onAddLog={
                addLog
              }

              onClearLogs={
                clearLogs
              }

              onCaptureAndSend={
                captureAndSendToModel
              }

              onSendToESP32={
                () =>
                  sendToESP32(
                    detectedClass,
                    confidence
                  )
              }

            />

          )}

        </Stack.Screen>


        <Stack.Screen
          name="TestESP32"
          options={{
            title: "Test ESP32",
          }}
        >
          {(props) => (
            <TestESP32Screen
              {...props}
              classes={labels}
              esp32Ip={esp32Ip}
              onSendTest={(className, percentage) =>
                sendToESP32(className, percentage)
              }
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="ESP32Viewer"
          options={{
            title: "Sitio del ESP32",
          }}
        >
          {(props) => <ESP32ViewerScreen {...props} esp32Ip={esp32Ip} />}
        </Stack.Screen>


        <Stack.Screen
          name="Settings"
          options={{
            title: "Configuración",
          }}
        >

          {(props) => (

            <SettingsScreen
              {...props}

              esp32Ip={
                esp32Ip
              }

              setEsp32Ip={
                setEsp32Ip
              }

              autoSend={
                autoSend
              }

              logsEnabled={
                logsEnabled
              }

              downloadedModelInfo={
                downloadedModelInfo
              }

              isModelLoading={
                modelLoading
              }

              modelReady={
                Boolean(model)
              }

              modelError={
                modelError
              }

              onDownloadModel={
                downloadConfiguredModel
              }

              onLoadDownloadedModel={
                loadSavedModel
              }

              onDeleteDownloadedModel={
                removeDownloadedModel
              }

              setLogsEnabled={
                updateLogsEnabled
              }

              setAutoSend={
                updateAutoSend
              }

              modelUrl={
                modelUrl
              }

              setModelUrl={
                setModelUrl
              }

              onSaveSettings={
                saveSettings
              }

              pingESP32={
                pingESP32
              }

            />

          )}

        </Stack.Screen>

      </Stack.Navigator>

    </NavigationContainer>
    </SafeAreaProvider>

  );

}


// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "bold",
  },

  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },

});