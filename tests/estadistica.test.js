// Pruebas de js/estadistica.js con el ejecutor de pruebas incluido en Node.
// Ejecutar desde la carpeta del proyecto:  node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const est = require("../js/estadistica.js");

// Compara números decimales con una tolerancia muy pequeña.
function casiIgual(real, esperado) {
  assert.ok(Math.abs(real - esperado) < 1e-12, real + " debería ser " + esperado);
}

// ---------- Lectura de listas ----------

test("lee números separados por comas, espacios o saltos de línea", function () {
  assert.deepEqual(est.leerLista("1, 2, 3").valores, [1, 2, 3]);
  assert.deepEqual(est.leerLista("1,2,3").valores, [1, 2, 3]);
  assert.deepEqual(est.leerLista("1 2   3").valores, [1, 2, 3]);
  assert.deepEqual(est.leerLista("1\n2\n3").valores, [1, 2, 3]);
  assert.deepEqual(est.leerLista("12.5, 14, 15.2").valores, [12.5, 14, 15.2]);
});

test("con punto y coma, la coma es decimal", function () {
  assert.deepEqual(est.leerLista("1,5; 2,7; 3,1").valores, [1.5, 2.7, 3.1]);
  assert.deepEqual(est.leerLista("1,5;2,7;3").valores, [1.5, 2.7, 3]);
  assert.deepEqual(est.leerLista("1.5; 2.7").valores, [1.5, 2.7]);
  assert.deepEqual(est.leerLista("1,5;\n2,7").valores, [1.5, 2.7]);
});

test("acepta signos, decimales sin cero inicial y notación científica", function () {
  assert.deepEqual(est.leerLista("-3, +4, .5, 2e3, 1.5E-2").valores, [-3, 4, 0.5, 2000, 0.015]);
});

test("ignora separadores al inicio o al final", function () {
  assert.deepEqual(est.leerLista("  1, 2, 3,  ").valores, [1, 2, 3]);
  assert.deepEqual(est.leerLista("1; 2; 3;").valores, [1, 2, 3]);
});

test("conserva el orden original de los datos", function () {
  assert.deepEqual(est.leerLista("9, 1, 5, 1").valores, [9, 1, 5, 1]);
});

test("rechaza una lista vacía", function () {
  assert.match(est.leerLista("").error, /vacía/);
  assert.match(est.leerLista("   \n ").error, /vacía/);
  assert.match(est.leerLista(" ; ; ").error, /ningún valor/);
});

test("rechaza datos no numéricos e indica cuál es", function () {
  const resultado = est.leerLista("1, a, 3");
  assert.equal(resultado.valores, undefined);
  assert.match(resultado.error, /dato 2/);
  assert.match(resultado.error, /«a»/);
});

test("rechaza formatos numéricos ambiguos o no finitos", function () {
  assert.match(est.leerLista("1,5,3; 2").error, /«1,5,3»/);  // dos comas en un dato
  assert.match(est.leerLista("1..5").error, /no es un número/);
  assert.match(est.leerLista("0x10").error, /no es un número/);
  assert.match(est.leerLista("Infinity").error, /no es un número/);
  assert.match(est.leerLista("NaN").error, /no es un número/);
  assert.match(est.leerLista("1, -").error, /no es un número/);
  assert.match(est.leerLista("1e400").error, /demasiado grande/);
});

test("lista binaria: acepta solo 0 y 1", function () {
  assert.deepEqual(est.leerListaBinaria("1, 0, 1, 1, 0").valores, [1, 0, 1, 1, 0]);
  assert.deepEqual(est.leerListaBinaria("1;0;1").valores, [1, 0, 1]);
  assert.match(est.leerListaBinaria("1, 0, 2").error, /dato 3/);
  assert.match(est.leerListaBinaria("1, 0.5").error, /solo 1 \(éxito\) o 0/);
  assert.match(est.leerListaBinaria("1, x").error, /«x»/);
  assert.match(est.leerListaBinaria("").error, /vacía/);
});

