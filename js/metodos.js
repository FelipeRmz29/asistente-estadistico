// Identificación del método según el caso y los datos (Parte 5).
// Aquí solo se decide QUÉ método corresponde; las fórmulas se implementan después.
// Estas funciones no usan la página (document), así que también se pueden probar
// con Node: ver tests/metodos.test.js.
//
// Reglas (según el formulario de intervalos de confianza):
//
//   Caso                σ          Tamaño          Varianzas    Método
//   ------------------  ---------  --------------  -----------  ---------------------------
//   Una media           conocida   cualquiera      —            Z        ("n ≥ 30 o σ² conocida")
//   Una media           desconoc.  n ≥ 30          —            Z con s  ("n ≥ 30 o σ² conocida")
//   Una media           desconoc.  n < 30          —            t, gl = n − 1  ("n < 30 y σ² desconocida")
//   Dos medias          conocidas  cualquiera      —            Z
//   Dos medias          desconoc.  ambas ≥ 30      iguales      Z (con s₁ y s₂)
//   Dos medias          desconoc.  ambas < 30      iguales      t con varianza combinada, gl = n₁ + n₂ − 2
//   Dos medias          desconoc.  no ambas ≥ 30   diferentes   t con gl de Welch
//   Una proporción, dos proporciones                            Z
//   Una varianza                                                chi-cuadrada, gl = n − 1
//   Cociente de varianzas                                       F, gl = n₁ − 1 y n₂ − 1
//   Muestras pareadas                                           t, gl = n − 1 (n = número de pares)
//
// Cualquier otra combinación (por ejemplo, dos medias con varianzas diferentes y
// ambas muestras grandes) coincide con ninguna o con más de una fila: no se elige
// un método por defecto.

// A partir de este tamaño la muestra se considera grande.
const TAMANO_MUESTRA_GRANDE = 30;

// Recibe un objeto con lo que eligió y escribió el usuario:
//   tipo:      "intervalo" o "prueba"
//   caso:      "una-media", "dos-medias", "una-proporcion", ... (como en el HTML)
//   sigma:     "conocida", "desconocida" o "" (solo una media y dos medias)
//   varianzas: "iguales", "diferentes" o "" (solo dos medias con σ desconocidas)
//   tamanos:   [n] o [n₁, n₂]; null si el usuario no lo escribió
// Devuelve uno de estos objetos:
//   { estado: "identificado", clave, metodo, distribucion, gradosLibertad, explicacion }
//     (clave identifica la fórmula: "media-z", "media-t", "proporcion", "varianza", ...)
//   { estado: "falta-dato", mensaje }     falta un dato o no es válido
//   { estado: "no-determinado", mensaje } la combinación no tiene un método seguro
function identificarMetodo(datos) {
  if (datos.tipo !== "intervalo" && datos.tipo !== "prueba") {
    return faltaDato("Elige si el ejercicio es un intervalo de confianza o una prueba de hipótesis (paso 1).");
  }

  const tamanos = datos.tamanos || [];
  const n = tamanos[0];

  switch (datos.caso) {
    case "una-media":
      return metodoUnaMedia(datos);
    case "dos-medias":
      return metodoDosMedias(datos);
    case "una-proporcion":
      return identificado("proporcion", datos.tipo, "una proporción (p)", "normal estándar Z", null,
        "Para una proporción el formulario usa la aproximación normal (Z) de la proporción muestral p̂.");
    case "dos-proporciones":
      return identificado("dos-proporciones", datos.tipo, "la diferencia de dos proporciones (p₁ − p₂)", "normal estándar Z", null,
        "Para dos proporciones de muestras independientes el formulario usa la aproximación normal (Z).");
    case "una-varianza":
      return identificado("varianza", datos.tipo, "una varianza (σ²)", "chi-cuadrada", textoGL("n − 1", n - 1),
        "Para una varianza el formulario usa la distribución chi-cuadrada con n − 1 grados de libertad " +
        "(supone que la población es normal).");
    case "cociente-varianzas":
      return identificado("cociente-varianzas", datos.tipo, "el cociente de varianzas (σ₁² / σ₂²)", "F",
        textoGL("n₁ − 1", tamanos[0] - 1) + " (numerador) y " + textoGL("n₂ − 1", tamanos[1] - 1) + " (denominador)",
        "Para comparar dos varianzas el formulario usa la distribución F con n₁ − 1 y n₂ − 1 grados de libertad " +
        "(supone poblaciones normales y muestras independientes).");
    case "pareadas":
      return identificado("pareadas", datos.tipo, "la media de las diferencias pareadas (μ_d)", "t de Student", textoGL("n − 1", n - 1),
        "Las observaciones están relacionadas por pares, así que se trabaja con las diferencias d como una sola " +
        "muestra y se usa t con n − 1 grados de libertad (n = número de pares).");
    case "":
    case undefined:
      return faltaDato("Elige el caso del ejercicio (paso 2).");
    default:
      return noDeterminado("El caso «" + datos.caso + "» no está contemplado en el formulario.");
  }
}

