// Intervalos de confianza de una muestra (Parte 6), según el formulario:

const valoresCriticos = typeof module !== "undefined"
  ? require("./valores-criticos.js")
  : {
    valorCriticoZ: valorCriticoZ,
    valorCriticoT: valorCriticoT,
    valorCriticoChi2: valorCriticoChi2,
    valorCriticoF: valorCriticoF,
    redondearGL: redondearGL,
  };
const MUESTRA_GRANDE = typeof module !== "undefined"
  ? require("./metodos.js").TAMANO_MUESTRA_GRANDE
  : TAMANO_MUESTRA_GRANDE;

// ---------- Intervalos ----------

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
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = desviacion / Math.sqrt(n);
  const margen = critico.valor * errorEstandar;
  return {
    alfa: alfa,
    critico: critico,
    errorEstandar: errorEstandar,
    margen: margen,
    inferior: media - margen,
    superior: media + margen,
  };
}

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
  const gl = n - 1;
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = s / Math.sqrt(n);
  const margen = critico.valor * errorEstandar;
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
    p = exitos / n;
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

  const q = 1 - p;
  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = Math.sqrt(p * q / n);
  const margen = critico.valor * errorEstandar;
  const inferior = p - margen;
  const superior = p + margen;

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
    varianza = s * s;
  } else {
    const errorS2 = revisarPositivo(s2, "la varianza muestral (s²)");
    if (errorS2) return { error: errorS2 };
    varianza = s2;
  }

  const alfa = calcularAlfa(confianza);
  const gl = n - 1;
  const chiDerecha = valoresCriticos.valorCriticoChi2(1 - alfa / 2, gl);
  const chiIzquierda = valoresCriticos.valorCriticoChi2(alfa / 2, gl);
  if (chiDerecha.error) return { error: "No se pudo obtener el valor crítico: " + chiDerecha.error };
  if (chiIzquierda.error) return { error: "No se pudo obtener el valor crítico: " + chiIzquierda.error };

  const numerador = gl * varianza;
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
    sigmaInferior: Math.sqrt(inferior),
    sigmaSuperior: Math.sqrt(superior),
  };
}

// ---------- Tamaño de muestra ----------

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
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const diferencia = media1 - media2;
  const errorEstandar = Math.sqrt(desv1 * desv1 / n1 + desv2 * desv2 / n2);
  const margen = critico.valor * errorEstandar;
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

function intervaloDosMediasTIguales(n1, media1, s1, n2, media2, s2, confianza) {
  const error = revisarDatosDosMediasT(n1, media1, s1, n2, media2, s2, confianza);
  if (error) return { error: error };
  if (n1 >= MUESTRA_GRANDE || n2 >= MUESTRA_GRANDE) {
    return { error: "El formulario usa t con varianza combinada solo si las muestras son pequeñas (n < " +
      MUESTRA_GRANDE + "); aquí n₁ = " + n1 + " y n₂ = " + n2 + "." };
  }

  const alfa = calcularAlfa(confianza);
  const gl = n1 + n2 - 2;
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / gl);
  const diferencia = media1 - media2;
  const errorEstandar = sp * Math.sqrt(1 / n1 + 1 / n2);
  const margen = critico.valor * errorEstandar;
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

