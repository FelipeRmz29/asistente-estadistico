// Intervalos de confianza de una muestra (Parte 6), según el formulario:
//
//   Una media, n ≥ 30 o σ² conocida:    x̄ − e ≤ μ ≤ x̄ + e,   e = z_{α/2} · σ / √n
//   Una media, n < 30 y σ² desconocida: x̄ − e ≤ μ ≤ x̄ + e,   e = t_{α/2,ν} · s / √n,   ν = n − 1
//   Una proporción:  p − e ≤ π ≤ p + e,   e = z_{α/2} · √(p·q / n),   p = x / n,   q = 1 − p
//   Una varianza:    (n − 1)S² / χ²_{α/2,ν} ≤ σ² ≤ (n − 1)S² / χ²_{1−α/2,ν},   ν = n − 1
//   Tamaño de muestra:  media n = (z_{α/2} · σ / e)²;   proporción n = z²_{α/2} · p·q / e²
//
// En el formulario, z_{α/2}, t_{α/2,ν} y χ²_{α/2,ν} dejan un área α/2 a la DERECHA.
// Las funciones de la Parte 4 (js/valores-criticos.js) reciben el área a la
// IZQUIERDA, así que se consultan con 1 − α/2. χ²_{1−α/2,ν} deja 1 − α/2 a la
// derecha, es decir α/2 a la izquierda.
//
// Las funciones no redondean: devuelven todos los valores intermedios para que la
// página muestre el procedimiento. Si un dato falta o no es válido devuelven
// { error: "mensaje" } en lugar de un intervalo.

// En el navegador estas funciones ya están cargadas por index.html (valores-criticos.js
// y metodos.js van antes que este archivo); en Node (pruebas) se cargan con require.
const valoresCriticos = typeof module !== "undefined"
  ? require("./valores-criticos.js")
  : { valorCriticoZ: valorCriticoZ, valorCriticoT: valorCriticoT, valorCriticoChi2: valorCriticoChi2 };
const MUESTRA_GRANDE = typeof module !== "undefined"
  ? require("./metodos.js").TAMANO_MUESTRA_GRANDE
  : TAMANO_MUESTRA_GRANDE;

// ---------- Intervalos ----------

// Una media con Z. desviacion es σ si sigmaConocida es true; si no, es s, y el
// formulario solo permite usar Z con σ desconocida cuando n ≥ 30.
// Devuelve { alfa, critico, errorEstandar, margen, inferior, superior }.
function intervaloMediaZ(n, media, desviacion, sigmaConocida, confianza) {
  const nombreDesviacion = sigmaConocida
    ? "la desviación estándar poblacional (σ)"
    : "la desviación estándar muestral (s)";
  const error = revisarConfianza(confianza) || revisarTamanoMuestra(n, 1) ||
    revisarNumero(media, "la media muestral (x̄)") || revisarPositivo(desviacion, nombreDesviacion);
  if (error) return { error: error };
  if (!sigmaConocida && n < MUESTRA_GRANDE) {
    return { error: "Con σ desconocida el formulario usa Z solo si n ≥ " + MUESTRA_GRANDE +
      " (aquí n = " + n + "); con n < " + MUESTRA_GRANDE + " corresponde t." };
  }

  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2); // z_{α/2}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = desviacion / Math.sqrt(n);   // σ/√n (o s/√n)
  const margen = critico.valor * errorEstandar;       // e = z_{α/2} · σ/√n
  return {
    alfa: alfa,
    critico: critico,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: media - margen,
    superior: media + margen,
  };
}

// Una media con t (n < 30 y σ desconocida).
// Devuelve { alfa, gl, critico, errorEstandar, margen, inferior, superior }.
function intervaloMediaT(n, media, s, confianza) {
  const error = revisarConfianza(confianza) || revisarTamanoMuestra(n, 2) ||
    revisarNumero(media, "la media muestral (x̄)") ||
    revisarPositivo(s, "la desviación estándar muestral (s)");
  if (error) return { error: error };
  if (n >= MUESTRA_GRANDE) {
    return { error: "El formulario usa t solo si n < " + MUESTRA_GRANDE + " (aquí n = " + n +
      "); con n ≥ " + MUESTRA_GRANDE + " corresponde Z." };
  }

  const alfa = calcularAlfa(confianza);
  const gl = n - 1;                                         // ν = n − 1
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl); // t_{α/2,ν}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = s / Math.sqrt(n);               // s/√n
  const margen = critico.valor * errorEstandar;          // e = t_{α/2,ν} · s/√n
  return {
    alfa: alfa,
    gl: gl,
    critico: critico,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: media - margen,
    superior: media + margen,
  };
}

