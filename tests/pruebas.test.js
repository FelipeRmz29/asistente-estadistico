// Pruebas de js/pruebas.js (pruebas de hipótesis, Parte 9).
// Ejecutar desde la carpeta del proyecto:  node --test
//
// Los valores esperados (estadístico, valor p y valores críticos) se calcularon aparte
// con SciPy (scipy.stats: norm, t, chi2 y f) a partir de las mismas fórmulas; varios
// ejercicios son los ejemplos clásicos de Walpole (por ejemplo, n = 100, x̄ = 71.8,
// σ = 8.9, H₀: μ = 70 da z = 2.02 y valor p = 0.0216).

const test = require("node:test");
const assert = require("node:assert/strict");
const ph = require("../js/pruebas.js");
const est = require("../js/estadistica.js");

// Compara con 9 cifras de precisión.
function cercano(real, esperado) {
  assert.ok(Math.abs(real - esperado) < 1e-9 * Math.max(1, Math.abs(esperado)),
    real + " debería ser " + esperado);
}

function sinError(resultado) {
  assert.equal(resultado.error, undefined, resultado.error);
  return resultado;
}

function valoresCriticos(r) {
  return r.criticos.map(function (c) { return c.critico.valor; });
}

// ---------- Una media ----------

test("una media, Z con σ conocida, cola derecha: se rechaza H₀", function () {
  // n = 100, x̄ = 71.8, σ = 8.9; H₀: μ = 70, H₁: μ > 70, α = 0.05
  const r = sinError(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "derecha", 0.05));
  cercano(r.errorEstandar, 0.89);
  cercano(r.estadistico, 2.0224719101123565);
  assert.equal(r.distribucion, "z");
  assert.equal(r.criticos.length, 1);
  assert.equal(r.criticos[0].lado, "superior");
  cercano(r.criticos[0].critico.valor, 1.6448536269514722);   // z_0.05
  cercano(r.criticos[0].critico.areaDerecha, 0.05);
  cercano(r.valorP, 0.021563811339088888);
  assert.equal(r.rechazar, true);
  assert.deepEqual(r.hipotesis, { h0: "μ = 70", h1: "μ > 70", cola: "cola derecha" });
  assert.match(r.conclusion, /^Se rechaza H₀/);
  assert.match(r.conclusion, /la media poblacional es mayor que 70 \(μ > 70\)/);
});

test("el mismo estadístico, decisiones a ambos lados de α y con las tres colas", function () {
  // z = 2.0225: valor p de una cola 0.0216, de dos colas 0.0431.
  const derecha01 = sinError(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "derecha", 0.01));
  assert.equal(derecha01.rechazar, false);                    // 0.0216 > 0.01
  cercano(derecha01.criticos[0].critico.valor, 2.3263478740408408);
  assert.match(derecha01.conclusion, /^No se rechaza H₀/);
  assert.match(derecha01.conclusion, /no demuestra que H₀ sea cierta/);

  const dos05 = sinError(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "dos-colas", 0.05));
  cercano(dos05.valorP, 2 * 0.021563811339088888);
  assert.equal(dos05.rechazar, true);                         // |2.02| > 1.96
  assert.deepEqual(valoresCriticos(dos05).map(function (v) { return Number(v.toFixed(6)); }), [-1.959964, 1.959964]);
  assert.equal(dos05.hipotesis.h1, "μ ≠ 70");
  assert.equal(dos05.hipotesis.cola, "dos colas");

  const dos01 = sinError(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "dos-colas", 0.01));
  assert.equal(dos01.rechazar, false);                        // 0.0431 > 0.01

  const izquierda = sinError(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "izquierda", 0.05));
  cercano(izquierda.valorP, 1 - 0.021563811339088888);       // P(Z ≤ 2.02)
  assert.equal(izquierda.rechazar, false);
  assert.equal(izquierda.criticos[0].lado, "inferior");
  cercano(izquierda.criticos[0].critico.valor, -1.6448536269514722);
  assert.equal(izquierda.hipotesis.h1, "μ < 70");
});

test("una media, Z con dos colas: se rechaza H₀ (z < −z_α/2)", function () {
  // n = 50, x̄ = 7.8, σ = 0.5; H₀: μ = 8, H₁: μ ≠ 8, α = 0.01
  const r = sinError(ph.pruebaMediaZ(50, 7.8, 0.5, true, 8, "dos-colas", 0.01));
  cercano(r.estadistico, -2.8284271247461925);
  cercano(r.criticos[0].critico.valor, -2.575829303548901);
  cercano(r.criticos[1].critico.valor, 2.5758293035489004);
  cercano(r.valorP, 0.00467773498104723);
  assert.equal(r.rechazar, true);
});

