// Selector de características del ejercicio con tarjetas (paso 1 de la página).
// Aquí solo se decide qué preguntas tienen sentido según lo ya elegido, qué caso
// resulta (con las mismas claves que js/metodos.js) y qué falta por responder.
// El método lo sigue eligiendo identificarMetodo (js/metodos.js): aquí no se
// clasifica nada ni se adivina un método.
// Estas funciones no usan la página (document), así que también se pueden probar
// con Node: ver tests/selector.test.js.
//
// Orden de las preguntas y cuándo aparece cada una:
//
//   Pregunta    Opciones                       Aparece si...
//   ----------  -----------------------------  ------------------------------------------
//   tipo        intervalo, prueba              siempre
//   parametro   media, proporcion, varianza    siempre
//   muestras    una, dos                       ya se eligió el parámetro
//   relacion    independientes, pareadas       media con dos muestras
//   sigma       conocida, desconocida          media con una muestra o con dos independientes
//   varianzas   iguales, diferentes            dos medias independientes con σ desconocidas
//
// Dos proporciones y dos varianzas solo se resuelven con muestras independientes,
// y las muestras pareadas no usan σ: por eso esas preguntas no aparecen ahí.

const PREGUNTAS_SELECTOR = ["tipo", "parametro", "muestras", "relacion", "sigma", "varianzas"];

// Cuándo tiene sentido cada pregunta. Solo mira preguntas anteriores en el orden.
const CONDICIONES_SELECTOR = {
  tipo: function () { return true; },
  parametro: function () { return true; },
  muestras: function (s) { return s.parametro !== ""; },
  relacion: function (s) { return s.parametro === "media" && s.muestras === "dos"; },
  sigma: function (s) { return s.parametro === "media" && (s.muestras === "una" || s.relacion === "independientes"); },
  varianzas: function (s) { return s.relacion === "independientes" && s.sigma === "desconocida"; },
};

// Cómo se pregunta cada dato (en la vista del método) y cómo se nombra si falta
// (en el mensaje de «Revisar datos»).
const TEXTOS_SELECTOR = {
  tipo: { pregunta: "¿Es un intervalo de confianza o una prueba de hipótesis?", falta: "el tipo de ejercicio" },
  parametro: { pregunta: "¿Qué parámetro se estudia: una media, una proporción o una varianza?", falta: "el parámetro" },
  muestras: { pregunta: "¿El ejercicio tiene una muestra o dos?", falta: "si hay una o dos muestras" },
  relacion: { pregunta: "¿Las dos muestras son independientes o pareadas?", falta: "si las muestras son independientes o pareadas" },
  sigma: {
    pregunta: "¿El enunciado da la desviación estándar poblacional σ (σ₁ y σ₂ si son dos muestras)?",
    falta: "si σ es conocida",
  },
  varianzas: {
    pregunta: "¿El enunciado supone que las varianzas poblacionales son iguales o diferentes?",
    falta: "si las varianzas son iguales o diferentes",
  },
};

// Caso que resulta de cada combinación completa, con su nombre para el resumen.
const CASOS = {
  "una-media": { parametro: "media", muestras: "una", relacion: "", nombre: "Una media (μ)" },
  "dos-medias": { parametro: "media", muestras: "dos", relacion: "independientes",
    nombre: "Dos medias, muestras independientes (μ₁ − μ₂)" },
  "pareadas": { parametro: "media", muestras: "dos", relacion: "pareadas", nombre: "Muestras pareadas (μ_d)" },
  "una-proporcion": { parametro: "proporcion", muestras: "una", relacion: "", nombre: "Una proporción (p)" },
  "dos-proporciones": { parametro: "proporcion", muestras: "dos", relacion: "",
    nombre: "Dos proporciones, muestras independientes (p₁ − p₂)" },
  "una-varianza": { parametro: "varianza", muestras: "una", relacion: "", nombre: "Una varianza (σ²)" },
  "cociente-varianzas": { parametro: "varianza", muestras: "dos", relacion: "",
    nombre: "Cociente de varianzas, muestras independientes (σ₁² / σ₂²)" },
};

// Selección sin nada elegido.
function seleccionVacia() {
  return { tipo: "", parametro: "", muestras: "", relacion: "", sigma: "", varianzas: "" };
}

// Quita las respuestas de preguntas que ya no tienen sentido (por ejemplo, la relación
// entre muestras si se cambió a una muestra). Así nunca queda una combinación incompatible.
function depurarSeleccion(seleccion) {
  const depurada = {};
  for (const pregunta of PREGUNTAS_SELECTOR) {
    depurada[pregunta] = CONDICIONES_SELECTOR[pregunta](depurada) ? (seleccion[pregunta] || "") : "";
  }
  return depurada;
}

// Toca una tarjeta: si ya estaba elegida se quita; si no, reemplaza a la otra de su pregunta.
// Devuelve una selección nueva (no cambia la recibida).
function tocarOpcion(seleccion, pregunta, valor) {
  const nueva = Object.assign(seleccionVacia(), seleccion);
  nueva[pregunta] = nueva[pregunta] === valor ? "" : valor;
  return depurarSeleccion(nueva);
}

// Preguntas que se muestran con lo que ya se eligió.
function preguntasVisibles(seleccion) {
  const depurada = depurarSeleccion(seleccion);
  return PREGUNTAS_SELECTOR.filter(function (pregunta) { return CONDICIONES_SELECTOR[pregunta](depurada); });
}

// Preguntas visibles que aún no tienen respuesta. Si hay alguna, no se busca el método.
function preguntasPendientes(seleccion) {
  const depurada = depurarSeleccion(seleccion);
  return preguntasVisibles(depurada).filter(function (pregunta) { return depurada[pregunta] === ""; });
}

// Clave del caso (como en js/metodos.js), o "" si todavía no se sabe.
function casoDeSeleccion(seleccion) {
  const s = depurarSeleccion(seleccion);
  for (const clave in CASOS) {
    const caso = CASOS[clave];
    if (caso.parametro === s.parametro && caso.muestras === s.muestras && caso.relacion === s.relacion) {
      return clave;
    }
  }
  return "";
}

// Los datos que necesita identificarMetodo (js/metodos.js), sin los tamaños de muestra.
function datosParaMetodo(seleccion) {
  const s = depurarSeleccion(seleccion);
  return { tipo: s.tipo, caso: casoDeSeleccion(s), sigma: s.sigma, varianzas: s.varianzas };
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    PREGUNTAS_SELECTOR,
    TEXTOS_SELECTOR,
    CASOS,
    seleccionVacia,
    depurarSeleccion,
    tocarOpcion,
    preguntasVisibles,
    preguntasPendientes,
    casoDeSeleccion,
    datosParaMetodo,
  };
}