// Una media: deciden σ (conocida o no) y el tamaño de la muestra.
// Formulario: Z si "n ≥ 30 o σ² conocida"; t si "n < 30 y σ² desconocida".
function metodoUnaMedia(datos) {
  if (datos.sigma !== "conocida" && datos.sigma !== "desconocida") {
    return faltaDato("Indica si el enunciado da la desviación estándar poblacional σ (paso 4). " +
      "Se necesita porque con σ conocida se usa Z y con σ desconocida el método depende de n. " +
      "Una desviación calculada con los datos de la muestra (s) no es σ.");
  }

  if (datos.sigma === "conocida") {
    return identificado("media-z", datos.tipo, "una media (μ) con σ conocida", "normal estándar Z", null,
      "σ es conocida; el formulario usa Z cuando n ≥ 30 o σ² es conocida.");
  }

  // σ desconocida: el tamaño de la muestra decide entre Z y t.
  const n = (datos.tamanos || [])[0];
  const problema = revisarTamano(n, "la muestra (n)");
  if (problema) {
    return faltaDato(problema + " Con σ desconocida se necesita para saber si n ≥ " + TAMANO_MUESTRA_GRANDE +
      " (se usa Z) o n < " + TAMANO_MUESTRA_GRANDE + " (se usa t).");
  }
  if (n < 2) {
    return noDeterminado("Con σ desconocida hay que estimarla con la desviación muestral s, " +
      "pero con n = 1 no se puede calcular s (n − 1 = 0).");
  }

  if (n >= TAMANO_MUESTRA_GRANDE) {
    return identificado("media-z", datos.tipo, "una media (μ) con n ≥ " + TAMANO_MUESTRA_GRANDE + " y σ desconocida",
      "normal estándar Z", null,
      "σ es desconocida, pero la muestra es grande (n = " + n + " ≥ " + TAMANO_MUESTRA_GRANDE + "); " +
      "el formulario usa Z cuando n ≥ 30 o σ² es conocida. Como σ no se conoce, se estima con la desviación muestral s.");
  }
  return identificado("media-t", datos.tipo, "una media (μ) con n < " + TAMANO_MUESTRA_GRANDE + " y σ desconocida",
    "t de Student", textoGL("n − 1", n - 1),
    "σ es desconocida (se estima con s) y la muestra es pequeña (n = " + n + " < " + TAMANO_MUESTRA_GRANDE + "); " +
    "el formulario usa t cuando n < 30 y σ² es desconocida.");
}

