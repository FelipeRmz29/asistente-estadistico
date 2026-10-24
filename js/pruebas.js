// Pruebas de hipótesis (Parte 9).

const distribuciones = typeof module !== "undefined"
  ? require("./valores-criticos.js")
  : {
    cdfNormal: cdfNormal,
    cdfT: cdfT,
    cdfChi2: cdfChi2,
    cdfF: cdfF,
    valorCriticoZ: valorCriticoZ,
    valorCriticoT: valorCriticoT,
    valorCriticoChi2: valorCriticoChi2,
    valorCriticoF: valorCriticoF,
    redondearGL: redondearGL,
  };
const revisiones = typeof module !== "undefined"
  ? require("./intervalos.js")
  : {
    revisarTamanoDe: revisarTamanoDe,
    revisarNumero: revisarNumero,
    revisarPositivo: revisarPositivo,
    varianzaDe: varianzaDe,
  };
const MUESTRA_GRANDE_PRUEBA = typeof module !== "undefined"
  ? require("./metodos.js").TAMANO_MUESTRA_GRANDE
  : TAMANO_MUESTRA_GRANDE;

const ALTERNATIVAS = {
  "dos-colas": { signo: "≠", cola: "dos colas", relacion: "es diferente de" },
  "izquierda": { signo: "<", cola: "cola izquierda", relacion: "es menor que" },
  "derecha": { signo: ">", cola: "cola derecha", relacion: "es mayor que" },
};

// ---------- Pruebas de una muestra ----------

function pruebaMediaZ(n, media, desviacion, sigmaConocida, mu0, alternativa, alfa) {
  const nombreDesviacion = sigmaConocida
    ? "la desviación estándar poblacional (σ)"
    : "la desviación estándar muestral (s)";
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n, 1, "la muestra (n)") ||
    revisiones.revisarNumero(media, "la media muestral (x̄)") ||
    revisiones.revisarPositivo(desviacion, nombreDesviacion) ||
    revisiones.revisarNumero(mu0, "μ₀ (valor del parámetro en H₀)");
  if (error) return { error: error };
  if (!sigmaConocida && n < MUESTRA_GRANDE_PRUEBA) {
    return { error: "Con σ desconocida el formulario usa Z solo si n ≥ " + MUESTRA_GRANDE_PRUEBA +
      " (aquí n = " + n + "); con n < " + MUESTRA_GRANDE_PRUEBA + " corresponde t." };
  }

  const errorEstandar = desviacion / Math.sqrt(n);
  const estadistico = (media - mu0) / errorEstandar;
  return terminarPrueba({ errorEstandar: errorEstandar, estadistico: estadistico }, "z", null, null,
    { simbolo: "μ", nombre: "la media poblacional", valor: mu0 }, alternativa, alfa);
}

function pruebaMediaT(n, media, s, mu0, alternativa, alfa) {
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n, 2, "la muestra (n)") ||
    revisiones.revisarNumero(media, "la media muestral (x̄)") ||
    revisiones.revisarPositivo(s, "la desviación estándar muestral (s)") ||
    revisiones.revisarNumero(mu0, "μ₀ (valor del parámetro en H₀)");
  if (error) return { error: error };
  if (n >= MUESTRA_GRANDE_PRUEBA) {
    return { error: "El formulario usa t solo si n < " + MUESTRA_GRANDE_PRUEBA + " (aquí n = " + n +
      "); con n ≥ " + MUESTRA_GRANDE_PRUEBA + " corresponde Z." };
  }

  const gl = n - 1;
  const errorEstandar = s / Math.sqrt(n);
  const estadistico = (media - mu0) / errorEstandar;
  return terminarPrueba({ gl: gl, errorEstandar: errorEstandar, estadistico: estadistico }, "t", gl, null,
    { simbolo: "μ", nombre: "la media poblacional", valor: mu0 }, alternativa, alfa);
}

function pruebaProporcion(n, exitos, proporcion, pi0, alternativa, alfa) {
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n, 1, "la muestra (n)") ||
    revisarProporcionH0(pi0);
  if (error) return { error: error };
  const muestra = proporcionMuestral(n, exitos, proporcion, "");
  if (muestra.error) return muestra;

  const p = muestra.p;
  const q0 = 1 - pi0;
  const errorEstandar = Math.sqrt(pi0 * q0 / n);
  const estadistico = (p - pi0) / errorEstandar;

  const advertencias = [];
  if (n * pi0 < 5 || n * q0 < 5) {
    advertencias.push("n·π₀ o n·q₀ es menor que 5. La prueba usa la aproximación normal, que suele pedir " +
      "n·π₀ ≥ 5 y n·q₀ ≥ 5; el resultado puede no ser confiable. Confirma con tu profesor si se acepta.");
  }
  return terminarPrueba({ p: p, q0: q0, errorEstandar: errorEstandar, estadistico: estadistico, advertencias: advertencias },
    "z", null, null, { simbolo: "π", nombre: "la proporción poblacional", valor: pi0 }, alternativa, alfa);
}

