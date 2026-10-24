// Pruebas de js/presentacion.js (presentación de los resultados, Parte 10).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pr = require("../js/presentacion.js");
const ic = require("../js/intervalos.js");
const ph = require("../js/pruebas.js");
const est = require("../js/estadistica.js");

function fila(filas, nombre) {
  const encontrada = filas.find(function (f) { return f[0] === nombre; });
  assert.ok(encontrada, "falta la fila «" + nombre + "»");
  return encontrada;
}

function nombres(filas) {
  return filas.map(function (f) { return f[0]; });
}

// ---------- Redondeo ----------

test("redondeo: 4 decimales al mostrar; valores p pequeños con 4 cifras significativas", function () {
  assert.equal(pr.formatear(2.0224719101123565), "2.0225");
  assert.equal(pr.formatear(1.2), "1.2");
  assert.equal(pr.formatearValorP(0.000123456), "0.0001235");
  assert.equal(pr.formatearValorP(0.4786), "0.4786");
  assert.equal(pr.formatearArea(0.025000000000000022), "0.025");
  assert.match(pr.NOTA_REDONDEO, /4 decimales/);
  assert.match(pr.NOTA_REDONDEO, /4 cifras significativas/);
  assert.match(pr.NOTA_REDONDEO, /los cálculos usan todos los decimales/);
});

test("los límites se redondean al final, no a partir de valores ya redondeados", function () {
  const r = { alfa: 0.05, critico: { valor: 1.96, descripcion: "" }, margen: 0.00004, inferior: 1, superior: 1.00008 };
  const p = pr.presentarMediaZ(r, 100, 1.00004, 0.001, true, 95, null, null);
  assert.equal(p.resultado, "1 ≤ μ ≤ 1.0001");
  assert.equal(fila(p.pasos, "Límite superior")[2], "1 + 0 = 1.0001");
});

// ---------- Estadísticos de una lista ----------

test("estadísticos descriptivos de una lista: n, suma, media, varianza y desviación", function () {
  const d = est.calcularDescriptivos(est.leerLista("10.2, 9.8, 10.5, 10.9, 10.1, 10.4").valores);
  const filas = pr.filasDescriptivos(d, "x", "x̄", "s");
  assert.deepEqual(nombres(filas),
    ["Tamaño de muestra", "Suma", "Media muestral", "Varianza muestral", "Desviación estándar muestral"]);
  assert.equal(fila(filas, "Tamaño de muestra")[2], 6);
  assert.equal(fila(filas, "Media muestral")[2], pr.formatear(d.media));
  assert.equal(fila(filas, "Varianza muestral")[1], "s² = Σ(x − x̄)² / (n − 1)");
});

test("con un solo dato no se muestra una varianza inventada", function () {
  const filas = pr.filasDescriptivos(est.calcularDescriptivos([7]), "x", "x̄", "s");
  assert.equal(fila(filas, "Varianza muestral")[2], "No se puede calcular con un solo dato");
  assert.equal(fila(filas, "Desviación estándar muestral")[2], "No se puede calcular con un solo dato");
});

// ---------- Intervalos de confianza ----------

test("intervalo con t: valor crítico, grados de libertad, margen de error y límites", function () {
  const r = ic.intervaloMediaT(12, 42, 11.9, 95);
  const p = pr.presentarMediaT(r, 12, 42, 11.9, 95);

  assert.deepEqual(nombres(p.datos).slice(0, 3),
    ["Tamaño de muestra (n)", "Media muestral (x̄)", "Desviación estándar muestral (s)"]);
  assert.equal(p.criticos[0][0], "t_α/2,ν = t_0.025,11");
  assert.equal(p.criticos[0][1], "2.201");
  assert.match(p.criticos[0][2], /gl = 11/);

  assert.deepEqual(fila(p.pasos, "Grados de libertad"), ["Grados de libertad", "ν = n − 1", "ν = 12 − 1 = 11"]);
  const margen = fila(p.pasos, "Margen de error");
  assert.equal(margen[1], "e = t_α/2,ν · s / √n");
  assert.equal(margen[2], "e = 2.201 · 11.9 / √12 = " + pr.formatear(r.margen));
  assert.equal(fila(p.pasos, "Límite inferior")[2], "42 − " + pr.formatear(r.margen) + " = " + pr.formatear(r.inferior));
  assert.equal(p.resultado, pr.formatear(r.inferior) + " ≤ μ ≤ " + pr.formatear(r.superior));
});

test("la interpretación es breve y no repite la aclaración sobre el nivel de confianza", function () {
  const r = ic.intervaloMediaT(12, 42, 11.9, 95);
  const p = pr.presentarMediaT(r, 12, 42, 11.9, 95);
  assert.equal(p.interpretacion, "Con un 95 % de confianza, se estima que la media poblacional μ está entre " +
    pr.formatear(r.inferior) + " y " + pr.formatear(r.superior) + ".");
  assert.match(pr.NOTA_CONFIANZA, /No es la probabilidad/);
});

test("intervalo con Z no muestra grados de libertad", function () {
  const r = ic.intervaloMediaZ(100, 71.8, 8.9, true, 95);
  const p = pr.presentarMediaZ(r, 100, 71.8, 8.9, true, 95, null, null);
  assert.equal(nombres(p.pasos).includes("Grados de libertad"), false);
  assert.equal(p.criticos[0][0], "z_α/2 = z_0.025");
  assert.equal(fila(p.datos, "Desviación estándar poblacional (σ)")[1], "8.9");
});

