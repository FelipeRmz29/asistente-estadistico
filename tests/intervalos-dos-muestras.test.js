// Pruebas de los intervalos de dos muestras de js/intervalos.js (Parte 7).
// Ejecutar desde la carpeta del proyecto:  node --test
//
// Los resultados esperados se calcularon a mano con las fórmulas del formulario y
// valores críticos de tablas (por ejemplo, F_0.025(9,15) = 3.12 y F_0.025(15,9) = 3.77);
// los decimales completos vienen de las funciones de la Parte 4, ya probadas aparte.

const test = require("node:test");
const assert = require("node:assert/strict");
const ic = require("../js/intervalos.js");
const est = require("../js/estadistica.js");
const vc = require("../js/valores-criticos.js");

// Compara con 9 cifras de precisión.
function cercano(real, esperado) {
  assert.ok(Math.abs(real - esperado) < 1e-9 * Math.max(1, Math.abs(esperado)),
    real + " debería ser " + esperado);
}

// Compara con una tolerancia (para resultados redondeados a mano).
function aproximado(real, esperado, tolerancia) {
  assert.ok(Math.abs(real - esperado) <= tolerancia, real + " debería estar cerca de " + esperado);
}

function sinError(resultado) {
  assert.equal(resultado.error, undefined, resultado.error);
  return resultado;
}

// ---------- Dos medias con Z ----------

test("dos medias, n ≥ 30 y σ desconocidas: Z con s₁ y s₂", function () {
  // n₁ = 50, x̄₁ = 76, s₁ = 6; n₂ = 75, x̄₂ = 82, s₂ = 8; 96 %
  const r = sinError(ic.intervaloDosMediasZ(50, 76, 6, 75, 82, 8, false, 96));
  assert.equal(r.alfa, 0.04);
  cercano(r.critico.valor, 2.0537489106318216);           // z_{0.02}
  assert.equal(r.critico.areaIzquierda, 0.98);             // deja α/2 = 0.02 a la derecha
  cercano(r.diferencia, -6);
  cercano(r.errorEstandar, Math.sqrt(36 / 50 + 64 / 75)); // 1.2543
  cercano(r.margen, 2.576070344212219);
  aproximado(r.inferior, -8.5761, 1e-4);
  aproximado(r.superior, -3.4239, 1e-4);
});

test("dos medias con σ₁ y σ₂ conocidas: Z con σ, aunque n sea pequeña", function () {
  // n₁ = 40, x̄₁ = 100, σ₁ = 5; n₂ = 60, x̄₂ = 95, σ₂ = 8; 95 %
  const r = sinError(ic.intervaloDosMediasZ(40, 100, 5, 60, 95, 8, true, 95));
  cercano(r.errorEstandar, Math.sqrt(25 / 40 + 64 / 60)); // 1.3006
  aproximado(r.margen, 2.5492, 1e-4);
  aproximado(r.inferior, 2.4508, 1e-4);
  aproximado(r.superior, 7.5492, 1e-4);
  // Con σ conocidas el formulario usa Z sin importar n.
  const pequenas = sinError(ic.intervaloDosMediasZ(9, 20, 3, 16, 18, 4, true, 90));
  cercano(pequenas.critico.valor, 1.6448536269514722);
});

test("dos medias con Z: simétrico alrededor de x̄₁ − x̄₂", function () {
  const r = sinError(ic.intervaloDosMediasZ(40, 100, 5, 60, 95, 8, true, 95));
  cercano(r.superior - r.diferencia, r.margen);
  cercano(r.diferencia - r.inferior, r.margen);
});

test("dos medias con Z y σ desconocidas: no se permite si una muestra es pequeña", function () {
  assert.match(ic.intervaloDosMediasZ(50, 76, 6, 29, 82, 8, false, 95).error, /ambas muestras son grandes.*n₁ = 50 y n₂ = 29/);
  assert.match(ic.intervaloDosMediasZ(29, 76, 6, 50, 82, 8, false, 95).error, /ambas muestras son grandes/);
});

// ---------- Dos medias con t, varianzas iguales ----------