// Una proporción. Se da el número de éxitos (exitos) o la proporción muestral
// (proporcion), no ambos; el que no se da es null.
// Devuelve { alfa, p, q, critico, errorEstandar, margen, inferior, superior, advertencias }.
function intervaloProporcion(n, exitos, proporcion, confianza) {
  const error = revisarConfianza(confianza) || revisarTamanoMuestra(n, 1);
  if (error) return { error: error };

  let p;
  if (exitos === null && proporcion === null) {
    return { error: "Falta el número de éxitos (x) o la proporción muestral (p̂)." };
  }
  if (exitos !== null && proporcion !== null) {
    return { error: "Escribe solo uno de los dos datos: el número de éxitos (x) o la proporción muestral (p̂)." };
  }
  if (exitos !== null) {
    if (!Number.isInteger(exitos) || exitos < 0 || exitos > n) {
      return { error: "El número de éxitos (x) debe ser un número entero entre 0 y n = " + n +
        " (se recibió " + exitos + ")." };
    }
    p = exitos / n;                                     // p = x / n
  } else {
    if (typeof proporcion !== "number" || !(proporcion >= 0 && proporcion <= 1)) {
      return { error: "La proporción muestral (p̂) debe estar entre 0 y 1 (se recibió " + proporcion +
        "). Si tienes un porcentaje, divídelo entre 100 (35 % → 0.35)." };
    }
    p = proporcion;
  }
  if (p === 0 || p === 1) {
    return { error: "Con p = " + p + " se obtiene p·q = 0 y el margen de error sería 0, lo que no significa " +
      "certeza: la aproximación normal de la fórmula no se puede usar. Se necesita al menos un éxito y un fracaso." };
  }

  const q = 1 - p;                                      // q = 1 − p
  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2); // z_{α/2}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = Math.sqrt(p * q / n);           // √(p·q / n)
  const margen = critico.valor * errorEstandar;          // e = z_{α/2} · √(p·q / n)
  const inferior = p - margen;
  const superior = p + margen;

  // El formulario no pone condiciones, pero la fórmula usa la aproximación normal:
  // se avisa (sin bloquear) cuando no se cumple la regla usual.
  const advertencias = [];
  if (n * p < 5 || n * q < 5) {
    advertencias.push("n·p o n·q es menor que 5. La fórmula usa la aproximación normal, que suele pedir " +
      "n·p ≥ 5 y n·q ≥ 5; el intervalo puede no ser confiable. Confirma con tu profesor si se acepta.");
  }
  if (inferior < 0 || superior > 1) {
    advertencias.push("Un límite del intervalo queda fuera de [0, 1], pero una proporción no puede ser " +
      "menor que 0 ni mayor que 1.");
  }

  return {
    alfa: alfa,
    p: p,
    q: q,
    critico: critico,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: inferior,
    superior: superior,
    advertencias: advertencias,
  };
}

// Una varianza. Se da la desviación muestral (s) o la varianza muestral (s2),
// no ambas; la que no se da es null.
// El intervalo no es simétrico alrededor de s², así que no tiene margen de error.
// Devuelve { alfa, gl, varianza, numerador, chiDerecha, chiIzquierda, inferior, superior }.
function intervaloVarianza(n, s, s2, confianza) {
  const error = revisarConfianza(confianza) || revisarTamanoMuestra(n, 2);
  if (error) return { error: error };

  let varianza;
  if (s === null && s2 === null) {
    return { error: "Falta la desviación estándar muestral (s) o la varianza muestral (s²)." };
  }
  if (s !== null && s2 !== null) {
    return { error: "Escribe solo uno de los dos datos: la desviación estándar muestral (s) o la varianza muestral (s²)." };
  }
  if (s !== null) {
    const errorS = revisarPositivo(s, "la desviación estándar muestral (s)");
    if (errorS) return { error: errorS };
    varianza = s * s;                                   // S² = s · s
  } else {
    const errorS2 = revisarPositivo(s2, "la varianza muestral (s²)");
    if (errorS2) return { error: errorS2 };
    varianza = s2;
  }

  const alfa = calcularAlfa(confianza);
  const gl = n - 1;                                     // ν = n − 1
  // χ²_{α/2,ν}: deja α/2 a la derecha (el valor grande, va en el límite inferior).
  const chiDerecha = valoresCriticos.valorCriticoChi2(1 - alfa / 2, gl);
  // χ²_{1−α/2,ν}: deja α/2 a la izquierda (el valor pequeño, va en el límite superior).
  const chiIzquierda = valoresCriticos.valorCriticoChi2(alfa / 2, gl);
  if (chiDerecha.error) return { error: "No se pudo obtener el valor crítico: " + chiDerecha.error };
  if (chiIzquierda.error) return { error: "No se pudo obtener el valor crítico: " + chiIzquierda.error };

  const numerador = gl * varianza;                      // (n − 1)S²
  return {
    alfa: alfa,
    gl: gl,
    varianza: varianza,
    numerador: numerador,
    chiDerecha: chiDerecha,
    chiIzquierda: chiIzquierda,
    inferior: numerador / chiDerecha.valor,
    superior: numerador / chiIzquierda.valor,
  };
}

