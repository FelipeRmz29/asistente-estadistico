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
// Parte 9: resuelve y muestra las pruebas de hipótesis
//          (las fórmulas y la decisión están en js/pruebas.js).

const formulario = document.getElementById("formulario-ejercicio");
const avisoDatos = document.getElementById("aviso-datos");
const estado = document.getElementById("estado");
const resultados = document.getElementById("resultados");
const contenidoResultados = document.getElementById("contenido-resultados");
const tarjetaMetodo = document.getElementById("metodo");
const contenidoMetodo = document.getElementById("contenido-metodo");
const tarjetaIntervalo = document.getElementById("intervalo");
const contenidoIntervalo = document.getElementById("contenido-intervalo");
const tarjetaPrueba = document.getElementById("prueba");
const contenidoPrueba = document.getElementById("contenido-prueba");

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
    alternativa: campos.alternativa.value, // solo pruebas de hipótesis
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
  tarjetaPrueba.hidden = true;
  contenidoPrueba.replaceChildren();
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
  if (seleccion.tipo === "prueba" && seleccion.caso !== "" && seleccion.formato !== "" && seleccion.alternativa === "") {
    faltantes.push("la hipótesis alternativa H₁ (paso 4)");
  }

  if (faltantes.length > 0) {
    mostrarMensaje("Falta elegir: " + faltantes.join(", ") + ".", true);
    return;
  }

  // Nivel de confianza o de significancia, según el tipo de ejercicio.
  let nivel;
  let confianza = null; // en %, solo para intervalos
  let alfa = null;      // solo para pruebas de hipótesis
  if (seleccion.tipo === "intervalo") {
    confianza = Number(formulario.elements["nivel-confianza"].value);
    if (!(confianza > 0 && confianza < 100)) {
      mostrarMensaje("El nivel de confianza debe ser un número mayor que 0 y menor que 100.", true);
      return;
    }
    nivel = "confianza " + confianza + " %";
  } else {
    alfa = Number(formulario.elements["nivel-significancia"].value);
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

  // Pruebas de hipótesis (Parte 9).
  if (seleccion.tipo === "prueba" && PRUEBAS.includes(metodo.clave)) {
    const presentacion = calcularPrueba(metodo.clave, seleccion.sigma, muestras, alfa, seleccion.alternativa);
    if (presentacion.error) {
      mostrarMensaje("No se pudo resolver la prueba de hipótesis: " + presentacion.error, true);
      return;
    }
    mostrarPrueba(presentacion);
    mostrarMensaje(resumen + " Revisa abajo el método y la prueba de hipótesis.", false);
    return;
  }

  mostrarMensaje(resumen + " Revisa abajo el método identificado. " +
    "La resolución de este caso no está implementada.", false);
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

// ---------- Datos del ejercicio ----------

// Reúne los datos del caso: de las listas (formato lista) o de los campos de
// estadísticas resumidas. La usan los intervalos (Partes 6 y 7) y las pruebas de
// hipótesis (Parte 9), así que ambos trabajan con los mismos datos.
// muestras: las listas leídas ([{ nombre, valores }, ...]) o null en estadísticas resumidas.
// Un campo vacío se devuelve como null; las validaciones están en intervalos.js y pruebas.js.
// σ solo se toma de los campos de σ conocida: una s nunca se usa como σ.
function leerDatosCaso(clave, sigma, muestras) {
  const listas = muestras === null ? null : muestras.map(function (muestra) { return muestra.valores; });
  const sigmaConocida = sigma === "conocida";

  if (clave === "proporcion") {
    if (listas) {
      const p = calcularProporcion(listas[0]);
      return { n: p.n, exitos: p.exitos, proporcion: null };
    }
    return { n: leerNumero("prop-n"), exitos: leerNumero("prop-x"), proporcion: leerNumero("prop-phat") };
  }

  if (clave === "varianza") {
    if (listas) {
      const d = calcularDescriptivos(listas[0]);
      return { n: d.n, s: null, s2: d.varianza };
    }
    return { n: leerNumero("var-n"), s: leerNumero("var-s"), s2: leerNumero("var-s2") };
  }

  if (clave === "media-z" || clave === "media-t") {
    let n, media, s;
    if (listas) {
      const d = calcularDescriptivos(listas[0]);
      n = d.n; media = d.media; s = d.desviacion;
    } else {
      n = leerNumero("media-n"); media = leerNumero("media-xbarra"); s = leerNumero("media-s");
    }
    // Z: con σ conocida se usa σ; si no, s (el formulario lo permite solo con n ≥ 30).
    const desviacion = sigmaConocida ? leerNumero("media-sigma") : s;
    return { n: n, media: media, s: s, sigmaConocida: sigmaConocida, desviacion: desviacion };
  }

  if (clave === "dos-proporciones") {
    if (listas) {
      const a = calcularProporcion(listas[0]);
      const b = calcularProporcion(listas[1]);
      return { n1: a.n, exitos1: a.exitos, prop1: null, n2: b.n, exitos2: b.exitos, prop2: null };
    }
    return {
      n1: leerNumero("dp1-n"), exitos1: leerNumero("dp1-x"), prop1: leerNumero("dp1-phat"),
      n2: leerNumero("dp2-n"), exitos2: leerNumero("dp2-x"), prop2: leerNumero("dp2-phat"),
    };
  }

  if (clave === "cociente-varianzas") {
    if (listas) {
      const a = calcularDescriptivos(listas[0]);
      const b = calcularDescriptivos(listas[1]);
      return { n1: a.n, s1: null, varianza1: a.varianza, n2: b.n, s2: null, varianza2: b.varianza };
    }
    return {
      n1: leerNumero("cv1-n"), s1: leerNumero("cv1-s"), varianza1: leerNumero("cv1-s2"),
      n2: leerNumero("cv2-n"), s2: leerNumero("cv2-s"), varianza2: leerNumero("cv2-s2"),
    };
  }

  if (clave === "pareadas") {
    // Se calculan las diferencias d = muestra 1 − muestra 2 y se trabaja con ellas como una muestra.
    if (listas) {
      const d = calcularDescriptivos(calcularDiferencias(listas[0], listas[1]).diferencias);
      return { n: d.n, mediaD: d.media, desvD: d.desviacion };
    }
    return { n: leerNumero("par-n"), mediaD: leerNumero("par-dbarra"), desvD: leerNumero("par-sd") };
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
  // Z: con σ conocidas se usan σ₁ y σ₂ (campos del formulario); si no, s₁ y s₂ (solo con n ≥ 30).
  return {
    n1: n1, media1: media1, s1: s1, n2: n2, media2: media2, s2: s2, sigmaConocida: sigmaConocida,
    desv1: sigmaConocida ? leerNumero("dm1-sigma") : s1,
    desv2: sigmaConocida ? leerNumero("dm2-sigma") : s2,
  };
}

// ---------- Intervalos de confianza de una muestra (Parte 6) ----------

// Métodos (claves de js/metodos.js) cuyo intervalo ya se calcula.
const INTERVALOS_UNA_MUESTRA = ["media-z", "media-t", "proporcion", "varianza"];

// Reúne los datos del caso (leerDatosCaso), calcula el intervalo con
// js/intervalos.js y prepara lo que se muestra. Devuelve { error } si un dato
// falta o no es válido.
function calcularIntervaloUnaMuestra(clave, sigma, muestras, confianza) {
  const d = leerDatosCaso(clave, sigma, muestras);

  if (clave === "proporcion") {
    const r = intervaloProporcion(d.n, d.exitos, d.proporcion, confianza);
    if (r.error) return r;
    const errorDeseado = leerNumero("prop-error");
    const tamano = errorDeseado === null ? null : tamanoMuestraProporcion(r.p, errorDeseado, confianza);
    return presentarProporcion(r, d.n, d.exitos, confianza, tamano, errorDeseado);
  }

  if (clave === "varianza") {
    const r = intervaloVarianza(d.n, d.s, d.s2, confianza);
    if (r.error) return r;
    return presentarVarianza(r, d.n, d.s, confianza);
  }

  // Una media
  if (clave === "media-t") {
    const r = intervaloMediaT(d.n, d.media, d.s, confianza);
    if (r.error) return r;
    return presentarMediaT(r, d.n, d.media, d.s, confianza);
  }

  const r = intervaloMediaZ(d.n, d.media, d.desviacion, d.sigmaConocida, confianza);
  if (r.error) return r;
  // El tamaño de muestra del formulario usa σ, así que solo se calcula con σ conocida.
  const errorDeseado = d.sigmaConocida ? leerNumero("media-error") : null;
  const tamano = errorDeseado === null ? null : tamanoMuestraMedia(d.desviacion, errorDeseado, confianza);
  return presentarMediaZ(r, d.n, d.media, d.desviacion, d.sigmaConocida, confianza, tamano, errorDeseado);
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
// Devuelve { error } si un dato falta o no es válido.
function calcularIntervaloDosMuestras(clave, sigma, muestras, confianza) {
  const d = leerDatosCaso(clave, sigma, muestras);

  if (clave === "dos-proporciones") {
    const r = intervaloDosProporciones(d.n1, d.exitos1, d.prop1, d.n2, d.exitos2, d.prop2, confianza);
    if (r.error) return r;
    return presentarDosProporciones(r, d.n1, d.exitos1, d.n2, d.exitos2, confianza);
  }

  if (clave === "cociente-varianzas") {
    const r = intervaloCocienteVarianzas(d.n1, d.s1, d.varianza1, d.n2, d.s2, d.varianza2, confianza);
    if (r.error) return r;
    return presentarCocienteVarianzas(r, d.n1, d.s1, d.n2, d.s2, confianza);
  }

  if (clave === "pareadas") {
    const r = intervaloPareadas(d.n, d.mediaD, d.desvD, confianza);
    if (r.error) return r;
    return presentarPareadas(r, d.n, d.mediaD, d.desvD, confianza);
  }

  // Dos medias (muestras independientes)
  if (clave === "dos-medias-t-iguales") {
    const r = intervaloDosMediasTIguales(d.n1, d.media1, d.s1, d.n2, d.media2, d.s2, confianza);
    if (r.error) return r;
    return presentarDosMediasTIguales(r, d.n1, d.media1, d.s1, d.n2, d.media2, d.s2, confianza);
  }
  if (clave === "dos-medias-t-diferentes") {
    const r = intervaloDosMediasTDiferentes(d.n1, d.media1, d.s1, d.n2, d.media2, d.s2, confianza);
    if (r.error) return r;
    return presentarDosMediasTDiferentes(r, d.n1, d.media1, d.s1, d.n2, d.media2, d.s2, confianza);
  }

  const r = intervaloDosMediasZ(d.n1, d.media1, d.desv1, d.n2, d.media2, d.desv2, d.sigmaConocida, confianza);
  if (r.error) return r;
  return presentarDosMediasZ(r, d.n1, d.media1, d.desv1, d.n2, d.media2, d.desv2, d.sigmaConocida, confianza);
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

// ---------- Pruebas de hipótesis (Parte 9) ----------

// Métodos (claves de js/metodos.js) cuya prueba de hipótesis ya se resuelve.
const PRUEBAS = [
  "media-z", "media-t", "proporcion", "varianza",
  "dos-medias-z", "dos-medias-t-iguales", "dos-medias-t-diferentes",
  "dos-proporciones", "pareadas", "cociente-varianzas",
];

// Símbolo del estadístico, de la variable aleatoria y nombre de cada distribución.
const ESTADISTICOS = {
  z: { simbolo: "z", variable: "Z", nombre: "normal estándar Z" },
  t: { simbolo: "t", variable: "T", nombre: "t de Student" },
  chi2: { simbolo: "χ²", variable: "χ²", nombre: "chi-cuadrada" },
  f: { simbolo: "F", variable: "F", nombre: "F" },
};

const NOTA_NORMAL = "La distribución t supone que la población de la que viene la muestra es aproximadamente normal.";

// Reúne los datos del caso (los mismos que usan los intervalos), resuelve la prueba
// con js/pruebas.js y prepara lo que se muestra. Devuelve { error } si un dato falta
// o no es válido.
function calcularPrueba(clave, sigma, muestras, alfa, alternativa) {
  const d = leerDatosCaso(clave, sigma, muestras);
  const h0 = leerNumero("h0-valor"); // no se usa en dos proporciones ni en cociente de varianzas
  let r;
  if (clave === "media-z") {
    r = pruebaMediaZ(d.n, d.media, d.desviacion, d.sigmaConocida, h0, alternativa, alfa);
  } else if (clave === "media-t") {
    r = pruebaMediaT(d.n, d.media, d.s, h0, alternativa, alfa);
  } else if (clave === "proporcion") {
    r = pruebaProporcion(d.n, d.exitos, d.proporcion, h0, alternativa, alfa);
  } else if (clave === "varianza") {
    r = pruebaVarianza(d.n, d.s, d.s2, h0, alternativa, alfa);
  } else if (clave === "dos-medias-z") {
    r = pruebaDosMediasZ(d.n1, d.media1, d.desv1, d.n2, d.media2, d.desv2, d.sigmaConocida, h0, alternativa, alfa);
  } else if (clave === "dos-medias-t-iguales") {
    r = pruebaDosMediasTIguales(d.n1, d.media1, d.s1, d.n2, d.media2, d.s2, h0, alternativa, alfa);
  } else if (clave === "dos-medias-t-diferentes") {
    r = pruebaDosMediasTDiferentes(d.n1, d.media1, d.s1, d.n2, d.media2, d.s2, h0, alternativa, alfa);
  } else if (clave === "dos-proporciones") {
    r = pruebaDosProporciones(d.n1, d.exitos1, d.prop1, d.n2, d.exitos2, d.prop2, alternativa, alfa);
  } else if (clave === "pareadas") {
    r = pruebaPareadas(d.n, d.mediaD, d.desvD, h0, alternativa, alfa);
  } else {
    r = pruebaCocienteVarianzas(d.n1, d.s1, d.varianza1, d.n2, d.s2, d.varianza2, alternativa, alfa);
  }
  if (r.error) return r;
  return presentarPrueba(clave, r, d);
}

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
    const fl = formatearLimite; // conserva cifras en varianzas pequeñas
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
  return p === 0 ? "≈ 0" : formatearLimite(p);
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

// Muestra el procedimiento completo de la prueba de hipótesis.
function mostrarPrueba(p) {
  const c = contenidoPrueba;
  agregarElemento("h3", "Hipótesis", c);
  agregarElemento("p", "H₀: " + p.hipotesis.h0, c);
  agregarElemento("p", "H₁: " + p.hipotesis.h1 + " (" + p.hipotesis.cola + ")", c);
  agregarElemento("h3", "Datos", c);
  agregarTabla(["Dato", "Valor"], p.datos, c);
  agregarElemento("h3", "Estadístico de prueba", c);
  agregarTabla(["Paso", "Fórmula", "Sustitución"], p.pasos, c);
  agregarElemento("h3", "Valor crítico y región de rechazo", c);
  agregarTabla(["Valor", "Resultado", "Cómo se obtuvo"], p.criticos, c);
  agregarElemento("p", p.region, c);
  agregarElemento("h3", "Valor p", c);
  agregarElemento("p", p.valorP, c);

  agregarElemento("h3", "Decisión y conclusión", c);
  agregarElemento("p", p.explicacion, c);
  agregarElemento("p", p.decision, c).className = "resultado-intervalo";
  agregarElemento("p", p.conclusion, c);
  for (const aviso of p.advertencias) {
    agregarElemento("p", "Atención: " + aviso, c).className = "aviso";
  }
  for (const nota of p.notas) {
    agregarElemento("p", "Nota: " + nota, c).className = "ayuda";
  }
  agregarElemento("p", "Los valores se muestran redondeados a 4 decimales (un valor p menor que 0.1, con 4 cifras " +
    "significativas); la decisión usa todos los decimales.", c).className = "ayuda";
  tarjetaPrueba.hidden = false;
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

// ---------- Reiniciar el ejercicio ----------

// Indica si el usuario escribió algo: algún campo de texto o número tiene un
// valor distinto del que trae el HTML (vacío, o 95 y 0.05 en los niveles).
// Las opciones elegidas (radios y el caso) no cuentan: se vuelven a elegir rápido.
function hayDatosEscritos() {
  for (const campo of formulario.querySelectorAll("input:not([type=radio]), textarea")) {
    if (campo.value !== campo.defaultValue) return true;
  }
  return false;
}

// Vuelve el ejercicio al estado inicial: borra lo escrito y lo elegido, los
// resultados y los mensajes. Si había datos escritos, primero pide confirmación.
function reiniciarEjercicio() {
  if (hayDatosEscritos() && !confirm("¿Borrar los datos escritos y empezar el ejercicio de nuevo?")) {
    return;
  }
  formulario.reset();   // cada campo vuelve al valor del HTML; no envía el formulario
  actualizarCampos();   // reset() no dispara "change", así que se ocultan los campos aquí
  limpiarResultados();
  formulario.elements.tipo[0].focus(); // para seguir con el teclado desde el paso 1
}

// Cualquier cambio en el formulario actualiza los campos visibles y borra
// los resultados anteriores, porque ya no corresponden a lo escrito.
formulario.addEventListener("change", function () {
  actualizarCampos();
  limpiarResultados();
});
formulario.addEventListener("submit", revisarDatos);
document.getElementById("boton-reiniciar").addEventListener("click", reiniciarEjercicio);

// Al cargar la página, ocultar todo lo que aún no corresponde.
actualizarCampos();
