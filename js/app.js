// Archivo principal de JavaScript.
// Parte 2: muestra u oculta los campos del formulario según las opciones elegidas.
// Parte 3: lee las listas de datos y muestra sus estadísticos descriptivos
//          (las funciones de cálculo están en js/estadistica.js).
// Parte 5: muestra qué método corresponde al ejercicio
//          (las reglas están en js/metodos.js).
// Parte 6: calcula y muestra los intervalos de confianza de una muestra
//          (las fórmulas están en js/intervalos.js).
// Todavía no se resuelven intervalos de dos muestras ni pruebas de hipótesis.

const formulario = document.getElementById("formulario-ejercicio");
const avisoDatos = document.getElementById("aviso-datos");
const estado = document.getElementById("estado");
const resultados = document.getElementById("resultados");
const contenidoResultados = document.getElementById("contenido-resultados");
const tarjetaMetodo = document.getElementById("metodo");
const contenidoMetodo = document.getElementById("contenido-metodo");
const tarjetaIntervalo = document.getElementById("intervalo");
const contenidoIntervalo = document.getElementById("contenido-intervalo");

// Opciones que deciden qué bloques se ven (coinciden con los atributos data-* del HTML).
const CRITERIOS = ["tipo", "caso", "formato", "sigma"];

// Nombres legibles para el resumen de la selección.
const NOMBRES = {
  intervalo: "Intervalo de confianza",
  prueba: "Prueba de hipótesis",
  lista: "Datos individuales",
  resumen: "Estadísticas resumidas",
  conocida: "σ conocida",
  desconocida: "σ desconocida",
  iguales: "varianzas iguales",
  diferentes: "varianzas diferentes",
};

// Campos de lista de cada caso: [id del campo, nombre que se muestra].
const LISTAS_POR_CASO = {
  "una-media": [["media-datos", "Muestra"]],
  "una-proporcion": [["prop-datos", "Muestra"]],
  "una-varianza": [["var-datos", "Muestra"]],
  "dos-medias": [["dm1-datos", "Muestra 1"], ["dm2-datos", "Muestra 2"]],
  "dos-proporciones": [["dp1-datos", "Muestra 1"], ["dp2-datos", "Muestra 2"]],
  "cociente-varianzas": [["cv1-datos", "Muestra 1"], ["cv2-datos", "Muestra 2"]],
  "pareadas": [["par1-datos", "Muestra 1"], ["par2-datos", "Muestra 2"]],
};

// Campos de tamaño de muestra de cada caso en estadísticas resumidas.
const TAMANOS_POR_CASO = {
  "una-media": ["media-n"],
  "una-proporcion": ["prop-n"],
  "una-varianza": ["var-n"],
  "dos-medias": ["dm1-n", "dm2-n"],
  "dos-proporciones": ["dp1-n", "dp2-n"],
  "cociente-varianzas": ["cv1-n", "cv2-n"],
  "pareadas": ["par-n"],
};

// Lee las opciones elegidas. Si una opción no se ha elegido, su valor es "".
function leerSeleccion() {
  const campos = formulario.elements;
  return {
    tipo: campos.tipo.value,
    caso: campos.caso.value,
    formato: campos.formato.value,
    sigma: campos.sigma.value,
    varianzas: campos.varianzas.value,
  };
}

// Un bloque se muestra solo si cada atributo data-* que tiene
// incluye el valor elegido. Ejemplo: data-formato="lista resumen"
// acepta tanto "lista" como "resumen", pero no "" (sin elegir).
function debeMostrarse(bloque, seleccion) {
  for (const criterio of CRITERIOS) {
    const permitidos = bloque.dataset[criterio];
    if (permitidos && !permitidos.split(" ").includes(seleccion[criterio])) {
      return false;
    }
  }
  return true;
}

function actualizarCampos() {
  const seleccion = leerSeleccion();

  for (const bloque of formulario.querySelectorAll(".condicional")) {
    bloque.hidden = !debeMostrarse(bloque, seleccion);
  }

  // El aviso del paso 4 solo se ve mientras falte el caso o el formato.
  avisoDatos.hidden = seleccion.caso !== "" && seleccion.formato !== "";
}

// Muestra un mensaje debajo del botón. Los errores se ven en rojo.
function mostrarMensaje(texto, esError) {
  estado.textContent = texto;
  estado.className = esError ? "error" : "";
}

