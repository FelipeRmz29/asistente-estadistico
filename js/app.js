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
// Parte 10: los textos y tablas de cada resultado se preparan en js/presentacion.js;
//          aquí solo se ponen en la página, con las mismas secciones en todos los casos.
// Selector con tarjetas (paso 1): el tipo, el caso, σ y las varianzas se eligen con
//          tarjetas que se marcan y desmarcan; qué preguntas aparecen lo decide
//          js/selector.js y el método se muestra en vivo con js/metodos.js.

const formulario = document.getElementById("formulario-ejercicio");
const seccionSelector = document.getElementById("selector");
const vistaMetodo = document.getElementById("vista-metodo");
const avisoNivel = document.getElementById("aviso-nivel");
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
const notaRedondeo = document.getElementById("nota-redondeo");
notaRedondeo.textContent = NOTA_REDONDEO; // se ve cuando hay números en la página

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

// Lo elegido en las tarjetas del paso 1: { tipo, parametro, muestras, relacion, sigma, varianzas }.
let caracteristicas = seleccionVacia();

// Lee las opciones elegidas. Si una opción no se ha elegido, su valor es "".
// tipo, caso, sigma y varianzas vienen de las tarjetas; σ y las varianzas quedan en ""
// si el caso no las usa.
function leerSeleccion() {
  const campos = formulario.elements;
  const elegido = datosParaMetodo(caracteristicas);
  return {
    tipo: elegido.tipo,
    caso: elegido.caso,
    formato: campos.formato.value,
    sigma: elegido.sigma,
    varianzas: elegido.varianzas,
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

  // Los avisos de los pasos 2 y 4 solo se ven mientras falte lo que necesitan.
  avisoNivel.hidden = seleccion.tipo !== "";
  avisoDatos.hidden = seleccion.caso !== "" && seleccion.formato !== "";
}

// ---------- Selector con tarjetas (paso 1) ----------

// Muestra solo las preguntas que tienen sentido, marca las tarjetas elegidas y
// actualiza el método.
function actualizarSelector() {
  const visibles = preguntasVisibles(caracteristicas);
  for (const grupo of seccionSelector.querySelectorAll(".grupo-tarjetas")) {
    grupo.hidden = !visibles.includes(grupo.dataset.pregunta);
  }
  for (const tarjeta of seccionSelector.querySelectorAll(".tarjeta-opcion")) {
    const elegida = caracteristicas[tarjeta.dataset.pregunta] === tarjeta.dataset.valor;
    tarjeta.setAttribute("aria-pressed", String(elegida));
  }
  actualizarVistaMetodo();
}

// Tamaños de muestra que ya se pueden leer de la página, sin mostrar errores:
// en estadísticas resumidas, los campos n; en lista, cuántos valores tiene cada lista.
// tamanos es null si todavía no se elige el formato. listaConError indica que una
// lista tiene un dato que no es número (y por eso no se pudo contar).
function tamanosEnVivo(caso, formato) {
  if (formato === "resumen") return { tamanos: leerTamanosResumen(caso), listaConError: false };
  if (formato !== "lista") return { tamanos: null, listaConError: false };
  let listaConError = false;
  const tamanos = LISTAS_POR_CASO[caso].map(function ([id]) {
    const texto = document.getElementById(id).value;
    if (texto.trim() === "") return null;
    const lectura = leerLista(texto);
    if (lectura.error) {
      listaConError = true;
      return null;
    }
    return lectura.valores.length;
  });
  return { tamanos: tamanos, listaConError: listaConError };
}

// Dónde escribir el tamaño de muestra cuando el método depende de él.
function dondeEscribirTamano(formato, listaConError) {
  if (formato === "resumen") return "Escribe el tamaño de muestra en el paso 4 (Datos del ejercicio).";
  if (formato === "lista") {
    return listaConError
      ? "Una lista del paso 4 tiene un dato que no es número; corrígela para poder contar n."
      : "Escribe la lista de datos en el paso 4; n se cuenta solo.";
  }
  return "Elige cómo vienen los datos (paso 3) y escribe el tamaño de muestra o la lista de datos (paso 4).";
}

// Debajo de las tarjetas: el método que corresponde, pero solo cuando identificarMetodo
// (js/metodos.js) lo identifica con lo elegido. Si falta algo, se pregunta por ello.
function actualizarVistaMetodo() {
  const nueva = document.createElement("div");
  const pendientes = preguntasPendientes(caracteristicas);
  let estadoVista;

  if (pendientes.length > 0) {
    estadoVista = "pendiente";
    agregarElemento("h3", "Método: falta información", nueva);
    agregarElemento("p", "Para saber qué método corresponde, responde:", nueva);
    const lista = agregarElemento("ul", "", nueva);
    for (const pregunta of pendientes) agregarElemento("li", TEXTOS_SELECTOR[pregunta].pregunta, lista);
  } else {
    const elegido = datosParaMetodo(caracteristicas);
    const formato = formulario.elements.formato.value;
    const vivo = tamanosEnVivo(elegido.caso, formato);
    const metodo = identificarMetodo(Object.assign({ tamanos: vivo.tamanos }, elegido));
    const caso = "Caso: " + CASOS[elegido.caso].nombre + ".";

    if (metodo.estado === "identificado") {
      estadoVista = "identificado";
      agregarElemento("h3", "Método: " + metodo.metodo, nueva);
      agregarElemento("p", caso, nueva);
      agregarElemento("p", "Distribución: " + metodo.distribucion + ". Grados de libertad: " +
        (metodo.gradosLibertad === null ? "no aplica" : metodo.gradosLibertad) + ".", nueva);
      agregarElemento("p", "Por qué: " + metodo.explicacion, nueva);
    } else if (metodo.estado === "falta-dato") {
      estadoVista = "pendiente";
      agregarElemento("h3", "Método: falta un dato", nueva);
      agregarElemento("p", caso, nueva);
      agregarElemento("p", metodo.mensaje, nueva);
      agregarElemento("p", dondeEscribirTamano(formato, vivo.listaConError), nueva);
    } else {
      estadoVista = "no-determinado";
      agregarElemento("h3", "No se puede determinar el método con seguridad", nueva);
      agregarElemento("p", caso, nueva);
      agregarElemento("p", metodo.mensaje, nueva);
    }
  }

  vistaMetodo.dataset.estado = estadoVista;
  // Solo se reemplaza si cambió, para que el lector de pantalla no repita lo mismo en cada tecla.
  if (vistaMetodo.textContent !== nueva.textContent) {
    vistaMetodo.replaceChildren(...nueva.childNodes);
  }
}

// Tocar una tarjeta la elige o la quita; las respuestas que dejan de tener sentido se borran.
function tocarTarjeta(evento) {
  const tarjeta = evento.target.closest(".tarjeta-opcion");
  if (!tarjeta) return;
  caracteristicas = tocarOpcion(caracteristicas, tarjeta.dataset.pregunta, tarjeta.dataset.valor);
  alCambiarCaracteristicas();
}

// Quita todas las tarjetas elegidas; lo escrito en los demás pasos no se borra.
function limpiarSeleccion() {
  caracteristicas = seleccionVacia();
  alCambiarCaracteristicas();
}

// Como un cambio en el formulario: los campos visibles cambian y los resultados
// anteriores se borran, porque ya no corresponden a lo elegido.
function alCambiarCaracteristicas() {
  actualizarSelector();
  actualizarCampos();
  limpiarResultados();
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
  notaRedondeo.hidden = true;
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
  // Las preguntas del paso 1 que tienen sentido y siguen sin respuesta (js/selector.js).
  const faltantes = preguntasPendientes(caracteristicas).map(function (pregunta) {
    return TEXTOS_SELECTOR[pregunta].falta + " (paso 1)";
  });

  if (seleccion.formato === "") faltantes.push("el formato de los datos (paso 3)");
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
    CASOS[seleccion.caso].nombre,
    NOMBRES[seleccion.formato],
    nivel,
  ];
  // σ y las varianzas solo tienen valor en los casos que las usan.
  if (seleccion.sigma !== "") partes.push(NOMBRES[seleccion.sigma]);
  if (seleccion.varianzas !== "") partes.push(NOMBRES[seleccion.varianzas]);
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
      const texto = textoSinResultado("intervalo", presentacion.error);
      mostrarSinResultado(tarjetaIntervalo, contenidoIntervalo, texto);
      mostrarMensaje(texto, true);
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
      const texto = textoSinResultado("prueba", presentacion.error);
      mostrarSinResultado(tarjetaPrueba, contenidoPrueba, texto);
      mostrarMensaje(texto, true);
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

  resultados.hidden = false;
  notaRedondeo.hidden = false;
  return muestras;
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

// Muestra el intervalo con las mismas secciones que la prueba de hipótesis (Parte 10):
// Datos usados → Procedimiento → Resultado → Interpretación → Supuestos y notas.
// Los textos se preparan en js/presentacion.js.
function mostrarIntervalo(p) {
  const c = contenidoIntervalo;
  agregarElemento("h3", "Datos usados", c);
  agregarTabla(["Dato", "Valor"], p.datos, c);

  agregarElemento("h3", "Procedimiento", c);
  agregarElemento("h4", "Valor crítico", c);
  agregarTabla(["Valor", "Resultado", "Cómo se obtuvo"], p.criticos, c);
  agregarElemento("h4", "Cálculos", c);
  agregarTabla(["Paso", "Fórmula", "Sustitución"], p.pasos, c);

  agregarElemento("h3", "Resultado", c);
  // resultado es un texto, o una lista de textos cuando hay más de un intervalo (varianza y σ).
  for (const linea of [].concat(p.resultado)) {
    agregarElemento("p", linea, c).className = "resultado-intervalo";
  }
  mostrarAdvertencias(p.advertencias, c);

  agregarElemento("h3", "Interpretación", c);
  agregarElemento("p", p.interpretacion, c);

  // Criterio de decisión del formulario (js/decisiones.js); solo hay en los casos de dos muestras.
  if (p.decision) {
    mostrarDecision(p.decision, p.advertencias.length > 0, c);
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

  mostrarNotas(p.notas.concat([NOTA_CONFIANZA]), c);
  tarjetaIntervalo.hidden = false;
  notaRedondeo.hidden = false;
}

// Advertencias sobre el resultado (en rojo), justo debajo de él.
function mostrarAdvertencias(advertencias, contenedor) {
  for (const aviso of advertencias) {
    agregarElemento("p", "Atención: " + aviso, contenedor).className = "aviso";
  }
}

// Supuestos y notas en una lista. (La regla de redondeo va una sola vez, en #nota-redondeo.)
function mostrarNotas(notas, contenedor) {
  if (notas.length === 0) return;
  agregarElemento("h3", "Supuestos y notas", contenedor);
  const lista = agregarElemento("ul", "", contenedor);
  lista.className = "ayuda";
  for (const nota of notas) agregarElemento("li", nota, lista);
}

// Si el cálculo falla, la tarjeta del resultado lo dice y explica por qué, para que
// no quede solo el método identificado como si hubiera un resultado válido.
function mostrarSinResultado(tarjeta, contenedor, texto) {
  agregarElemento("h3", "Sin resultado", contenedor);
  agregarElemento("p", texto, contenedor).className = "aviso";
  tarjeta.hidden = false;
}

// ---------- Pruebas de hipótesis (Parte 9) ----------

// Métodos (claves de js/metodos.js) cuya prueba de hipótesis ya se resuelve.
const PRUEBAS = [
  "media-z", "media-t", "proporcion", "varianza",
  "dos-medias-z", "dos-medias-t-iguales", "dos-medias-t-diferentes",
  "dos-proporciones", "pareadas", "cociente-varianzas",
];

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

// Muestra la prueba con las mismas secciones que el intervalo, más las hipótesis al inicio:
// Hipótesis → Datos usados → Procedimiento → Resultado → Interpretación → Supuestos y notas.
function mostrarPrueba(p) {
  const c = contenidoPrueba;
  agregarElemento("h3", "Hipótesis", c);
  agregarElemento("p", "H₀: " + p.hipotesis.h0, c);
  agregarElemento("p", "H₁: " + p.hipotesis.h1 + " (" + p.hipotesis.cola + ")", c);

  // Incluye α, la distribución de referencia y sus grados de libertad.
  agregarElemento("h3", "Datos usados", c);
  agregarTabla(["Dato", "Valor"], p.datos, c);

  agregarElemento("h3", "Procedimiento", c);
  agregarElemento("h4", "Estadístico de prueba", c);
  agregarTabla(["Paso", "Fórmula", "Sustitución"], p.pasos, c);
  agregarElemento("h4", "Valor crítico y región de rechazo", c);
  agregarTabla(["Valor", "Resultado", "Cómo se obtuvo"], p.criticos, c);
  agregarElemento("p", p.region, c);
  agregarElemento("h4", "Valor p", c);
  agregarElemento("p", p.valorP, c);

  agregarElemento("h3", "Resultado", c);
  agregarElemento("p", p.decision, c).className = "resultado-intervalo";
  agregarElemento("p", p.explicacion, c);
  mostrarAdvertencias(p.advertencias, c);

  agregarElemento("h3", "Interpretación", c);
  agregarElemento("p", p.conclusion, c);

  mostrarNotas(p.notas, c);
  tarjetaPrueba.hidden = false;
  notaRedondeo.hidden = false;
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
// Las opciones elegidas (radios y tarjetas) no cuentan: se vuelven a elegir rápido.
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
  formulario.reset();   // cada campo vuelve al valor del HTML (y se quitan las tarjetas); no envía el formulario
  actualizarCampos();   // reset() no dispara "change", así que se ocultan los campos aquí
  limpiarResultados();
  seccionSelector.querySelector(".tarjeta-opcion").focus(); // para seguir con el teclado desde el paso 1
}

// Cualquier cambio en el formulario actualiza los campos visibles y borra
// los resultados anteriores, porque ya no corresponden a lo escrito.
// El método del paso 1 depende del formato y del tamaño de muestra, así que también se actualiza.
formulario.addEventListener("change", function () {
  actualizarCampos();
  actualizarVistaMetodo();
  limpiarResultados();
});
// Mientras se escribe (por ejemplo, n) solo se actualiza el método del paso 1.
formulario.addEventListener("input", actualizarVistaMetodo);
// Las tarjetas no son campos del formulario: reset() no las quita por sí solo.
formulario.addEventListener("reset", function () {
  caracteristicas = seleccionVacia();
  actualizarSelector();
});
formulario.addEventListener("submit", revisarDatos);
seccionSelector.addEventListener("click", tocarTarjeta);
document.getElementById("boton-limpiar-seleccion").addEventListener("click", limpiarSeleccion);
document.getElementById("boton-reiniciar").addEventListener("click", reiniciarEjercicio);

// Al cargar la página, ocultar todo lo que aún no corresponde.
actualizarSelector();
actualizarCampos();
