// Criterios de decisión a partir de un intervalo de confianza (Parte 8).
// Solo se implementan las reglas de la columna "Criterios de decisión" del formulario:
//
//   Dos proporciones                  (+,+) ⇒ π₁ > π₂    (−,+) ⇒ π₁ = π₂    (−,−) ⇒ π₁ < π₂
//   Cociente de varianzas             (<1,<1) ⇒ σ₁² < σ₂²   (<1,>1) ⇒ σ₁² = σ₂²   (>1,>1) ⇒ σ₁² > σ₂²
//   Dos medias (Z, t iguales, t diferentes) y muestras pareadas
//                                     (+,+) ⇒ μ₁ > μ₂    (−,+) ⇒ μ₁ = μ₂    (−,−) ⇒ μ₁ < μ₂
//
// Cada pareja son los dos límites del intervalo, en orden (inferior, superior):
// su signo si el intervalo es de una diferencia (se compara con 0), o si son menores
// o mayores que 1 si es un cociente (se compara con 1).
//
// El formulario NO trae criterio para una media, una proporción ni una varianza, y
// tampoco dice qué hacer si un límite vale exactamente 0 (o 1): en esos casos no se
// decide y se explica qué hay que confirmar.
//
// Estas funciones no usan la página (document), así que también se pueden probar
// con Node: ver tests/decisiones.test.js.

// Claves de js/metodos.js que tienen criterio: con qué se compara el intervalo y
// qué parámetros se comparan.
const REGLAS_DECISION = {
  "dos-medias-z": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "dos-medias-t-iguales": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "dos-medias-t-diferentes": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "pareadas": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },     // μ_D = μ₁ − μ₂
  "dos-proporciones": { referencia: 0, izquierda: "π₁", derecha: "π₂" },
  "cociente-varianzas": { referencia: 1, izquierda: "σ₁²", derecha: "σ₂²" },
};

// Recibe la clave del método (como en js/metodos.js) y los límites SIN redondear.
// Devuelve uno de estos objetos:
//   { estado: "decidido", criterio, signos, decision, explicacion }
//   { estado: "sin-decision", mensaje }   (con criterio si la regla existe pero no se puede aplicar)
function decidirIntervalo(clave, inferior, superior) {
  const regla = REGLAS_DECISION[clave];
  if (!regla) {
    return { estado: "sin-decision", mensaje: "El formulario no trae criterio de decisión para este caso." };
  }
  if (!Number.isFinite(inferior) || !Number.isFinite(superior) || inferior > superior) {
    return { estado: "sin-decision", mensaje: "No se puede aplicar el criterio: los límites del intervalo no son válidos." };
  }

  const ref = regla.referencia;
  const a = regla.izquierda;
  const b = regla.derecha;
  const cero = ref === 0;
  const parametro = cero ? a + " − " + b : a + " / " + b;       // lo que estima el intervalo
  const alto = cero ? "+" : ">1";
  const bajo = cero ? "−" : "<1";
  const criterio = "(" + alto + "," + alto + ") ⇒ " + a + " > " + b + ";  (" + bajo + "," + alto + ") ⇒ " + a +
    " = " + b + ";  (" + bajo + "," + bajo + ") ⇒ " + a + " < " + b;

  // Un límite exactamente igual a la referencia no es ni "+" ni "−" (ni "<1" ni ">1").
  if (inferior === ref || superior === ref) {
    return {
      estado: "sin-decision",
      criterio: criterio,
      mensaje: "Un límite del intervalo vale exactamente " + ref + ", y el formulario no indica qué decisión " +
        "corresponde en ese caso (solo trae (" + alto + "," + alto + "), (" + bajo + "," + alto + ") y (" +
        bajo + "," + bajo + ")). Confirma con tu profesor qué decisión se toma.",
    };
  }

  const signoInferior = inferior > ref ? alto : bajo;
  const signoSuperior = superior > ref ? alto : bajo;
  const signos = "(" + signoInferior + "," + signoSuperior + ")";

  let decision;
  let explicacion;
  if (signoInferior === alto) {            // (+,+): los dos límites quedan por encima de la referencia
    decision = a + " > " + b;
    explicacion = "Los dos límites de " + parametro + " están por encima de " + ref + " " + signos + ": " +
      parametro + " > " + ref + ", así que " + decision + ".";
  } else if (signoSuperior === bajo) {     // (−,−): los dos por debajo
    decision = a + " < " + b;
    explicacion = "Los dos límites de " + parametro + " están por debajo de " + ref + " " + signos + ": " +
      parametro + " < " + ref + ", así que " + decision + ".";
  } else {                                 // (−,+): la referencia queda dentro del intervalo
    decision = a + " = " + b;
    explicacion = "Un límite de " + parametro + " queda por debajo de " + ref + " y el otro por encima " + signos +
      ": el intervalo contiene el " + ref + ", así que " + parametro + " podría valer " + ref +
      " y el formulario toma " + decision + " (no se puede afirmar que sean diferentes).";
  }
  return { estado: "decidido", criterio: criterio, signos: signos, decision: decision, explicacion: explicacion };
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    decidirIntervalo,
  };
}