test("una media, Z con σ desconocida y n ≥ 30 (usa s), cola izquierda", function () {
  // n = 36, x̄ = 48.2, s = 4.1; H₀: μ = 50, H₁: μ < 50, α = 0.05
  const r = sinError(ph.pruebaMediaZ(36, 48.2, 4.1, false, 50, "izquierda", 0.05));
  cercano(r.estadistico, -2.6341463414634108);
  cercano(r.valorP, 0.004217456221522793);
  assert.equal(r.rechazar, true);
});

test("una media, t con n < 30, cola izquierda: no se rechaza H₀", function () {
  // n = 12, x̄ = 42, s = 11.9; H₀: μ = 46, H₁: μ < 46, α = 0.05
  const r = sinError(ph.pruebaMediaT(12, 42, 11.9, 46, "izquierda", 0.05));
  assert.equal(r.gl, 11);                                     // ν = n − 1
  assert.equal(r.distribucion, "t");
  assert.equal(r.criticos[0].critico.parametros, "gl = 11");
  cercano(r.estadistico, -1.1644039042479846);
  cercano(r.criticos[0].critico.valor, -1.795884818704044);  // −t_0.05,11
  cercano(r.valorP, 0.13444641275899213);
  assert.equal(r.rechazar, false);
});

test("una media desde una lista de datos: misma prueba que con los resúmenes", function () {
  const valores = est.leerLista("10.2, 9.8, 10.5, 10.9, 10.1, 10.4").valores;
  const d = est.calcularDescriptivos(valores);
  const r = sinError(ph.pruebaMediaT(d.n, d.media, d.desviacion, 10, "derecha", 0.05));
  assert.equal(r.gl, 5);
  cercano(r.estadistico, (d.media - 10) / (d.desviacion / Math.sqrt(6)));
});

// ---------- Una proporción ----------

test("una proporción, cola derecha: el error estándar usa π₀", function () {
  // n = 100, x = 70; H₀: π = 0.6, H₁: π > 0.6, α = 0.05
  const r = sinError(ph.pruebaProporcion(100, 70, null, 0.6, "derecha", 0.05));
  cercano(r.p, 0.7);
  cercano(r.q0, 0.4);
  cercano(r.errorEstandar, Math.sqrt(0.6 * 0.4 / 100));
  cercano(r.estadistico, 2.0412414523193148);
  cercano(r.valorP, 0.02061341666858185);
  assert.equal(r.rechazar, true);
  assert.deepEqual(r.advertencias, []);
  // Con p̂ en lugar de x se obtiene lo mismo.
  const conPhat = sinError(ph.pruebaProporcion(100, null, 0.7, 0.6, "derecha", 0.05));
  cercano(conPhat.estadistico, r.estadistico);
});

test("una proporción con p = 0 sí se puede probar, con advertencia si n·π₀ < 5", function () {
  const r = sinError(ph.pruebaProporcion(20, 0, null, 0.1, "izquierda", 0.05));
  cercano(r.estadistico, -0.1 / Math.sqrt(0.1 * 0.9 / 20));
  assert.equal(r.advertencias.length, 1);
  assert.match(r.advertencias[0], /n·π₀ o n·q₀ es menor que 5/);
});

// ---------- Una varianza ----------

