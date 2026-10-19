// Presentación de los resultados (Parte 10).
// Aquí se prepara QUÉ se muestra de cada resultado: las filas de las tablas (datos,
// valores críticos y pasos con fórmula y sustitución), el resultado, la interpretación
// y las notas. Las fórmulas y decisiones NO están aquí (están en js/intervalos.js,
// js/decisiones.js y js/pruebas.js); este archivo solo convierte sus resultados en texto.
// js/app.js pone estos textos en la página, siempre con las mismas secciones:
//   Datos usados → Procedimiento → Resultado → Interpretación → Supuestos y notas.
//
// Estas funciones no usan la página (document), así que se pueden probar con Node:
// ver tests/presentacion.test.js.

// Funciones de otros archivos: en el navegador ya están cargadas (index.html carga
// intervalos.js y decisiones.js antes que este archivo); en Node se cargan con require.
const herramientas = typeof module !== "undefined"
  ? {
    formatearLimite: require("./intervalos.js").formatearLimite,
    decidirIntervalo: require("./decisiones.js").decidirIntervalo,
  }
  : { formatearLimite: formatearLimite, decidirIntervalo: decidirIntervalo };

// ---------- Redondeo ----------

// α y α/2 se muestran con hasta 10 cifras significativas para quitar el ruido
// de la resta (por ejemplo 0.025000000000000022 -> 0.025) sin perder valores
// pequeños como 0.00005, que con 4 decimales se vería como 0.0001.
function formatearArea(numero) {
  return String(Number(numero.toPrecision(10)));
}

// Redondea a 4 decimales solo para mostrar (quita ceros sobrantes: 1.2000 -> 1.2).
function formatear(numero) {
  return String(Number(numero.toFixed(4)));
}

// Regla de redondeo de toda la página. Se muestra una sola vez, debajo de los resultados.
// Los valores p y el caso de una varianza usan formatearLimite (js/intervalos.js) para que un
// valor pequeño (0.000123) no aparezca como 0.
const NOTA_REDONDEO = "Redondeo: los valores se muestran con 4 decimales; los valores p y los del caso de una " +
  "varianza, si son menores que 0.1, con 4 cifras significativas. Solo se redondea lo que se muestra: los " +
  "cálculos usan todos los decimales.";

// Qué significa el nivel de confianza. Se muestra una vez, en las notas del intervalo.
const NOTA_CONFIANZA = "El nivel de confianza se refiere al método: de muchos intervalos calculados así, " +
  "alrededor de ese porcentaje contendría el valor real del parámetro. No es la probabilidad de que el " +
  "parámetro (un valor fijo) esté en este intervalo.";

// Texto cuando no hay resultado. tipo: "intervalo" o "prueba"; error: el mensaje de la validación.
// Se usa junto al botón y en la tarjeta del resultado, para que no parezca que hay un resultado válido.
function textoSinResultado(tipo, error) {
  return (tipo === "intervalo" ? "No se pudo calcular el intervalo de confianza: "
    : "No se pudo resolver la prueba de hipótesis: ") + error;
}

// Filas de la tabla de estadísticos de una lista numérica.
// x, media y s son los símbolos a mostrar (por ejemplo "d", "d̄" y "s_d").
function filasDescriptivos(d, x, media, s) {
  const sinVarianza = "No se puede calcular con un solo dato";
  return [
    ["Tamaño de muestra", "n", d.n],
    ["Suma", "Σ" + x, formatear(d.suma)],
    ["Media muestral", media + " = Σ" + x + " / n", formatear(d.media)],
    ["Varianza muestral", s + "² = Σ(" + x + " − " + media + ")² / (n − 1)",
      d.varianza === null ? sinVarianza : formatear(d.varianza)],
    ["Desviación estándar muestral", s + " = √" + s + "²",
      d.desviacion === null ? sinVarianza : formatear(d.desviacion)],
  ];
}

// Filas de la tabla de una lista de 0 y 1.
function filasProporcion(p) {
  return [
    ["Total de observaciones", "n", p.n],
    ["Éxitos (cantidad de unos)", "x", p.exitos],
    ["Proporción muestral", "p̂ = x / n", formatear(p.proporcion)],
  ];
}

function presentarMediaZ(r, n, media, desviacion, sigmaConocida, confianza, tamano, errorDeseado) {
  const simbolo = sigmaConocida ? "σ" : "s";
  return {
    datos: [
      ["Tamaño de muestra (n)", n],
      ["Media muestral (x̄)", formatear(media)],
      sigmaConocida
        ? ["Desviación estándar poblacional (σ)", formatear(desviacion)]
        : ["Desviación estándar muestral (s), en lugar de σ", formatear(desviacion)],
    ].concat(filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("z_α/2 = z_" + formatearArea(r.alfa / 2), r.critico)],
    pasos: [
      ["Margen de error", "e = z_α/2 · " + simbolo + " / √n",
        "e = " + formatear(r.critico.valor) + " · " + formatear(desviacion) + " / √" + n + " = " + formatear(r.margen)],
    ].concat(pasosLimites("x̄", media, r)),
    resultado: formatear(r.inferior) + " ≤ μ ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la media poblacional", "μ", r),
    notas: sigmaConocida ? [] :
      ["σ no se conoce, pero como n ≥ 30 el formulario usa Z; en la fórmula se usa s en lugar de σ."],
    advertencias: [],
    tamano: presentarTamanoMedia(tamano, desviacion, errorDeseado),
  };
}

