export async function sendToESP32(ip, className, percentage) {
  const safeClass = encodeURIComponent(className);
  const numericPercentage = Number(percentage);
  const url =
    `http://${ip}/enviar` +
    `?clase=${safeClass}` +
    `&porcentaje=${numericPercentage.toFixed(2)}`;

  const response = await fetch(url, { method: "GET" });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`ESP32 respondió ${response.status}: ${text}`);
  }

  return { text, percentage: numericPercentage };
}

export async function checkESP32(ip) {
  const response = await fetch(`http://${ip}/`, { method: "GET" });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`ESP32 respondió ${response.status}: ${text}`);
  }

  return text;
}