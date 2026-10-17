// Archivo principal de JavaScript.
// Parte 2: muestra u oculta los campos del formulario según las opciones elegidas.
// Parte 3: lee las listas de datos y muestra sus estadísticos descriptivos
//          (las funciones de cálculo están en js/estadistica.js).
// Parte 5: muestra qué método corresponde al ejercicio
//          (las reglas están en js/metodos.js).
// Todavía no se resuelven intervalos ni pruebas de hipótesis.

const formulario = document.getElementById("formulario-ejercicio");
const avisoDatos = document.getElementById("aviso-datos");
const estado = document.getElementById("estado");
const resultados = document.getElementById("resultados");
const contenidoResultados = document.getElementById("contenido-resultados");
const tarjetaMetodo = document.getElementById("metodo");
const contenidoMetodo = document.getElementById("contenido-metodo");

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
  if (seleccion.tipo === "intervalo") {
    const confianza = Number(formulario.elements["nivel-confianza"].value);
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
  let tamanos;
  if (seleccion.formato === "lista") {
    tamanos = mostrarEstadisticos(seleccion.caso);
    if (tamanos === null) return; // hay datos inválidos; el error ya se mostró
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
  if (metodo.estado === "identificado") {
    mostrarMensaje(resumen + " Revisa abajo el método identificado. " +
      "La resolución del ejercicio se agregará en las siguientes partes del proyecto.", false);
  } else {
    mostrarMensaje(resumen + " No se pudo determinar el método con seguridad; revisa la explicación abajo.", true);
  }
}

// Lee los campos n del caso elegido (estadísticas resumidas).
// Un campo vacío o con texto que no es número se devuelve como null.
function leerTamanosResumen(caso) {
  const tamanos = [];
  for (const id of TAMANOS_POR_CASO[caso]) {
    const texto = document.getElementById(id).value.trim();
    tamanos.push(texto === "" ? null : Number(texto));
  }
  return tamanos;
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
// Devuelve los tamaños de las muestras ([n] o [n₁, n₂]).
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
  return muestras.map(function (muestra) { return muestra.valores.length; });
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