function presentarMediaT(r, n, media, s, confianza) {
  return {
    datos: [
      ["Tamaño de muestra (n)", n],
      ["Media muestral (x̄)", formatear(media)],
      ["Desviación estándar muestral (s)", formatear(s)],
    ].concat(filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("t_α/2,ν = t_" + formatearArea(r.alfa / 2) + "," + r.gl, r.critico)],
    pasos: [
      ["Grados de libertad", "ν = n − 1", "ν = " + n + " − 1 = " + r.gl],
      ["Margen de error", "e = t_α/2,ν · s / √n",
        "e = " + formatear(r.critico.valor) + " · " + formatear(s) + " / √" + n + " = " + formatear(r.margen)],
    ].concat(pasosLimites("x̄", media, r)),
    resultado: formatear(r.inferior) + " ≤ μ ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la media poblacional", "μ", r),
    notas: ["La distribución t supone que la población de la que viene la muestra es aproximadamente normal."],
    advertencias: [],
    tamano: null,
  };
}

function presentarProporcion(r, n, exitos, confianza, tamano, errorDeseado) {
  const datos = [["Tamaño de muestra (n)", n]];
  const pasos = [];
  if (exitos !== null) {
    datos.push(["Número de éxitos (x)", exitos]);
    pasos.push(["Proporción muestral", "p = x / n", "p = " + exitos + " / " + n + " = " + formatear(r.p)]);
  } else {
    datos.push(["Proporción muestral (p)", formatear(r.p)]);
  }
  datos.push(["n · p", formatear(n * r.p)], ["n · q", formatear(n * r.q)]);
  pasos.push(
    ["q", "q = 1 − p", "q = 1 − " + formatear(r.p) + " = " + formatear(r.q)],
    ["Margen de error", "e = z_α/2 · √(p · q / n)",
      "e = " + formatear(r.critico.valor) + " · √(" + formatear(r.p) + " · " + formatear(r.q) + " / " + n + ") = " +
        formatear(r.margen)]
  );
  return {
    datos: datos.concat(filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("z_α/2 = z_" + formatearArea(r.alfa / 2), r.critico)],
    pasos: pasos.concat(pasosLimites("p", r.p, r)),
    resultado: formatear(r.inferior) + " ≤ π ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la proporción poblacional", "π", r),
    notas: [],
    advertencias: r.advertencias,
    tamano: presentarTamanoProporcion(tamano, r.p, r.q, errorDeseado),
  };
}

function presentarVarianza(r, n, s, confianza) {
  const datos = [["Tamaño de muestra (n)", n]];
  if (s !== null) datos.push(["Desviación estándar muestral (s)", herramientas.formatearLimite(s)]);
  datos.push(["Varianza muestral (S²)", herramientas.formatearLimite(r.varianza)]);
  // formatearLimite (js/intervalos.js) conserva cifras en valores pequeños; solo cambia lo que se ve.
  const fl = herramientas.formatearLimite;
  return {
    datos: datos.concat(filasNivel(confianza, r.alfa), [["1 − α/2", formatearArea(1 - r.alfa / 2)]]),
    criticos: [
      filaCritico("χ²_α/2,ν = χ²_" + formatearArea(r.alfa / 2) + "," + r.gl, r.chiDerecha),
      filaCritico("χ²_1−α/2,ν = χ²_" + formatearArea(1 - r.alfa / 2) + "," + r.gl, r.chiIzquierda),
    ],
    pasos: [
      ["Grados de libertad", "ν = n − 1", "ν = " + n + " − 1 = " + r.gl],
      ["Numerador", "(n − 1) · S²", r.gl + " · " + fl(r.varianza) + " = " + fl(r.numerador)],
      ["Límite inferior de σ²", "(n − 1) · S² / χ²_α/2,ν",
        fl(r.numerador) + " / " + formatear(r.chiDerecha.valor) + " = " + fl(r.inferior)],
      ["Límite superior de σ²", "(n − 1) · S² / χ²_1−α/2,ν",
        fl(r.numerador) + " / " + formatear(r.chiIzquierda.valor) + " = " + fl(r.superior)],
      ["Límite inferior de σ", "√(límite inferior de σ²)", "√" + fl(r.inferior) + " = " + fl(r.sigmaInferior)],
      ["Límite superior de σ", "√(límite superior de σ²)", "√" + fl(r.superior) + " = " + fl(r.sigmaSuperior)],
    ],
    resultado: [
      "Intervalo para la varianza (σ²): " + fl(r.inferior) + " ≤ σ² ≤ " + fl(r.superior),
      "Intervalo para la desviación estándar (σ): " + fl(r.sigmaInferior) + " ≤ σ ≤ " + fl(r.sigmaSuperior),
    ],
    interpretacion: "Con un " + confianza + " % de confianza, se estima que la varianza poblacional σ² está entre " +
      fl(r.inferior) + " y " + fl(r.superior) + ", y la desviación estándar poblacional σ, entre " +
      fl(r.sigmaInferior) + " y " + fl(r.sigmaSuperior) + ".",
    notas: [
      "Los límites de σ son la raíz cuadrada de los límites de σ² (sin redondear).",
      "No hay margen de error e: el intervalo no es simétrico y cada límite usa su propio valor de chi-cuadrada.",
      "La distribución chi-cuadrada supone que la población es normal.",
    ],
    advertencias: [],
    tamano: null,
  };
}

// Tamaño de muestra: null si no se pidió (sin error deseado), { error } si no se
// pudo calcular, o los pasos y la conclusión.
function presentarTamanoMedia(tamano, sigma, errorDeseado) {
  if (tamano === null || tamano.error) return tamano;
  return presentarTamano(tamano, "n = (z_α/2 · σ / e)²",
    "n = (" + formatear(tamano.critico.valor) + " · " + formatear(sigma) + " / " + formatear(errorDeseado) + ")²");
}