function pruebaVarianza(n, s, s2, varianza0, alternativa, alfa) {
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n, 2, "la muestra (n)") ||
    revisiones.revisarPositivo(varianza0, "σ₀² (valor del parámetro en H₀)");
  if (error) return { error: error };

  let varianza;
  if (s === null && s2 === null) {
    return { error: "Falta la desviación estándar muestral (s) o la varianza muestral (s²)." };
  }
  if (s !== null && s2 !== null) {
    return { error: "Escribe solo uno de los dos datos: la desviación estándar muestral (s) o la varianza muestral (s²)." };
  }
  if (s !== null) {
    const errorS = revisiones.revisarPositivo(s, "la desviación estándar muestral (s)");
    if (errorS) return { error: errorS };
    varianza = s * s;
  } else {
    const errorS2 = revisiones.revisarPositivo(s2, "la varianza muestral (s²)");
    if (errorS2) return { error: errorS2 };
    varianza = s2;
  }

  const gl = n - 1;
  const estadistico = gl * varianza / varianza0;
  return terminarPrueba({ gl: gl, varianza: varianza, estadistico: estadistico }, "chi2", gl, null,
    { simbolo: "σ²", nombre: "la varianza poblacional", valor: varianza0 }, alternativa, alfa);
}

// ---------- Pruebas de dos muestras ----------

function pruebaDosMediasZ(n1, media1, desv1, n2, media2, desv2, sigmaConocida, d0, alternativa, alfa) {
  const simbolo = sigmaConocida ? "σ" : "s";
  const nombre = sigmaConocida ? "la desviación estándar poblacional" : "la desviación estándar muestral";
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n1, 1, "la muestra 1 (n₁)") || revisiones.revisarTamanoDe(n2, 1, "la muestra 2 (n₂)") ||
    revisiones.revisarNumero(media1, "la media de la muestra 1 (x̄₁)") ||
    revisiones.revisarNumero(media2, "la media de la muestra 2 (x̄₂)") ||
    revisiones.revisarPositivo(desv1, nombre + " de la muestra 1 (" + simbolo + "₁)") ||
    revisiones.revisarPositivo(desv2, nombre + " de la muestra 2 (" + simbolo + "₂)") ||
    revisiones.revisarNumero(d0, "d₀ (valor de μ₁ − μ₂ en H₀)");
  if (error) return { error: error };
  if (!sigmaConocida && (n1 < MUESTRA_GRANDE_PRUEBA || n2 < MUESTRA_GRANDE_PRUEBA)) {
    return { error: "Con σ desconocidas el formulario usa Z solo si ambas muestras son grandes (n ≥ " +
      MUESTRA_GRANDE_PRUEBA + "); aquí n₁ = " + n1 + " y n₂ = " + n2 + "." };
  }

  const diferencia = media1 - media2;
  const errorEstandar = Math.sqrt(desv1 * desv1 / n1 + desv2 * desv2 / n2);
  const estadistico = (diferencia - d0) / errorEstandar;
  return terminarPrueba({ diferencia: diferencia, errorEstandar: errorEstandar, estadistico: estadistico },
    "z", null, null, parametroDosMedias(d0), alternativa, alfa);
}

function pruebaDosMediasTIguales(n1, media1, s1, n2, media2, s2, d0, alternativa, alfa) {
  const error = revisarPruebaDosMediasT(n1, media1, s1, n2, media2, s2, d0, alternativa, alfa);
  if (error) return { error: error };
  if (n1 >= MUESTRA_GRANDE_PRUEBA || n2 >= MUESTRA_GRANDE_PRUEBA) {
    return { error: "El formulario usa t con varianza combinada solo si las muestras son pequeñas (n < " +
      MUESTRA_GRANDE_PRUEBA + "); aquí n₁ = " + n1 + " y n₂ = " + n2 + "." };
  }

  const gl = n1 + n2 - 2;
  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / gl);
  const diferencia = media1 - media2;
  const errorEstandar = sp * Math.sqrt(1 / n1 + 1 / n2);
  const estadistico = (diferencia - d0) / errorEstandar;
  return terminarPrueba({ gl: gl, sp: sp, diferencia: diferencia, errorEstandar: errorEstandar, estadistico: estadistico },
    "t", gl, null, parametroDosMedias(d0), alternativa, alfa);
}

