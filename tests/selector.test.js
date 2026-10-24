// Pruebas de js/selector.js con el ejecutor de pruebas incluido en Node.
// Ejecutar desde la carpeta del proyecto:  node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CASOS, TEXTOS_SELECTOR, PREGUNTAS_SELECTOR, seleccionVacia, tocarOpcion, preguntasVisibles,
  preguntasPendientes, casoDeSeleccion, datosParaMetodo,
} = require("../js/selector.js");
const { identificarMetodo } = require("../js/metodos.js");

// Atajo: toca varias tarjetas en orden, empezando sin nada elegido.
function tocarTodo(tarjetas) {
  let seleccion = seleccionVacia();
  for (const [pregunta, valor] of tarjetas) seleccion = tocarOpcion(seleccion, pregunta, valor);
  return seleccion;
}

// ---------- Elegir y quitar ----------

test("al inicio no hay nada elegido y solo se pregunta el tipo y el parámetro", function () {
  const s = seleccionVacia();
  assert.deepEqual(preguntasVisibles(s), ["tipo", "parametro"]);
  assert.deepEqual(preguntasPendientes(s), ["tipo", "parametro"]);
  assert.equal(casoDeSeleccion(s), "");
});

test("tocar una tarjeta la elige y tocarla otra vez la quita", function () {
  const elegida = tocarOpcion(seleccionVacia(), "tipo", "intervalo");
  assert.equal(elegida.tipo, "intervalo");
  assert.equal(tocarOpcion(elegida, "tipo", "intervalo").tipo, "");
});

test("tocar otra tarjeta de la misma pregunta reemplaza a la anterior", function () {
  const s = tocarTodo([["tipo", "intervalo"], ["tipo", "prueba"]]);
  assert.equal(s.tipo, "prueba");
});

test("tocar no cambia la selección recibida", function () {
  const s = seleccionVacia();
  tocarOpcion(s, "tipo", "intervalo");
  assert.equal(s.tipo, "");
});

// ---------- Qué preguntas aparecen ----------

test("una media pregunta por σ, pero no por la relación ni por las varianzas", function () {
  const s = tocarTodo([["parametro", "media"], ["muestras", "una"]]);
  assert.deepEqual(preguntasVisibles(s), ["tipo", "parametro", "muestras", "sigma"]);
});

test("dos medias preguntan primero si son independientes o pareadas", function () {
  const s = tocarTodo([["parametro", "media"], ["muestras", "dos"]]);
  assert.deepEqual(preguntasVisibles(s), ["tipo", "parametro", "muestras", "relacion"]);
});

test("dos medias independientes con σ desconocidas preguntan por las varianzas", function () {
  const base = [["parametro", "media"], ["muestras", "dos"], ["relacion", "independientes"]];
  assert.deepEqual(preguntasVisibles(tocarTodo(base.concat([["sigma", "conocida"]]))),
    ["tipo", "parametro", "muestras", "relacion", "sigma"]);
  assert.deepEqual(preguntasVisibles(tocarTodo(base.concat([["sigma", "desconocida"]]))), PREGUNTAS_SELECTOR);
});

test("las muestras pareadas no preguntan por σ ni por las varianzas", function () {
  const s = tocarTodo([["parametro", "media"], ["muestras", "dos"], ["relacion", "pareadas"]]);
  assert.deepEqual(preguntasVisibles(s), ["tipo", "parametro", "muestras", "relacion"]);
});

test("proporciones y varianzas no preguntan por la relación, σ ni las varianzas", function () {
  for (const parametro of ["proporcion", "varianza"]) {
    for (const muestras of ["una", "dos"]) {
      const s = tocarTodo([["parametro", parametro], ["muestras", muestras]]);
      assert.deepEqual(preguntasVisibles(s), ["tipo", "parametro", "muestras"], parametro + ", " + muestras);
    }
  }
});

test("una respuesta a una pregunta que no se ve se ignora", function () {
  const s = tocarTodo([["parametro", "proporcion"], ["muestras", "una"], ["sigma", "conocida"]]);
  assert.equal(s.sigma, "");
  assert.equal(datosParaMetodo(s).sigma, "");
});

// ---------- Cambiar respuestas sin dejar combinaciones incompatibles ----------