function presentarTamanoProporcion(tamano, p, q, errorDeseado) {
  if (tamano === null || tamano.error) return tamano;
  return presentarTamano(tamano, "n = z_α/2² · p · q / e²",
    "n = " + formatear(tamano.critico.valor) + "² · " + formatear(p) + " · " + formatear(q) + " / " +
      formatear(errorDeseado) + "²");
}

function presentarTamano(tamano, formula, sustitucion) {
  return {
    pasos: [["Tamaño de muestra", formula, sustitucion + " = " + formatear(tamano.valor)]],
    conclusion: "Como n debe ser entero, se redondea hacia arriba: se necesitan al menos " + tamano.n +
      " observaciones para que el error no pase de e.",
  };
}

// Filas comunes: nivel de confianza, α y α/2.
function filasNivel(confianza, alfa) {
  return [
    ["Nivel de confianza", confianza + " %"],
    ["α = 1 − confianza", formatearArea(alfa)],
    ["α/2", formatearArea(alfa / 2)],
  ];
}

// Fila de la tabla de valores críticos: [símbolo, valor, cómo se obtuvo].
function filaCritico(simbolo, critico) {
  return [simbolo, formatear(critico.valor), critico.descripcion];
}

// Límites de un intervalo simétrico: centro − e y centro + e.
function pasosLimites(simbolo, centro, r) {
  return [
    ["Límite inferior", simbolo + " − e", formatear(centro) + " − " + formatear(r.margen) + " = " + formatear(r.inferior)],
    ["Límite superior", simbolo + " + e", formatear(centro) + " + " + formatear(r.margen) + " = " + formatear(r.superior)],
  ];
}

// Interpretación breve del intervalo. Qué significa el nivel de confianza se explica
// una sola vez en NOTA_CONFIANZA, en lugar de repetirlo aquí.
function interpretar(confianza, nombre, simbolo, r) {
  return "Con un " + confianza + " % de confianza, se estima que " + nombre + " " + simbolo +
    " está entre " + formatear(r.inferior) + " y " + formatear(r.superior) + ".";
}

const NOTA_INDEPENDIENTES = "Las muestras se suponen independientes; si los datos van por pares (por ejemplo, " +
  "antes y después en los mismos sujetos), elige «Muestras pareadas».";

// Filas de datos de una de las dos muestras. desvNombre y desv pueden ser null.
function filasMuestra(numero, n, media, desvNombre, desv) {
  const sub = numero === 1 ? "₁" : "₂";
  const filas = [
    ["Tamaño de la muestra " + numero + " (n" + sub + ")", n],
    ["Media de la muestra " + numero + " (x̄" + sub + ")", formatear(media)],
  ];
  if (desv !== null) filas.push([desvNombre + " " + numero, formatear(desv)]);
  return filas;
}

function presentarDosMediasZ(r, n1, media1, desv1, n2, media2, desv2, sigmaConocida, confianza) {
  const s = sigmaConocida ? "σ" : "s";
  const nombre = sigmaConocida ? "Desviación estándar poblacional (σ" : "Desviación muestral (s";
  return {
    datos: filasMuestra(1, n1, media1, nombre + "₁) de la muestra", desv1)
      .concat(filasMuestra(2, n2, media2, nombre + "₂) de la muestra", desv2), filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("z_α/2 = z_" + formatearArea(r.alfa / 2), r.critico)],
    pasos: [
      ["Diferencia de medias", "x̄₁ − x̄₂",
        formatear(media1) + " − " + formatear(media2) + " = " + formatear(r.diferencia)],
      ["Error estándar", "√(" + s + "₁² / n₁ + " + s + "₂² / n₂)",
        "√(" + formatear(desv1) + "² / " + n1 + " + " + formatear(desv2) + "² / " + n2 + ") = " +
          formatear(r.errorEstandar)],
      ["Margen de error", "e = z_α/2 · √(" + s + "₁² / n₁ + " + s + "₂² / n₂)",
        "e = " + formatear(r.critico.valor) + " · " + formatear(r.errorEstandar) + " = " + formatear(r.margen)],
    ].concat(pasosLimites("(x̄₁ − x̄₂)", r.diferencia, r)),
    resultado: formatear(r.inferior) + " ≤ μ₁ − μ₂ ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la diferencia de medias poblacionales", "μ₁ − μ₂", r),
    decision: herramientas.decidirIntervalo("dos-medias-z", r.inferior, r.superior),
    notas: (sigmaConocida ? [] :
      ["σ₁ y σ₂ no se conocen, pero como n₁ y n₂ son ≥ 30 el formulario usa Z; en la fórmula se usan s₁ y s₂ en lugar de σ₁ y σ₂."])
      .concat([NOTA_INDEPENDIENTES]),
    advertencias: [],
    tamano: null,
  };
}

function presentarDosMediasTIguales(r, n1, media1, s1, n2, media2, s2, confianza) {
  return {
    datos: filasMuestra(1, n1, media1, "Desviación muestral (s₁) de la muestra", s1)
      .concat(filasMuestra(2, n2, media2, "Desviación muestral (s₂) de la muestra", s2), filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("t_α/2,ν = t_" + formatearArea(r.alfa / 2) + "," + r.gl, r.critico)],
    pasos: [
      ["Diferencia de medias", "x̄₁ − x̄₂",
        formatear(media1) + " − " + formatear(media2) + " = " + formatear(r.diferencia)],
      ["Grados de libertad", "ν = n₁ + n₂ − 2", "ν = " + n1 + " + " + n2 + " − 2 = " + r.gl],
      ["Desviación combinada", "Sp = √(((n₁ − 1)s₁² + (n₂ − 1)s₂²) / (n₁ + n₂ − 2))",
        "Sp = √((" + (n1 - 1) + " · " + formatear(s1) + "² + " + (n2 - 1) + " · " + formatear(s2) + "²) / " + r.gl +
          ") = " + formatear(r.sp)],
      ["Margen de error", "e = t_α/2,ν · Sp · √(1/n₁ + 1/n₂)",
        "e = " + formatear(r.critico.valor) + " · " + formatear(r.sp) + " · √(1/" + n1 + " + 1/" + n2 + ") = " +
          formatear(r.margen)],
    ].concat(pasosLimites("(x̄₁ − x̄₂)", r.diferencia, r)),
    resultado: formatear(r.inferior) + " ≤ μ₁ − μ₂ ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la diferencia de medias poblacionales", "μ₁ − μ₂", r),
    decision: herramientas.decidirIntervalo("dos-medias-t-iguales", r.inferior, r.superior),
    notas: [
      "Supone varianzas poblacionales iguales (σ₁² = σ₂², como indica el enunciado) y poblaciones aproximadamente normales.",
      NOTA_INDEPENDIENTES,
    ],
    advertencias: [],
    tamano: null,
  };
}

