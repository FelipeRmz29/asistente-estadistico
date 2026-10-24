// Pruebas de js/intervalos.js con el ejecutor de pruebas incluido en Node.

const test = require("node:test");
const assert = require("node:assert/strict");
const ic = require("../js/intervalos.js");

function cercano(real, esperado) {
  assert.ok(Math.abs(real - esperado) < 1e-9 * Math.max(1, Math.abs(esperado)),
    real + " debería ser " + esperado);
}

function sinError(resultado) {
  assert.equal(resultado.error, undefined, resultado.error);
  return resultado;
}

// ---------- Una media con Z ----------

test("media con σ conocida (Walpole 9.2: 2.50 < μ < 2.70)", function () {
  const r = sinError(ic.intervaloMediaZ(36, 2.6, 0.3, true, 95));
  assert.equal(r.alfa, 0.05);
  cercano(r.critico.valor, 1.959963984540054);
  assert.equal(r.critico.areaIzquierda, 0.975);
  cercano(r.errorEstandar, 0.05);
  cercano(r.margen, 0.0979981992270027);
  cercano(r.inferior, 2.502001800772997);
  cercano(r.superior, 2.697998199227003);
});

test("media con σ desconocida y n ≥ 30: Z con s", function () {
  const r = sinError(ic.intervaloMediaZ(40, 50, 2.5, false, 99));
  cercano(r.critico.valor, 2.5758293035489004);
  cercano(r.margen, 1.0181859328774703);
  cercano(r.inferior, 48.98181406712253);
  cercano(r.superior, 51.01818593287747);
});

test("media con σ conocida y n < 30 también usa Z (n ≥ 30 o σ² conocida)", function () {
  const r = sinError(ic.intervaloMediaZ(9, 20, 3, true, 90));
  cercano(r.critico.valor, 1.6448536269514722);
  cercano(r.margen, 1.6448536269514722);
});

test("Z con σ desconocida y n < 30 no está permitido", function () {
  assert.match(ic.intervaloMediaZ(29, 50, 2.5, false, 95).error, /solo si n ≥ 30.*corresponde t/);
});

test("el intervalo es simétrico: x̄ ± e", function () {
  const r = sinError(ic.intervaloMediaZ(50, 10, 2, true, 95));
  cercano(r.superior - 10, r.margen);
  cercano(10 - r.inferior, r.margen);
});

// ---------- Una media con t ----------

test("media con t (Walpole 9.5: 9.74 < μ < 10.26)", function () {
  const r = sinError(ic.intervaloMediaT(7, 10, 0.283, 95));
  assert.equal(r.gl, 6);
  cercano(r.critico.valor, 2.4469118511449786);
  assert.equal(r.critico.parametros, "gl = 6");
  cercano(r.margen, 0.26173134677400656);
  cercano(r.inferior, 9.738268653225994);
  cercano(r.superior, 10.261731346774006);
});

test("t requiere n < 30 y al menos 2 datos", function () {
  assert.match(ic.intervaloMediaT(30, 10, 1, 95).error, /solo si n < 30.*corresponde Z/);
  assert.match(ic.intervaloMediaT(1, 10, 1, 95).error, /mayor o igual que 2.*un solo dato/);
});

// ---------- Una proporción ----------

test("proporción con número de éxitos (Walpole 9.13: 0.6391 < π < 0.7209)", function () {
  const r = sinError(ic.intervaloProporcion(500, 340, null, 95));
  assert.equal(r.p, 0.68);
  cercano(r.q, 0.32);
  cercano(r.margen, 0.040887686150797076);
  cercano(r.inferior, 0.639112313849203);
  cercano(r.superior, 0.7208876861507971);
  assert.deepEqual(r.advertencias, []);
});

test("proporción con p̂ da el mismo intervalo que con x", function () {
  const conX = ic.intervaloProporcion(500, 340, null, 95);
  const conP = sinError(ic.intervaloProporcion(500, null, 0.68, 95));
  cercano(conP.inferior, conX.inferior);
  cercano(conP.superior, conX.superior);
});

test("proporción: valida x, p̂ y que se dé solo uno", function () {
  assert.match(ic.intervaloProporcion(50, null, null, 95).error, /Falta el número de éxitos \(x\) o la proporción/);
  assert.match(ic.intervaloProporcion(50, 10, 0.2, 95).error, /solo uno/);
  assert.match(ic.intervaloProporcion(50, 51, null, 95).error, /entero entre 0 y n = 50/);
  assert.match(ic.intervaloProporcion(50, -1, null, 95).error, /entero entre 0 y n/);
  assert.match(ic.intervaloProporcion(50, 2.5, null, 95).error, /entero/);
  assert.match(ic.intervaloProporcion(50, null, 35, 95).error, /entre 0 y 1.*divídelo entre 100/);
  assert.match(ic.intervaloProporcion(50, null, -0.1, 95).error, /entre 0 y 1/);
});