// Borra el mensaje, los resultados y las marcas de error anteriores.
function limpiarResultados() {
  mostrarMensaje("", false);
  resultados.hidden = true;
  contenidoResultados.replaceChildren();
  tarjetaMetodo.hidden = true;
  contenidoMetodo.replaceChildren();
  tarjetaIntervalo.hidden = true;
  contenidoIntervalo.replaceChildren();
  for (const campo of formulario.querySelectorAll("[aria-invalid]")) {
    campo.removeAttribute("aria-invalid");
  }
}

// Revisa que estén todas las opciones necesarias. Si los datos vienen en
// lista, además calcula y muestra los estadísticos descriptivos.
function revisarDatos(evento) {
  evento.preventDefault();
  limpiarResultados();

  const seleccion = leerSeleccion();
  const faltantes = [];
  const usaSigma = seleccion.caso === "una-media" || seleccion.caso === "dos-medias";

  if (seleccion.tipo === "") faltantes.push("el tipo de ejercicio (paso 1)");
  if (seleccion.caso === "") faltantes.push("el caso (paso 2)");
  if (seleccion.formato === "") faltantes.push("el formato de los datos (paso 3)");
  if (usaSigma && seleccion.formato !== "" && seleccion.sigma === "") {
    faltantes.push("si σ es conocida (paso 4)");
  }
  if (seleccion.caso === "dos-medias" && seleccion.sigma === "desconocida" && seleccion.varianzas === "") {
    faltantes.push("si las varianzas son iguales o diferentes (paso 4)");
  }

  if (faltantes.length > 0) {
    mostrarMensaje("Falta elegir: " + faltantes.join(", ") + ".", true);
    return;
  }

  // Nivel de confianza o de significancia, según el tipo de ejercicio.
  let nivel;
  let confianza = null; // en %, solo para intervalos
  if (seleccion.tipo === "intervalo") {
    confianza = Number(formulario.elements["nivel-confianza"].value);
    if (!(confianza > 0 && confianza < 100)) {
      mostrarMensaje("El nivel de confianza debe ser un número mayor que 0 y menor que 100.", true);
      return;
    }
    nivel = "confianza " + confianza + " %";
  } else {
    const alfa = Number(formulario.elements["nivel-significancia"].value);
    if (!(alfa > 0 && alfa < 1)) {
      mostrarMensaje("El nivel de significancia α debe ser un número mayor que 0 y menor que 1.", true);
      return;
    }
    nivel = "α = " + alfa;
  }

  const partes = [
    NOMBRES[seleccion.tipo],
    formulario.elements.caso.selectedOptions[0].textContent,
    NOMBRES[seleccion.formato],
    nivel,
  ];
  if (usaSigma) partes.push(NOMBRES[seleccion.sigma]);
  if (seleccion.caso === "dos-medias" && seleccion.sigma === "desconocida") {
    partes.push(NOMBRES[seleccion.varianzas]);
  }
  const resumen = "Selección: " + partes.join(" · ") + ".";

  // Tamaños de muestra: en lista se cuentan los datos leídos (y se muestran sus
  // estadísticos); en estadísticas resumidas se leen los campos n.
  let muestras = null; // listas leídas: [{ nombre, valores }] (solo en formato lista)
  let tamanos;
  if (seleccion.formato === "lista") {
    muestras = mostrarEstadisticos(seleccion.caso);
    if (muestras === null) return; // hay datos inválidos; el error ya se mostró
    tamanos = muestras.map(function (muestra) { return muestra.valores.length; });
  } else {
    tamanos = leerTamanosResumen(seleccion.caso);
  }

  // Identificar el método (las reglas están en js/metodos.js).
  const metodo = identificarMetodo({
    tipo: seleccion.tipo,
    caso: seleccion.caso,
    sigma: seleccion.sigma,
    varianzas: seleccion.varianzas,
    tamanos: tamanos,
  });

  if (metodo.estado === "falta-dato") {
    mostrarMensaje("Falta información para elegir el método: " + metodo.mensaje, true);
    return;
  }

  mostrarMetodo(metodo);
  if (metodo.estado !== "identificado") {
    mostrarMensaje(resumen + " No se pudo determinar el método con seguridad; revisa la explicación abajo.", true);
    return;
  }

  // Intervalos de una muestra (Parte 6). Los demás casos se resolverán en otras partes.
  if (seleccion.tipo === "intervalo" && INTERVALOS_UNA_MUESTRA.includes(metodo.clave)) {
    const presentacion = calcularIntervaloUnaMuestra(metodo.clave, seleccion.sigma, muestras, confianza);
    if (presentacion.error) {
      mostrarMensaje("No se pudo calcular el intervalo: " + presentacion.error, true);
      return;
    }
    mostrarIntervalo(presentacion);
    mostrarMensaje(resumen + " Revisa abajo el método y el intervalo de confianza.", false);
    return;
  }

  mostrarMensaje(resumen + " Revisa abajo el método identificado. " +
    "La resolución de este caso se agregará en las siguientes partes del proyecto.", false);
}

