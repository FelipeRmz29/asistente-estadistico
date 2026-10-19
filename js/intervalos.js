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

//
// Intervalos de dos muestras (Parte 7), según el formulario:
//
//   Dos medias, n ≥ 30 o σ² conocidas:  (x̄₁ − x̄₂) ± e,  e = z_{α/2} · √(σ₁²/n₁ + σ₂²/n₂)
//   Dos medias, σ² desconocidas, iguales:     e = t_{α/2,ν} · Sp · √(1/n₁ + 1/n₂),
//        Sp = √(((n₁−1)s₁² + (n₂−1)s₂²) / (n₁+n₂−2)),  ν = n₁ + n₂ − 2
//   Dos medias, σ² desconocidas, diferentes:  e = t_{α/2,ν} · √(s₁²/n₁ + s₂²/n₂),
//        ν = (s₁²/n₁ + s₂²/n₂)² / [ (s₁²/n₁)²/(n₁−1) + (s₂²/n₂)²/(n₂−1) ]
//   Dos proporciones: (p₁ − p₂) ± e,  e = z_{α/2} · √(p₁q₁/n₁ + p₂q₂/n₂)
//   Muestras pareadas: d̄ ± e,  e = t_{α/2,ν} · s_d / √n,  ν = n − 1
//   Cociente de varianzas: (S₁²/S₂²) · 1/F_{α/2(ν₁,ν₂)} ≤ σ₁²/σ₂² ≤ (S₁²/S₂²) · F_{α/2(ν₂,ν₁)},
//        ν₁ = n₁ − 1, ν₂ = n₂ − 1
//
// F_{α/2(a,b)} deja α/2 a la derecha y tiene a grados de libertad en el numerador.
// El formulario no trae fórmulas de tamaño de muestra para dos muestras, así que
// no se calcula.

// En el navegador estas funciones ya están cargadas por index.html (valores-criticos.js
// y metodos.js van antes que este archivo); en Node (pruebas) se cargan con require.
const valoresCriticos = typeof module !== "undefined"
  ? require("./valores-criticos.js")
  : {
    valorCriticoZ: valorCriticoZ,
    valorCriticoT: valorCriticoT,
    valorCriticoChi2: valorCriticoChi2,
    valorCriticoF: valorCriticoF,
  };
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
// También da el intervalo de σ (sigmaInferior, sigmaSuperior): la raíz cuadrada de los límites de σ².
// Devuelve { alfa, gl, varianza, numerador, chiDerecha, chiIzquierda, inferior, superior,
//            sigmaInferior, sigmaSuperior }.
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
  const inferior = numerador / chiDerecha.valor;
  const superior = numerador / chiIzquierda.valor;
  return {
    alfa: alfa,
    gl: gl,
    varianza: varianza,
    numerador: numerador,
    chiDerecha: chiDerecha,
    chiIzquierda: chiIzquierda,
    inferior: inferior,
    superior: superior,
    // Intervalo para σ: raíz cuadrada de los límites de σ² SIN redondear.
    sigmaInferior: Math.sqrt(inferior),
    sigmaSuperior: Math.sqrt(superior),
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

// ---------- Intervalos de dos muestras (Parte 7) ----------

// Diferencia de dos medias con Z (muestras independientes).
// desv1 y desv2 son σ₁ y σ₂ si sigmaConocida es true; si no, son s₁ y s₂, y el
// formulario solo permite Z cuando ambas muestras son grandes (n ≥ 30).
// Devuelve { alfa, critico, diferencia, errorEstandar, margen, inferior, superior }.
function intervaloDosMediasZ(n1, media1, desv1, n2, media2, desv2, sigmaConocida, confianza) {
  const simbolo = sigmaConocida ? "σ" : "s";
  const nombre = sigmaConocida ? "la desviación estándar poblacional" : "la desviación estándar muestral";
  const error = revisarConfianza(confianza) ||
    revisarTamanoDe(n1, 1, "la muestra 1 (n₁)") || revisarTamanoDe(n2, 1, "la muestra 2 (n₂)") ||
    revisarNumero(media1, "la media de la muestra 1 (x̄₁)") || revisarNumero(media2, "la media de la muestra 2 (x̄₂)") ||
    revisarPositivo(desv1, nombre + " de la muestra 1 (" + simbolo + "₁)") ||
    revisarPositivo(desv2, nombre + " de la muestra 2 (" + simbolo + "₂)");
  if (error) return { error: error };
  if (!sigmaConocida && (n1 < MUESTRA_GRANDE || n2 < MUESTRA_GRANDE)) {
    return { error: "Con σ desconocidas el formulario usa Z solo si ambas muestras son grandes (n ≥ " +
      MUESTRA_GRANDE + "); aquí n₁ = " + n1 + " y n₂ = " + n2 + "." };
  }

  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2); // z_{α/2}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const diferencia = media1 - media2;                                      // x̄₁ − x̄₂
  const errorEstandar = Math.sqrt(desv1 * desv1 / n1 + desv2 * desv2 / n2); // √(σ₁²/n₁ + σ₂²/n₂)
  const margen = critico.valor * errorEstandar;                           // e = z_{α/2} · √(...)
  return {
    alfa: alfa,
    critico: critico,
    diferencia: diferencia,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: diferencia - margen,
    superior: diferencia + margen,
  };
}