// Dos medias de muestras independientes: deciden σ₁ y σ₂, el tamaño de las
// muestras y lo que el enunciado supone sobre las varianzas.
function metodoDosMedias(datos) {
  if (datos.sigma !== "conocida" && datos.sigma !== "desconocida") {
    return faltaDato("Indica si el enunciado da las desviaciones estándar poblacionales σ₁ y σ₂ (paso 4). " +
      "Se necesita porque con σ conocidas se usa Z y con σ desconocidas se usa otro método. " +
      "Las desviaciones calculadas con los datos de las muestras (s₁, s₂) no son σ₁ y σ₂.");
  }

  if (datos.sigma === "conocida") {
    return identificado("dos-medias-z", datos.tipo, "la diferencia de dos medias (μ₁ − μ₂) con σ₁ y σ₂ conocidas",
      "normal estándar Z", null,
      "σ₁ y σ₂ son conocidas; el formulario usa Z para dos medias con desviaciones poblacionales conocidas.");
  }

  if (datos.varianzas !== "iguales" && datos.varianzas !== "diferentes") {
    return faltaDato("Indica si el enunciado supone que las varianzas poblacionales son iguales o diferentes (paso 4). " +
      "Con σ desconocidas el formulario usa una fórmula distinta para cada caso.");
  }

  const tamanos = datos.tamanos || [];
  const n1 = tamanos[0];
  const n2 = tamanos[1];
  const problema = revisarTamano(n1, "la muestra 1 (n₁)") || revisarTamano(n2, "la muestra 2 (n₂)");
  if (problema) {
    return faltaDato(problema + " Se necesita para saber si las muestras son grandes (n ≥ " +
      TAMANO_MUESTRA_GRANDE + ") o pequeñas, lo que decide el método.");
  }
  if (n1 < 2 || n2 < 2) {
    return noDeterminado("Con σ desconocidas hay que estimarlas con las desviaciones muestrales, " +
      "y con un solo dato en una muestra no se puede calcular s (n − 1 = 0).");
  }

  const grandes = n1 >= TAMANO_MUESTRA_GRANDE && n2 >= TAMANO_MUESTRA_GRANDE;
  const pequenas = n1 < TAMANO_MUESTRA_GRANDE && n2 < TAMANO_MUESTRA_GRANDE;
  const textoTamanos = "n₁ = " + n1 + ", n₂ = " + n2;

  if (datos.varianzas === "iguales") {
    if (grandes) {
      return identificado("dos-medias-z", datos.tipo, "la diferencia de dos medias (μ₁ − μ₂) con muestras grandes",
        "normal estándar Z", null,
        "Las dos muestras son grandes (" + textoTamanos + ", ambas ≥ " + TAMANO_MUESTRA_GRANDE + "); " +
        "el formulario usa Z para dos medias con muestras grandes, con s₁ y s₂ en lugar de σ₁ y σ₂.");
    }
    if (pequenas) {
      return identificado("dos-medias-t-iguales", datos.tipo,
        "la diferencia de dos medias (μ₁ − μ₂) con varianzas desconocidas e iguales",
        "t de Student", textoGL("n₁ + n₂ − 2", n1 + n2 - 2),
        "σ₁ y σ₂ son desconocidas, el enunciado supone varianzas iguales y las muestras son pequeñas (" +
        textoTamanos + ", ambas < " + TAMANO_MUESTRA_GRANDE + "); se usa t con la varianza combinada.");
    }
    return noDeterminado("Una muestra es grande y la otra pequeña (" + textoTamanos + "). " +
      "El formulario usa Z cuando las muestras son grandes y t con varianza combinada cuando son pequeñas; " +
      "con tamaños mixtos no se puede elegir con seguridad. Confirma con tu profesor qué método corresponde.");
  }

  // Varianzas diferentes
  if (grandes) {
    return noDeterminado("Las dos muestras son grandes (" + textoTamanos + ") y las varianzas se suponen " +
      "diferentes: coinciden dos métodos del formulario, Z para muestras grandes y t con varianzas diferentes " +
      "(gl de Welch). Confirma con tu profesor cuál se usa.");
  }
  return identificado("dos-medias-t-diferentes", datos.tipo,
    "la diferencia de dos medias (μ₁ − μ₂) con varianzas desconocidas y diferentes",
    "t de Student", "fórmula de Welch (se calcula con s₁, s₂, n₁ y n₂ y se redondea hacia abajo al entero inferior)",
    "σ₁ y σ₂ son desconocidas y el enunciado supone varianzas diferentes (" + textoTamanos + "); " +
    "se usa t con los grados de libertad de Welch.");
}

// ---------- Funciones auxiliares ----------

// Devuelve un mensaje si el tamaño falta o no es un entero ≥ 1, o null si es válido.
function revisarTamano(n, nombre) {
  if (n === null || n === undefined) {
    return "Falta el tamaño de " + nombre + ".";
  }
  if (!Number.isInteger(n) || n < 1) {
    return "El tamaño de " + nombre + " debe ser un número entero mayor o igual que 1 (se recibió " + n + ").";
  }
  return null;
}

// Grados de libertad como texto: "n − 1 = 11" si el valor se conoce, o solo "n − 1".
function textoGL(formula, valor) {
  return Number.isInteger(valor) && valor >= 1 ? formula + " = " + valor : formula;
}

function identificado(clave, tipo, parametro, distribucion, gradosLibertad, explicacion) {
  const inicio = tipo === "intervalo" ? "Intervalo de confianza para " : "Prueba de hipótesis para ";
  return {
    estado: "identificado",
    clave: clave, // indica qué fórmula aplicar

    metodo: inicio + parametro,
    distribucion: distribucion,
    gradosLibertad: gradosLibertad, // null si la distribución no usa grados de libertad
    explicacion: explicacion,
  };
}

function faltaDato(mensaje) {
  return { estado: "falta-dato", mensaje: mensaje };
}

function noDeterminado(mensaje) {
  return { estado: "no-determinado", mensaje: mensaje };
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    TAMANO_MUESTRA_GRANDE,
    identificarMetodo,
  };
}