test("dos medias con t y varianzas iguales (varianza combinada)", function () {
  // n₁ = 12, x̄₁ = 85, s₁ = 4; n₂ = 10, x̄₂ = 81, s₂ = 5; 90 %  →  0.69 ≤ μ₁ − μ₂ ≤ 7.31
  const r = sinError(ic.intervaloDosMediasTIguales(12, 85, 4, 10, 81, 5, 90));
  assert.equal(r.gl, 20);                                          // n₁ + n₂ − 2
  cercano(r.sp, Math.sqrt((11 * 16 + 9 * 25) / 20));               // 4.4777
  cercano(r.critico.valor, 1.724718242920786);                     // t_{0.05,20}
  assert.equal(r.critico.parametros, "gl = 20");
  cercano(r.errorEstandar, r.sp * Math.sqrt(1 / 12 + 1 / 10));
  aproximado(r.margen, 3.3067, 1e-4);
  aproximado(r.inferior, 0.6933, 1e-4);
  aproximado(r.superior, 7.3067, 1e-4);
});

test("t con varianzas iguales: solo con muestras pequeñas", function () {
  assert.match(ic.intervaloDosMediasTIguales(30, 85, 4, 10, 81, 5, 90).error, /solo si las muestras son pequeñas.*n₁ = 30 y n₂ = 10/);
  assert.match(ic.intervaloDosMediasTIguales(10, 85, 4, 30, 81, 5, 90).error, /solo si las muestras son pequeñas/);
});

// ---------- Dos medias con t, varianzas diferentes ----------

test("dos medias con t y varianzas diferentes (gl de Welch, no enteros)", function () {
  // Mismos datos que arriba, pero sin suponer varianzas iguales
  const r = sinError(ic.intervaloDosMediasTDiferentes(12, 85, 4, 10, 81, 5, 90));
  cercano(r.varMedia1, 16 / 12);
  cercano(r.varMedia2, 25 / 10);
  // ν = (16/12 + 25/10)² / [(16/12)²/11 + (25/10)²/9]
  const nu = Math.pow(16 / 12 + 25 / 10, 2) / (Math.pow(16 / 12, 2) / 11 + Math.pow(25 / 10, 2) / 9);
  cercano(r.gl, nu);
  aproximado(r.gl, 17.1652, 1e-4);
  assert.ok(!Number.isInteger(r.gl));
  aproximado(r.critico.valor, 1.7386, 1e-4);                       // entre t_{0.05,17} = 1.740 y t_{0.05,18} = 1.734
  cercano(r.errorEstandar, Math.sqrt(16 / 12 + 25 / 10));
  aproximado(r.inferior, 0.5959, 1e-4);
  aproximado(r.superior, 7.4041, 1e-4);
});

test("Welch coincide con la varianza combinada si n₁ = n₂ y s₁ = s₂", function () {
  const combinada = sinError(ic.intervaloDosMediasTIguales(8, 30, 2.5, 8, 27, 2.5, 95));
  const welch = sinError(ic.intervaloDosMediasTDiferentes(8, 30, 2.5, 8, 27, 2.5, 95));
  cercano(welch.gl, combinada.gl);
  cercano(welch.inferior, combinada.inferior);
  cercano(welch.superior, combinada.superior);
});

test("Welch con una muestra grande y una pequeña es válido; con ambas grandes no", function () {
  sinError(ic.intervaloDosMediasTDiferentes(40, 10, 2, 12, 9, 3, 95));
  assert.match(ic.intervaloDosMediasTDiferentes(40, 10, 2, 35, 9, 3, 95).error, /coinciden dos métodos/);
});

// ---------- Dos proporciones ----------

test("dos proporciones con x (0.05 − 0.04; −0.0017 ≤ π₁ − π₂ ≤ 0.0217)", function () {
  // x₁ = 75 de n₁ = 1500; x₂ = 80 de n₂ = 2000; 90 %
  const r = sinError(ic.intervaloDosProporciones(1500, 75, null, 2000, 80, null, 90));
  cercano(r.p1, 0.05);
  cercano(r.q2, 0.96);
  cercano(r.diferencia, 0.01);
  cercano(r.critico.valor, 1.644853626951468);
  cercano(r.errorEstandar, Math.sqrt(0.05 * 0.95 / 1500 + 0.04 * 0.96 / 2000));
  aproximado(r.margen, 0.011731, 1e-6);
  aproximado(r.inferior, -0.001731, 1e-6);
  aproximado(r.superior, 0.021731, 1e-6);
  assert.deepEqual(r.advertencias, []);
});