function presentarDosMediasTDiferentes(r, n1, media1, s1, n2, media2, s2, confianza) {
  return {
    datos: filasMuestra(1, n1, media1, "Desviación muestral (s₁) de la muestra", s1)
      .concat(filasMuestra(2, n2, media2, "Desviación muestral (s₂) de la muestra", s2), filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("t_α/2,ν = t_" + formatearArea(r.alfa / 2) + ",ν", r.critico)],
    pasos: [
      ["Diferencia de medias", "x̄₁ − x̄₂",
        formatear(media1) + " − " + formatear(media2) + " = " + formatear(r.diferencia)],
      ["Varianza de x̄₁", "s₁² / n₁", formatear(s1) + "² / " + n1 + " = " + formatear(r.varMedia1)],
      ["Varianza de x̄₂", "s₂² / n₂", formatear(s2) + "² / " + n2 + " = " + formatear(r.varMedia2)],
      ["Grados de libertad (Welch)", "ν = (s₁²/n₁ + s₂²/n₂)² / [(s₁²/n₁)² / (n₁ − 1) + (s₂²/n₂)² / (n₂ − 1)]",
        "ν = (" + formatear(r.varMedia1) + " + " + formatear(r.varMedia2) + ")² / [" + formatear(r.varMedia1) + "² / " +
          (n1 - 1) + " + " + formatear(r.varMedia2) + "² / " + (n2 - 1) + "] = " + formatear(r.gl)],
      ["Margen de error", "e = t_α/2,ν · √(s₁²/n₁ + s₂²/n₂)",
        "e = " + formatear(r.critico.valor) + " · " + formatear(r.errorEstandar) + " = " + formatear(r.margen)],
    ].concat(pasosLimites("(x̄₁ − x̄₂)", r.diferencia, r)),
    resultado: formatear(r.inferior) + " ≤ μ₁ − μ₂ ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la diferencia de medias poblacionales", "μ₁ − μ₂", r),
    decision: herramientas.decidirIntervalo("dos-medias-t-diferentes", r.inferior, r.superior),
    notas: [
      "Supone varianzas poblacionales diferentes y poblaciones aproximadamente normales. ν (Welch) no es entero " +
        "y se usa con todos sus decimales; con tablas y ν redondeado, el valor crítico cambia un poco.",
      NOTA_INDEPENDIENTES,
    ],
    advertencias: [],
    tamano: null,
  };
}

function presentarDosProporciones(r, n1, exitos1, n2, exitos2, confianza) {
  const datos = [["Tamaño de la muestra 1 (n₁)", n1]];
  const pasos = [];
  if (exitos1 !== null) {
    datos.push(["Éxitos en la muestra 1 (x₁)", exitos1]);
    pasos.push(["Proporción 1", "p₁ = x₁ / n₁", "p₁ = " + exitos1 + " / " + n1 + " = " + formatear(r.p1)]);
  } else {
    datos.push(["Proporción de la muestra 1 (p₁)", formatear(r.p1)]);
  }
  datos.push(["Tamaño de la muestra 2 (n₂)", n2]);
  if (exitos2 !== null) {
    datos.push(["Éxitos en la muestra 2 (x₂)", exitos2]);
    pasos.push(["Proporción 2", "p₂ = x₂ / n₂", "p₂ = " + exitos2 + " / " + n2 + " = " + formatear(r.p2)]);
  } else {
    datos.push(["Proporción de la muestra 2 (p₂)", formatear(r.p2)]);
  }
  datos.push(["n₁ · p₁ y n₁ · q₁", formatear(n1 * r.p1) + " y " + formatear(n1 * r.q1)],
    ["n₂ · p₂ y n₂ · q₂", formatear(n2 * r.p2) + " y " + formatear(n2 * r.q2)]);

  pasos.push(
    ["q₁ y q₂", "q = 1 − p",
      "q₁ = 1 − " + formatear(r.p1) + " = " + formatear(r.q1) + "; q₂ = 1 − " + formatear(r.p2) + " = " + formatear(r.q2)],
    ["Diferencia de proporciones", "p₁ − p₂", formatear(r.p1) + " − " + formatear(r.p2) + " = " + formatear(r.diferencia)],
    ["Margen de error", "e = z_α/2 · √(p₁q₁/n₁ + p₂q₂/n₂)",
      "e = " + formatear(r.critico.valor) + " · √(" + formatear(r.p1) + " · " + formatear(r.q1) + " / " + n1 + " + " +
        formatear(r.p2) + " · " + formatear(r.q2) + " / " + n2 + ") = " + formatear(r.margen)]
  );
  return {
    datos: datos.concat(filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("z_α/2 = z_" + formatearArea(r.alfa / 2), r.critico)],
    pasos: pasos.concat(pasosLimites("(p₁ − p₂)", r.diferencia, r)),
    resultado: formatear(r.inferior) + " ≤ π₁ − π₂ ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la diferencia de proporciones poblacionales", "π₁ − π₂", r),
    decision: herramientas.decidirIntervalo("dos-proporciones", r.inferior, r.superior),
    notas: [NOTA_INDEPENDIENTES],
    advertencias: r.advertencias,
    tamano: null,
  };
}