test("una varianza con chi-cuadrada: las tres colas y sus valores críticos", function () {
  // n = 10, s = 1.2, H₀: σ² = 0.81 → χ² = 9 · 1.44 / 0.81 = 16
  const derecha = sinError(ph.pruebaVarianza(10, 1.2, null, 0.81, "derecha", 0.05));
  assert.equal(derecha.gl, 9);
  cercano(derecha.varianza, 1.44);
  cercano(derecha.estadistico, 16);
  cercano(derecha.criticos[0].critico.valor, 16.918977604620448);  // χ²_0.05,9
  cercano(derecha.valorP, 0.06688158777412673);
  assert.equal(derecha.rechazar, false);
  assert.equal(derecha.hipotesis.h0, "σ² = 0.81");

  const izquierda = sinError(ph.pruebaVarianza(10, 1.2, null, 0.81, "izquierda", 0.05));
  cercano(izquierda.criticos[0].critico.valor, 3.325112843066815); // χ²_0.95,9
  cercano(izquierda.valorP, 0.9331184122258733);
  assert.equal(izquierda.rechazar, false);

  const dos = sinError(ph.pruebaVarianza(10, null, 1.44, 0.81, "dos-colas", 0.05));
  cercano(dos.criticos[0].critico.valor, 2.7003894999803584);       // χ²_0.975,9
  cercano(dos.criticos[1].critico.valor, 19.02276779864163);        // χ²_0.025,9
  cercano(dos.valorP, 0.13376317554825345);                          // 2 · mín(colas)
  assert.equal(dos.rechazar, false);

  // Con α = 0.10 en cola derecha (crítico 14.68) sí se rechaza: valor p 0.0669 < 0.10.
  assert.equal(sinError(ph.pruebaVarianza(10, 1.2, null, 0.81, "derecha", 0.10)).rechazar, true);
});

// ---------- Dos medias ----------

test("dos medias con Z y σ conocidas, cola derecha", function () {
  const r = sinError(ph.pruebaDosMediasZ(40, 100, 5, 60, 95, 8, true, 0, "derecha", 0.01));
  cercano(r.diferencia, 5);
  cercano(r.errorEstandar, Math.sqrt(25 / 40 + 64 / 60));
  cercano(r.estadistico, 3.8442587221924476);
  cercano(r.valorP, 6.0458692779683354e-05);
  assert.equal(r.rechazar, true);
  assert.equal(r.hipotesis.h0, "μ₁ − μ₂ = 0");
  assert.match(r.conclusion, /es decir, μ₁ > μ₂/);
});

test("dos medias con t y varianzas iguales: gl = n₁ + n₂ − 2 y d₀ ≠ 0", function () {
  // n₁ = 12, x̄₁ = 85, s₁ = 4; n₂ = 10, x̄₂ = 81, s₂ = 5; H₀: μ₁ − μ₂ = 2, H₁: μ₁ − μ₂ > 2
  const r = sinError(ph.pruebaDosMediasTIguales(12, 85, 4, 10, 81, 5, 2, "derecha", 0.05));
  assert.equal(r.gl, 20);
  cercano(r.sp, 4.4777226354476225);
  cercano(r.estadistico, 1.0431627961927559);
  cercano(r.criticos[0].critico.valor, 1.7247182429207866);  // t_0.05,20
  cercano(r.valorP, 0.15465940995588925);
  assert.equal(r.rechazar, false);
  assert.equal(r.hipotesis.h1, "μ₁ − μ₂ > 2");
  // Con d₀ ≠ 0 no se agrega "es decir, μ₁ > μ₂", porque no es lo mismo.
  assert.doesNotMatch(r.conclusion, /es decir/);
});

test("dos medias con t y varianzas diferentes: gl de Welch (no entero), dos colas", function () {
  // n₁ = 15, x̄₁ = 23.1, s₁ = 2.9; n₂ = 11, x̄₂ = 20.4, s₂ = 5.8; α = 0.05
  const r = sinError(ph.pruebaDosMediasTDiferentes(15, 23.1, 2.9, 11, 20.4, 5.8, 0, "dos-colas", 0.05));
  cercano(r.gl, 13.67448168959504);
  assert.equal(Number.isInteger(r.gl), false);
  cercano(r.estadistico, 1.4193142528587446);
  cercano(r.criticos[1].critico.valor, 2.1495865042109537);
  cercano(r.valorP, 0.17819941541673853);
  assert.equal(r.rechazar, false);
});

// ---------- Dos proporciones ----------

test("dos proporciones con proporción combinada, cola derecha", function () {
  // n₁ = 200, x₁ = 120; n₂ = 500, x₂ = 240; H₀: π₁ = π₂, H₁: π₁ > π₂, α = 0.05
  const r = sinError(ph.pruebaDosProporciones(200, 120, null, 500, 240, null, "derecha", 0.05));
  cercano(r.p1, 0.6);
  cercano(r.p2, 0.48);
  cercano(r.combinada, 360 / 700);
  cercano(r.estadistico, 2.869720215917757);
  cercano(r.valorP, 0.0020541757121497117);
  assert.equal(r.rechazar, true);
  assert.equal(r.hipotesis.h0, "π₁ − π₂ = 0");
  assert.match(r.conclusion, /es decir, π₁ > π₂/);
  // Con p̂ en lugar de x, el mismo resultado.
  const conPhat = sinError(ph.pruebaDosProporciones(200, null, 0.6, 500, null, 0.48, "derecha", 0.05));
  cercano(conPhat.estadistico, r.estadistico);
});