// ---------- Estadísticos descriptivos ----------

test("media, varianza y desviación de un ejemplo conocido", function () {
  // 2, 4, 4, 4, 5, 5, 7, 9: suma 40, media 5, Σ(x − x̄)² = 32, s² = 32/7
  const d = est.calcularDescriptivos([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(d.n, 8);
  assert.equal(d.suma, 40);
  assert.equal(d.media, 5);
  casiIgual(d.varianza, 32 / 7);
  casiIgual(d.desviacion, Math.sqrt(32 / 7));
});

test("la varianza muestral divide entre n − 1", function () {
  // 1, 2, 3, 4: media 2.5, Σ(x − x̄)² = 5, s² = 5/3 (con n daría 1.25)
  casiIgual(est.calcularVarianzaMuestral([1, 2, 3, 4]), 5 / 3);
});

test("ejemplo con decimales leído con coma decimal", function () {
  // 1.5, 2.7, 3.1: media 7.3/3, Σ(x − x̄)² = 1.3866..., s² = 0.69333...
  const d = est.calcularDescriptivos(est.leerLista("1,5; 2,7; 3,1").valores);
  assert.equal(d.n, 3);
  casiIgual(d.media, 7.3 / 3);
  casiIgual(d.varianza, 0.6933333333333334);
});

test("la varianza es precisa con valores grandes", function () {
  // Desviaciones respecto a la media: −6, −3, 3, 6 -> Σ = 90, s² = 30
  const d = est.calcularDescriptivos([1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]);
  assert.equal(d.media, 1e9 + 10);
  casiIgual(d.varianza, 30);
});

test("con un solo dato no hay varianza ni desviación", function () {
  const d = est.calcularDescriptivos([7]);
  assert.equal(d.n, 1);
  assert.equal(d.media, 7);
  assert.equal(d.varianza, null);
  assert.equal(d.desviacion, null);
});

test("datos iguales tienen varianza cero", function () {
  const d = est.calcularDescriptivos([3, 3, 3]);
  assert.equal(d.varianza, 0);
  assert.equal(d.desviacion, 0);
});

test("los cálculos no modifican la lista original", function () {
  const datos = [5, 1, 3];
  est.calcularDescriptivos(datos);
  assert.deepEqual(datos, [5, 1, 3]);
});

// ---------- Proporciones ----------

test("proporción muestral a partir de 0 y 1", function () {
  const p = est.calcularProporcion([1, 0, 1, 1, 0]);
  assert.equal(p.n, 5);
  assert.equal(p.exitos, 3);
  assert.equal(p.proporcion, 0.6);
});

test("proporción con todos éxitos o todos fracasos", function () {
  assert.equal(est.calcularProporcion([1, 1]).proporcion, 1);
  assert.equal(est.calcularProporcion([0, 0, 0]).proporcion, 0);
});

// ---------- Datos pareados ----------

test("diferencias pareadas: muestra 1 − muestra 2, en orden", function () {
  const r = est.calcularDiferencias([5, 7, 9], [3, 7, 4]);
  assert.deepEqual(r.diferencias, [2, 0, 5]);
});

test("estadísticos de las diferencias pareadas", function () {
  // d = 2, 0, 5: media 7/3, Σ(d − d̄)² = 38/3, s_d² = 19/3
  const d = est.calcularDescriptivos(est.calcularDiferencias([5, 7, 9], [3, 7, 4]).diferencias);
  casiIgual(d.media, 7 / 3);
  casiIgual(d.varianza, 19 / 3);
});

test("listas pareadas de distinto tamaño producen un error claro", function () {
  const r = est.calcularDiferencias([1, 2, 3], [1, 2]);
  assert.equal(r.diferencias, undefined);
  assert.match(r.error, /muestra 1 tiene 3 y la muestra 2 tiene 2/);
});