function presentarPareadas(r, n, mediaD, desvD, confianza) {
  return {
    datos: [
      ["Número de pares (n)", n],
      ["Media de las diferencias (d̄)", formatear(mediaD)],
      ["Desviación estándar de las diferencias (s_d)", formatear(desvD)],
    ].concat(filasNivel(confianza, r.alfa)),
    criticos: [filaCritico("t_α/2,ν = t_" + formatearArea(r.alfa / 2) + "," + r.gl, r.critico)],
    pasos: [
      ["Grados de libertad", "ν = n − 1", "ν = " + n + " − 1 = " + r.gl],
      ["Margen de error", "e = t_α/2,ν · s_d / √n",
        "e = " + formatear(r.critico.valor) + " · " + formatear(desvD) + " / √" + n + " = " + formatear(r.margen)],
    ].concat(pasosLimites("d̄", mediaD, r)),
    resultado: formatear(r.inferior) + " ≤ μ_D ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la media de las diferencias pareadas", "μ_D", r),
    decision: herramientas.decidirIntervalo("pareadas", r.inferior, r.superior),
    notas: [
      "d = muestra 1 − muestra 2 y μ_D = μ₁ − μ₂ (si se invierte el orden, cambia el signo del intervalo).",
      "Las diferencias se tratan como una muestra de n pares; supone que vienen de una población aproximadamente normal.",
    ],
    advertencias: [],
    tamano: null,
  };
}

function presentarCocienteVarianzas(r, n1, s1, n2, s2, confianza) {
  const datos = [["Tamaño de la muestra 1 (n₁)", n1]];
  if (s1 !== null) datos.push(["Desviación muestral 1 (s₁)", formatear(s1)]);
  datos.push(["Varianza muestral 1 (S₁²)", formatear(r.varianza1)], ["Tamaño de la muestra 2 (n₂)", n2]);
  if (s2 !== null) datos.push(["Desviación muestral 2 (s₂)", formatear(s2)]);
  datos.push(["Varianza muestral 2 (S₂²)", formatear(r.varianza2)]);

  const area = formatearArea(r.alfa / 2);
  return {
    datos: datos.concat(filasNivel(confianza, r.alfa)),
    criticos: [
      filaCritico("F_α/2(ν₁,ν₂) = F_" + area + "(" + r.gl1 + "," + r.gl2 + ")", r.fInferior),
      filaCritico("F_α/2(ν₂,ν₁) = F_" + area + "(" + r.gl2 + "," + r.gl1 + ")", r.fSuperior),
    ],
    pasos: [
      ["Grados de libertad", "ν₁ = n₁ − 1 y ν₂ = n₂ − 1",
        "ν₁ = " + n1 + " − 1 = " + r.gl1 + "; ν₂ = " + n2 + " − 1 = " + r.gl2],
      ["Cociente muestral", "S₁² / S₂²", formatear(r.varianza1) + " / " + formatear(r.varianza2) + " = " + formatear(r.razon)],
      ["Límite inferior", "(S₁² / S₂²) · 1 / F_α/2(ν₁,ν₂)",
        formatear(r.razon) + " · 1 / " + formatear(r.fInferior.valor) + " = " + formatear(r.inferior)],
      ["Límite superior", "(S₁² / S₂²) · F_α/2(ν₂,ν₁)",
        formatear(r.razon) + " · " + formatear(r.fSuperior.valor) + " = " + formatear(r.superior)],
    ],
    resultado: formatear(r.inferior) + " ≤ σ₁² / σ₂² ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "el cociente de varianzas poblacionales", "σ₁² / σ₂²", r),
    decision: herramientas.decidirIntervalo("cociente-varianzas", r.inferior, r.superior),
    notas: [
      "No hay margen de error e: el intervalo no es simétrico y cada límite usa su propio valor de F, con los " +
        "grados de libertad en distinto orden.",
      "La distribución F supone poblaciones normales. Para σ₁ / σ₂, saca la raíz cuadrada de los dos límites.",
      NOTA_INDEPENDIENTES,
    ],
    advertencias: [],
    tamano: null,
  };
}

// Símbolo del estadístico, de la variable aleatoria y nombre de cada distribución.
const ESTADISTICOS = {
  z: { simbolo: "z", variable: "Z", nombre: "normal estándar Z" },
  t: { simbolo: "t", variable: "T", nombre: "t de Student" },
  chi2: { simbolo: "χ²", variable: "χ²", nombre: "chi-cuadrada" },
  f: { simbolo: "F", variable: "F", nombre: "F" },
};

const NOTA_NORMAL = "La distribución t supone que la población de la que viene la muestra es aproximadamente normal.";