test("dos proporciones desde listas 0/1", function () {
  const a = est.calcularProporcion(est.leerListaBinaria("1 1 0 1 0 1 1 0").valores);
  const b = est.calcularProporcion(est.leerListaBinaria("0 1 0 0 1 0").valores);
  const r = sinError(ph.pruebaDosProporciones(a.n, a.exitos, null, b.n, b.exitos, null, "dos-colas", 0.05));
  cercano(r.combinada, 7 / 14);
  assert.equal(r.advertencias.length, 1);                     // muestras pequeñas: n·p < 5
});

// ---------- Muestras pareadas ----------

test("muestras pareadas con resumen: t, ν = n − 1, cola derecha", function () {
  // d = 2, 4, 1, 3, 5, −1, 2, 4 → d̄ = 2.5, s_d = 1.9272; H₁: μ_D > 0, α = 0.01
  const d = est.calcularDescriptivos([2, 4, 1, 3, 5, -1, 2, 4]);
  const r = sinError(ph.pruebaPareadas(d.n, d.media, d.desviacion, 0, "derecha", 0.01));
  assert.equal(r.gl, 7);
  cercano(r.estadistico, 3.668996928526714);
  cercano(r.criticos[0].critico.valor, 2.9979515668685277);  // t_0.01,7
  cercano(r.valorP, 0.003987407956293977);
  assert.equal(r.rechazar, true);
  assert.equal(r.hipotesis.h0, "μ_D = 0");
  assert.match(r.conclusion, /es decir, μ₁ > μ₂/);
});

test("muestras pareadas desde dos listas: se usan las diferencias, no muestras independientes", function () {
  const antes = [12.1, 11.4, 13.0, 12.7, 11.9, 12.4];
  const despues = [11.8, 11.6, 12.1, 12.0, 11.2, 12.5];
  const d = est.calcularDescriptivos(est.calcularDiferencias(antes, despues).diferencias);
  const r = sinError(ph.pruebaPareadas(d.n, d.media, d.desviacion, 0, "dos-colas", 0.05));
  assert.equal(r.gl, 5);
  cercano(r.estadistico, 2.050630985911791);
  cercano(r.valorP, 0.09556604729336929);
  assert.equal(r.rechazar, false);
});

// ---------- Cociente de varianzas ----------

test("cociente de varianzas con F: dos colas y cola izquierda", function () {
  // n₁ = 12, s₁ = 4; n₂ = 10, s₂ = 5 → F = 16 / 25 = 0.64, ν₁ = 11, ν₂ = 9, α = 0.10
  const dos = sinError(ph.pruebaCocienteVarianzas(12, 4, null, 10, 5, null, "dos-colas", 0.10));
  assert.equal(dos.gl1, 11);
  assert.equal(dos.gl2, 9);
  cercano(dos.estadistico, 0.64);
  cercano(dos.criticos[0].critico.valor, 0.34527730855736555); // F_0.95(11,9)
  cercano(dos.criticos[1].critico.valor, 3.1024854075283783);  // F_0.05(11,9)
  cercano(dos.valorP, 0.47864961042191234);
  assert.equal(dos.rechazar, false);
  assert.equal(dos.hipotesis.h0, "σ₁² / σ₂² = 1");

  const izquierda = sinError(ph.pruebaCocienteVarianzas(12, 4, null, 10, 5, null, "izquierda", 0.10));
  cercano(izquierda.criticos[0].critico.valor, 0.43985006739940385);
  cercano(izquierda.valorP, 0.23932480521095617);
  assert.match(izquierda.conclusion, /es decir, σ₁² < σ₂²/);
});

test("cociente de varianzas con F, cola derecha: se rechaza H₀", function () {
  const r = sinError(ph.pruebaCocienteVarianzas(16, null, 30, 13, null, 8, "derecha", 0.05));
  cercano(r.estadistico, 3.75);
  cercano(r.criticos[0].critico.valor, 2.6168512341321053);    // F_0.05(15,12)
  cercano(r.valorP, 0.013132507942640089);
  assert.equal(r.rechazar, true);
});

// ---------- Regla de decisión ----------

