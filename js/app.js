// Archivo principal de JavaScript.
// Parte 2: muestra u oculta los campos del formulario según las opciones elegidas.
// Parte 3: lee las listas de datos y muestra sus estadísticos descriptivos
//          (las funciones de cálculo están en js/estadistica.js).
// Parte 5: muestra qué método corresponde al ejercicio
//          (las reglas están en js/metodos.js).
// Parte 6: calcula y muestra los intervalos de confianza de una muestra
//          (las fórmulas están en js/intervalos.js).
// Parte 7: calcula y muestra los intervalos de confianza de dos muestras
//          (las fórmulas están en js/intervalos.js).
// Parte 8: muestra el criterio de decisión del formulario para los intervalos de
//          dos muestras (las reglas están en js/decisiones.js).
// Todavía no se resuelven pruebas de hipótesis.

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

  // Intervalos de una muestra (Parte 6) y de dos muestras (Parte 7).
  const esUnaMuestra = INTERVALOS_UNA_MUESTRA.includes(metodo.clave);
  const esDosMuestras = INTERVALOS_DOS_MUESTRAS.includes(metodo.clave);
  if (seleccion.tipo === "intervalo" && (esUnaMuestra || esDosMuestras)) {
    const presentacion = esUnaMuestra
      ? calcularIntervaloUnaMuestra(metodo.clave, seleccion.sigma, muestras, confianza)
      : calcularIntervaloDosMuestras(metodo.clave, seleccion.sigma, muestras, confianza);
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
  if (s !== null) datos.push(["Desviación estándar muestral (s)", formatearLimite(s)]);
  datos.push(["Varianza muestral (S²)", formatearLimite(r.varianza)]);
  // formatearLimite (js/intervalos.js) conserva cifras en valores pequeños; solo cambia lo que se ve.
  const fl = formatearLimite;
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
      "Varianza: " + fl(r.inferior) + " ≤ σ² ≤ " + fl(r.superior),
      "Desviación estándar: " + fl(r.sigmaInferior) + " ≤ σ ≤ " + fl(r.sigmaSuperior),
    ],
    interpretacion: interpretar(confianza, "la varianza poblacional", "σ²", r, fl) +
      " Tomando la raíz cuadrada de los límites, la desviación estándar poblacional σ está entre " +
      fl(r.sigmaInferior) + " y " + fl(r.sigmaSuperior) + ".",
    notas: [
      "Los límites de σ son la raíz cuadrada de los límites de σ² sin redondear, no de los valores que se ven aquí.",
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
// formato es la función que escribe los límites (formatear, salvo que se indique otra).
function interpretar(confianza, nombre, simbolo, r, formato = formatear) {
  return "Con un nivel de confianza del " + confianza + " %, se estima que " + nombre + " " + simbolo +
    " está entre " + formato(r.inferior) + " y " + formato(r.superior) + ". El " + confianza +
    " % se refiere al método: si se tomaran muchas muestras y con cada una se calculara un intervalo así, " +
    "alrededor del " + confianza + " % de esos intervalos contendría el valor real de " + simbolo + ". " +
    "No significa que haya un " + confianza + " % de probabilidad de que " + simbolo +
    " (que es un valor fijo) esté en este intervalo en particular.";
}

// ---------- Intervalos de confianza de dos muestras (Parte 7) ----------

// Métodos (claves de js/metodos.js) de dos muestras cuyo intervalo ya se calcula.
const INTERVALOS_DOS_MUESTRAS = [
  "dos-medias-z", "dos-medias-t-iguales", "dos-medias-t-diferentes",
  "dos-proporciones", "cociente-varianzas", "pareadas",
];

// Igual que calcularIntervaloUnaMuestra, pero con dos listas o dos juegos de campos.
// muestras: las listas leídas ([{ nombre, valores }, ...]) o null en estadísticas resumidas.
// Devuelve { error } si un dato falta o no es válido.
function calcularIntervaloDosMuestras(clave, sigma, muestras, confianza) {
  const listas = muestras === null ? null : [muestras[0].valores, muestras[1].valores];

  if (clave === "dos-proporciones") {
    let n1, exitos1, prop1, n2, exitos2, prop2;
    if (listas) {
      const a = calcularProporcion(listas[0]);
      const b = calcularProporcion(listas[1]);
      n1 = a.n; exitos1 = a.exitos; prop1 = null;
      n2 = b.n; exitos2 = b.exitos; prop2 = null;
    } else {
      n1 = leerNumero("dp1-n"); exitos1 = leerNumero("dp1-x"); prop1 = leerNumero("dp1-phat");
      n2 = leerNumero("dp2-n"); exitos2 = leerNumero("dp2-x"); prop2 = leerNumero("dp2-phat");
    }
    const r = intervaloDosProporciones(n1, exitos1, prop1, n2, exitos2, prop2, confianza);
    if (r.error) return r;
    return presentarDosProporciones(r, n1, exitos1, n2, exitos2, confianza);
  }

  if (clave === "cociente-varianzas") {
    let n1, s1, varianza1, n2, s2, varianza2;
    if (listas) {
      const a = calcularDescriptivos(listas[0]);
      const b = calcularDescriptivos(listas[1]);
      n1 = a.n; s1 = null; varianza1 = a.varianza;
      n2 = b.n; s2 = null; varianza2 = b.varianza;
    } else {
      n1 = leerNumero("cv1-n"); s1 = leerNumero("cv1-s"); varianza1 = leerNumero("cv1-s2");
      n2 = leerNumero("cv2-n"); s2 = leerNumero("cv2-s"); varianza2 = leerNumero("cv2-s2");
    }
    const r = intervaloCocienteVarianzas(n1, s1, varianza1, n2, s2, varianza2, confianza);
    if (r.error) return r;
    return presentarCocienteVarianzas(r, n1, s1, n2, s2, confianza);
  }

  if (clave === "pareadas") {
    // Se calculan las diferencias d = muestra 1 − muestra 2 y se trabaja con ellas como una muestra.
    let n, mediaD, desvD;
    if (listas) {
      const d = calcularDescriptivos(calcularDiferencias(listas[0], listas[1]).diferencias);
      n = d.n; mediaD = d.media; desvD = d.desviacion;
    } else {
      n = leerNumero("par-n"); mediaD = leerNumero("par-dbarra"); desvD = leerNumero("par-sd");
    }
    const r = intervaloPareadas(n, mediaD, desvD, confianza);
    if (r.error) return r;
    return presentarPareadas(r, n, mediaD, desvD, confianza);
  }

  // Dos medias (muestras independientes)
  let n1, media1, s1, n2, media2, s2;
  if (listas) {
    const a = calcularDescriptivos(listas[0]);
    const b = calcularDescriptivos(listas[1]);
    n1 = a.n; media1 = a.media; s1 = a.desviacion;
    n2 = b.n; media2 = b.media; s2 = b.desviacion;
  } else {
    n1 = leerNumero("dm1-n"); media1 = leerNumero("dm1-xbarra");
    n2 = leerNumero("dm2-n"); media2 = leerNumero("dm2-xbarra");
    // Los campos s₁ y s₂ solo existen cuando σ es desconocida.
    s1 = sigma === "desconocida" ? leerNumero("dm1-s") : null;
    s2 = sigma === "desconocida" ? leerNumero("dm2-s") : null;
  }

  if (clave === "dos-medias-t-iguales") {
    const r = intervaloDosMediasTIguales(n1, media1, s1, n2, media2, s2, confianza);
    if (r.error) return r;
    return presentarDosMediasTIguales(r, n1, media1, s1, n2, media2, s2, confianza);
  }
  if (clave === "dos-medias-t-diferentes") {
    const r = intervaloDosMediasTDiferentes(n1, media1, s1, n2, media2, s2, confianza);
    if (r.error) return r;
    return presentarDosMediasTDiferentes(r, n1, media1, s1, n2, media2, s2, confianza);
  }

  // Z: con σ conocidas se usan σ₁ y σ₂ (campos del formulario); si no, s₁ y s₂ (solo con n ≥ 30).
  const sigmaConocida = sigma === "conocida";
  const desv1 = sigmaConocida ? leerNumero("dm1-sigma") : s1;
  const desv2 = sigmaConocida ? leerNumero("dm2-sigma") : s2;
  const r = intervaloDosMediasZ(n1, media1, desv1, n2, media2, desv2, sigmaConocida, confianza);
  if (r.error) return r;
  return presentarDosMediasZ(r, n1, media1, desv1, n2, media2, desv2, sigmaConocida, confianza);
}

const NOTA_INDEPENDIENTES = "Las muestras se tratan como independientes (ningún dato de la muestra 1 está " +
  "emparejado con uno de la muestra 2). Si cada dato de una muestra corresponde a uno de la otra " +
  "(por ejemplo, antes y después en los mismos sujetos), elige «Muestras pareadas».";

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
    decision: decidirIntervalo("dos-medias-z", r.inferior, r.superior),
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
    decision: decidirIntervalo("dos-medias-t-iguales", r.inferior, r.superior),
    notas: [
      "Esta fórmula supone que las varianzas poblacionales son iguales (σ₁² = σ₂²), como indica el enunciado, " +
        "y que las poblaciones son aproximadamente normales.",
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
    decision: decidirIntervalo("dos-medias-t-diferentes", r.inferior, r.superior),
    notas: [
      "Esta fórmula supone varianzas poblacionales diferentes y poblaciones aproximadamente normales. " +
        "Los grados de libertad (Welch) no son un número entero y se usan con todos sus decimales; si tu profesor " +
        "usa tablas y redondea ν, el valor crítico cambia un poco.",
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
    decision: decidirIntervalo("dos-proporciones", r.inferior, r.superior),
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
    decision: decidirIntervalo("pareadas", r.inferior, r.superior),
    notas: [
      "Cada diferencia es d = muestra 1 − muestra 2, y μ_D = μ₁ − μ₂. Si se invierte el orden, cambia el signo del intervalo.",
      "Las diferencias se trabajan como una sola muestra de n pares con t y ν = n − 1; esto supone que las diferencias " +
        "vienen de una población aproximadamente normal.",
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
    decision: decidirIntervalo("cociente-varianzas", r.inferior, r.superior),
    notas: [
      "Este intervalo no es simétrico alrededor de S₁² / S₂², por eso no tiene un margen de error e: cada límite " +
        "usa su propio valor de F, con los grados de libertad en distinto orden.",
      "La distribución F supone poblaciones normales y muestras independientes. Si necesitas σ₁ / σ₂, saca la " +
        "raíz cuadrada de los dos límites.",
      NOTA_INDEPENDIENTES,
    ],
    advertencias: [],
    tamano: null,
  };
}

// Muestra el criterio aplicado y la decisión, o por qué no hay decisión automática.
// conAdvertencias: el intervalo tiene advertencias, y la decisión depende de él.
function mostrarDecision(d, conAdvertencias, contenedor) {
  agregarElemento("h3", "Criterio de decisión", contenedor);
  if (d.criterio) agregarElemento("p", "Criterio del formulario: " + d.criterio, contenedor);

  if (d.estado === "decidido") {
    agregarElemento("p", "Signos de los límites (inferior, superior): " + d.signos + ". " + d.explicacion, contenedor);
    agregarElemento("p", "Decisión: " + d.decision, contenedor).className = "resultado-intervalo";
    if (conAdvertencias) {
      agregarElemento("p", "Esta decisión depende del intervalo, que tiene una advertencia arriba: revísala antes de usarla.",
        contenedor).className = "aviso";
    }
  } else {
    agregarElemento("p", "Sin decisión automática: " + d.mensaje, contenedor).className = "aviso";
  }
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
  // resultado es un texto, o una lista de textos cuando hay más de un intervalo (varianza y σ).
  for (const linea of [].concat(p.resultado)) {
    agregarElemento("p", linea, c).className = "resultado-intervalo";
  }
  agregarElemento("p", p.interpretacion, c);
  for (const aviso of p.advertencias) {
    agregarElemento("p", "Atención: " + aviso, c).className = "aviso";
  }

  // Criterio de decisión del formulario (js/decisiones.js); solo hay en los casos de dos muestras.
  if (p.decision) {
    mostrarDecision(p.decision, p.advertencias.length > 0, c);
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
