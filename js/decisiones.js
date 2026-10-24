
const REGLAS_DECISION = {
  "dos-medias-z": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "dos-medias-t-iguales": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "dos-medias-t-diferentes": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "pareadas": { referencia: 0, izquierda: "μ₁", derecha: "μ₂" },
  "dos-proporciones": { referencia: 0, izquierda: "π₁", derecha: "π₂" },
  "cociente-varianzas": { referencia: 1, izquierda: "σ₁²", derecha: "σ₂²" },
};

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
  const parametro = cero ? a + " − " + b : a + " / " + b;
  const alto = cero ? "+" : ">1";
  const bajo = cero ? "−" : "<1";
  const criterio = "(" + alto + "," + alto + ") ⇒ " + a + " > " + b + ";  (" + bajo + "," + alto + ") ⇒ " + a +
    " = " + b + ";  (" + bajo + "," + bajo + ") ⇒ " + a + " < " + b;

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
  if (signoInferior === alto) {
    decision = a + " > " + b;
    explicacion = "Los dos límites de " + parametro + " están por encima de " + ref + " " + signos + ": " +
      parametro + " > " + ref + ", así que " + decision + ".";
  } else if (signoSuperior === bajo) {
    decision = a + " < " + b;
    explicacion = "Los dos límites de " + parametro + " están por debajo de " + ref + " " + signos + ": " +
      parametro + " < " + ref + ", así que " + decision + ".";
  } else {
    decision = a + " = " + b;
    explicacion = "Un límite de " + parametro + " queda por debajo de " + ref + " y el otro por encima " + signos +
      ": el intervalo contiene el " + ref + ", así que " + parametro + " podría valer " + ref +
      " y el formulario toma " + decision + " (no se puede afirmar que sean diferentes).";
  }
  return { estado: "decidido", criterio: criterio, signos: signos, decision: decision, explicacion: explicacion };
}

if (typeof module !== "undefined") {
  module.exports = {
    decidirIntervalo,
  };
}
