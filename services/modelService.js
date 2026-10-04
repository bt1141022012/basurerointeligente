import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
 import { fromByteArray, toByteArray } from "base64-js";
import jpeg from "jpeg-js";

const OFFLINE_MODEL_PATH = "basurero-inteligente-offline";
const OFFLINE_MODEL_INFO_KEY = "BASURERO_OFFLINE_MODEL_INFO";
const OFFLINE_MODEL_DIRECTORY = "basurero-inteligente-model";

function getOfflineModelFiles() {
  if (!FileSystem.documentDirectory) {
    throw new Error("No se encontró el directorio de documentos del teléfono.");
  }

  const directory = `${FileSystem.documentDirectory}${OFFLINE_MODEL_DIRECTORY}/`;
  return {
    directory,
    model: `${directory}model.json`,
    weights: `${directory}weights.bin`,
  };
}

function createFileSystemModelIO() {
  return {
    async save(modelArtifacts) {
      if (
        !modelArtifacts.modelTopology ||
        modelArtifacts.modelTopology instanceof ArrayBuffer
      ) {
        throw new Error("El modelo debe tener una topología JSON para guardarse.");
      }
      if (!modelArtifacts.weightData || Array.isArray(modelArtifacts.weightData)) {
        throw new Error("No se encontraron los pesos del modelo para guardarlos.");
      }

      const files = getOfflineModelFiles();
      const directoryInfo = await FileSystem.getInfoAsync(files.directory);
      if (!directoryInfo.exists) {
        await FileSystem.makeDirectoryAsync(files.directory, {
          intermediates: true,
        });
      }

      const { weightData, ...modelWithoutWeights } = modelArtifacts;
      const encodedWeights = fromByteArray(new Uint8Array(weightData));
      await FileSystem.writeAsStringAsync(files.weights, encodedWeights, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(
        files.model,
        JSON.stringify(modelWithoutWeights)
      );

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON",
          weightDataBytes: weightData.byteLength,
        },
      };
    },

    async load() {
      const files = getOfflineModelFiles();
      const modelFile = await FileSystem.getInfoAsync(files.model);
      if (!modelFile.exists) {
        throw new Error("No se encontró el archivo del modelo en el teléfono.");
      }

      const [savedModel, encodedWeights] = await Promise.all([
        FileSystem.readAsStringAsync(files.model),
        FileSystem.readAsStringAsync(files.weights, {
          encoding: FileSystem.EncodingType.Base64,
        }),
      ]);
      const modelArtifacts = JSON.parse(savedModel);
      modelArtifacts.weightData = toByteArray(encodedWeights).buffer;
      return modelArtifacts;
    },
  };
}

function configureTensorFlow() {
  return tf;
}

async function initializeTensorFlow(addLog) {
  const tensorflow = configureTensorFlow();

  addLog("Iniciando TensorFlow.js...");
  try {
    await tensorflow.setBackend("rn-webgl");
    addLog("WebGL disponible");
  } catch (error) {
    addLog("WebGL no disponible; usando CPU.");
    await tensorflow.setBackend("cpu");
  }
  await tensorflow.ready();
  addLog(`Backend TensorFlow: ${tensorflow.getBackend()}`);
  return tensorflow;
}

async function loadRemoteModel(selectedUrl, addLog) {
  const tensorflow = await initializeTensorFlow(addLog);
  const baseUrl = selectedUrl.trim().replace(/\/+$/, "");
  const modelJsonUrl = baseUrl.endsWith("/model.json")
    ? baseUrl
    : `${baseUrl}/model.json`;
  const metadataUrl = baseUrl.endsWith("/model.json")
    ? baseUrl.replace(/model\.json$/, "metadata.json")
    : `${baseUrl}/metadata.json`;

  addLog("Descargando modelo remoto...");
  const loadedModel = await tensorflow.loadLayersModel(
    tensorflow.io.http(modelJsonUrl, {
      fetchFunc: (url, options) => fetch(url, options),
    })
  );

  const metadataResponse = await fetch(metadataUrl);
  if (!metadataResponse.ok) {
    throw new Error(
      `No se pudo cargar metadata.json (${metadataResponse.status})`
    );
  }
  const metadata = await metadataResponse.json();

  const labels = metadata.labels || metadata.classes || [];
  if (!labels.length) {
    throw new Error("No se encontraron las etiquetas del modelo en metadata.json");
  }

  addLog("Modelo cargado correctamente.");
  addLog(`Clases encontradas: ${labels.join(", ")}`);

  if (loadedModel.inputs?.[0]?.shape) {
    addLog(`Entrada del modelo: ${JSON.stringify(loadedModel.inputs[0].shape)}`);
  }

  return { model: loadedModel, labels };
}