test("proporción: con p = 0 o p = 1 el método no aplica", function () {
  assert.match(ic.intervaloProporcion(20, 0, null, 95).error, /margen de error sería 0/);
  assert.match(ic.intervaloProporcion(20, 20, null, 95).error, /al menos un éxito y un fracaso/);
  assert.match(ic.intervaloProporcion(20, null, 1, 95).error, /p = 1/);
});

test("proporción: avisa si n·p o n·q < 5 o si un límite sale de [0, 1]", function () {
  const r = sinError(ic.intervaloProporcion(20, 2, null, 95));
  assert.equal(r.advertencias.length, 2);
  assert.match(r.advertencias[0], /n·p ≥ 5 y n·q ≥ 5/);
  assert.match(r.advertencias[1], /fuera de \[0, 1\]/);
  assert.ok(r.inferior < 0);
});

// ---------- Una varianza ----------

test("varianza (Walpole 9.17: 0.135 < σ² < 0.953)", function () {
  const r = sinError(ic.intervaloVarianza(10, null, 0.286, 95));
  assert.equal(r.gl, 9);
  cercano(r.numerador, 9 * 0.286);
  cercano(r.chiDerecha.valor, 19.02276779864163);
  cercano(r.chiIzquierda.valor, 2.7003894999803584);
  cercano(r.inferior, 0.1353115396900236);
  cercano(r.superior, 0.9531958260164773);
});

test("varianza con s da lo mismo que con s²", function () {
  const conS = sinError(ic.intervaloVarianza(10, 2, null, 90));
  const conS2 = sinError(ic.intervaloVarianza(10, null, 4, 90));
  assert.equal(conS.varianza, 4);
  cercano(conS.inferior, conS2.inferior);
  cercano(conS.superior, conS2.superior);
});

test("varianza: el intervalo no es simétrico alrededor de s²", function () {
  const r = sinError(ic.intervaloVarianza(10, null, 0.286, 95));
  assert.ok(r.inferior < 0.286 && 0.286 < r.superior);
  assert.ok(Math.abs((r.superior - 0.286) - (0.286 - r.inferior)) > 0.1);
  assert.equal(r.margen, undefined);
});

test("desviación estándar: los límites de σ son la raíz de los límites de σ² (sin redondear)", function () {
  const r = sinError(ic.intervaloVarianza(10, null, 0.286, 95));
  assert.equal(r.sigmaInferior, Math.sqrt(r.inferior));
  assert.equal(r.sigmaSuperior, Math.sqrt(r.superior));
  cercano(r.sigmaInferior * r.sigmaInferior, r.inferior);
  cercano(r.sigmaSuperior * r.sigmaSuperior, r.superior);
  assert.equal(Number(r.sigmaInferior.toFixed(4)), 0.3678);
  assert.equal(Number(r.sigmaSuperior.toFixed(4)), 0.9763);
  assert.notEqual(r.sigmaInferior, Math.sqrt(Number(r.inferior.toFixed(4))));
  assert.ok(r.sigmaInferior < Math.sqrt(0.286) && Math.sqrt(0.286) < r.sigmaSuperior);
});

test("desviación estándar: con s o con s² da el mismo intervalo de σ", function () {
  const conS = sinError(ic.intervaloVarianza(10, 2, null, 90));
  const conS2 = sinError(ic.intervaloVarianza(10, null, 4, 90));
  cercano(conS.sigmaInferior, conS2.sigmaInferior);
  cercano(conS.sigmaSuperior, conS2.sigmaSuperior);
});

test("formato de límites pequeños: conserva 4 cifras significativas", function () {
  assert.equal(ic.formatearLimite(0.1353115396900236), "0.1353");
  assert.equal(ic.formatearLimite(12.5), "12.5");
  assert.equal(ic.formatearLimite(100), "100");
  assert.equal(ic.formatearLimite(0), "0");
  assert.equal(ic.formatearLimite(0.000123456), "0.0001235");
  assert.equal(ic.formatearLimite(0.0123456), "0.01235");
  assert.equal(ic.formatearLimite(-0.000123456), "-0.0001235");
  assert.equal(ic.formatearLimite(0.000000012346), "0.00000001235");
});