// ---------- Tamaño de muestra ----------

// Media: n = (z_{α/2} · σ / e)². Necesita σ conocida y el error máximo deseado e.
// El resultado se redondea hacia arriba porque n debe ser entero y, si se
// redondeara hacia abajo, el error sería mayor que e.
// Devuelve { alfa, critico, valor (sin redondear), n }.
function tamanoMuestraMedia(sigma, errorDeseado, confianza) {
  const error = revisarConfianza(confianza) ||
    revisarPositivo(sigma, "la desviación estándar poblacional (σ)") ||
    revisarPositivo(errorDeseado, "el error máximo deseado (e)");
  if (error) return { error: error };

  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const valor = Math.pow(critico.valor * sigma / errorDeseado, 2);
  return { alfa: alfa, critico: critico, valor: valor, n: Math.ceil(valor) };
}

// Proporción: n = z²_{α/2} · p·q / e². Usa la p de la muestra; e debe estar entre 0 y 1.
// Devuelve { alfa, critico, valor (sin redondear), n }.
function tamanoMuestraProporcion(p, errorDeseado, confianza) {
  const error = revisarConfianza(confianza) || revisarPositivo(errorDeseado, "el error máximo deseado (e)");
  if (error) return { error: error };
  if (errorDeseado >= 1) {
    return { error: "Para una proporción el error máximo deseado (e) debe ser menor que 1 " +
      "(se recibió " + errorDeseado + "). Si tienes un porcentaje, divídelo entre 100 (3 % → 0.03)." };
  }
  if (typeof p !== "number" || !(p > 0 && p < 1)) {
    return { error: "La proporción p debe estar entre 0 y 1, sin incluirlos (se recibió " + p + ")." };
  }

  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const valor = critico.valor * critico.valor * p * (1 - p) / (errorDeseado * errorDeseado);
  return { alfa: alfa, critico: critico, valor: valor, n: Math.ceil(valor) };
}

// ---------- Validaciones ----------

// α = 1 − confianza/100. Se calcula como (100 − confianza)/100 para que, por
// ejemplo, 95 % dé exactamente 0.05.
function calcularAlfa(confianza) {
  return (100 - confianza) / 100;
}

function revisarConfianza(confianza) {
  if (typeof confianza !== "number" || !(confianza > 0 && confianza < 100)) {
    return "El nivel de confianza debe ser un número mayor que 0 y menor que 100 (se recibió " + confianza + ").";
  }
  return null;
}

function revisarTamanoMuestra(n, minimo) {
  if (n === null || n === undefined) return "Falta el tamaño de muestra (n).";
  if (!Number.isInteger(n) || n < minimo) {
    return "El tamaño de muestra (n) debe ser un número entero mayor o igual que " + minimo +
      " (se recibió " + n + ")." + (minimo === 2 ? " Con un solo dato no se puede estimar la dispersión." : "");
  }
  return null;
}

// nombre va en minúscula y con artículo, por ejemplo "la media muestral (x̄)".
function revisarNumero(valor, nombre) {
  if (valor === null || valor === undefined) return "Falta " + nombre + ".";
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return "El valor de " + nombre + " debe ser un número (se recibió " + valor + ").";
  }
  return null;
}

function revisarPositivo(valor, nombre) {
  const error = revisarNumero(valor, nombre);
  if (error) return error;
  if (valor <= 0) return "El valor de " + nombre + " debe ser mayor que 0 (se recibió " + valor + ").";
  return null;
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    intervaloMediaZ,
    intervaloMediaT,
    intervaloProporcion,
    intervaloVarianza,
    tamanoMuestraMedia,
    tamanoMuestraProporcion,
  };
}