test("intervalo de una varianza: la varianza y la desviación estándar van etiquetadas", function () {
  const r = ic.intervaloVarianza(10, 1.2, null, 95);
  const p = pr.presentarVarianza(r, 10, 1.2, 95);
  assert.equal(p.resultado.length, 2);
  assert.match(p.resultado[0], /^Intervalo para la varianza \(σ²\): .* ≤ σ² ≤ /);
  assert.match(p.resultado[1], /^Intervalo para la desviación estándar \(σ\): .* ≤ σ ≤ /);
  assert.equal(p.criticos.length, 2);
  assert.ok(nombres(p.pasos).includes("Límite inferior de σ²"));
  assert.ok(nombres(p.pasos).includes("Límite inferior de σ"));
  assert.match(p.interpretacion, /varianza poblacional σ² está entre .* y la desviación estándar poblacional σ, entre/);
});

test("intervalo de dos medias: criterio de decisión y notas cortas", function () {
  const r = ic.intervaloDosMediasTIguales(12, 85, 4, 10, 81, 5, 95);
  const p = pr.presentarDosMediasTIguales(r, 12, 85, 4, 10, 81, 5, 95);
  assert.equal(fila(p.pasos, "Grados de libertad")[2], "ν = 12 + 10 − 2 = 20");
  assert.ok(nombres(p.pasos).includes("Desviación combinada"));
  assert.equal(p.decision.estado, "decidido");
  for (const nota of p.notas) {
    assert.ok(nota.length <= 160, "nota demasiado larga: " + nota);
  }
});

// ---------- Pruebas de hipótesis ----------

test("prueba con t: H₀, H₁, estadístico, distribución, gl, valor crítico, valor p y conclusión", function () {
  const r = ph.pruebaMediaT(12, 42, 11.9, 46, "izquierda", 0.05);
  const p = pr.presentarPrueba("media-t", r, { n: 12, media: 42, s: 11.9, sigmaConocida: false, desviacion: 11.9 });

  assert.deepEqual(p.hipotesis, { h0: "μ = 46", h1: "μ < 46", cola: "cola izquierda" });
  assert.equal(fila(p.datos, "Nivel de significancia (α)")[1], "0.05");
  assert.equal(fila(p.datos, "Distribución de referencia")[1], "t de Student, ν = 11");
  assert.equal(fila(p.pasos, "Estadístico de prueba")[2], "t = (42 − 46) / 3.4352 = -1.1644");
  assert.equal(p.criticos[0][0], "−t_0.05,11");
  assert.equal(p.criticos[0][1], "-1.7959");
  assert.equal(p.region, "Región de rechazo (α = 0.05 en la cola izquierda): se rechaza H₀ si t < -1.7959.");
  assert.equal(p.valorP, "valor p = P(T ≤ -1.1644) = 0.1344");
  assert.equal(p.decision, "Decisión: no se rechaza H₀");
  assert.match(p.explicacion, /no cae en la región de rechazo .* valor p = 0.1344 ≥ α = 0.05/);
  assert.match(p.conclusion, /^No se rechaza H₀/);
});

test("prueba que rechaza H₀ y prueba con Z (sin grados de libertad)", function () {
  const r = ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "derecha", 0.05);
  const p = pr.presentarPrueba("media-z", r, { n: 100, media: 71.8, s: null, sigmaConocida: true, desviacion: 8.9 });
  assert.equal(fila(p.datos, "Distribución de referencia")[1], "normal estándar Z (no usa grados de libertad)");
  assert.equal(p.decision, "Decisión: se rechaza H₀");
  assert.match(p.explicacion, /cae en la región de rechazo \(z > 1.6449\)/);
  assert.match(p.conclusion, /^Se rechaza H₀/);
});

test("prueba con F de dos colas: dos valores críticos y los dos grados de libertad", function () {
  const r = ph.pruebaCocienteVarianzas(12, 4, null, 10, 5, null, "dos-colas", 0.10);
  const p = pr.presentarPrueba("cociente-varianzas", r, { n1: 12, s1: 4, n2: 10, s2: 5 });
  assert.equal(fila(p.datos, "Distribución de referencia")[1], "F, ν₁ = 11 (numerador) y ν₂ = 9 (denominador)");
  assert.deepEqual(p.criticos.map(function (c) { return c[0]; }), ["F_0.95(11,9)", "F_0.05(11,9)"]);
  assert.match(p.valorP, /^valor p = 2 · mín\(/);
});

// ---------- Errores ----------

test("sin resultado: el mensaje dice que no se calculó y por qué", function () {
  const errorIntervalo = ic.intervaloMediaT(1, 42, 11.9, 95).error;
  assert.ok(errorIntervalo);
  assert.equal(pr.textoSinResultado("intervalo", errorIntervalo),
    "No se pudo calcular el intervalo de confianza: " + errorIntervalo);

  const errorPrueba = ph.pruebaVarianza(10, 1.2, null, null, "derecha", 0.05).error;
  assert.equal(pr.textoSinResultado("prueba", errorPrueba),
    "No se pudo resolver la prueba de hipótesis: Falta σ₀² (valor del parámetro en H₀).");
});

// ---------- Orden de los archivos en la página ----------

test("index.html carga presentacion.js después de lo que usa y antes de app.js", function () {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const orden = Array.from(html.matchAll(/<script src="js\/([a-z-]+)\.js"/g)).map(function (m) { return m[1]; });
  const posicion = function (nombre) { return orden.indexOf(nombre); };
  assert.ok(posicion("presentacion") > posicion("intervalos"));
  assert.ok(posicion("presentacion") > posicion("decisiones"));
  assert.ok(posicion("presentacion") < posicion("app"));
  assert.match(html, /id="nota-redondeo"/);
});
