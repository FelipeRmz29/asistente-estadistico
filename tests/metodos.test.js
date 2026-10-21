// Pruebas de js/metodos.js con el ejecutor de pruebas incluido en Node.
// Ejecutar desde la carpeta del proyecto:  node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const { identificarMetodo, TAMANO_MUESTRA_GRANDE } = require("../js/metodos.js");

// Atajo: identifica el método de un intervalo con los datos indicados.
function identificar(caso, sigma, varianzas, tamanos, tipo = "intervalo") {
  return identificarMetodo({ tipo: tipo, caso: caso, sigma: sigma, varianzas: varianzas, tamanos: tamanos });
}

// Comprueba que se identificó un método con la distribución y gl esperados.
function esMetodo(resultado, distribucion, gradosLibertad) {
  assert.equal(resultado.estado, "identificado", resultado.mensaje);
  assert.equal(resultado.distribucion, distribucion);
  assert.equal(resultado.gradosLibertad, gradosLibertad);
  assert.ok(resultado.explicacion.length > 0);
}

// Comprueba el estado y que el mensaje contenga el texto indicado.
function esEstado(resultado, estado, texto) {
  assert.equal(resultado.estado, estado);
  assert.equal(resultado.metodo, undefined, "no debe elegir un método");
  assert.match(resultado.mensaje, texto);
}

test("una muestra se considera grande desde n = 30", function () {
  assert.equal(TAMANO_MUESTRA_GRANDE, 30);
});

// ---------- Datos generales ----------

test("pide el tipo de ejercicio y el caso si faltan", function () {
  esEstado(identificar("una-proporcion", "", "", [10], ""), "falta-dato", /intervalo de confianza o una prueba/);
  esEstado(identificar("", "", "", []), "falta-dato", /caso/);
});

test("un caso desconocido no se asigna a ningún método", function () {
  esEstado(identificar("tres-medias", "", "", [10]), "no-determinado", /no está contemplado/);
});

test("el nombre del método indica si es intervalo o prueba", function () {
  assert.equal(identificar("una-proporcion", "", "", [50]).metodo, "Intervalo de confianza para una proporción (p)");
  assert.equal(identificar("una-proporcion", "", "", [50], "prueba").metodo, "Prueba de hipótesis para una proporción (p)");
});

// ---------- Una media ----------

// Formulario: Z si "n ≥ 30 o σ² conocida"; t si "n < 30 y σ² desconocida".

test("una media: σ conocida -> Z con cualquier tamaño", function () {
  for (const n of [1, 29, 30, 31, 200]) {
    const r = identificar("una-media", "conocida", "", [n]);
    esMetodo(r, "normal estándar Z", null);
    assert.equal(r.clave, "media-z");
  }
  // El tamaño no hace falta para decidir si σ es conocida.
  esMetodo(identificar("una-media", "conocida", "", [null]), "normal estándar Z", null);
});

test("una media: σ desconocida y muestra pequeña -> t con n − 1 gl", function () {
  esMetodo(identificar("una-media", "desconocida", "", [29]), "t de Student", "n − 1 = 28");
  esMetodo(identificar("una-media", "desconocida", "", [2]), "t de Student", "n − 1 = 1");
  assert.match(identificar("una-media", "desconocida", "", [12]).explicacion, /n = 12 < 30/);
});

test("una media: σ desconocida y n ≥ 30 -> Z, estimando σ con s", function () {
  for (const n of [30, 31, 100]) {
    const r = identificar("una-media", "desconocida", "", [n]);
    esMetodo(r, "normal estándar Z", null);
    assert.equal(r.clave, "media-z");
    assert.match(r.explicacion, /se estima con la desviación muestral s/);
  }
  assert.match(identificar("una-media", "desconocida", "", [30]).explicacion, /n = 30 ≥ 30/);
});

test("una media: σ desconocida y n < 30 usa la clave de t", function () {
  assert.equal(identificar("una-media", "desconocida", "", [29]).clave, "media-t");
});

test("una media: con n = 1 y σ desconocida no se puede estimar σ", function () {
  esEstado(identificar("una-media", "desconocida", "", [1]), "no-determinado", /n = 1 no se puede calcular s/);
});

test("una media: pide si σ es conocida y no supone que s sea σ", function () {
  // Aunque haya datos (y por tanto s), sin la respuesta del usuario no se elige método.
  const r = identificar("una-media", "", "", [40]);
  esEstado(r, "falta-dato", /desviación estándar poblacional σ/);
  assert.match(r.mensaje, /\(s\) no es σ/);
  esEstado(identificar("una-media", undefined, "", [10]), "falta-dato", /σ/);
});

test("una media con σ desconocida: pide el tamaño de muestra si falta o no es válido", function () {
  esEstado(identificar("una-media", "desconocida", "", [null]), "falta-dato", /Falta el tamaño de la muestra \(n\)/);
  esEstado(identificar("una-media", "desconocida", "", []), "falta-dato", /n ≥ 30 \(se usa Z\) o n < 30 \(se usa t\)/);
  for (const n of [0, -5, 12.5, NaN]) {
    esEstado(identificar("una-media", "desconocida", "", [n]), "falta-dato", /número entero mayor o igual que 1/);
  }
});

// ---------- Dos medias ----------

