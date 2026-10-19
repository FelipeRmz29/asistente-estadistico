// Ejecuta las pruebas integrales (tests/integracion.html) en un navegador sin ventana.
// Ejecutar desde la carpeta del proyecto:  node --test
//
// Usa Microsoft Edge o Google Chrome si están instalados (o el que indique la variable de
// entorno NAVEGADOR). No instala nada: abre la página con --headless y lee el texto que
// deja en <pre id="salida">. Si no encuentra un navegador, la prueba se omite y se puede
// abrir la página a mano (ver tests/integracion.html).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const candidatos = [
  process.env.NAVEGADOR,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
];
const navegador = candidatos.find(function (ruta) { return ruta && fs.existsSync(ruta); });

const omitir = navegador ? false
  : "No se encontró Edge ni Chrome. Abre tests/integracion.html con un servidor local o define NAVEGADOR.";

test("recorridos completos de la página en un navegador real", { skip: omitir }, function () {
  // Perfil temporal: así no se usa ni se modifica el perfil del navegador de la persona.
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "pruebas-integrales-"));
  let html;
  try {
    html = execFileSync(navegador, [
      "--headless=new",
      "--disable-gpu",
      "--allow-file-access-from-files", // la página de pruebas lee el iframe de ../index.html
      "--user-data-dir=" + perfil,
      "--dump-dom",
      pathToFileURL(path.join(__dirname, "integracion.html")).href,
    ], { encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "ignore"] });
  } finally {
    fs.rmSync(perfil, { recursive: true, force: true });
  }

  const encontrado = html.match(/<pre id="salida"[^>]*>([\s\S]*?)<\/pre>/);
  assert.ok(encontrado, "La página de pruebas no dejó resultados en <pre id=\"salida\">.");
  const salida = encontrado[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&amp;/g, "&");
  const fallos = salida.split("\n").filter(function (linea) { return linea.startsWith("FALLO"); });
  const total = salida.match(/TOTAL (\d+) FALLOS (\d+)/);

  assert.ok(total, "Falta el resumen de las pruebas integrales:\n" + salida);
  assert.ok(Number(total[1]) > 0, "No se ejecutó ninguna prueba integral.");
  assert.deepEqual(fallos, [], "Fallaron pruebas integrales:\n" + fallos.join("\n"));
});