// Datos y pasos del estadístico de cada método; después, la parte común de la
// decisión (valores críticos, región de rechazo, valor p y conclusión).
function presentarPrueba(clave, r, d) {
  const f = formatear;
  const v0 = r.valorH0 < 0 ? "(" + r.valorH0 + ")" : String(r.valorH0); // para restar: 5 − (−2)
  const e = ESTADISTICOS[r.distribucion].simbolo;
  let datos = [];
  let pasos = [];
  let notas = [];

  if (clave === "media-z" || clave === "media-t") {
    const s = clave === "media-t" || !d.sigmaConocida ? "s" : "σ";
    datos = [
      ["Tamaño de muestra (n)", d.n],
      ["Media muestral (x̄)", f(d.media)],
      s === "σ" ? ["Desviación estándar poblacional (σ)", f(d.desviacion)]
        : ["Desviación estándar muestral (s)" + (clave === "media-z" ? ", en lugar de σ" : ""), f(d.desviacion)],
    ];
    if (clave === "media-t") pasos.push(["Grados de libertad", "ν = n − 1", "ν = " + d.n + " − 1 = " + r.gl]);
    pasos.push(
      ["Error estándar", s + " / √n", f(d.desviacion) + " / √" + d.n + " = " + f(r.errorEstandar)],
      ["Estadístico de prueba", e + " = (x̄ − μ₀) / (" + s + " / √n)",
        e + " = (" + f(d.media) + " − " + v0 + ") / " + f(r.errorEstandar) + " = " + f(r.estadistico)]
    );
    if (clave === "media-t") notas.push(NOTA_NORMAL);
    else if (!d.sigmaConocida) notas.push("σ no se conoce, pero como n ≥ 30 el formulario usa Z; se usa s en lugar de σ.");
  } else if (clave === "proporcion") {
    datos = [["Tamaño de muestra (n)", d.n]];
    if (d.exitos !== null) {
      datos.push(["Número de éxitos (x)", d.exitos]);
      pasos.push(["Proporción muestral", "p = x / n", "p = " + d.exitos + " / " + d.n + " = " + f(r.p)]);
    } else {
      datos.push(["Proporción muestral (p)", f(r.p)]);
    }
    pasos.push(
      ["q₀", "q₀ = 1 − π₀", "q₀ = 1 − " + r.valorH0 + " = " + f(r.q0)],
      ["Error estándar", "√(π₀ · q₀ / n)",
        "√(" + r.valorH0 + " · " + f(r.q0) + " / " + d.n + ") = " + f(r.errorEstandar)],
      ["Estadístico de prueba", "z = (p − π₀) / √(π₀ · q₀ / n)",
        "z = (" + f(r.p) + " − " + r.valorH0 + ") / " + f(r.errorEstandar) + " = " + f(r.estadistico)]
    );
    notas.push("El formulario no trae la fórmula de la prueba: aquí el error estándar usa π₀ (el valor de H₀), " +
      "como en la prueba usual de una proporción. Confirma con tu profesor que es la que se usa en clase.");
  } else if (clave === "varianza") {
    const fl = herramientas.formatearLimite; // conserva cifras en varianzas pequeñas
    datos = [["Tamaño de muestra (n)", d.n]];
    if (d.s !== null) datos.push(["Desviación estándar muestral (s)", fl(d.s)]);
    datos.push(["Varianza muestral (S²)", fl(r.varianza)]);
    pasos = [
      ["Grados de libertad", "ν = n − 1", "ν = " + d.n + " − 1 = " + r.gl],
      ["Estadístico de prueba", "χ² = (n − 1) · S² / σ₀²",
        "χ² = " + r.gl + " · " + fl(r.varianza) + " / " + r.valorH0 + " = " + f(r.estadistico)],
    ];
    notas.push("La distribución chi-cuadrada supone que la población es normal.");
  } else if (clave === "dos-medias-z" || clave === "dos-medias-t-iguales" || clave === "dos-medias-t-diferentes") {
    const s = clave === "dos-medias-z" && d.sigmaConocida ? "σ" : "s";
    const nombre = s === "σ" ? "Desviación estándar poblacional (σ" : "Desviación muestral (s";
    datos = filasMuestra(1, d.n1, d.media1, nombre + "₁) de la muestra", d.desv1)
      .concat(filasMuestra(2, d.n2, d.media2, nombre + "₂) de la muestra", d.desv2));
    pasos.push(["Diferencia de medias", "x̄₁ − x̄₂",
      f(d.media1) + " − " + f(d.media2) + " = " + f(r.diferencia)]);
    let formulaEE;
    if (clave === "dos-medias-t-iguales") {
      formulaEE = "Sp · √(1/n₁ + 1/n₂)";
      pasos.push(
        ["Grados de libertad", "ν = n₁ + n₂ − 2", "ν = " + d.n1 + " + " + d.n2 + " − 2 = " + r.gl],
        ["Desviación combinada", "Sp = √(((n₁ − 1)s₁² + (n₂ − 1)s₂²) / (n₁ + n₂ − 2))",
          "Sp = √((" + (d.n1 - 1) + " · " + f(d.s1) + "² + " + (d.n2 - 1) + " · " + f(d.s2) + "²) / " + r.gl +
            ") = " + f(r.sp)],
        ["Error estándar", formulaEE, f(r.sp) + " · √(1/" + d.n1 + " + 1/" + d.n2 + ") = " + f(r.errorEstandar)]
      );
      notas.push("Esta fórmula supone varianzas poblacionales iguales (como indica el enunciado) y poblaciones " +
        "aproximadamente normales.");
    } else if (clave === "dos-medias-t-diferentes") {
      formulaEE = "√(s₁²/n₁ + s₂²/n₂)";
      pasos.push(
        ["Varianza de x̄₁", "s₁² / n₁", f(d.s1) + "² / " + d.n1 + " = " + f(r.varMedia1)],
        ["Varianza de x̄₂", "s₂² / n₂", f(d.s2) + "² / " + d.n2 + " = " + f(r.varMedia2)],
        ["Grados de libertad (Welch)", "ν = (s₁²/n₁ + s₂²/n₂)² / [(s₁²/n₁)² / (n₁ − 1) + (s₂²/n₂)² / (n₂ − 1)]",
          "ν = (" + f(r.varMedia1) + " + " + f(r.varMedia2) + ")² / [" + f(r.varMedia1) + "² / " + (d.n1 - 1) +
            " + " + f(r.varMedia2) + "² / " + (d.n2 - 1) + "] = " + f(r.gl)],
        ["Error estándar", formulaEE, "√(" + f(r.varMedia1) + " + " + f(r.varMedia2) + ") = " + f(r.errorEstandar)]
      );
      notas.push("Esta fórmula supone varianzas poblacionales diferentes y poblaciones aproximadamente normales. " +
        "Los grados de libertad (Welch) no son un número entero y se usan con todos sus decimales.");
    } else {
      formulaEE = "√(" + s + "₁²/n₁ + " + s + "₂²/n₂)";
      pasos.push(["Error estándar", formulaEE,
        "√(" + f(d.desv1) + "² / " + d.n1 + " + " + f(d.desv2) + "² / " + d.n2 + ") = " + f(r.errorEstandar)]);
      if (!d.sigmaConocida) {
        notas.push("σ₁ y σ₂ no se conocen, pero como n₁ y n₂ son ≥ 30 el formulario usa Z; se usan s₁ y s₂ en lugar de σ₁ y σ₂.");
      }
    }
    const denominador = clave === "dos-medias-t-iguales" ? "(" + formulaEE + ")" : formulaEE;
    pasos.push(["Estadístico de prueba", e + " = ((x̄₁ − x̄₂) − d₀) / " + denominador,
      e + " = (" + f(r.diferencia) + " − " + v0 + ") / " + f(r.errorEstandar) + " = " + f(r.estadistico)]);
    notas.push(NOTA_INDEPENDIENTES);
  } else if (clave === "dos-proporciones") {
    // x₁ y x₂: los éxitos dados o, si se dio p̂, n · p̂.
    const x1 = d.exitos1 !== null ? d.exitos1 : f(d.n1 * r.p1);
    const x2 = d.exitos2 !== null ? d.exitos2 : f(d.n2 * r.p2);
    datos = [
      ["Tamaño de la muestra 1 (n₁)", d.n1],
      d.exitos1 !== null ? ["Éxitos en la muestra 1 (x₁)", d.exitos1] : ["Proporción de la muestra 1 (p₁)", f(r.p1)],
      ["Tamaño de la muestra 2 (n₂)", d.n2],
      d.exitos2 !== null ? ["Éxitos en la muestra 2 (x₂)", d.exitos2] : ["Proporción de la muestra 2 (p₂)", f(r.p2)],
    ];
    if (d.exitos1 !== null) pasos.push(["Proporción 1", "p₁ = x₁ / n₁", "p₁ = " + d.exitos1 + " / " + d.n1 + " = " + f(r.p1)]);
    if (d.exitos2 !== null) pasos.push(["Proporción 2", "p₂ = x₂ / n₂", "p₂ = " + d.exitos2 + " / " + d.n2 + " = " + f(r.p2)]);
    pasos.push(
      ["Proporción combinada", "p = (x₁ + x₂) / (n₁ + n₂)",
        "p = (" + x1 + " + " + x2 + ") / (" + d.n1 + " + " + d.n2 + ") = " + f(r.combinada)],
      ["q", "q = 1 − p", "q = 1 − " + f(r.combinada) + " = " + f(r.q)],
      ["Error estándar", "√(p · q · (1/n₁ + 1/n₂))",
        "√(" + f(r.combinada) + " · " + f(r.q) + " · (1/" + d.n1 + " + 1/" + d.n2 + ")) = " + f(r.errorEstandar)],
      ["Estadístico de prueba", "z = (p₁ − p₂) / √(p · q · (1/n₁ + 1/n₂))",
        "z = (" + f(r.p1) + " − " + f(r.p2) + ") / " + f(r.errorEstandar) + " = " + f(r.estadistico)]
    );
    notas.push("El formulario no trae la fórmula de la prueba: aquí se usa la proporción combinada p, que es la usual " +
      "cuando H₀ dice π₁ = π₂. Confirma con tu profesor que es la que se usa en clase.", NOTA_INDEPENDIENTES);
  } else if (clave === "pareadas") {
    datos = [
      ["Número de pares (n)", d.n],
      ["Media de las diferencias (d̄)", f(d.mediaD)],
      ["Desviación estándar de las diferencias (s_d)", f(d.desvD)],
    ];
    pasos = [
      ["Grados de libertad", "ν = n − 1", "ν = " + d.n + " − 1 = " + r.gl],
      ["Error estándar", "s_d / √n", f(d.desvD) + " / √" + d.n + " = " + f(r.errorEstandar)],
      ["Estadístico de prueba", "t = (d̄ − d₀) / (s_d / √n)",
        "t = (" + f(d.mediaD) + " − " + v0 + ") / " + f(r.errorEstandar) + " = " + f(r.estadistico)],
    ];
    notas.push("Cada diferencia es d = muestra 1 − muestra 2, y μ_D = μ₁ − μ₂. Se trabajan como una sola muestra " +
      "de n pares; esto supone que las diferencias vienen de una población aproximadamente normal.");
  } else {
    datos = [["Tamaño de la muestra 1 (n₁)", d.n1]];
    if (d.s1 !== null) datos.push(["Desviación muestral 1 (s₁)", f(d.s1)]);
    datos.push(["Varianza muestral 1 (S₁²)", f(r.varianza1)], ["Tamaño de la muestra 2 (n₂)", d.n2]);
    if (d.s2 !== null) datos.push(["Desviación muestral 2 (s₂)", f(d.s2)]);
    datos.push(["Varianza muestral 2 (S₂²)", f(r.varianza2)]);
    pasos = [
      ["Grados de libertad", "ν₁ = n₁ − 1 y ν₂ = n₂ − 1",
        "ν₁ = " + d.n1 + " − 1 = " + r.gl1 + "; ν₂ = " + d.n2 + " − 1 = " + r.gl2],
      ["Estadístico de prueba", "F = S₁² / S₂²", "F = " + f(r.varianza1) + " / " + f(r.varianza2) + " = " + f(r.estadistico)],
    ];
    notas.push("La distribución F supone poblaciones normales y muestras independientes. El valor crítico de la " +
      "izquierda se pide directamente con área α (o α/2) a la izquierda; equivale a 1 / F con los grados de libertad " +
      "intercambiados, como en el formulario.", NOTA_INDEPENDIENTES);
  }

  if (r.distribucion === "chi2" || r.distribucion === "f") {
    if (r.alternativa === "dos-colas") {
      notas.push("En dos colas, el valor p es el doble del área de la cola más pequeña (la distribución no es simétrica).");
    }
  }

  datos.push(
    ["Nivel de significancia (α)", formatearArea(r.alfa)],
    ["Distribución de referencia", ESTADISTICOS[r.distribucion].nombre + textoGLPrueba(r)]
  );
  return Object.assign({ datos: datos, pasos: pasos, notas: notas }, presentarDecisionPrueba(r));
}