function pruebaDosMediasTDiferentes(n1, media1, s1, n2, media2, s2, d0, alternativa, alfa) {
  const error = revisarPruebaDosMediasT(n1, media1, s1, n2, media2, s2, d0, alternativa, alfa);
  if (error) return { error: error };
  if (n1 >= MUESTRA_GRANDE_PRUEBA && n2 >= MUESTRA_GRANDE_PRUEBA) {
    return { error: "Con varianzas diferentes y ambas muestras grandes (n₁ = " + n1 + ", n₂ = " + n2 +
      ") coinciden dos métodos del formulario (Z y t con gl de Welch); confirma con tu profesor cuál se usa." };
  }

  const varMedia1 = s1 * s1 / n1;
  const varMedia2 = s2 * s2 / n2;
  const suma = varMedia1 + varMedia2;
  const glWelch = suma * suma / (varMedia1 * varMedia1 / (n1 - 1) + varMedia2 * varMedia2 / (n2 - 1));
  const gl = distribuciones.redondearGL(glWelch);
  const diferencia = media1 - media2;
  const errorEstandar = Math.sqrt(suma);
  const estadistico = (diferencia - d0) / errorEstandar;
  return terminarPrueba({
    gl: gl, glWelch: glWelch, varMedia1: varMedia1, varMedia2: varMedia2, diferencia: diferencia,
    errorEstandar: errorEstandar, estadistico: estadistico,
  }, "t", gl, null, parametroDosMedias(d0), alternativa, alfa);
}

function pruebaDosProporciones(n1, exitos1, prop1, n2, exitos2, prop2, alternativa, alfa) {
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n1, 1, "la muestra 1 (n₁)") || revisiones.revisarTamanoDe(n2, 1, "la muestra 2 (n₂)");
  if (error) return { error: error };
  const m1 = proporcionMuestral(n1, exitos1, prop1, " de la muestra 1");
  if (m1.error) return m1;
  const m2 = proporcionMuestral(n2, exitos2, prop2, " de la muestra 2");
  if (m2.error) return m2;

  const p1 = m1.p;
  const p2 = m2.p;
  const combinada = (n1 * p1 + n2 * p2) / (n1 + n2);
  if (!(combinada > 0 && combinada < 1)) {
    return { error: "La proporción combinada es p = " + combinada + " (todas las observaciones son " +
      (combinada === 0 ? "fracasos" : "éxitos") + "), así que p · q = 0 y el estadístico no se puede calcular." };
  }
  const q = 1 - combinada;
  const diferencia = p1 - p2;
  const errorEstandar = Math.sqrt(combinada * q * (1 / n1 + 1 / n2));
  const estadistico = diferencia / errorEstandar;

  const advertencias = [];
  if (n1 * p1 < 5 || n1 * (1 - p1) < 5 || n2 * p2 < 5 || n2 * (1 - p2) < 5) {
    advertencias.push("Alguno de n·p o n·q es menor que 5. La prueba usa la aproximación normal, que suele pedir " +
      "n·p ≥ 5 y n·q ≥ 5 en cada muestra; el resultado puede no ser confiable. Confirma con tu profesor si se acepta.");
  }
  return terminarPrueba({
    p1: p1, p2: p2, combinada: combinada, q: q, diferencia: diferencia,
    errorEstandar: errorEstandar, estadistico: estadistico, advertencias: advertencias,
  }, "z", null, null, { simbolo: "π₁ − π₂", nombre: "la diferencia de proporciones poblacionales", valor: 0,
    equivalente: ["π₁", "π₂"] }, alternativa, alfa);
}

function pruebaPareadas(n, mediaD, desvD, d0, alternativa, alfa) {
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n, 2, "pares (n)") ||
    revisiones.revisarNumero(mediaD, "la media de las diferencias (d̄)") ||
    revisiones.revisarPositivo(desvD, "la desviación estándar de las diferencias (s_d)") ||
    revisiones.revisarNumero(d0, "d₀ (valor de μ_D en H₀)");
  if (error) return { error: error };

  const gl = n - 1;
  const errorEstandar = desvD / Math.sqrt(n);
  const estadistico = (mediaD - d0) / errorEstandar;
  return terminarPrueba({ gl: gl, errorEstandar: errorEstandar, estadistico: estadistico }, "t", gl, null,
    { simbolo: "μ_D", nombre: "la media de las diferencias pareadas", valor: d0, equivalente: ["μ₁", "μ₂"] },
    alternativa, alfa);
}

