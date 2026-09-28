import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, View, Text, StyleSheet } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as tf from "@tensorflow/tfjs";
import jpeg from "jpeg-js";
import { toByteArray } from "base64-js";

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


const Stack = createNativeStackNavigator();


// ======================================================
// CONFIGURACIÓN
// ======================================================

const MODEL_BASE_URL =
  "https://teachablemachine.withgoogle.com/models/jFaZibuwF/";

const MODEL_URL =
  `${MODEL_BASE_URL}model.json`;

const METADATA_URL =
  `${MODEL_BASE_URL}metadata.json`;

const ESP32_IP_KEY = "ESP32_IP";
const MODEL_URL_KEY = "MODEL_URL";
const AUTO_SEND_KEY = "AUTO_SEND";


// ======================================================
// APP
// ======================================================

export default function App() {

  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);

  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState("");

  const [esp32Ip, setEsp32Ip] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [detectedClass, setDetectedClass] = useState("");
  const [confidence, setConfidence] = useState(0);

  const [logs, setLogs] = useState([]);

  const [autoSend, setAutoSend] = useState(false);


  // ======================================================
  // LOG
  // ======================================================

  const addLog = (message) => {

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

    loadSettings();

  }, []);


  const loadSettings = async () => {

    try {

      const savedIp =
        await AsyncStorage.getItem(ESP32_IP_KEY);

      const savedModel =
        await AsyncStorage.getItem(MODEL_URL_KEY);

      const savedAutoSend =
        await AsyncStorage.getItem(AUTO_SEND_KEY);


      if (savedIp) {
        setEsp32Ip(savedIp);
      }

      if (savedAutoSend !== null) {
        setAutoSend(savedAutoSend === "true");
      }


      addLog(
        `IP ESP32: ${savedIp || "no configurada"}`
      );

      addLog(
        `Modelo: ${savedModel || MODEL_URL}`
      );

    } catch (error) {

      console.log(
        "Error cargando configuración:",
        error
      );

    }

  };


  // ======================================================
  // CARGAR MODELO
  // ======================================================

  useEffect(() => {

    loadModel();

  }, []);


  const loadModel = async () => {

    try {

      setModelLoading(true);
      setModelError("");

      addLog("Iniciando TensorFlow.js...");

      const fetchModelResource = (url, options) =>
        fetch(url, options);

      tf.env().setPlatform("react-native", {
        fetch: fetchModelResource,
        now: () => Date.now(),
        encode: (text) => {
          const encoded = unescape(encodeURIComponent(text));
          return Uint8Array.from(encoded, (character) =>
            character.charCodeAt(0)
          );
        },
        decode: (bytes) => {
          const encoded = Array.from(bytes, (byte) =>
            `%${byte.toString(16).padStart(2, "0")}`
          ).join("");
          return decodeURIComponent(encoded);
        },
        isTypedArray: (value) =>
          value instanceof Float32Array ||
          value instanceof Int32Array ||
          value instanceof Uint8Array ||
          value instanceof Uint8ClampedArray,
      });

      // Usamos CPU porque no estamos utilizando
      // @tensorflow/tfjs-react-native.
      await tf.setBackend("cpu");
      await tf.ready();

      addLog(
        `Backend TensorFlow: ${tf.getBackend()}`
      );


      addLog("Cargando model.json...");

      const loadedModel =
        await tf.loadLayersModel(
          tf.io.http(MODEL_URL, {
            fetchFunc: fetchModelResource,
          })
        );


      addLog("Modelo cargado correctamente.");


      // --------------------------------------------------
      // METADATA
      // --------------------------------------------------

      addLog("Cargando metadata.json...");

      const metadataResponse =
        await fetch(METADATA_URL);

      if (!metadataResponse.ok) {

        throw new Error(
          `No se pudo cargar metadata.json (${metadataResponse.status})`
        );

      }

      const metadata =
        await metadataResponse.json();


      // Teachable Machine normalmente guarda:
      // metadata.labels
      //
      // pero también dejamos soporte para:
      // metadata.classes

      const loadedLabels =
        metadata.labels ||
        metadata.classes ||
        [];


      if (!loadedLabels.length) {

        throw new Error(
          "No se encontraron las etiquetas del modelo en metadata.json"
        );

      }


      setModel(loadedModel);
      setLabels(loadedLabels);


      addLog(
        `Clases encontradas: ${loadedLabels.join(", ")}`
      );


      // Mostrar forma de entrada
      if (loadedModel.inputs?.[0]?.shape) {

        addLog(
          `Entrada del modelo: ${JSON.stringify(
            loadedModel.inputs[0].shape
          )}`
        );

      }


      setModelLoading(false);

    } catch (error) {

      console.error(
        "Error cargando modelo:",
        error
      );

      setModelError(
        error?.message ||
        "No se pudo cargar el modelo."
      );

      setModelLoading(false);

      addLog(
        `ERROR MODELO: ${error?.message}`
      );

    }

  };


  // ======================================================
  // CONVERTIR FOTO A TENSOR
  // ======================================================

  const imageToTensor = (base64) => {

    if (!base64) {

      throw new Error(
        "La foto no contiene base64."
      );

    }


    // --------------------------------------------------
    // Base64 -> bytes
    // --------------------------------------------------

    const imageBytes =
      toByteArray(base64);


    // --------------------------------------------------
    // JPEG -> RGB
    // --------------------------------------------------

    const decoded =
      jpeg.decode(imageBytes, {
        useTArray: true,
      });


    const {
      width,
      height,
      data,
    } = decoded;


    if (!width || !height || !data) {

      throw new Error(
        "No se pudo decodificar la imagen JPEG."
      );

    }


    // --------------------------------------------------
    // Tamaño esperado por Teachable Machine
    // --------------------------------------------------

    const size = 224;


    // --------------------------------------------------
    // Crop cuadrado centrado
    // --------------------------------------------------

    const cropSize =
      Math.min(width, height);

    const offsetX =
      Math.floor((width - cropSize) / 2);

    const offsetY =
      Math.floor((height - cropSize) / 2);


    const rgb = new Float32Array(
      size * size * 3
    );


    // --------------------------------------------------
    // Resize + normalización
    //
    // Teachable Machine normalmente utiliza:
    // pixel / 127.5 - 1
    // --------------------------------------------------

    let index = 0;


    for (let y = 0; y < size; y++) {

      const sourceY =
        Math.min(
          cropSize - 1,
          Math.floor(
            (y / size) * cropSize
          )
        );


      for (let x = 0; x < size; x++) {

        const sourceX =
          Math.min(
            cropSize - 1,
            Math.floor(
              (x / size) * cropSize
            )
          );


        const pixelIndex =
          (
            (sourceY + offsetY) * width +
            (sourceX + offsetX)
          ) * 4;


        const r =
          data[pixelIndex];

        const g =
          data[pixelIndex + 1];

        const b =
          data[pixelIndex + 2];


        rgb[index++] =
          r / 127.5 - 1;

        rgb[index++] =
          g / 127.5 - 1;

        rgb[index++] =
          b / 127.5 - 1;

      }

    }


    // --------------------------------------------------
    // Tensor [1, 224, 224, 3]
    // --------------------------------------------------

    return tf.tensor4d(
      rgb,
      [1, size, size, 3]
    );

  };


  // ======================================================
  // PREDICCIÓN
  // ======================================================

  const predictImage = async (photo) => {

    if (!model) {

      throw new Error(
        "El modelo todavía no está cargado."
      );

    }


    if (!photo?.base64) {

      throw new Error(
        "La cámara no devolvió la imagen en base64."
      );

    }


    addLog("Preparando imagen...");


    const inputTensor =
      imageToTensor(photo.base64);


    try {

      addLog("Ejecutando predicción...");


      const prediction =
        model.predict(inputTensor);


      // Algunos modelos devuelven Tensor,
      // otros pueden devolver un array.

      const outputTensor =
        Array.isArray(prediction)
          ? prediction[0]
          : prediction;


      const probabilities =
        await outputTensor.data();


      let bestIndex = 0;
      let bestProbability = probabilities[0];


      for (
        let i = 1;
        i < probabilities.length;
        i++
      ) {

        if (
          probabilities[i] >
          bestProbability
        ) {

          bestProbability =
            probabilities[i];

          bestIndex = i;

        }

      }


      const className =
        labels[bestIndex] ||
        `Clase ${bestIndex}`;


      const percentage =
        bestProbability * 100;


      addLog(
        `Predicción: ${className} (${percentage.toFixed(2)}%)`
      );


      setDetectedClass(className);
      setConfidence(percentage);


      // Liberar tensores
      inputTensor.dispose();

      if (
        outputTensor &&
        typeof outputTensor.dispose === "function"
      ) {

        outputTensor.dispose();

      }


      return {
        className,
        confidence: percentage,
      };

    } catch (error) {

      inputTensor.dispose();

      throw error;

    }

  };


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
          await predictImage(photo);


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


      try {

        const safeClass =
          encodeURIComponent(
            className
          );


        const numericPercentage =
          Number(porcentaje);


        const url =
          `http://${esp32Ip}/enviar` +
          `?clase=${safeClass}` +
          `&porcentaje=${numericPercentage.toFixed(2)}`;


        addLog(
          `Enviando al ESP32: ${className} / ${numericPercentage.toFixed(2)}%`
        );


        const response =
          await fetch(url, {
            method: "GET",
          });


        const text =
          await response.text();


        if (!response.ok) {

          throw new Error(
            `ESP32 respondió ${response.status}: ${text}`
          );

        }


        addLog(
          `ESP32 respondió: ${text}`
        );


        Alert.alert(
          "ESP32",
          "Datos enviados correctamente."
        );


      } catch (error) {

        console.error(
          "Error ESP32:",
          error
        );


        addLog(
          `ERROR ESP32: ${error?.message}`
        );


        Alert.alert(
          "Error ESP32",
          error?.message ||
          "No se pudo conectar con el ESP32."
        );

      }

    };


  // ======================================================
  // GUARDAR CONFIGURACIÓN
  // ======================================================

  const saveSettings = async (
    newIp,
    newAutoSend
  ) => {

    try {

      await AsyncStorage.setItem(
        ESP32_IP_KEY,
        newIp || ""
      );


      await AsyncStorage.setItem(
        MODEL_URL_KEY,
        MODEL_BASE_URL
      );


      await AsyncStorage.setItem(
        AUTO_SEND_KEY,
        String(!!newAutoSend)
      );


      setEsp32Ip(newIp || "");
      setAutoSend(!!newAutoSend);


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


  // ======================================================
  // PANTALLA DE CARGA
  // ======================================================

  if (modelLoading) {

    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
        />

        <Text style={styles.loadingText}>
          Cargando modelo...
        </Text>

        <Text style={styles.loadingSubtext}>
          Teachable Machine
        </Text>

      </View>
    );

  }


  // ======================================================
  // NAVEGACIÓN
  // ======================================================

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Home"
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
                isProcessing
              }

              detectedClass={
                detectedClass
              }

              confidence={
                confidence
              }

              logs={
                logs
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

              modelUrl={
                MODEL_BASE_URL
              }

              onSaveSettings={
                saveSettings
              }

            />

          )}

        </Stack.Screen>

      </Stack.Navigator>

    </NavigationContainer>

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