// Grados de libertad para mostrar: ", ν = 11" en t y χ², ν₁ y ν₂ en F; Z no usa.
function textoGLPrueba(r) {
  if (r.distribucion === "f") return ", ν₁ = " + r.gl1 + " (numerador) y ν₂ = " + r.gl2 + " (denominador)";
  if (r.distribucion === "z") return " (no usa grados de libertad)";
  return ", ν = " + formatear(r.gl);
}

// Nombre del valor crítico con la notación del formulario: el subíndice es el área a la
// DERECHA (z_0.05, χ²_0.975,9, F_0.05(11,9)). En Z y t el de la izquierda es −z_α o −t_α,ν.
function simboloCritico(r, c) {
  const derecha = formatearArea(c.critico.areaDerecha);
  if (r.distribucion === "z" || r.distribucion === "t") {
    const gl = r.distribucion === "t" ? "," + formatear(r.gl) : "";
    return c.lado === "inferior"
      ? "−" + r.distribucion + "_" + formatearArea(c.critico.areaIzquierda) + gl
      : r.distribucion + "_" + derecha + gl;
  }
  if (r.distribucion === "chi2") return "χ²_" + derecha + "," + r.gl;
  return "F_" + derecha + "(" + r.gl1 + "," + r.gl2 + ")";
}