// Diferencia de dos medias con t, σ² desconocidas y suponiéndolas IGUALES
// (varianza combinada). El formulario lo usa con muestras pequeñas (n < 30).
// Devuelve { alfa, gl, sp, critico, diferencia, errorEstandar, margen, inferior, superior }.
function intervaloDosMediasTIguales(n1, media1, s1, n2, media2, s2, confianza) {
  const error = revisarDatosDosMediasT(n1, media1, s1, n2, media2, s2, confianza);
  if (error) return { error: error };
  if (n1 >= MUESTRA_GRANDE || n2 >= MUESTRA_GRANDE) {
    return { error: "El formulario usa t con varianza combinada solo si las muestras son pequeñas (n < " +
      MUESTRA_GRANDE + "); aquí n₁ = " + n1 + " y n₂ = " + n2 + "." };
  }

  const alfa = calcularAlfa(confianza);
  const gl = n1 + n2 - 2;                                                  // ν = n₁ + n₂ − 2
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);         // t_{α/2,ν}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / gl);    // Sp
  const diferencia = media1 - media2;
  const errorEstandar = sp * Math.sqrt(1 / n1 + 1 / n2);                  // Sp · √(1/n₁ + 1/n₂)
  const margen = critico.valor * errorEstandar;                           // e = t_{α/2,ν} · Sp · √(...)
  return {
    alfa: alfa,
    gl: gl,
    sp: sp,
    critico: critico,
    diferencia: diferencia,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: diferencia - margen,
    superior: diferencia + margen,
  };
}

// Diferencia de dos medias con t, σ² desconocidas y suponiéndolas DIFERENTES
// (grados de libertad de Welch, que normalmente no son un número entero).
// Si las dos muestras son grandes (n ≥ 30), el formulario usa Z, no esta fórmula.
// Devuelve { alfa, gl, varMedia1, varMedia2, critico, diferencia, errorEstandar, margen, inferior, superior }.
function intervaloDosMediasTDiferentes(n1, media1, s1, n2, media2, s2, confianza) {
  const error = revisarDatosDosMediasT(n1, media1, s1, n2, media2, s2, confianza);
  if (error) return { error: error };
  if (n1 >= MUESTRA_GRANDE && n2 >= MUESTRA_GRANDE) {
    return { error: "Con varianzas diferentes y ambas muestras grandes (n₁ = " + n1 + ", n₂ = " + n2 +
      ") coinciden dos métodos del formulario (Z y t con gl de Welch); confirma con tu profesor cuál se usa." };
  }

  const alfa = calcularAlfa(confianza);
  const varMedia1 = s1 * s1 / n1;                                          // s₁²/n₁
  const varMedia2 = s2 * s2 / n2;                                          // s₂²/n₂
  const suma = varMedia1 + varMedia2;
  const gl = suma * suma / (varMedia1 * varMedia1 / (n1 - 1) + varMedia2 * varMedia2 / (n2 - 1)); // ν
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);         // t_{α/2,ν}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const diferencia = media1 - media2;
  const errorEstandar = Math.sqrt(suma);                                   // √(s₁²/n₁ + s₂²/n₂)
  const margen = critico.valor * errorEstandar;                           // e = t_{α/2,ν} · √(...)
  return {
    alfa: alfa,
    gl: gl,
    varMedia1: varMedia1,
    varMedia2: varMedia2,
    critico: critico,
    diferencia: diferencia,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: diferencia - margen,
    superior: diferencia + margen,
  };
}