test("pasar de dos muestras a una quita la relación y las varianzas, pero no σ", function () {
  const s = tocarTodo([["tipo", "intervalo"], ["parametro", "media"], ["muestras", "dos"], ["relacion", "independientes"],
    ["sigma", "desconocida"], ["varianzas", "iguales"], ["muestras", "una"]]);
  assert.equal(s.relacion, "");
  assert.equal(s.varianzas, "");
  assert.equal(s.sigma, "desconocida");
  assert.equal(casoDeSeleccion(s), "una-media");
});

test("pasar de media a proporción quita σ y la relación", function () {
  const s = tocarTodo([["parametro", "media"], ["muestras", "dos"], ["relacion", "pareadas"], ["parametro", "proporcion"]]);
  assert.equal(s.relacion, "");
  assert.equal(s.muestras, "dos");
  assert.equal(casoDeSeleccion(s), "dos-proporciones");
});

test("pasar a muestras pareadas quita σ y las varianzas", function () {
  const s = tocarTodo([["parametro", "media"], ["muestras", "dos"], ["relacion", "independientes"],
    ["sigma", "desconocida"], ["varianzas", "diferentes"], ["relacion", "pareadas"]]);
  assert.equal(s.sigma, "");
  assert.equal(s.varianzas, "");
  assert.equal(casoDeSeleccion(s), "pareadas");
});

test("quitar el parámetro quita todo lo que depende de él, pero no el tipo", function () {
  const s = tocarTodo([["tipo", "prueba"], ["parametro", "media"], ["muestras", "una"], ["sigma", "conocida"],
    ["parametro", "media"]]);
  assert.deepEqual(s, Object.assign(seleccionVacia(), { tipo: "prueba" }));
});

// ---------- Caso resultante ----------

test("cada combinación completa da el caso de js/metodos.js", function () {
  const combinaciones = {
    "una-media": [["parametro", "media"], ["muestras", "una"]],
    "dos-medias": [["parametro", "media"], ["muestras", "dos"], ["relacion", "independientes"]],
    "pareadas": [["parametro", "media"], ["muestras", "dos"], ["relacion", "pareadas"]],
    "una-proporcion": [["parametro", "proporcion"], ["muestras", "una"]],
    "dos-proporciones": [["parametro", "proporcion"], ["muestras", "dos"]],
    "una-varianza": [["parametro", "varianza"], ["muestras", "una"]],
    "cociente-varianzas": [["parametro", "varianza"], ["muestras", "dos"]],
  };
  assert.deepEqual(Object.keys(combinaciones).sort(), Object.keys(CASOS).sort());
  for (const caso in combinaciones) {
    assert.equal(casoDeSeleccion(tocarTodo(combinaciones[caso])), caso, caso);
  }
});

test("sin el número de muestras o la relación no hay caso", function () {
  assert.equal(casoDeSeleccion(tocarTodo([["parametro", "media"]])), "");
  assert.equal(casoDeSeleccion(tocarTodo([["parametro", "media"], ["muestras", "dos"]])), "");
});

test("cada pregunta tiene su texto para preguntarla y para decir que falta", function () {
  for (const pregunta of PREGUNTAS_SELECTOR) {
    assert.match(TEXTOS_SELECTOR[pregunta].pregunta, /^¿.+\?$/, pregunta);
    assert.ok(TEXTOS_SELECTOR[pregunta].falta.length > 0, pregunta);
  }
});

// ---------- Con js/metodos.js ----------

test("una selección completa da los datos que espera identificarMetodo", function () {
  const s = tocarTodo([["tipo", "intervalo"], ["parametro", "media"], ["muestras", "dos"], ["relacion", "independientes"],
    ["sigma", "desconocida"], ["varianzas", "iguales"]]);
  assert.deepEqual(preguntasPendientes(s), []);
  const datos = datosParaMetodo(s);
  assert.deepEqual(datos, { tipo: "intervalo", caso: "dos-medias", sigma: "desconocida", varianzas: "iguales" });
  const metodo = identificarMetodo(Object.assign({ tamanos: [12, 10] }, datos));
  assert.equal(metodo.clave, "dos-medias-t-iguales");
});

test("una media con σ desconocida está completa en las tarjetas, pero el método sigue pidiendo n", function () {
  const s = tocarTodo([["tipo", "intervalo"], ["parametro", "media"], ["muestras", "una"], ["sigma", "desconocida"]]);
  assert.deepEqual(preguntasPendientes(s), []);
  const metodo = identificarMetodo(Object.assign({ tamanos: null }, datosParaMetodo(s)));
  assert.equal(metodo.estado, "falta-dato");
  assert.match(metodo.mensaje, /Falta el tamaño de la muestra \(n\)/);
});