test("dos proporciones con p̂ da lo mismo que con x; se pueden mezclar", function () {
  const conX = sinError(ic.intervaloDosProporciones(1500, 75, null, 2000, 80, null, 90));
  const conP = sinError(ic.intervaloDosProporciones(1500, null, 0.05, 2000, null, 0.04, 90));
  const mixto = sinError(ic.intervaloDosProporciones(1500, 75, null, 2000, null, 0.04, 90));
  cercano(conP.inferior, conX.inferior);
  cercano(conP.superior, conX.superior);
  cercano(mixto.inferior, conX.inferior);
});

test("dos proporciones: avisa con n·p o n·q < 5 y con límites fuera de [−1, 1]", function () {
  const r = sinError(ic.intervaloDosProporciones(20, 2, null, 30, 15, null, 95)); // n₁·p₁ = 2
  assert.match(r.advertencias[0], /n·p ≥ 5 y n·q ≥ 5 en cada muestra/);
  const extremo = sinError(ic.intervaloDosProporciones(3, 1, null, 3, 2, null, 99.9));
  assert.ok(extremo.advertencias.some(function (a) { return /fuera de \[−1, 1\]/.test(a); }));
});

test("dos proporciones: valida n, x, p̂ y que se dé solo uno en cada muestra", function () {
  assert.match(ic.intervaloDosProporciones(null, 5, null, 40, 10, null, 95).error, /Falta el tamaño de la muestra 1 \(n₁\)/);
  assert.match(ic.intervaloDosProporciones(40, 5, null, 0, 10, null, 95).error, /tamaño de la muestra 2 \(n₂\).*mayor o igual que 1/);
  assert.match(ic.intervaloDosProporciones(40, null, null, 40, 10, null, 95).error, /Falta el número de éxitos o la proporción muestral de la muestra 1/);
  assert.match(ic.intervaloDosProporciones(40, 5, 0.1, 40, 10, null, 95).error, /muestra 1 escribe solo uno/);
  assert.match(ic.intervaloDosProporciones(40, 5, null, 40, 41, null, 95).error, /éxitos de la muestra 2.*entre 0 y n = 40/);
  assert.match(ic.intervaloDosProporciones(40, 2.5, null, 40, 10, null, 95).error, /éxitos de la muestra 1.*entero/);
  assert.match(ic.intervaloDosProporciones(40, null, 25, 40, 10, null, 95).error, /proporción muestral de la muestra 1.*entre 0 y 1.*divídelo entre 100/);
  assert.match(ic.intervaloDosProporciones(40, null, 0.5, 40, null, -0.2, 95).error, /muestra 2.*entre 0 y 1/);
});

test("dos proporciones: con p = 0 o p = 1 en una muestra el método no aplica", function () {
  assert.match(ic.intervaloDosProporciones(40, 0, null, 40, 10, null, 95).error, /muestra 1.*p = 0.*al menos un éxito y un fracaso/);
  assert.match(ic.intervaloDosProporciones(40, 10, null, 40, 40, null, 95).error, /muestra 2.*p = 1/);
});

// ---------- Muestras pareadas ----------

test("pareadas con n, d̄ y s_d: t con ν = n − 1", function () {
  // 12 pares, d̄ = 0.5, s_d = 0.8, 95 %
  const r = sinError(ic.intervaloPareadas(12, 0.5, 0.8, 95));
  assert.equal(r.gl, 11);
  cercano(r.critico.valor, 2.2009851600916406);                    // t_{0.025,11}
  cercano(r.errorEstandar, 0.8 / Math.sqrt(12));
  aproximado(r.margen, 0.5083, 1e-4);
  aproximado(r.inferior, -0.0083, 1e-4);
  aproximado(r.superior, 1.0083, 1e-4);
});

test("pareadas desde dos listas: primero las diferencias, luego una sola muestra", function () {
  const antes = [85, 90, 78, 92, 88, 76, 95, 89];
  const despues = [80, 88, 75, 90, 85, 77, 91, 84];
  const dif = est.calcularDiferencias(antes, despues);
  assert.deepEqual(dif.diferencias, [5, 2, 3, 2, 3, -1, 4, 5]);
  const d = est.calcularDescriptivos(dif.diferencias);
  cercano(d.media, 2.875);
  cercano(d.desviacion, Math.sqrt(26.875 / 7));                     // 1.9594

  const r = sinError(ic.intervaloPareadas(d.n, d.media, d.desviacion, 95));
  assert.equal(r.gl, 7);                                           // n − 1 con n = 8 pares, no 8 + 8 − 2
  cercano(r.critico.valor, 2.364624251592785);                     // t_{0.025,7}
  aproximado(r.margen, 1.6381, 1e-4);
  aproximado(r.inferior, 1.2369, 1e-4);
  aproximado(r.superior, 4.5131, 1e-4);
});