function intervaloDosMediasTDiferentes(n1, media1, s1, n2, media2, s2, confianza) {
  const error = revisarDatosDosMediasT(n1, media1, s1, n2, media2, s2, confianza);
  if (error) return { error: error };
  if (n1 >= MUESTRA_GRANDE && n2 >= MUESTRA_GRANDE) {
    return { error: "Con varianzas diferentes y ambas muestras grandes (n₁ = " + n1 + ", n₂ = " + n2 +
      ") coinciden dos métodos del formulario (Z y t con gl de Welch); confirma con tu profesor cuál se usa." };
  }

  const alfa = calcularAlfa(confianza);
  const varMedia1 = s1 * s1 / n1;
  const varMedia2 = s2 * s2 / n2;
  const suma = varMedia1 + varMedia2;
  const glWelch = suma * suma / (varMedia1 * varMedia1 / (n1 - 1) + varMedia2 * varMedia2 / (n2 - 1));
  const gl = valoresCriticos.redondearGL(glWelch);
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const diferencia = media1 - media2;
  const errorEstandar = Math.sqrt(suma);
  const margen = critico.valor * errorEstandar;
  return {
    alfa: alfa,
    gl: gl,
    glWelch: glWelch,
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

function revisarDatosDosMediasT(n1, media1, s1, n2, media2, s2, confianza) {
  return revisarConfianza(confianza) ||
    revisarTamanoDe(n1, 2, "la muestra 1 (n₁)") || revisarTamanoDe(n2, 2, "la muestra 2 (n₂)") ||
    revisarNumero(media1, "la media de la muestra 1 (x̄₁)") || revisarNumero(media2, "la media de la muestra 2 (x̄₂)") ||
    revisarPositivo(s1, "la desviación estándar muestral de la muestra 1 (s₁)") ||
    revisarPositivo(s2, "la desviación estándar muestral de la muestra 2 (s₂)");
}

function intervaloDosProporciones(n1, exitos1, prop1, n2, exitos2, prop2, confianza) {
  const errorConfianza = revisarConfianza(confianza);
  if (errorConfianza) return { error: errorConfianza };
  const m1 = proporcionDe(n1, exitos1, prop1, 1);
  if (m1.error) return m1;
  const m2 = proporcionDe(n2, exitos2, prop2, 2);
  if (m2.error) return m2;

  const p1 = m1.p;
  const p2 = m2.p;
  const q1 = 1 - p1;
  const q2 = 1 - p2;
  const alfa = calcularAlfa(confianza);
  const critico = valoresCriticos.valorCriticoZ(1 - alfa / 2);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const diferencia = p1 - p2;
  const errorEstandar = Math.sqrt(p1 * q1 / n1 + p2 * q2 / n2);
  const margen = critico.valor * errorEstandar;
  const inferior = diferencia - margen;
  const superior = diferencia + margen;

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

function intervaloPareadas(n, mediaD, desvD, confianza) {
  const error = revisarConfianza(confianza) || revisarTamanoDe(n, 2, "pares (n)") ||
    revisarNumero(mediaD, "la media de las diferencias (d̄)") ||
    revisarPositivo(desvD, "la desviación estándar de las diferencias (s_d)");
  if (error) return { error: error };

  const alfa = calcularAlfa(confianza);
  const gl = n - 1;
  const critico = valoresCriticos.valorCriticoT(1 - alfa / 2, gl);
  if (critico.error) return { error: "No se pudo obtener el valor crítico: " + critico.error };

  const errorEstandar = desvD / Math.sqrt(n);
  const margen = critico.valor * errorEstandar;
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

function intervaloCocienteVarianzas(n1, desv1, varianza1, n2, desv2, varianza2, confianza) {
  const error = revisarConfianza(confianza) ||
    revisarTamanoDe(n1, 2, "la muestra 1 (n₁)") || revisarTamanoDe(n2, 2, "la muestra 2 (n₂)");
  if (error) return { error: error };
  const v1 = varianzaDe(desv1, varianza1, 1);
  if (v1.error) return v1;
  const v2 = varianzaDe(desv2, varianza2, 2);
  if (v2.error) return v2;

  const alfa = calcularAlfa(confianza);
  const gl1 = n1 - 1;
  const gl2 = n2 - 1;
  const fInferior = valoresCriticos.valorCriticoF(1 - alfa / 2, gl1, gl2);
  const fSuperior = valoresCriticos.valorCriticoF(1 - alfa / 2, gl2, gl1);
  if (fInferior.error) return { error: "No se pudo obtener el valor crítico: " + fInferior.error };
  if (fSuperior.error) return { error: "No se pudo obtener el valor crítico: " + fSuperior.error };

  const razon = v1.varianza / v2.varianza;
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
    p = exitos / n;
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
    return errorS ? { error: errorS } : { varianza: desv * desv };
  }
  const errorV = revisarPositivo(varianza, "la varianza de la muestra " + numero + " (s" + sub + "²)");
  return errorV ? { error: errorV } : { varianza: varianza };
}

// ---------- Formato ----------

function formatearLimite(numero) {
  if (numero === 0) return "0";
  const decimales = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(numero))));
  const texto = numero.toFixed(Math.min(decimales, 100));
  return texto.includes(".") ? texto.replace(/\.?0+$/, "") : texto;
}

// ---------- Validaciones ----------

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

function revisarTamanoDe(n, minimo, nombre) {
  if (n === null || n === undefined) return "Falta el tamaño de " + nombre + ".";
  if (!Number.isInteger(n) || n < minimo) {
    return "El tamaño de " + nombre + " debe ser un número entero mayor o igual que " + minimo +
      " (se recibió " + n + ")." + (minimo === 2 ? " Con un solo dato no se puede estimar la dispersión." : "");
  }
  return null;
}

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
    revisarTamanoDe,
    revisarNumero,
    revisarPositivo,
    varianzaDe,
  };
}