function pruebaCocienteVarianzas(n1, desv1, varianza1, n2, desv2, varianza2, alternativa, alfa) {
  const error = revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n1, 2, "la muestra 1 (n₁)") || revisiones.revisarTamanoDe(n2, 2, "la muestra 2 (n₂)");
  if (error) return { error: error };
  const v1 = revisiones.varianzaDe(desv1, varianza1, 1);
  if (v1.error) return v1;
  const v2 = revisiones.varianzaDe(desv2, varianza2, 2);
  if (v2.error) return v2;

  const gl1 = n1 - 1;
  const gl2 = n2 - 1;
  const estadistico = v1.varianza / v2.varianza;
  return terminarPrueba({
    gl1: gl1, gl2: gl2, varianza1: v1.varianza, varianza2: v2.varianza, estadistico: estadistico,
  }, "f", gl1, gl2, { simbolo: "σ₁² / σ₂²", nombre: "el cociente de varianzas poblacionales", valor: 1,
    equivalente: ["σ₁²", "σ₂²"] }, alternativa, alfa);
}

// ---------- Decisión ----------

function decidirPrueba(estadistico, distribucion, gl1, gl2, alternativa, alfa) {
  gl1 = distribuciones.redondearGL(gl1);
  gl2 = distribuciones.redondearGL(gl2);
  if (!Number.isFinite(estadistico)) {
    return { error: "No se pudo calcular el estadístico de prueba (se obtuvo " + estadistico + ")." };
  }

  const area = alternativa === "dos-colas" ? alfa / 2 : alfa;
  const criticos = [];
  if (alternativa !== "derecha") {
    const c = cuantilPrueba(distribucion, area, gl1, gl2);
    if (c.error) return { error: "No se pudo obtener el valor crítico: " + c.error };
    criticos.push({ lado: "inferior", critico: c });
  }
  if (alternativa !== "izquierda") {
    const c = cuantilPrueba(distribucion, 1 - area, gl1, gl2);
    if (c.error) return { error: "No se pudo obtener el valor crítico: " + c.error };
    criticos.push({ lado: "superior", critico: c });
  }

  let rechazar = false;
  for (const c of criticos) {
    if (c.lado === "inferior" && estadistico < c.critico.valor) rechazar = true;
    if (c.lado === "superior" && estadistico > c.critico.valor) rechazar = true;
  }

  const colaIzquierda = areaIzquierdaPrueba(distribucion, estadistico, gl1, gl2);
  const colaDerecha = 1 - colaIzquierda;
  let valorP;
  if (alternativa === "izquierda") {
    valorP = colaIzquierda;
  } else if (alternativa === "derecha") {
    valorP = colaDerecha;
  } else {
    valorP = Math.min(1, 2 * Math.min(colaIzquierda, colaDerecha));
  }
  if (!Number.isFinite(valorP)) {
    return { error: "No se pudo calcular el valor p." };
  }

  return {
    area: area,
    criticos: criticos,
    rechazar: rechazar,
    colaIzquierda: colaIzquierda,
    colaDerecha: colaDerecha,
    valorP: valorP,
  };
}

function cuantilPrueba(distribucion, p, gl1, gl2) {
  if (distribucion === "z") return distribuciones.valorCriticoZ(p);
  if (distribucion === "t") return distribuciones.valorCriticoT(p, gl1);
  if (distribucion === "chi2") return distribuciones.valorCriticoChi2(p, gl1);
  return distribuciones.valorCriticoF(p, gl1, gl2);
}

function areaIzquierdaPrueba(distribucion, x, gl1, gl2) {
  if (distribucion === "z") return distribuciones.cdfNormal(x);
  if (distribucion === "t") return distribuciones.cdfT(x, gl1);
  if (distribucion === "chi2") return distribuciones.cdfChi2(x, gl1);
  return distribuciones.cdfF(x, gl1, gl2);
}

