// Archivo principal de JavaScript.
// Parte 2: muestra u oculta los campos del formulario según las opciones elegidas.
// Todavía no se realizan cálculos; eso se agregará en las siguientes partes.

const formulario = document.getElementById("formulario-ejercicio");
const avisoDatos = document.getElementById("aviso-datos");
const estado = document.getElementById("estado");

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

// Revisa que estén todas las opciones necesarias y muestra un resumen.
// No calcula nada todavía.
function revisarSeleccion(evento) {
  evento.preventDefault();

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
    estado.textContent = "Falta elegir: " + faltantes.join(", ") + ".";
    return;
  }

  // Nivel de confianza o de significancia, según el tipo de ejercicio.
  let nivel;
  if (seleccion.tipo === "intervalo") {
    const confianza = Number(formulario.elements["nivel-confianza"].value);
    if (!(confianza > 0 && confianza < 100)) {
      estado.textContent = "El nivel de confianza debe ser un número mayor que 0 y menor que 100.";
      return;
    }
    nivel = "confianza " + confianza + " %";
  } else {
    const alfa = Number(formulario.elements["nivel-significancia"].value);
    if (!(alfa > 0 && alfa < 1)) {
      estado.textContent = "El nivel de significancia α debe ser un número mayor que 0 y menor que 1.";
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

  estado.textContent = "Selección: " + partes.join(" · ") +
    ". Los cálculos se agregarán en las siguientes partes del proyecto.";
}

// Cualquier cambio en el formulario actualiza los campos visibles
// y borra el mensaje anterior, porque ya no corresponde a la selección.
formulario.addEventListener("change", function () {
  actualizarCampos();
  estado.textContent = "";
});
formulario.addEventListener("submit", revisarSeleccion);

// Al cargar la página, ocultar todo lo que aún no corresponde.
actualizarCampos();