// Revisión común de los dos casos con t: cada muestra necesita n ≥ 2 para poder calcular s.
function revisarDatosDosMediasT(n1, media1, s1, n2, media2, s2, confianza) {
  return revisarConfianza(confianza) ||
    revisarTamanoDe(n1, 2, "la muestra 1 (n₁)") || revisarTamanoDe(n2, 2, "la muestra 2 (n₂)") ||
    revisarNumero(media1, "la media de la muestra 1 (x̄₁)") || revisarNumero(media2, "la media de la muestra 2 (x̄₂)") ||
    revisarPositivo(s1, "la desviación estándar muestral de la muestra 1 (s₁)") ||
    revisarPositivo(s2, "la desviación estándar muestral de la muestra 2 (s₂)");
}

// Diferencia de dos proporciones (muestras independientes). En cada muestra se da el
// número de éxitos (exitos) o la proporción muestral (prop), no ambos; el que no se da es null.
// Devuelve { alfa, p1, q1, p2, q2, critico, diferencia, errorEstandar, margen, inferior, superior, advertencias }.
function intervaloDosProporciones(n1, exitos1, prop1, n2, exitos2, prop2, confianza) {
  const errorConfianza = revisarConfianza(confianza);
  if (errorConfianza) return { error: errorConfianza };
  const m1 = proporcionDe(n1, exitos1, prop1, 1);
  if (m1.error) return m1;
  const m2 = proporcionDe(n2, exitos2, prop2, 2);
  if (m2.error) return m2;

  const p1 = m1.p;
  const p2 = m2.p;
  const q1 = 1 - p1;                                                       // q₁ = 1 − p₁
  const q2 = 1 - p2;                                                       // q₂ = 1 − p₂
  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);             // z_{α/2}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const diferencia = p1 - p2;                                              // p₁ − p₂
  const errorEstandar = Math.sqrt(p1 * q1 / n1 + p2 * q2 / n2);            // √(p₁q₁/n₁ + p₂q₂/n₂)
  const margen = critico.valor * errorEstandar;                           // e = z_{α/2} · √(...)
  const inferior = diferencia - margen;
  const superior = diferencia + margen;

  // El formulario no pone condiciones, pero usa la aproximación normal: se avisa sin bloquear.
  const advertencias = [];
  if (n1 * p1 < 5 || n1 * q1 < 5 || n2 * p2 < 5 || n2 * q2 < 5) {
    advertencias.push("Alguno de n·p o n·q es menor que 5. La fórmula usa la aproximación normal, que suele pedir " +
      "n·p ≥ 5 y n·q ≥ 5 en cada muestra; el intervalo puede no ser confiable. Confirma con tu profesor si se acepta.");
  }
  if (inferior < -1 || superior > 1) {
    advertencias.push("Un límite del intervalo queda fuera de [−1, 1], pero la diferencia de dos proporciones " +
      "no puede salirse de ese rango.");
  }

  return {
    alfa: alfa,
    p1: p1,
    q1: q1,
    p2: p2,
    q2: q2,
    critico: critico,
    diferencia: diferencia,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: inferior,
    superior: superior,
    advertencias: advertencias,
  };
}

