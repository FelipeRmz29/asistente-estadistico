// Pruebas de js/valores-criticos.js con el ejecutor de pruebas incluido en Node.

const test = require("node:test");
const assert = require("node:assert/strict");
const vc = require("../js/valores-criticos.js");

function valorCercano(resultado, esperado) {
  assert.equal(resultado.error, undefined, resultado.error);
  const diferencia = Math.abs(resultado.valor - esperado);
  assert.ok(diferencia < 1e-9 * Math.max(1, Math.abs(esperado)),
    resultado.valor + " debería ser " + esperado);
}

// ---------- Normal estándar Z ----------

test("Z: valores de tabla", function () {
  valorCercano(vc.valorCriticoZ(0.9), 1.2815515655446004);
  valorCercano(vc.valorCriticoZ(0.95), 1.6448536269514722);
  valorCercano(vc.valorCriticoZ(0.975), 1.959963984540054);
  valorCercano(vc.valorCriticoZ(0.995), 2.5758293035489004);
});

test("Z: es simétrica y la mediana es 0", function () {
  valorCercano(vc.valorCriticoZ(0.025), -1.959963984540054);
  assert.equal(vc.valorCriticoZ(0.5).valor, 0);
});

// ---------- t de Student ----------

test("t: valores de tabla", function () {
  valorCercano(vc.valorCriticoT(0.975, 10), 2.2281388519862744);
  valorCercano(vc.valorCriticoT(0.95, 5), 2.0150483733330233);
  valorCercano(vc.valorCriticoT(0.995, 20), 2.8453397097861077);
  valorCercano(vc.valorCriticoT(0.975, 30), 2.0422724563012378);
  valorCercano(vc.valorCriticoT(0.025, 10), -2.2281388519862744);
});

test("t: fórmulas exactas con 1 y 2 grados de libertad", function () {
  valorCercano(vc.valorCriticoT(0.975, 1), Math.tan(Math.PI * (0.975 - 0.5)));
  valorCercano(vc.valorCriticoT(0.95, 2), (2 * 0.95 - 1) / Math.sqrt(2 * 0.95 * 0.05));
});

test("redondearGL: siempre hacia abajo al entero inferior", function () {
  assert.equal(vc.redondearGL(23.9), 23);
  assert.equal(vc.redondearGL(32.9), 32);
  assert.equal(vc.redondearGL(17.1), 17);
  assert.equal(vc.redondearGL(20), 20);
  assert.equal(vc.redondearGL(1), 1);
  assert.equal(vc.redondearGL(13.999999999999998), 14);
  assert.equal(vc.redondearGL(13.9999), 13);
});

test("t, chi-cuadrada y F: los grados de libertad no enteros se redondean hacia abajo", function () {
  const t = vc.valorCriticoT(0.975, 17.37);
  valorCercano(t, vc.valorCriticoT(0.975, 17).valor);
  assert.equal(t.parametros, "gl = 17");
  assert.equal(vc.valorCriticoT(0.975, 23.9).parametros, "gl = 23");
  assert.equal(vc.valorCriticoT(0.975, 32.9).valor, vc.valorCriticoT(0.975, 32).valor);
  assert.equal(vc.valorCriticoChi2(0.95, 9.9).valor, vc.valorCriticoChi2(0.95, 9).valor);
  const f = vc.valorCriticoF(0.95, 5.9, 10.9);
  assert.equal(f.valor, vc.valorCriticoF(0.95, 5, 10).valor);
  assert.equal(f.parametros, "gl1 = 5 (numerador), gl2 = 10 (denominador)");
});

test("t: con muchos grados de libertad se acerca a Z", function () {
  const t = vc.valorCriticoT(0.975, 1000000).valor;
  const z = vc.valorCriticoZ(0.975).valor;
  assert.ok(Math.abs(t - z) < 1e-5);
  assert.ok(t > z);
});

// ---------- Chi-cuadrada ----------

test("chi-cuadrada: valores de tabla", function () {
  valorCercano(vc.valorCriticoChi2(0.95, 10), 18.307038053275146);
  valorCercano(vc.valorCriticoChi2(0.975, 10), 20.483177350807388);
  valorCercano(vc.valorCriticoChi2(0.025, 10), 3.2469727802368413);
  valorCercano(vc.valorCriticoChi2(0.995, 1), 7.879438576622417);
  valorCercano(vc.valorCriticoChi2(0.05, 24), 13.848425027170224);
});

test("chi-cuadrada: fórmula exacta con 2 grados de libertad", function () {
  valorCercano(vc.valorCriticoChi2(0.975, 2), -2 * Math.log(0.025));
  valorCercano(vc.valorCriticoChi2(0.1, 2), -2 * Math.log(0.9));
});