test("dos medias: σ₁ y σ₂ conocidas -> Z, sin importar el tamaño", function () {
  esMetodo(identificar("dos-medias", "conocida", "", [5, 8]), "normal estándar Z", null);
  esMetodo(identificar("dos-medias", "conocida", "", [50, 60]), "normal estándar Z", null);
  esMetodo(identificar("dos-medias", "conocida", "", [null, null]), "normal estándar Z", null);
});

test("dos medias: pide si σ es conocida y no supone que s₁, s₂ sean σ", function () {
  esEstado(identificar("dos-medias", "", "", [40, 40]), "falta-dato", /\(s₁, s₂\) no son σ₁ y σ₂/);
});

test("dos medias con σ desconocidas: pide qué se supone de las varianzas", function () {
  esEstado(identificar("dos-medias", "desconocida", "", [10, 12]), "falta-dato", /iguales o diferentes/);
});

test("dos medias, varianzas iguales: muestras pequeñas -> t combinada con n₁ + n₂ − 2 gl", function () {
  esMetodo(identificar("dos-medias", "desconocida", "iguales", [29, 29]), "t de Student", "n₁ + n₂ − 2 = 56");
  esMetodo(identificar("dos-medias", "desconocida", "iguales", [10, 12]), "t de Student", "n₁ + n₂ − 2 = 20");
  assert.match(identificar("dos-medias", "desconocida", "iguales", [10, 12]).metodo, /varianzas desconocidas e iguales/);
});

test("dos medias, varianzas iguales: muestras grandes -> Z", function () {
  esMetodo(identificar("dos-medias", "desconocida", "iguales", [30, 30]), "normal estándar Z", null);
  assert.match(identificar("dos-medias", "desconocida", "iguales", [30, 45]).explicacion, /s₁ y s₂ en lugar de σ₁ y σ₂/);
});

test("dos medias, varianzas iguales: tamaños mixtos no se deciden por defecto", function () {
  esEstado(identificar("dos-medias", "desconocida", "iguales", [29, 30]), "no-determinado", /grande y la otra pequeña/);
  esEstado(identificar("dos-medias", "desconocida", "iguales", [30, 29]), "no-determinado", /n₁ = 30, n₂ = 29/);
});

test("dos medias, varianzas diferentes: -> t con gl de Welch si no son ambas grandes", function () {
  esMetodo(identificar("dos-medias", "desconocida", "diferentes", [10, 12]), "t de Student",
    "fórmula de Welch (se calcula con s₁, s₂, n₁ y n₂ y se redondea hacia abajo al entero inferior)");
  assert.equal(identificar("dos-medias", "desconocida", "diferentes", [29, 29]).estado, "identificado");
  assert.equal(identificar("dos-medias", "desconocida", "diferentes", [29, 30]).estado, "identificado");
});

test("dos medias, varianzas diferentes y ambas grandes: coinciden dos métodos, no se decide", function () {
  esEstado(identificar("dos-medias", "desconocida", "diferentes", [30, 30]), "no-determinado", /coinciden dos métodos/);
});

test("dos medias: pide los tamaños si faltan o no son válidos", function () {
  esEstado(identificar("dos-medias", "desconocida", "iguales", [10, null]), "falta-dato", /muestra 2 \(n₂\)/);
  esEstado(identificar("dos-medias", "desconocida", "diferentes", [null, 10]), "falta-dato", /muestra 1 \(n₁\)/);
  esEstado(identificar("dos-medias", "desconocida", "iguales", [10, 3.5]), "falta-dato", /entero/);
});

test("dos medias: con un solo dato en una muestra no se puede estimar σ", function () {
  esEstado(identificar("dos-medias", "desconocida", "iguales", [1, 10]), "no-determinado", /un solo dato/);
});

// ---------- Demás casos ----------

test("proporciones -> Z", function () {
  esMetodo(identificar("una-proporcion", "", "", [100]), "normal estándar Z", null);
  esMetodo(identificar("dos-proporciones", "", "", [100, 80]), "normal estándar Z", null);
});

test("una varianza -> chi-cuadrada con n − 1 gl", function () {
  esMetodo(identificar("una-varianza", "", "", [10]), "chi-cuadrada", "n − 1 = 9");
  esMetodo(identificar("una-varianza", "", "", [null]), "chi-cuadrada", "n − 1"); // n aún no escrito
});

test("cociente de varianzas -> F con n₁ − 1 y n₂ − 1 gl", function () {
  esMetodo(identificar("cociente-varianzas", "", "", [11, 16]), "F",
    "n₁ − 1 = 10 (numerador) y n₂ − 1 = 15 (denominador)");
});

test("muestras pareadas -> t con n − 1 gl sobre las diferencias", function () {
  const r = identificar("pareadas", "", "", [8, 8]);
  esMetodo(r, "t de Student", "n − 1 = 7");
  assert.match(r.explicacion, /diferencias/);
});

test("las opciones que no corresponden al caso se ignoran", function () {
  // σ y varianzas solo se usan en una media y dos medias.
  esMetodo(identificar("una-proporcion", "conocida", "iguales", [100]), "normal estándar Z", null);
  esMetodo(identificar("pareadas", "conocida", "diferentes", [8, 8]), "t de Student", "n − 1 = 7");
  // En una media no importa lo que se haya elegido sobre las varianzas.
  esMetodo(identificar("una-media", "desconocida", "diferentes", [12]), "t de Student", "n − 1 = 11");
});