// Muestras pareadas. Se trabaja con las diferencias d = muestra 1 − muestra 2 como UNA
// sola muestra: n es el número de pares, mediaD = d̄ y desvD = s_d.
// El formulario usa t con ν = n − 1 sin importar el tamaño de n.
// Devuelve { alfa, gl, critico, errorEstandar, margen, inferior, superior }.
function intervaloPareadas(n, mediaD, desvD, confianza) {
  const error = revisarConfianza(confianza) || revisarTamanoDe(n, 2, "pares (n)") ||
    revisarNumero(mediaD, "la media de las diferencias (d̄)") ||
    revisarPositivo(desvD, "la desviación estándar de las diferencias (s_d)");
  if (error) return { error: error };

  const alfa = calcularAlfa(confianza);
  const gl = n - 1;                                                        // ν = n − 1
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);         // t_{α/2,ν}
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = desvD / Math.sqrt(n);                              // s_d / √n
  const margen = critico.valor * errorEstandar;                           // e = t_{α/2,ν} · s_d / √n
  return {
    alfa: alfa,
    gl: gl,
    critico: critico,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: mediaD - margen,
    superior: mediaD + margen,
  };
}

// Cociente de dos varianzas (σ₁² / σ₂²), muestras independientes. En cada muestra se da
// la desviación (desv) o la varianza (varianza), no ambas; la que no se da es null.
// El intervalo no es simétrico, así que no tiene margen de error.
// Devuelve { alfa, gl1, gl2, varianza1, varianza2, razon, fInferior, fSuperior, inferior, superior }.
function intervaloCocienteVarianzas(n1, desv1, varianza1, n2, desv2, varianza2, confianza) {
  const error = revisarConfianza(confianza) ||
    revisarTamanoDe(n1, 2, "la muestra 1 (n₁)") || revisarTamanoDe(n2, 2, "la muestra 2 (n₂)");
  if (error) return { error: error };
  const v1 = varianzaDe(desv1, varianza1, 1);
  if (v1.error) return v1;
  const v2 = varianzaDe(desv2, varianza2, 2);
  if (v2.error) return v2;

  const alfa = calcularAlfa(confianza);
  const gl1 = n1 - 1;                                                      // ν₁ = n₁ − 1
  const gl2 = n2 - 1;                                                      // ν₂ = n₂ − 1
  // F_{α/2(ν₁,ν₂)}: va dividiendo, en el límite inferior.
  const fInferior = valoresCriticos.valorCriticoF(1 - alfa / 2, gl1, gl2);
  // F_{α/2(ν₂,ν₁)}: los grados de libertad intercambiados; va multiplicando, en el límite superior.
  const fSuperior = valoresCriticos.valorCriticoF(1 - alfa / 2, gl2, gl1);
  if (fInferior.error) return { error: "No se pudo obtener el valor crítico: " + fInferior.error };
  if (fSuperior.error) return { error: "No se pudo obtener el valor crítico: " + fSuperior.error };

  const razon = v1.varianza / v2.varianza;                                 // S₁² / S₂²
  return {
    alfa: alfa,
    gl1: gl1,
    gl2: gl2,
    varianza1: v1.varianza,
    varianza2: v2.varianza,
    razon: razon,
    fInferior: fInferior,
    fSuperior: fSuperior,
    inferior: razon / fInferior.valor,
    superior: razon * fSuperior.valor,
  };
}