test("chi-cuadrada con 1 gl es el cuadrado de Z", function () {
  valorCercano(vc.valorCriticoChi2(0.95, 1), Math.pow(1.959963984540054, 2));
});

// ---------- F ----------

test("F: valores de tabla", function () {
  valorCercano(vc.valorCriticoF(0.95, 5, 10), 3.3258345304130104);
  valorCercano(vc.valorCriticoF(0.95, 10, 5), 4.73506306969342);
  valorCercano(vc.valorCriticoF(0.99, 4, 9), 6.422085458153198);
  valorCercano(vc.valorCriticoF(0.975, 6, 12), 3.7282921153925073);
});

test("F: el orden de los grados de libertad importa (numerador, denominador)", function () {
  assert.notEqual(vc.valorCriticoF(0.95, 5, 10).valor, vc.valorCriticoF(0.95, 10, 5).valor);
});

test("F: propiedad recíproca F₁₋α(gl1, gl2) = 1 / Fα(gl2, gl1)", function () {
  valorCercano(vc.valorCriticoF(0.05, 5, 10), 0.21119042878234487);
  valorCercano(vc.valorCriticoF(0.05, 5, 10), 1 / vc.valorCriticoF(0.95, 10, 5).valor);
});

test("F con gl1 = 1 es el cuadrado de t", function () {
  const t = vc.valorCriticoT(0.975, 12).valor;
  valorCercano(vc.valorCriticoF(0.95, 1, 12), t * t);
});

// ---------- Datos que acompañan al valor ----------

test("el resultado indica distribución, parámetros y probabilidades usadas", function () {
  const r = vc.valorCriticoT(0.975, 10);
  assert.equal(r.distribucion, "t de Student");
  assert.equal(r.parametros, "gl = 10");
  assert.equal(r.areaIzquierda, 0.975);
  assert.ok(Math.abs(r.areaDerecha - 0.025) < 1e-15);
  assert.equal(r.descripcion,
    "Distribución t de Student, gl = 10; área a la izquierda = 0.975, área a la derecha = 0.025");

  const f = vc.valorCriticoF(0.95, 5, 10);
  assert.match(f.parametros, /gl1 = 5 \(numerador\), gl2 = 10 \(denominador\)/);
});

test("el valor no se redondea", function () {
  const z = vc.valorCriticoZ(0.975).valor;
  assert.notEqual(z, 1.96);
  assert.notEqual(z, 1.9600);
  assert.ok(String(z).length > 10);
});

// ---------- Errores de rango ----------

test("rechaza probabilidades fuera de rango o no numéricas", function () {
  for (const p of [0, 1, -0.5, 1.5, 0.0000001, 0.9999999, NaN, Infinity, "0.95", undefined]) {
    const r = vc.valorCriticoZ(p);
    assert.equal(r.valor, undefined, "debería rechazar " + p);
    assert.match(r.error, /probabilidad acumulada debe ser un número entre 0.000001 y 0.999999/);
  }
  assert.match(vc.valorCriticoT(1, 10).error, /probabilidad/);
  assert.match(vc.valorCriticoChi2(0, 10).error, /probabilidad/);
  assert.match(vc.valorCriticoF(95, 5, 10).error, /se recibió 95/);
});

test("acepta los extremos del rango de probabilidad", function () {
  valorCercano(vc.valorCriticoZ(0.000001), -4.753424308817087);
  valorCercano(vc.valorCriticoZ(0.999999), 4.753424308817087);
});

test("rechaza grados de libertad fuera de rango o no numéricos", function () {
  for (const gl of [0, 0.5, -3, 1000001, NaN, Infinity, "10", undefined]) {
    const r = vc.valorCriticoT(0.975, gl);
    assert.equal(r.valor, undefined, "debería rechazar gl = " + gl);
    assert.match(r.error, /grados de libertad \(gl\) deben ser un número entre 1 y 1000000/);
  }
  assert.match(vc.valorCriticoChi2(0.95, 0).error, /grados de libertad/);
});

test("F: indica cuál de los grados de libertad es inválido", function () {
  assert.match(vc.valorCriticoF(0.95, 0, 10).error, /del numerador \(gl1\).*se recibió 0/);
  assert.match(vc.valorCriticoF(0.95, 5, -1).error, /del denominador \(gl2\).*se recibió -1/);
});

// ---------- Funciones de distribución acumulada ----------

test("las CDF devuelven la probabilidad usada para el valor crítico", function () {
  const casos = [
    [vc.cdfNormal(1.959963984540054), 0.975],
    [vc.cdfT(2.2281388519862744, 10), 0.975],
    [vc.cdfChi2(18.307038053275146, 10), 0.95],
    [vc.cdfF(3.3258345304130104, 5, 10), 0.95],
  ];
  for (const [real, esperado] of casos) {
    assert.ok(Math.abs(real - esperado) < 1e-12, real + " debería ser " + esperado);
  }
});