// Valor p para mostrar: 4 decimales o, si es menor que 0.1, 4 cifras significativas (formatearLimite).
function formatearValorP(p) {
  return p === 0 ? "≈ 0" : herramientas.formatearLimite(p);
}

// Parte común: valores críticos, región de rechazo, valor p, decisión y conclusión.
function presentarDecisionPrueba(r) {
  const e = ESTADISTICOS[r.distribucion].simbolo;
  const v = ESTADISTICOS[r.distribucion].variable;
  const x = formatear(r.estadistico);
  const alfa = formatearArea(r.alfa);

  const criticos = [];
  const zonas = [];
  for (const c of r.criticos) {
    criticos.push([simboloCritico(r, c), formatear(c.critico.valor), c.critico.descripcion]);
    zonas.push(e + (c.lado === "inferior" ? " < " : " > ") + formatear(c.critico.valor));
  }
  const area = r.alternativa === "dos-colas"
    ? "α/2 = " + formatearArea(r.area) + " en cada cola"
    : "α = " + alfa + " en la cola " + (r.alternativa === "izquierda" ? "izquierda" : "derecha");

  let valorP;
  if (r.alternativa === "izquierda") {
    valorP = "valor p = P(" + v + " ≤ " + x + ") = " + formatearValorP(r.valorP);
  } else if (r.alternativa === "derecha") {
    valorP = "valor p = P(" + v + " ≥ " + x + ") = " + formatearValorP(r.valorP);
  } else {
    valorP = "valor p = 2 · mín(P(" + v + " ≤ " + x + "), P(" + v + " ≥ " + x + ")) = 2 · mín(" +
      formatearValorP(r.colaIzquierda) + ", " + formatearValorP(r.colaDerecha) + ") = " + formatearValorP(r.valorP);
  }

  const comparacionP = "valor p = " + formatearValorP(r.valorP) + (r.valorP < r.alfa ? " < " : " ≥ ") + "α = " + alfa;
  const explicacion = r.rechazar
    ? "El estadístico " + e + " = " + x + " cae en la región de rechazo (" + zonas.join(" o ") + "). " +
      "Con el valor p se llega a lo mismo: " + comparacionP + "."
    : "El estadístico " + e + " = " + x + " no cae en la región de rechazo (" + zonas.join(" o ") + "). " +
      "Con el valor p se llega a lo mismo: " + comparacionP + ".";

  return {
    hipotesis: r.hipotesis,
    criticos: criticos,
    region: "Región de rechazo (" + area + "): se rechaza H₀ si " + zonas.join(" o ") + ".",
    valorP: valorP,
    explicacion: explicacion,
    decision: r.rechazar ? "Decisión: se rechaza H₀" : "Decisión: no se rechaza H₀",
    conclusion: r.conclusion,
    advertencias: r.advertencias,
  };
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    NOTA_REDONDEO,
    NOTA_CONFIANZA,
    textoSinResultado,
    formatear,
    formatearArea,
    formatearValorP,
    filasDescriptivos,
    filasProporcion,
    presentarMediaZ,
    presentarMediaT,
    presentarProporcion,
    presentarVarianza,
    presentarDosMediasZ,
    presentarDosMediasTIguales,
    presentarDosMediasTDiferentes,
    presentarDosProporciones,
    presentarPareadas,
    presentarCocienteVarianzas,
    presentarPrueba,
  };
}