// Proporción de una de las dos muestras, a partir de n y de x o p̂ (el que no se da es null).
// numero es 1 o 2 (la muestra) y solo sirve para escribir los mensajes.
// Devuelve { p } o { error }.
function proporcionDe(n, exitos, proporcion, numero) {
  const muestra = "de la muestra " + numero;
  const errorN = revisarTamanoDe(n, 1, "la muestra " + numero + " (n" + (numero === 1 ? "₁" : "₂") + ")");
  if (errorN) return { error: errorN };

  let p;
  if (exitos === null && proporcion === null) {
    return { error: "Falta el número de éxitos o la proporción muestral " + muestra + "." };
  }
  if (exitos !== null && proporcion !== null) {
    return { error: "En la muestra " + numero + " escribe solo uno de los dos datos: el número de éxitos o la proporción muestral." };
  }
  if (exitos !== null) {
    if (!Number.isInteger(exitos) || exitos < 0 || exitos > n) {
      return { error: "El número de éxitos " + muestra + " debe ser un número entero entre 0 y n = " + n +
        " (se recibió " + exitos + ")." };
    }
    p = exitos / n;                                                        // p = x / n
  } else {
    if (typeof proporcion !== "number" || !(proporcion >= 0 && proporcion <= 1)) {
      return { error: "La proporción muestral " + muestra + " debe estar entre 0 y 1 (se recibió " + proporcion +
        "). Si tienes un porcentaje, divídelo entre 100 (35 % → 0.35)." };
    }
    p = proporcion;
  }
  if (p === 0 || p === 1) {
    return { error: "En la muestra " + numero + " se obtiene p = " + p + ", con lo que p·q = 0: la aproximación normal " +
      "de la fórmula no se puede usar. Se necesita al menos un éxito y un fracaso en cada muestra." };
  }
  return { p: p };
}

// Varianza de una de las dos muestras, a partir de la desviación o de la varianza.
// Devuelve { varianza } o { error }.
function varianzaDe(desv, varianza, numero) {
  const sub = numero === 1 ? "₁" : "₂";
  if (desv === null && varianza === null) {
    return { error: "Falta la desviación estándar (s" + sub + ") o la varianza (s" + sub + "²) de la muestra " + numero + "." };
  }
  if (desv !== null && varianza !== null) {
    return { error: "En la muestra " + numero + " escribe solo uno de los dos datos: la desviación estándar (s" + sub +
      ") o la varianza (s" + sub + "²)." };
  }
  if (desv !== null) {
    const errorS = revisarPositivo(desv, "la desviación estándar de la muestra " + numero + " (s" + sub + ")");
    return errorS ? { error: errorS } : { varianza: desv * desv };         // S² = s · s
  }
  const errorV = revisarPositivo(varianza, "la varianza de la muestra " + numero + " (s" + sub + "²)");
  return errorV ? { error: errorV } : { varianza: varianza };
}

// ---------- Formato ----------

// Texto para mostrar un número con 4 decimales o, si es menor que 0.1 en valor absoluto,
// con 4 cifras significativas (0.000123456 → 0.0001235, no 0.0001). Quita los ceros
// sobrantes. Solo es para mostrar: el valor que se calcula no se redondea.
// Se usa con los límites de varianzas y desviaciones, que pueden ser muy pequeños.
function formatearLimite(numero) {
  if (numero === 0) return "0";
  const decimales = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(numero))));
  const texto = numero.toFixed(Math.min(decimales, 100));
  return texto.includes(".") ? texto.replace(/\.?0+$/, "") : texto;
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

// Como revisarTamanoMuestra, pero con el nombre del tamaño en el mensaje, por ejemplo
// "la muestra 1 (n₁)". Falta si es null; debe ser un entero mayor o igual que minimo.
function revisarTamanoDe(n, minimo, nombre) {
  if (n === null || n === undefined) return "Falta el tamaño de " + nombre + ".";
  if (!Number.isInteger(n) || n < minimo) {
    return "El tamaño de " + nombre + " debe ser un número entero mayor o igual que " + minimo +
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
    intervaloDosMediasZ,
    intervaloDosMediasTIguales,
    intervaloDosMediasTDiferentes,
    intervaloDosProporciones,
    intervaloPareadas,
    intervaloCocienteVarianzas,
    tamanoMuestraMedia,
    tamanoMuestraProporcion,
    formatearLimite,
    // Validaciones que también usan las pruebas de hipótesis (js/pruebas.js).
    revisarTamanoDe,
    revisarNumero,
    revisarPositivo,
    varianzaDe,
  };
}