export async function downloadModel(selectedUrl, addLog) {
  const loaded = await loadRemoteModel(selectedUrl, addLog);
  addLog("Guardando modelo para uso sin conexión...");
  await loaded.model.save(createFileSystemModelIO());

  const modelInfo = {
    labels: loaded.labels,
    sourceUrl: selectedUrl.trim(),
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(OFFLINE_MODEL_INFO_KEY, JSON.stringify(modelInfo));
  addLog("Modelo guardado en el dispositivo.");

  return { ...loaded, modelInfo };
}

export async function getDownloadedModelInfo() {
  try {
    const savedInfo = await AsyncStorage.getItem(OFFLINE_MODEL_INFO_KEY);
    return savedInfo ? JSON.parse(savedInfo) : null;
  } catch (error) {
    return null;
  }
}

export async function deleteDownloadedModel() {
  const files = getOfflineModelFiles();
  await FileSystem.deleteAsync(files.directory, { idempotent: true });
  await AsyncStorage.multiRemove([
    OFFLINE_MODEL_INFO_KEY,
    `tensorflowjs_models/${OFFLINE_MODEL_PATH}/info`,
    `tensorflowjs_models/${OFFLINE_MODEL_PATH}/model_without_weight`,
    `tensorflowjs_models/${OFFLINE_MODEL_PATH}/weight_data`,
  ]);
}

export async function loadDownloadedModel(addLog) {
  const tensorflow = await initializeTensorFlow(addLog);
  const modelInfo = await getDownloadedModelInfo();
  if (!modelInfo?.labels?.length) {
    throw new Error("No hay un modelo descargado en este dispositivo.");
  }

  addLog("Cargando modelo guardado en el dispositivo...");
  const files = getOfflineModelFiles();
  const modelFile = await FileSystem.getInfoAsync(files.model);
  if (!modelFile.exists) {
    await AsyncStorage.multiRemove([
      OFFLINE_MODEL_INFO_KEY,
      `tensorflowjs_models/${OFFLINE_MODEL_PATH}/info`,
      `tensorflowjs_models/${OFFLINE_MODEL_PATH}/model_without_weight`,
      `tensorflowjs_models/${OFFLINE_MODEL_PATH}/weight_data`,
    ]);
    throw new Error(
      "La copia guardada con la versión anterior no se puede cargar. Descarga el modelo nuevamente para guardarlo como archivo en el teléfono."
    );
  }

  const loadedModel = await tensorflow.loadLayersModel(createFileSystemModelIO());

  if (loadedModel.inputs?.[0]?.shape) {
    addLog(`Entrada del modelo: ${JSON.stringify(loadedModel.inputs[0].shape)}`);
  }
  addLog("Modelo sin conexión cargado correctamente.");

  return { model: loadedModel, labels: modelInfo.labels, modelInfo };
}

function imageToTensor(base64, addLog) {
  if (!base64) {
    throw new Error("La foto no contiene base64.");
  }

  const base64StartedAt = Date.now();
  const jpegBytes = toByteArray(base64);
  addLog(`Conversión base64: ${Date.now() - base64StartedAt} ms`);

  const jpegDecodeStartedAt = Date.now();
  const decoded = jpeg.decode(jpegBytes, { useTArray: true });
  const { width, height, data } = decoded;
  addLog(`Decodificación JPEG (${width}x${height}): ${Date.now() - jpegDecodeStartedAt} ms`);

  if (!width || !height || !data) {
    throw new Error("No se pudo decodificar la imagen JPEG.");
  }

  const resizeStartedAt = Date.now();
  const size = 224;
  const cropSize = Math.min(width, height);
  const offsetX = Math.floor((width - cropSize) / 2);
  const offsetY = Math.floor((height - cropSize) / 2);
  const rgb = new Float32Array(size * size * 3);
  let index = 0;

  for (let y = 0; y < size; y++) {
    const sourceY = Math.min(cropSize - 1, Math.floor((y / size) * cropSize));

    for (let x = 0; x < size; x++) {
      const sourceX = Math.min(cropSize - 1, Math.floor((x / size) * cropSize));
      const pixelIndex = ((sourceY + offsetY) * width + (sourceX + offsetX)) * 4;

      rgb[index++] = data[pixelIndex] / 127.5 - 1;
      rgb[index++] = data[pixelIndex + 1] / 127.5 - 1;
      rgb[index++] = data[pixelIndex + 2] / 127.5 - 1;
    }
  }

  addLog(`Redimensionado y normalización: ${Date.now() - resizeStartedAt} ms`);

  const tensorStartedAt = Date.now();
  const tensor = tf.tensor4d(rgb, [1, size, size, 3]);
  addLog(`Creación del tensor: ${Date.now() - tensorStartedAt} ms`);
  return tensor;
}

export async function predictImage(model, labels, photo, addLog) {
  if (!model) {
    throw new Error("El modelo todavía no está cargado.");
  }

  if (!photo?.base64) {
    throw new Error("La cámara no devolvió la imagen en base64.");
  }

  addLog("Preparando imagen...");
  const preparationStartedAt = Date.now();
  const inputTensor = imageToTensor(photo.base64, addLog);
  addLog(`Preparación de imagen: ${Date.now() - preparationStartedAt} ms`);
  let outputTensor;

  try {
    addLog("Ejecutando predicción...");
    const inferenceStartedAt = Date.now();
    const prediction = model.predict(inputTensor);
    outputTensor = Array.isArray(prediction) ? prediction[0] : prediction;
    const probabilities = await outputTensor.data();
    addLog(`Inferencia TensorFlow: ${Date.now() - inferenceStartedAt} ms`);

    let bestIndex = 0;
    let bestProbability = probabilities[0];
    for (let index = 1; index < probabilities.length; index++) {
      if (probabilities[index] > bestProbability) {
        bestProbability = probabilities[index];
        bestIndex = index;
      }
    }

    const className = labels[bestIndex] || `Clase ${bestIndex}`;
    const confidence = bestProbability * 100;
    addLog(`Predicción: ${className} (${confidence.toFixed(2)}%)`);

    return { className, confidence };
  } finally {
    inputTensor.dispose();
    if (outputTensor && typeof outputTensor.dispose === "function") {
      outputTensor.dispose();
    }
  }
}