function terminarPrueba(calculos, distribucion, gl1, gl2, parametro, alternativa, alfa) {
  const decision = decidirPrueba(calculos.estadistico, distribucion, gl1, gl2, alternativa, alfa);
  if (decision.error) return decision;

  const alt = ALTERNATIVAS[alternativa];
  const h1 = parametro.simbolo + " " + alt.signo + " " + parametro.valor;
  let afirmacion = parametro.nombre + " " + alt.relacion + " " + parametro.valor + " (" + h1 + ")";
  if (parametro.equivalente && (parametro.valor === 0 || parametro.valor === 1)) {
    afirmacion += ", es decir, " + parametro.equivalente[0] + " " + alt.signo + " " + parametro.equivalente[1];
  }

  const conclusion = decision.rechazar
    ? "Se rechaza H₀. Con un nivel de significancia α = " + alfa + ", hay evidencia suficiente para afirmar que " +
      afirmacion + "."
    : "No se rechaza H₀. Con un nivel de significancia α = " + alfa + ", no hay evidencia suficiente para afirmar que " +
      afirmacion + ". Esto no demuestra que H₀ sea cierta; solo indica que los datos no la contradicen lo suficiente.";

  return Object.assign({ advertencias: [] }, calculos, decision, {
    alfa: alfa,
    alternativa: alternativa,
    distribucion: distribucion,
    valorH0: parametro.valor,
    hipotesis: {
      h0: parametro.simbolo + " = " + parametro.valor,
      h1: h1,
      cola: alt.cola,
    },
    conclusion: conclusion,
  });
}

// ---------- Validaciones y auxiliares ----------

function revisarAlternativaYAlfa(alternativa, alfa) {
  if (!["dos-colas", "izquierda", "derecha"].includes(alternativa)) {
    return "Elige la hipótesis alternativa H₁: diferente (≠, dos colas), menor (<, cola izquierda) " +
      "o mayor (>, cola derecha).";
  }
  if (typeof alfa !== "number" || !(alfa > 0 && alfa < 1)) {
    return "El nivel de significancia α debe ser un número mayor que 0 y menor que 1 (se recibió " + alfa + ").";
  }
  return null;
}

function revisarProporcionH0(pi0) {
  const error = revisiones.revisarNumero(pi0, "π₀ (valor del parámetro en H₀)");
  if (error) return error;
  if (!(pi0 > 0 && pi0 < 1)) {
    return "El valor de H₀ (π₀) debe estar entre 0 y 1, sin incluirlos (se recibió " + pi0 +
      "). Si tienes un porcentaje, divídelo entre 100 (40 % → 0.4).";
  }
  return null;
}

function proporcionMuestral(n, exitos, proporcion, deMuestra) {
  if (exitos === null && proporcion === null) {
    return { error: "Falta el número de éxitos (x) o la proporción muestral (p̂)" + deMuestra + "." };
  }
  if (exitos !== null && proporcion !== null) {
    return { error: "Escribe solo uno de los dos datos" + deMuestra +
      ": el número de éxitos (x) o la proporción muestral (p̂)." };
  }
  if (exitos !== null) {
    if (!Number.isInteger(exitos) || exitos < 0 || exitos > n) {
      return { error: "El número de éxitos" + deMuestra + " debe ser un número entero entre 0 y n = " + n +
        " (se recibió " + exitos + ")." };
    }
    return { p: exitos / n };
  }
  if (typeof proporcion !== "number" || !(proporcion >= 0 && proporcion <= 1)) {
    return { error: "La proporción muestral" + deMuestra + " debe estar entre 0 y 1 (se recibió " + proporcion +
      "). Si tienes un porcentaje, divídelo entre 100 (35 % → 0.35)." };
  }
  return { p: proporcion };
}

function revisarPruebaDosMediasT(n1, media1, s1, n2, media2, s2, d0, alternativa, alfa) {
  return revisarAlternativaYAlfa(alternativa, alfa) ||
    revisiones.revisarTamanoDe(n1, 2, "la muestra 1 (n₁)") || revisiones.revisarTamanoDe(n2, 2, "la muestra 2 (n₂)") ||
    revisiones.revisarNumero(media1, "la media de la muestra 1 (x̄₁)") ||
    revisiones.revisarNumero(media2, "la media de la muestra 2 (x̄₂)") ||
    revisiones.revisarPositivo(s1, "la desviación estándar muestral de la muestra 1 (s₁)") ||
    revisiones.revisarPositivo(s2, "la desviación estándar muestral de la muestra 2 (s₂)") ||
    revisiones.revisarNumero(d0, "d₀ (valor de μ₁ − μ₂ en H₀)");
}

function parametroDosMedias(d0) {
  return { simbolo: "μ₁ − μ₂", nombre: "la diferencia de medias poblacionales", valor: d0, equivalente: ["μ₁", "μ₂"] };
}

if (typeof module !== "undefined") {
  module.exports = {
    pruebaMediaZ,
    pruebaMediaT,
    pruebaProporcion,
    pruebaVarianza,
    pruebaDosMediasZ,
    pruebaDosMediasTIguales,
    pruebaDosMediasTDiferentes,
    pruebaDosProporciones,
    pruebaPareadas,
    pruebaCocienteVarianzas,
    decidirPrueba,
  };
}