test("pareadas: no se aceptan listas de distinto tamaño (no son pares)", function () {
  assert.match(est.calcularDiferencias([1, 2, 3], [1, 2]).error, /misma cantidad de datos/);
});

test("pareadas: valida n, d̄ y s_d", function () {
  assert.match(ic.intervaloPareadas(null, 0.5, 0.8, 95).error, /Falta el tamaño de pares \(n\)/);
  assert.match(ic.intervaloPareadas(1, 0.5, 0.8, 95).error, /mayor o igual que 2.*un solo dato/);
  assert.match(ic.intervaloPareadas(8.5, 0.5, 0.8, 95).error, /entero/);
  assert.match(ic.intervaloPareadas(8, null, 0.8, 95).error, /Falta la media de las diferencias/);
  assert.match(ic.intervaloPareadas(8, 0.5, null, 95).error, /Falta la desviación estándar de las diferencias/);
  assert.match(ic.intervaloPareadas(8, 0.5, 0, 95).error, /s_d\) debe ser mayor que 0/);
});

// ---------- Cociente de varianzas ----------

test("cociente de varianzas: F con ν₁ = n₁ − 1 y ν₂ = n₂ − 1", function () {
  // n₁ = 10, S₁² = 4; n₂ = 16, S₂² = 2.5; 95 %
  const r = sinError(ic.intervaloCocienteVarianzas(10, null, 4, 16, null, 2.5, 95));
  assert.equal(r.gl1, 9);
  assert.equal(r.gl2, 15);
  cercano(r.razon, 1.6);
  // F_{α/2(ν₁,ν₂)} = F_{0.025}(9, 15) ≈ 3.12 (va dividiendo) y F_{α/2(ν₂,ν₁)} = F_{0.025}(15, 9) ≈ 3.77 (va multiplicando)
  aproximado(r.fInferior.valor, 3.12, 0.005);
  aproximado(r.fSuperior.valor, 3.77, 0.005);
  assert.equal(r.fInferior.areaIzquierda, 0.975);
  assert.match(r.fInferior.parametros, /gl1 = 9 .*gl2 = 15/);
  assert.match(r.fSuperior.parametros, /gl1 = 15 .*gl2 = 9/);
  cercano(r.inferior, 1.6 / vc.valorCriticoF(0.975, 9, 15).valor);
  cercano(r.superior, 1.6 * vc.valorCriticoF(0.975, 15, 9).valor);
  aproximado(r.inferior, 0.5124, 1e-4);
  aproximado(r.superior, 6.0310, 1e-4);
});

test("cociente de varianzas: intercambiar las muestras invierte el intervalo", function () {
  const a = sinError(ic.intervaloCocienteVarianzas(10, null, 4, 16, null, 2.5, 90));
  const b = sinError(ic.intervaloCocienteVarianzas(16, null, 2.5, 10, null, 4, 90));
  cercano(b.inferior, 1 / a.superior);
  cercano(b.superior, 1 / a.inferior);
});

test("cociente de varianzas: con s da lo mismo que con s²; no es simétrico ni tiene margen", function () {
  const conS = sinError(ic.intervaloCocienteVarianzas(10, 2, null, 16, Math.sqrt(2.5), null, 95));
  const conS2 = sinError(ic.intervaloCocienteVarianzas(10, null, 4, 16, null, 2.5, 95));
  cercano(conS.varianza1, 4);
  cercano(conS.inferior, conS2.inferior);
  cercano(conS.superior, conS2.superior);
  assert.equal(conS2.margen, undefined);
  assert.ok(Math.abs((conS2.superior - 1.6) - (1.6 - conS2.inferior)) > 1);
});