test("rechazar H₀ coincide siempre con valor p < α", function () {
  const casos = [
    ["z", null, null], ["t", 7, null], ["t", 13.67, null], ["chi2", 9, null], ["f", 11, 9],
  ];
  const estadisticos = [-3, -1.7, -0.2, 0.05, 0.5, 1, 2.2, 3.4, 16, 25];
  for (const [dist, gl1, gl2] of casos) {
    for (const x of estadisticos) {
      if ((dist === "chi2" || dist === "f") && x <= 0) continue;
      for (const alternativa of ["izquierda", "derecha", "dos-colas"]) {
        for (const alfa of [0.01, 0.05, 0.1]) {
          const d = ph.decidirPrueba(x, dist, gl1, gl2, alternativa, alfa);
          assert.equal(d.rechazar, d.valorP < alfa, [dist, x, alternativa, alfa].join(" "));
        }
      }
    }
  }
});

test("un estadístico igual al valor crítico no está en la región de rechazo", function () {
  const critico = ph.decidirPrueba(0, "z", null, null, "derecha", 0.05).criticos[0].critico.valor;
  assert.equal(ph.decidirPrueba(critico, "z", null, null, "derecha", 0.05).rechazar, false);
  assert.equal(ph.decidirPrueba(critico + 1e-9, "z", null, null, "derecha", 0.05).rechazar, true);
  assert.equal(ph.decidirPrueba(-critico - 1e-9, "z", null, null, "izquierda", 0.05).rechazar, true);
  assert.equal(ph.decidirPrueba(-critico + 1e-9, "z", null, null, "izquierda", 0.05).rechazar, false);
});

test("el valor p de dos colas es el doble de la cola más pequeña y no pasa de 1", function () {
  const d = ph.decidirPrueba(0, "z", null, null, "dos-colas", 0.05);
  cercano(d.valorP, 1);
  const chi = ph.decidirPrueba(2, "chi2", 9, null, "dos-colas", 0.05);  // cola izquierda pequeña
  cercano(chi.valorP, 2 * chi.colaIzquierda);
  assert.equal(chi.rechazar, true);                                     // 2 < χ²_0.975,9 = 2.70
});

// ---------- Entradas inválidas ----------

test("falta o no es válida la hipótesis alternativa o α", function () {
  for (const alternativa of ["", undefined, "otra", "toString"]) {
    assert.match(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, alternativa, 0.05).error, /hipótesis alternativa H₁/);
  }
  for (const alfa of [0, 1, -0.05, 5, NaN, null, "0.05"]) {
    assert.match(ph.pruebaMediaT(12, 42, 11.9, 46, "izquierda", alfa).error, /nivel de significancia α/);
  }
});

test("falta el valor de H₀ o no es válido", function () {
  assert.match(ph.pruebaMediaZ(100, 71.8, 8.9, true, null, "derecha", 0.05).error, /Falta μ₀/);
  assert.match(ph.pruebaMediaT(12, 42, 11.9, NaN, "derecha", 0.05).error, /μ₀.*debe ser un número/);
  assert.match(ph.pruebaProporcion(100, 70, null, null, "derecha", 0.05).error, /Falta π₀/);
  assert.match(ph.pruebaProporcion(100, 70, null, 0, "derecha", 0.05).error, /entre 0 y 1, sin incluirlos/);
  assert.match(ph.pruebaProporcion(100, 70, null, 60, "derecha", 0.05).error, /divídelo entre 100/);
  assert.match(ph.pruebaVarianza(10, 1.2, null, 0, "derecha", 0.05).error, /σ₀².*mayor que 0/);
  assert.match(ph.pruebaVarianza(10, 1.2, null, null, "derecha", 0.05).error, /Falta σ₀²/);
  assert.match(ph.pruebaDosMediasZ(40, 100, 5, 60, 95, 8, true, null, "derecha", 0.05).error, /Falta d₀/);
  assert.match(ph.pruebaPareadas(8, 2.5, 1.9, null, "derecha", 0.05).error, /Falta d₀/);
});