test("los límites pequeños de varianza y σ se distinguen al mostrarlos", function () {
  const r = sinError(ic.intervaloVarianza(10, null, 0.0000286, 95));
  const textos = [r.inferior, r.superior, r.sigmaInferior, r.sigmaSuperior].map(ic.formatearLimite);
  for (const texto of textos) {
    assert.notEqual(Number(texto), 0, texto + " no debe verse como 0");
    assert.ok(texto.replace(/^[-0.]+/, "").length >= 4, texto + " debe tener 4 cifras significativas");
  }
  assert.ok(Math.abs(Number(textos[2]) - r.sigmaInferior) < 5e-4 * r.sigmaInferior);
  assert.equal(ic.formatearLimite(r.sigmaSuperior * r.sigmaSuperior), ic.formatearLimite(r.superior));
});

test("varianza: valida s, s² y el tamaño", function () {
  assert.match(ic.intervaloVarianza(10, null, null, 95).error, /Falta la desviación estándar muestral \(s\) o la varianza/);
  assert.match(ic.intervaloVarianza(10, 2, 4, 95).error, /solo uno/);
  assert.match(ic.intervaloVarianza(10, 0, null, 95).error, /mayor que 0/);
  assert.match(ic.intervaloVarianza(10, null, -4, 95).error, /mayor que 0/);
  assert.match(ic.intervaloVarianza(1, 2, null, 95).error, /mayor o igual que 2/);
});

// ---------- Tamaño de muestra ----------

test("tamaño de muestra para la media (Walpole 9.2: n = 139)", function () {
  const r = sinError(ic.tamanoMuestraMedia(0.3, 0.05, 95));
  cercano(r.valor, 138.2925175449885);
  assert.equal(r.n, 139);
});

test("tamaño de muestra para una proporción (Walpole 9.14: n = 2090)", function () {
  const r = sinError(ic.tamanoMuestraProporcion(0.68, 0.02, 95));
  cercano(r.valor, 2089.7535984576043);
  assert.equal(r.n, 2090);
});

test("tamaño de muestra: valida el error deseado, σ y p", function () {
  assert.match(ic.tamanoMuestraMedia(0.3, null, 95).error, /Falta el error máximo deseado \(e\)/);
  assert.match(ic.tamanoMuestraMedia(0.3, 0, 95).error, /mayor que 0/);
  assert.match(ic.tamanoMuestraMedia(null, 0.05, 95).error, /Falta la desviación estándar poblacional \(σ\)/);
  assert.match(ic.tamanoMuestraProporcion(0.5, 3, 95).error, /menor que 1.*3 % → 0.03/);
  assert.match(ic.tamanoMuestraProporcion(0, 0.03, 95).error, /entre 0 y 1/);
});

// ---------- Datos faltantes o inválidos comunes ----------

test("valida el nivel de confianza", function () {
  for (const confianza of [0, 100, -5, 150, NaN, null]) {
    assert.match(ic.intervaloMediaZ(36, 2.6, 0.3, true, confianza).error, /nivel de confianza/);
  }
  assert.match(ic.intervaloMediaZ(36, 2.6, 0.3, true, 99.99999).error, /No se pudo obtener el valor crítico/);
  for (const confianza of [0.95, 0.9, 1]) {
    assert.match(ic.intervaloMediaZ(36, 2.6, 0.3, true, confianza).error, /95, no 0.95/);
  }
});

test("valida datos faltantes o no válidos de la media", function () {
  assert.match(ic.intervaloMediaZ(null, 2.6, 0.3, true, 95).error, /Falta el tamaño de muestra/);
  assert.match(ic.intervaloMediaZ(36.5, 2.6, 0.3, true, 95).error, /entero/);
  assert.match(ic.intervaloMediaZ(36, null, 0.3, true, 95).error, /Falta la media muestral/);
  assert.match(ic.intervaloMediaZ(36, NaN, 0.3, true, 95).error, /debe ser un número/);
  assert.match(ic.intervaloMediaZ(36, 2.6, null, true, 95).error, /Falta la desviación estándar poblacional \(σ\)/);
  assert.match(ic.intervaloMediaZ(36, 2.6, null, false, 95).error, /Falta la desviación estándar muestral \(s\)/);
  assert.match(ic.intervaloMediaZ(36, 2.6, -1, true, 95).error, /mayor que 0/);
  assert.match(ic.intervaloMediaT(10, 5, 0, 95).error, /muestral \(s\) debe ser mayor que 0/);
});

test("los resultados no se redondean", function () {
  const r = ic.intervaloMediaZ(36, 2.6, 0.3, true, 95);
  assert.notEqual(r.margen, 0.098);
  assert.notEqual(r.inferior, 2.5);
});