test("cociente de varianzas: valida n, s y s² de cada muestra", function () {
  assert.match(ic.intervaloCocienteVarianzas(null, null, 4, 16, null, 2.5, 95).error, /Falta el tamaño de la muestra 1 \(n₁\)/);
  assert.match(ic.intervaloCocienteVarianzas(10, null, 4, 1, null, 2.5, 95).error, /muestra 2 \(n₂\).*mayor o igual que 2/);
  assert.match(ic.intervaloCocienteVarianzas(10, null, null, 16, null, 2.5, 95).error, /Falta la desviación estándar \(s₁\) o la varianza \(s₁²\) de la muestra 1/);
  assert.match(ic.intervaloCocienteVarianzas(10, null, 4, 16, 1.5, 2.25, 95).error, /muestra 2 escribe solo uno/);
  assert.match(ic.intervaloCocienteVarianzas(10, 0, null, 16, null, 2.5, 95).error, /muestra 1 \(s₁\) debe ser mayor que 0/);
  assert.match(ic.intervaloCocienteVarianzas(10, null, 4, 16, null, -2.5, 95).error, /muestra 2 \(s₂²\) debe ser mayor que 0/);
});

// ---------- Datos faltantes o inválidos comunes a las medias ----------

test("dos medias: valida n, medias, desviaciones y nivel de confianza", function () {
  // Z
  assert.match(ic.intervaloDosMediasZ(null, 76, 6, 75, 82, 8, true, 95).error, /Falta el tamaño de la muestra 1 \(n₁\)/);
  assert.match(ic.intervaloDosMediasZ(50, 76, 6, 75.5, 82, 8, true, 95).error, /tamaño de la muestra 2 \(n₂\).*entero/);
  assert.match(ic.intervaloDosMediasZ(50, null, 6, 75, 82, 8, true, 95).error, /Falta la media de la muestra 1 \(x̄₁\)/);
  assert.match(ic.intervaloDosMediasZ(50, 76, 6, 75, NaN, 8, true, 95).error, /media de la muestra 2.*debe ser un número/);
  assert.match(ic.intervaloDosMediasZ(50, 76, null, 75, 82, 8, true, 95).error, /Falta la desviación estándar poblacional de la muestra 1 \(σ₁\)/);
  assert.match(ic.intervaloDosMediasZ(50, 76, 6, 75, 82, null, false, 95).error, /Falta la desviación estándar muestral de la muestra 2 \(s₂\)/);
  assert.match(ic.intervaloDosMediasZ(50, 76, -6, 75, 82, 8, true, 95).error, /σ₁\) debe ser mayor que 0/);
  // t, varianzas iguales y diferentes
  for (const metodo of [ic.intervaloDosMediasTIguales, ic.intervaloDosMediasTDiferentes]) {
    assert.match(metodo(1, 85, 4, 10, 81, 5, 90).error, /muestra 1 \(n₁\).*mayor o igual que 2.*un solo dato/);
    assert.match(metodo(10, 85, 4, null, 81, 5, 90).error, /Falta el tamaño de la muestra 2/);
    assert.match(metodo(10, null, 4, 10, 81, 5, 90).error, /Falta la media de la muestra 1/);
    assert.match(metodo(10, 85, null, 10, 81, 5, 90).error, /Falta la desviación estándar muestral de la muestra 1 \(s₁\)/);
    assert.match(metodo(10, 85, 4, 10, 81, 0, 90).error, /muestra 2 \(s₂\) debe ser mayor que 0/);
  }
  // Nivel de confianza
  for (const confianza of [0, 100, -5, NaN, null]) {
    assert.match(ic.intervaloDosMediasZ(50, 76, 6, 75, 82, 8, true, confianza).error, /nivel de confianza/);
    assert.match(ic.intervaloDosMediasTIguales(10, 85, 4, 10, 81, 5, confianza).error, /nivel de confianza/);
    assert.match(ic.intervaloDosProporciones(40, 5, null, 40, 10, null, confianza).error, /nivel de confianza/);
    assert.match(ic.intervaloPareadas(8, 0.5, 0.8, confianza).error, /nivel de confianza/);
    assert.match(ic.intervaloCocienteVarianzas(10, null, 4, 16, null, 2.5, confianza).error, /nivel de confianza/);
  }
});

test("los resultados de dos muestras no se redondean", function () {
  const r = ic.intervaloDosMediasTIguales(12, 85, 4, 10, 81, 5, 90);
  assert.notEqual(r.margen, 3.3067);
  assert.notEqual(r.inferior, 0.69);
  const p = ic.intervaloDosProporciones(1500, 75, null, 2000, 80, null, 90);
  assert.notEqual(p.inferior, -0.0017);
});