test("no se supone σ conocida ni se usa Z o t fuera de sus condiciones", function () {
  assert.match(ph.pruebaMediaZ(25, 48.2, 4.1, false, 50, "izquierda", 0.05).error, /Z solo si n ≥ 30/);
  assert.match(ph.pruebaMediaT(30, 42, 11.9, 46, "izquierda", 0.05).error, /t solo si n < 30/);
  assert.match(ph.pruebaDosMediasZ(50, 76, 6, 29, 82, 8, false, 0, "derecha", 0.05).error, /ambas muestras son grandes/);
  assert.match(ph.pruebaDosMediasTIguales(12, 85, 4, 30, 81, 5, 0, "derecha", 0.05).error, /muestras son pequeñas/);
  assert.match(ph.pruebaDosMediasTDiferentes(30, 85, 4, 31, 81, 5, 0, "derecha", 0.05).error, /confirma con tu profesor/);
});

test("datos de la muestra faltantes o inválidos", function () {
  assert.match(ph.pruebaMediaZ(null, 71.8, 8.9, true, 70, "derecha", 0.05).error, /Falta el tamaño de la muestra/);
  assert.match(ph.pruebaMediaT(12.5, 42, 11.9, 46, "derecha", 0.05).error, /número entero/);
  assert.match(ph.pruebaMediaT(1, 42, 11.9, 46, "derecha", 0.05).error, /mayor o igual que 2/);
  assert.match(ph.pruebaMediaZ(100, null, 8.9, true, 70, "derecha", 0.05).error, /Falta la media muestral/);
  assert.match(ph.pruebaMediaZ(100, 71.8, 0, true, 70, "derecha", 0.05).error, /σ.*mayor que 0/);
  assert.match(ph.pruebaProporcion(100, 120, null, 0.6, "derecha", 0.05).error, /entero entre 0 y n = 100/);
  assert.match(ph.pruebaProporcion(100, 70, 0.7, 0.6, "derecha", 0.05).error, /solo uno de los dos datos/);
  assert.match(ph.pruebaProporcion(100, null, null, 0.6, "derecha", 0.05).error, /Falta el número de éxitos/);
  assert.match(ph.pruebaVarianza(10, 1.2, 1.44, 0.81, "derecha", 0.05).error, /solo uno de los dos datos/);
  assert.match(ph.pruebaVarianza(10, null, null, 0.81, "derecha", 0.05).error, /Falta la desviación/);
  assert.match(ph.pruebaPareadas(8, 2.5, 0, 0, "derecha", 0.05).error, /s_d.*mayor que 0/);
  assert.match(ph.pruebaPareadas(1, 2.5, 1, 0, "derecha", 0.05).error, /pares/);
  assert.match(ph.pruebaCocienteVarianzas(1, 4, null, 10, 5, null, "derecha", 0.05).error, /mayor o igual que 2/);
  assert.match(ph.pruebaCocienteVarianzas(12, null, null, 10, 5, null, "derecha", 0.05).error, /muestra 1/);
  assert.match(ph.pruebaDosProporciones(10, 3, null, 12, null, 1.5, "derecha", 0.05).error, /muestra 2 debe estar entre 0 y 1/);
});

test("dos proporciones sin éxitos (o sin fracasos) en total: no se puede calcular", function () {
  assert.match(ph.pruebaDosProporciones(10, 0, null, 12, 0, null, "derecha", 0.05).error, /todas las observaciones son fracasos/);
  assert.match(ph.pruebaDosProporciones(10, 10, null, 12, 12, null, "derecha", 0.05).error, /todas las observaciones son éxitos/);
});

// En el navegador todos los archivos de js/ comparten el ámbito global: si dos archivos
// declaran una función con el mismo nombre, la del último archivo reemplaza a la otra
// (Node no lo detecta porque carga cada archivo por separado).
test("los archivos de js/ no repiten nombres de funciones ni constantes globales", function () {
  const fs = require("node:fs");
  const path = require("node:path");
  const carpeta = path.join(__dirname, "..", "js");
  const dondeEsta = {};
  for (const archivo of fs.readdirSync(carpeta).filter(function (a) { return a.endsWith(".js"); })) {
    const texto = fs.readFileSync(path.join(carpeta, archivo), "utf8");
    for (const m of texto.matchAll(/^(?:function|const|let)\s+([A-Za-z0-9_]+)/gm)) {
      assert.equal(dondeEsta[m[1]], undefined, m[1] + " está en " + dondeEsta[m[1]] + " y en " + archivo);
      dondeEsta[m[1]] = archivo;
    }
  }
});

test("un α demasiado pequeño para los valores críticos produce un error visible", function () {
  assert.match(ph.pruebaMediaZ(100, 71.8, 8.9, true, 70, "dos-colas", 0.000001).error, /No se pudo obtener el valor crítico/);
});
