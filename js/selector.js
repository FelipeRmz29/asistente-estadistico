const PREGUNTAS_SELECTOR = ["tipo", "parametro", "muestras", "relacion", "sigma", "varianzas"];

const CONDICIONES_SELECTOR = {
  tipo: function () { return true; },
  parametro: function () { return true; },
  muestras: function (s) { return s.parametro !== ""; },
  relacion: function (s) { return s.parametro === "media" && s.muestras === "dos"; },
  sigma: function (s) { return s.parametro === "media" && (s.muestras === "una" || s.relacion === "independientes"); },
  varianzas: function (s) { return s.relacion === "independientes" && s.sigma === "desconocida"; },
};

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

function seleccionVacia() {
  return { tipo: "", parametro: "", muestras: "", relacion: "", sigma: "", varianzas: "" };
}

function depurarSeleccion(seleccion) {
  const depurada = {};
  for (const pregunta of PREGUNTAS_SELECTOR) {
    depurada[pregunta] = CONDICIONES_SELECTOR[pregunta](depurada) ? (seleccion[pregunta] || "") : "";
  }
  return depurada;
}

function tocarOpcion(seleccion, pregunta, valor) {
  const nueva = Object.assign(seleccionVacia(), seleccion);
  nueva[pregunta] = nueva[pregunta] === valor ? "" : valor;
  return depurarSeleccion(nueva);
}

function preguntasVisibles(seleccion) {
  const depurada = depurarSeleccion(seleccion);
  return PREGUNTAS_SELECTOR.filter(function (pregunta) { return CONDICIONES_SELECTOR[pregunta](depurada); });
}

function preguntasPendientes(seleccion) {
  const depurada = depurarSeleccion(seleccion);
  return preguntasVisibles(depurada).filter(function (pregunta) { return depurada[pregunta] === ""; });
}

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

function datosParaMetodo(seleccion) {
  const s = depurarSeleccion(seleccion);
  return { tipo: s.tipo, caso: casoDeSeleccion(s), sigma: s.sigma, varianzas: s.varianzas };
}

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