// Lee un campo numérico. Si está vacío devuelve null (dato faltante); si el
// texto no es un número devuelve NaN, que las validaciones rechazan.
function leerNumero(id) {
  const texto = document.getElementById(id).value.trim();
  return texto === "" ? null : Number(texto);
}

// Lee los campos n del caso elegido (estadísticas resumidas).
function leerTamanosResumen(caso) {
  return TAMANOS_POR_CASO[caso].map(leerNumero);
}

// Muestra el método identificado, o por qué no se pudo determinar.
function mostrarMetodo(metodo) {
  if (metodo.estado === "identificado") {
    agregarElemento("h3", metodo.metodo, contenidoMetodo);
    agregarTabla(["Dato", "Valor"], [
      ["Distribución", metodo.distribucion],
      ["Grados de libertad", metodo.gradosLibertad === null ? "No aplica" : metodo.gradosLibertad],
    ], contenidoMetodo);
    agregarElemento("p", "Por qué: " + metodo.explicacion, contenidoMetodo);
  } else {
    agregarElemento("h3", "No se puede determinar el método con seguridad", contenidoMetodo);
    agregarElemento("p", metodo.mensaje, contenidoMetodo).className = "no-determinado";
  }
  tarjetaMetodo.hidden = false;
}

// Lee las listas del caso elegido y muestra sus estadísticos.
// Devuelve las muestras leídas: [{ nombre, valores }, ...].
// Si algún dato no es válido, muestra los errores y devuelve null.
function mostrarEstadisticos(caso) {
  const esProporcion = caso === "una-proporcion" || caso === "dos-proporciones";
  const muestras = []; // cada elemento: { nombre, valores }
  const camposConError = [];
  const errores = [];

  for (const [id, nombre] of LISTAS_POR_CASO[caso]) {
    const campo = document.getElementById(id);
    const lectura = esProporcion ? leerListaBinaria(campo.value) : leerLista(campo.value);
    if (lectura.error) {
      errores.push(nombre + ": " + lectura.error);
      camposConError.push(campo);
    } else {
      muestras.push({ nombre: nombre, valores: lectura.valores });
    }
  }

  // En datos pareados, además se calculan las diferencias de cada par.
  let diferencias = null;
  if (caso === "pareadas" && errores.length === 0) {
    const resultado = calcularDiferencias(muestras[0].valores, muestras[1].valores);
    if (resultado.error) {
      errores.push(resultado.error);
      camposConError.push(document.getElementById("par1-datos"), document.getElementById("par2-datos"));
    } else {
      diferencias = resultado.diferencias;
    }
  }

  if (errores.length > 0) {
    for (const campo of camposConError) {
      campo.setAttribute("aria-invalid", "true");
    }
    mostrarMensaje("Corrige los datos:\n" + errores.join("\n"), true);
    camposConError[0].focus();
    return null;
  }

  // Estadísticos de cada muestra.
  for (const muestra of muestras) {
    agregarElemento("h3", muestra.nombre);
    agregarElemento("p", "Valores leídos (" + muestra.valores.length + "): " + muestra.valores.join(", "));
    if (esProporcion) {
      agregarTabla(["Estadístico", "Fórmula", "Valor"], filasProporcion(calcularProporcion(muestra.valores)));
    } else {
      agregarTabla(["Estadístico", "Fórmula", "Valor"],
        filasDescriptivos(calcularDescriptivos(muestra.valores), "x", "x̄", "s"));
    }
  }

  // Diferencias pareadas: tabla par por par y sus estadísticos.
  if (diferencias !== null) {
    agregarElemento("h3", "Diferencias (d = muestra 1 − muestra 2)");
    const filasPares = [];
    for (let i = 0; i < diferencias.length; i++) {
      filasPares.push([i + 1, muestras[0].valores[i], muestras[1].valores[i], formatear(diferencias[i])]);
    }
    agregarTabla(["Par", "Muestra 1", "Muestra 2", "d"], filasPares);
    agregarTabla(["Estadístico", "Fórmula", "Valor"],
      filasDescriptivos(calcularDescriptivos(diferencias), "d", "d̄", "s_d"));
  }

  agregarElemento("p", "Los valores calculados se muestran redondeados a 4 decimales; " +
    "los cálculos internos usan todos los decimales.").className = "ayuda";
  resultados.hidden = false;
  return muestras;
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

// ---------- Intervalos de confianza de una muestra (Parte 6) ----------

// Métodos (claves de js/metodos.js) cuyo intervalo ya se calcula.
const INTERVALOS_UNA_MUESTRA = ["media-z", "media-t", "proporcion", "varianza"];

// Reúne los datos del caso (de la lista o de los campos de estadísticas
// resumidas), calcula el intervalo con js/intervalos.js y prepara lo que se
// muestra. Devuelve { error } si un dato falta o no es válido.
function calcularIntervaloUnaMuestra(clave, sigma, muestras, confianza) {
  const valores = muestras === null ? null : muestras[0].valores; // null en estadísticas resumidas

  if (clave === "proporcion") {
    let n, exitos, proporcion;
    if (valores) {
      const p = calcularProporcion(valores);
      n = p.n;
      exitos = p.exitos;
      proporcion = null;
    } else {
      n = leerNumero("prop-n");
      exitos = leerNumero("prop-x");
      proporcion = leerNumero("prop-phat");
    }
    const r = intervaloProporcion(n, exitos, proporcion, confianza);
    if (r.error) return r;
    const errorDeseado = leerNumero("prop-error");
    const tamano = errorDeseado === null ? null : tamanoMuestraProporcion(r.p, errorDeseado, confianza);
    return presentarProporcion(r, n, exitos, confianza, tamano, errorDeseado);
  }

  if (clave === "varianza") {
    let n, s, s2;
    if (valores) {
      const d = calcularDescriptivos(valores);
      n = d.n;
      s = null;
      s2 = d.varianza;
    } else {
      n = leerNumero("var-n");
      s = leerNumero("var-s");
      s2 = leerNumero("var-s2");
    }
    const r = intervaloVarianza(n, s, s2, confianza);
    if (r.error) return r;
    return presentarVarianza(r, n, s, confianza);
  }

  // Una media
  let n, media, s;
  if (valores) {
    const d = calcularDescriptivos(valores);
    n = d.n;
    media = d.media;
    s = d.desviacion;
  } else {
    n = leerNumero("media-n");
    media = leerNumero("media-xbarra");
    s = leerNumero("media-s");
  }

  if (clave === "media-t") {
    const r = intervaloMediaT(n, media, s, confianza);
    if (r.error) return r;
    return presentarMediaT(r, n, media, s, confianza);
  }

  // Z: con σ conocida se usa σ; si no, s (el formulario lo permite solo con n ≥ 30).
  const sigmaConocida = sigma === "conocida";
  const desviacion = sigmaConocida ? leerNumero("media-sigma") : s;
  const r = intervaloMediaZ(n, media, desviacion, sigmaConocida, confianza);
  if (r.error) return r;
  // El tamaño de muestra del formulario usa σ, así que solo se calcula con σ conocida.
  const errorDeseado = sigmaConocida ? leerNumero("media-error") : null;
  const tamano = errorDeseado === null ? null : tamanoMuestraMedia(desviacion, errorDeseado, confianza);
  return presentarMediaZ(r, n, media, desviacion, sigmaConocida, confianza, tamano, errorDeseado);
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
  if (s !== null) datos.push(["Desviación estándar muestral (s)", formatear(s)]);
  datos.push(["Varianza muestral (S²)", formatear(r.varianza)]);
  return {
    datos: datos.concat(filasNivel(confianza, r.alfa), [["1 − α/2", formatearArea(1 - r.alfa / 2)]]),
    criticos: [
      filaCritico("χ²_α/2,ν = χ²_" + formatearArea(r.alfa / 2) + "," + r.gl, r.chiDerecha),
      filaCritico("χ²_1−α/2,ν = χ²_" + formatearArea(1 - r.alfa / 2) + "," + r.gl, r.chiIzquierda),
    ],
    pasos: [
      ["Grados de libertad", "ν = n − 1", "ν = " + n + " − 1 = " + r.gl],
      ["Numerador", "(n − 1) · S²", r.gl + " · " + formatear(r.varianza) + " = " + formatear(r.numerador)],
      ["Límite inferior", "(n − 1) · S² / χ²_α/2,ν",
        formatear(r.numerador) + " / " + formatear(r.chiDerecha.valor) + " = " + formatear(r.inferior)],
      ["Límite superior", "(n − 1) · S² / χ²_1−α/2,ν",
        formatear(r.numerador) + " / " + formatear(r.chiIzquierda.valor) + " = " + formatear(r.superior)],
    ],
    resultado: formatear(r.inferior) + " ≤ σ² ≤ " + formatear(r.superior),
    interpretacion: interpretar(confianza, "la varianza poblacional", "σ²", r),
    notas: [
      "Este intervalo no es simétrico alrededor de S², por eso el formulario no usa un margen de error e: " +
        "cada límite se calcula con su propio valor de chi-cuadrada.",
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

// Interpretación: el nivel de confianza se refiere al método, no a este intervalo.
function interpretar(confianza, nombre, simbolo, r) {
  return "Con un nivel de confianza del " + confianza + " %, se estima que " + nombre + " " + simbolo +
    " está entre " + formatear(r.inferior) + " y " + formatear(r.superior) + ". El " + confianza +
    " % se refiere al método: si se tomaran muchas muestras y con cada una se calculara un intervalo así, " +
    "alrededor del " + confianza + " % de esos intervalos contendría el valor real de " + simbolo + ". " +
    "No significa que haya un " + confianza + " % de probabilidad de que " + simbolo +
    " (que es un valor fijo) esté en este intervalo en particular.";
}

// Muestra el procedimiento completo del intervalo.
function mostrarIntervalo(p) {
  const c = contenidoIntervalo;
  agregarElemento("h3", "Datos", c);
  agregarTabla(["Dato", "Valor"], p.datos, c);
  agregarElemento("h3", "Valor crítico", c);
  agregarTabla(["Valor", "Resultado", "Cómo se obtuvo"], p.criticos, c);
  agregarElemento("h3", "Procedimiento", c);
  agregarTabla(["Paso", "Fórmula", "Sustitución"], p.pasos, c);

  agregarElemento("h3", "Resultado", c);
  agregarElemento("p", p.resultado, c).className = "resultado-intervalo";
  agregarElemento("p", p.interpretacion, c);
  for (const aviso of p.advertencias) {
    agregarElemento("p", "Atención: " + aviso, c).className = "aviso";
  }
  for (const nota of p.notas) {
    agregarElemento("p", "Nota: " + nota, c).className = "ayuda";
  }

  if (p.tamano !== null) {
    agregarElemento("h3", "Tamaño de muestra", c);
    if (p.tamano.error) {
      agregarElemento("p", "No se pudo calcular el tamaño de muestra: " + p.tamano.error, c).className = "aviso";
    } else {
      agregarTabla(["Paso", "Fórmula", "Sustitución"], p.tamano.pasos, c);
      agregarElemento("p", p.tamano.conclusion, c);
    }
  }

  agregarElemento("p", "Los valores se muestran redondeados a 4 decimales; " +
    "los cálculos internos usan todos los decimales.", c).className = "ayuda";
  tarjetaIntervalo.hidden = false;
}

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

// Crea un elemento con texto y lo agrega a los resultados (o al contenedor indicado).
// Se usa textContent para que lo escrito por el usuario se muestre como texto.
function agregarElemento(etiqueta, texto, contenedor = contenidoResultados) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  contenedor.appendChild(elemento);
  return elemento;
}

// Crea una tabla con encabezados y filas, y la agrega a los resultados
// (o al contenedor indicado).
function agregarTabla(encabezados, filas, destino = contenidoResultados) {
  const contenedor = document.createElement("div");
  contenedor.className = "tabla-contenedor";
  const tabla = document.createElement("table");

  const filaEncabezado = tabla.createTHead().insertRow();
  for (const texto of encabezados) {
    const celda = document.createElement("th");
    celda.scope = "col";
    celda.textContent = texto;
    filaEncabezado.appendChild(celda);
  }

  const cuerpo = tabla.createTBody();
  for (const fila of filas) {
    const filaTabla = cuerpo.insertRow();
    for (const valor of fila) {
      filaTabla.insertCell().textContent = valor;
    }
  }

  contenedor.appendChild(tabla);
  destino.appendChild(contenedor);
}

// Cualquier cambio en el formulario actualiza los campos visibles y borra
// los resultados anteriores, porque ya no corresponden a lo escrito.
formulario.addEventListener("change", function () {
  actualizarCampos();
  limpiarResultados();
});
formulario.addEventListener("submit", revisarDatos);

// Al cargar la página, ocultar todo lo que aún no corresponde.
actualizarCampos();
