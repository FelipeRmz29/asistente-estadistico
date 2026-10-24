// Pruebas integrales (Parte 11).
// Cargan la página real (../index.html) en un iframe y la usan como una persona: eligen
// opciones, escriben datos, pulsan «Revisar datos» o «Reiniciar» y leen lo que se muestra.
// Así se prueba js/app.js (formulario, resultados en pantalla, reinicio y errores), que las
// pruebas de Node no pueden cargar porque necesita una página.
//
// Los valores esperados vienen de ejemplos resueltos de Walpole, Myers, Myers y Ye,
// «Probabilidad y estadística para ingeniería y ciencias» (capítulos 9 y 10), o de cálculos
// a mano con tablas. El libro redondea y usa valores de tablas, por eso cada comparación
// tiene una tolerancia; los valores exactos ya se prueban en los demás archivos de tests/.
//
// Cómo ejecutarlas:
//   - Con Node: node --test (tests/integracion.test.js abre esta página en Edge o Chrome sin ventana).
//   - En el navegador: python -m http.server 8000 y abre http://localhost:8000/tests/integracion.html

let marco;              // el iframe con la página
let app;                // window de la página
let doc;                // document de la página
let formulario;
const resultados = [];  // { nombre, ok, detalle }
const erroresConsola = [];

// ---------- Ejecutar las pruebas ----------

function prueba(nombre, fn) {
  try {
    limpiar();
    fn();
    resultados.push({ nombre: nombre, ok: true });
  } catch (error) {
    resultados.push({ nombre: nombre, ok: false, detalle: error.message });
  }
}

// Vuelve el formulario a su estado inicial sin usar el botón «Reiniciar» (que se prueba aparte).
function limpiar() {
  marco.style.width = "1000px";
  formulario.reset();
  formulario.dispatchEvent(new app.Event("change", { bubbles: true }));
}

// ---------- Acciones de la persona ----------

// Tarjetas del paso 1 que hay que tocar para cada caso (en este orden).
const TARJETAS_POR_CASO = {
  "una-media": { parametro: "media", muestras: "una" },
  "dos-medias": { parametro: "media", muestras: "dos", relacion: "independientes" },
  "pareadas": { parametro: "media", muestras: "dos", relacion: "pareadas" },
  "una-proporcion": { parametro: "proporcion", muestras: "una" },
  "dos-proporciones": { parametro: "proporcion", muestras: "dos" },
  "una-varianza": { parametro: "varianza", muestras: "una" },
  "cociente-varianzas": { parametro: "varianza", muestras: "dos" },
};

function tarjeta(pregunta, valor) {
  const boton = doc.querySelector('.tarjeta-opcion[data-pregunta="' + pregunta + '"][data-valor="' + valor + '"]');
  if (!boton) throw new Error("No existe la tarjeta " + pregunta + " = " + valor);
  return boton;
}

// Toca una tarjeta (la elige o, si ya estaba elegida, la quita); falla si no se ve.
function tocar(pregunta, valor) {
  const boton = tarjeta(pregunta, valor);
  if (oculto(boton)) throw new Error("La tarjeta " + pregunta + " = " + valor + " no está visible");
  boton.click();
}

function elegida(pregunta, valor) {
  return tarjeta(pregunta, valor).getAttribute("aria-pressed") === "true";
}

// Elige una opción como lo haría una persona: el caso, el tipo, σ y las varianzas con
// las tarjetas del paso 1; lo demás con los radios del formulario.
function elegir(nombre, valor) {
  if (nombre === "caso") {
    const tarjetas = TARJETAS_POR_CASO[valor];
    for (const pregunta in tarjetas) tocar(pregunta, tarjetas[pregunta]);
    return;
  }
  if (doc.querySelector('.tarjeta-opcion[data-pregunta="' + nombre + '"]')) {
    tocar(nombre, valor);
    return;
  }
  const campo = formulario.elements[nombre];
  if (campo.tagName === "SELECT") {
    campo.value = valor;
    campo.dispatchEvent(new app.Event("change", { bubbles: true }));
    return;
  }
  const opcion = Array.from(campo).find(function (r) { return r.value === valor; });
  if (!opcion) throw new Error("No existe la opción " + nombre + " = " + valor);
  if (oculto(opcion)) throw new Error("La opción " + nombre + " = " + valor + " no está visible");
  opcion.click(); // como un clic real: marca la opción y dispara «change»
}

// Varias opciones en orden, por ejemplo { tipo: "intervalo", caso: "una-media", ... }.
function elegirTodo(opciones) {
  for (const nombre in opciones) elegir(nombre, opciones[nombre]);
}

// Escribe en un campo; falla si el campo no se ve para el caso elegido.
function escribir(campos) {
  for (const id in campos) {
    const campo = doc.getElementById(id);
    if (!campo) throw new Error("No existe el campo #" + id);
    if (oculto(campo)) throw new Error("El campo #" + id + " no está visible");
    campo.value = campos[id];
  }
}

function revisar() {
  doc.querySelector("button[type=submit]").click();
}

// ---------- Lo que se ve en la página ----------

function oculto(elemento) {
  return elemento.closest("[hidden]") !== null;
}

function texto(id) {
  return doc.getElementById(id).textContent;
}

function estado() {
  return texto("estado");
}

function tarjetasVisibles() {
  return ["resultados", "metodo", "intervalo", "prueba"].filter(function (id) {
    return !doc.getElementById(id).hidden;
  });
}

// Líneas destacadas (resultado o decisión) dentro de una tarjeta.
function destacados(idTarjeta) {
  return Array.from(doc.querySelectorAll("#" + idTarjeta + " .resultado-intervalo")).map(function (p) {
    return p.textContent;
  });
}

// Celdas de la fila de una tabla cuya primera columna empieza con «inicio».
function fila(idTarjeta, inicio) {
  for (const tr of doc.querySelectorAll("#" + idTarjeta + " tr")) {
    if (tr.cells[0] && tr.cells[0].textContent.startsWith(inicio)) {
      return Array.from(tr.cells).map(function (c) { return c.textContent; });
    }
  }
  throw new Error("No se encontró la fila «" + inicio + "» en #" + idTarjeta);
}

// Párrafo de una tarjeta que empieza con «inicio».
function parrafo(idTarjeta, inicio) {
  for (const p of doc.querySelectorAll("#" + idTarjeta + " p")) {
    if (p.textContent.startsWith(inicio)) return p.textContent;
  }
  throw new Error("No se encontró el párrafo «" + inicio + "» en #" + idTarjeta);
}

// Números que aparecen en un texto, en orden. Los subíndices (σ₁², μ₂) no son dígitos y no cuentan.
function numeros(cadena) {
  return (cadena.match(/-?\d+(\.\d+)?/g) || []).map(Number);
}

// El número que queda después del último «=» (por ejemplo, el valor del estadístico).
function ultimoValor(cadena) {
  const partes = cadena.split("= ");
  return Number(partes[partes.length - 1].replace("≈ ", ""));
}

// Límites de un intervalo mostrado como «a ≤ parámetro ≤ b».
function limites(linea) {
  const n = numeros(linea.split(":").pop());
  return [n[0], n[n.length - 1]];
}

// ---------- Comprobaciones ----------

function igual(real, esperado, que) {
  if (real !== esperado) throw new Error(que + ": se obtuvo «" + real + "», se esperaba «" + esperado + "»");
}

function cerca(real, esperado, tolerancia, que) {
  if (!(Math.abs(real - esperado) <= tolerancia)) {
    throw new Error(que + ": se obtuvo " + real + ", se esperaba " + esperado + " ± " + tolerancia);
  }
}

function contiene(cadena, parte, que) {
  if (!cadena.includes(parte)) throw new Error(que + ": «" + cadena.slice(0, 160) + "» no contiene «" + parte + "»");
}

function verdadero(condicion, que) {
  if (!condicion) throw new Error(que);
}

function intervaloCerca(linea, inferior, superior, tolerancia) {
  const [a, b] = limites(linea);
  cerca(a, inferior, tolerancia, "límite inferior");
  cerca(b, superior, tolerancia, "límite superior");
}

// ---------- Pruebas ----------

function todasLasPruebas() {
  prueba("al cargar: campos ocultos, sin resultados ni mensajes", function () {
    const visibles = Array.from(formulario.querySelectorAll(".condicional")).filter(function (b) { return !b.hidden; });
    igual(visibles.length, 0, "bloques condicionales visibles");
    verdadero(!doc.getElementById("aviso-datos").hidden, "el aviso del paso 4 debería verse");
    igual(tarjetasVisibles().length, 0, "tarjetas de resultado visibles");
    igual(estado(), "", "mensaje");
  });

  // ----- Intervalos de una muestra -----

  prueba("intervalo, una media, resumen, σ conocida → Z y tamaño de muestra (Walpole 9.2 y 9.4)", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-media", formato: "resumen", sigma: "conocida" });
    escribir({ "nivel-confianza": "95", "media-n": "36", "media-xbarra": "2.6", "media-sigma": "0.3", "media-error": "0.05" });
    revisar();
    igual(tarjetasVisibles().join(","), "metodo,intervalo", "tarjetas");
    contiene(texto("metodo"), "normal estándar Z", "método");
    intervaloCerca(destacados("intervalo")[0], 2.50, 2.70, 0.005);  // libro: 2.50 < μ < 2.70
    contiene(texto("intervalo"), "al menos 139 observaciones", "tamaño de muestra");
    verdadero(!doc.getElementById("nota-redondeo").hidden, "la nota de redondeo debería verse");
  });

  prueba("intervalo, una media, lista, n < 30 y σ desconocida → t (Walpole 9.5)", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-media", formato: "lista", sigma: "desconocida" });
    escribir({ "nivel-confianza": "95", "media-datos": "9.8, 10.2, 10.4, 9.8, 10.0, 10.2, 9.6" });
    revisar();
    igual(tarjetasVisibles().join(","), "resultados,metodo,intervalo", "tarjetas");
    igual(fila("resultados", "Tamaño de muestra")[2], "7", "n de la lista");
    igual(fila("resultados", "Media muestral")[2], "10", "x̄ de la lista");
    igual(fila("intervalo", "Grados de libertad")[2], "ν = 7 − 1 = 6", "grados de libertad");
    intervaloCerca(destacados("intervalo")[0], 9.74, 10.26, 0.005); // libro: 9.74 < μ < 10.26
  });

  prueba("intervalo, una proporción, resumen (Walpole 9.13)", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-proporcion", formato: "resumen" });
    escribir({ "nivel-confianza": "95", "prop-n": "500", "prop-x": "340" });
    revisar();
    intervaloCerca(destacados("intervalo")[0], 0.6391, 0.7209, 0.0002);
  });

  prueba("intervalo, una varianza, lista: σ² y σ etiquetados (Walpole 9.17)", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-varianza", formato: "lista" });
    escribir({ "nivel-confianza": "95", "var-datos": "46.4 46.1 45.8 47.0 46.1 45.9 45.8 46.9 45.2 46.0" });
    revisar();
    const lineas = destacados("intervalo");
    contiene(lineas[0], "Intervalo para la varianza (σ²)", "etiqueta de σ²");
    contiene(lineas[1], "Intervalo para la desviación estándar (σ)", "etiqueta de σ");
    intervaloCerca(lineas[0], 0.135, 0.953, 0.002);                  // libro: 0.135 < σ² < 0.953
    const [a, b] = limites(lineas[1]);
    cerca(a, Math.sqrt(0.1354), 0.001, "límite inferior de σ");
    cerca(b, Math.sqrt(0.9539), 0.001, "límite superior de σ");
  });

  // ----- Intervalos de dos muestras -----

  prueba("intervalo, dos medias, σ conocidas → Z (Walpole 9.9, 96 %)", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-medias", formato: "resumen", sigma: "conocida" });
    escribir({ "nivel-confianza": "96", "dm1-n": "50", "dm1-xbarra": "36", "dm1-sigma": "6",
      "dm2-n": "75", "dm2-xbarra": "42", "dm2-sigma": "8" });
    revisar();
    // El libro da 3.43 < μ₂ − μ₁ < 8.57; aquí se pide μ₁ − μ₂, así que cambia el signo.
    intervaloCerca(destacados("intervalo")[0], -8.57, -3.43, 0.01);
    contiene(destacados("intervalo")[1], "μ₁ < μ₂", "criterio de decisión");
  });

  prueba("intervalo, dos medias, varianzas iguales → t combinada (Walpole 9.10, 90 %)", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "iguales" });
    escribir({ "nivel-confianza": "90", "dm1-n": "12", "dm1-xbarra": "85", "dm1-s": "4",
      "dm2-n": "10", "dm2-xbarra": "81", "dm2-s": "5" });
    revisar();
    igual(fila("intervalo", "Grados de libertad")[2], "ν = 12 + 10 − 2 = 20", "grados de libertad");
    intervaloCerca(destacados("intervalo")[0], 0.69, 7.31, 0.01);
    contiene(destacados("intervalo")[1], "μ₁ > μ₂", "criterio de decisión");
  });

  prueba("intervalo, dos medias, varianzas diferentes → t con gl de Welch (Walpole 9.11)", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "diferentes" });
    escribir({ "nivel-confianza": "95", "dm1-n": "15", "dm1-xbarra": "3.84", "dm1-s": "3.07",
      "dm2-n": "12", "dm2-xbarra": "1.49", "dm2-s": "0.80" });
    revisar();
    contiene(fila("intervalo", "Grados de libertad (Welch)")[2], "= 16.3278", "gl de Welch sin redondear");
    igual(ultimoValor(fila("intervalo", "Grados de libertad (Welch)")[2]), 16, "gl de Welch redondeados hacia abajo"); // libro: ≈ 16
    intervaloCerca(destacados("intervalo")[0], 0.60, 4.10, 0.01);
  });

  prueba("intervalo, dos proporciones (Walpole 9.15, 90 %)", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-proporciones", formato: "resumen" });
    escribir({ "nivel-confianza": "90", "dp1-n": "1500", "dp1-x": "75", "dp2-n": "2000", "dp2-x": "80" });
    revisar();
    intervaloCerca(destacados("intervalo")[0], -0.0017, 0.0217, 0.0002);
  });

  prueba("intervalo, muestras pareadas desde dos listas (a mano con t_0.025,7 = 2.365)", function () {
    elegirTodo({ tipo: "intervalo", caso: "pareadas", formato: "lista" });
    escribir({ "nivel-confianza": "95", "par1-datos": "12 14 11 13 15 9 12 14", "par2-datos": "10 10 10 10 10 10 10 10" });
    revisar();
    // d = 2, 4, 1, 3, 5, −1, 2, 4 → d̄ = 2.5, s_d = 1.9272; e = 2.365 · 1.9272 / √8 = 1.6115
    contiene(texto("resultados"), "Diferencias (d = muestra 1 − muestra 2)", "tabla de diferencias");
    igual(fila("intervalo", "Media de las diferencias")[1], "2.5", "d̄");
    intervaloCerca(destacados("intervalo")[0], 0.8885, 4.1115, 0.001);
  });

  prueba("intervalo, cociente de varianzas → F (Walpole 9.18, 98 %)", function () {
    elegirTodo({ tipo: "intervalo", caso: "cociente-varianzas", formato: "resumen" });
    escribir({ "nivel-confianza": "98", "cv1-n": "15", "cv1-s": "3.07", "cv2-n": "12", "cv2-s": "0.80" });
    revisar();
    // El libro usa valores F de tabla (redondeados): 3.425 < σ₁²/σ₂² < 56.991. Tolerancia de 0.5 %.
    const [a, b] = limites(destacados("intervalo")[0]);
    cerca(a, 3.425, 3.425 * 0.005, "límite inferior");
    cerca(b, 56.991, 56.991 * 0.005, "límite superior");
  });

  // ----- Pruebas de hipótesis -----

  prueba("prueba, una media, Z, cola derecha: se rechaza H₀ (Walpole 10.3)", function () {
    elegirTodo({ tipo: "prueba", caso: "una-media", formato: "resumen", sigma: "conocida", alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.05", "media-n": "100", "media-xbarra": "71.8", "media-sigma": "8.9", "h0-valor": "70" });
    revisar();
    contiene(texto("prueba"), "H₀: μ = 70", "H₀");
    contiene(texto("prueba"), "H₁: μ > 70 (cola derecha)", "H₁");
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 2.02, 0.005, "z");
    cerca(ultimoValor(parrafo("prueba", "valor p")), 0.0217, 0.0005, "valor p");
    igual(destacados("prueba")[0], "Decisión: se rechaza H₀", "decisión");
  });

  prueba("prueba, una media: las tres colas cambian H₁, los valores críticos y la decisión", function () {
    const datos = { "nivel-significancia": "0.05", "media-n": "100", "media-xbarra": "71.8", "media-sigma": "8.9", "h0-valor": "70" };
    const casos = [
      ["dos-colas", "μ ≠ 70", 2, "Decisión: se rechaza H₀"],     // |2.02| > 1.96
      ["izquierda", "μ < 70", 1, "Decisión: no se rechaza H₀"],  // 2.02 no es < −1.645
      ["derecha", "μ > 70", 1, "Decisión: se rechaza H₀"],
    ];
    for (const [cola, h1, criticos, decision] of casos) {
      limpiar();
      elegirTodo({ tipo: "prueba", caso: "una-media", formato: "resumen", sigma: "conocida", alternativa: cola });
      escribir(datos);
      revisar();
      contiene(texto("prueba"), "H₁: " + h1, "H₁ con " + cola);
      igual(filasDeTabla("prueba", "Valor").length, criticos, "valores críticos con " + cola);
      igual(destacados("prueba")[0], decision, "decisión con " + cola);
    }
  });

  prueba("prueba, una media, t, cola izquierda: no se rechaza H₀ (Walpole 10.5)", function () {
    elegirTodo({ tipo: "prueba", caso: "una-media", formato: "resumen", sigma: "desconocida", alternativa: "izquierda" });
    escribir({ "nivel-significancia": "0.05", "media-n": "12", "media-xbarra": "42", "media-s": "11.9", "h0-valor": "46" });
    revisar();
    igual(fila("prueba", "Distribución de referencia")[1], "t de Student, ν = 11", "distribución y gl");
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), -1.16, 0.005, "t");
    const p = ultimoValor(parrafo("prueba", "valor p"));
    verdadero(p > 0.10 && p < 0.15, "el libro da 0.10 < valor p < 0.15; se obtuvo " + p);
    igual(destacados("prueba")[0], "Decisión: no se rechaza H₀", "decisión");
  });

  prueba("prueba, una proporción, cola derecha (a mano: z = 0.1 / √(0.24/100) = 2.041)", function () {
    elegirTodo({ tipo: "prueba", caso: "una-proporcion", formato: "resumen", alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.05", "prop-n": "100", "prop-x": "70", "h0-valor": "0.6" });
    revisar();
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 2.041, 0.001, "z");
    igual(destacados("prueba")[0], "Decisión: se rechaza H₀", "decisión");
  });

  prueba("prueba, una varianza, χ², cola derecha: no se rechaza H₀ (Walpole 10.13)", function () {
    elegirTodo({ tipo: "prueba", caso: "una-varianza", formato: "resumen", alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.05", "var-n": "10", "var-s": "1.2", "h0-valor": "0.81" });
    revisar();
    igual(fila("prueba", "Distribución de referencia")[1], "chi-cuadrada, ν = 9", "distribución y gl");
    igual(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 16, "χ²");
    const p = ultimoValor(parrafo("prueba", "valor p"));
    verdadero(p > 0.05 && p < 0.10, "el libro da 0.05 < valor p < 0.10; se obtuvo " + p);
    igual(destacados("prueba")[0], "Decisión: no se rechaza H₀", "decisión");
  });

  prueba("prueba, dos medias, t combinada con d₀ = 2 (Walpole 10.6)", function () {
    elegirTodo({ tipo: "prueba", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "iguales",
      alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.05", "dm1-n": "12", "dm1-xbarra": "85", "dm1-s": "4",
      "dm2-n": "10", "dm2-xbarra": "81", "dm2-s": "5", "h0-valor": "2" });
    revisar();
    contiene(texto("prueba"), "H₁: μ₁ − μ₂ > 2", "H₁");
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 1.04, 0.005, "t");
    igual(destacados("prueba")[0], "Decisión: no se rechaza H₀", "decisión");
  });

  prueba("prueba, dos medias, σ conocidas → Z (a mano: z = 5 / √(25/40 + 64/60) = 3.844)", function () {
    elegirTodo({ tipo: "prueba", caso: "dos-medias", formato: "resumen", sigma: "conocida", alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.01", "dm1-n": "40", "dm1-xbarra": "100", "dm1-sigma": "5",
      "dm2-n": "60", "dm2-xbarra": "95", "dm2-sigma": "8", "h0-valor": "0" });
    revisar();
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 3.844, 0.001, "z");
    igual(destacados("prueba")[0], "Decisión: se rechaza H₀", "decisión");
  });

  prueba("prueba, dos medias, varianzas diferentes (Welch), dos colas", function () {
    elegirTodo({ tipo: "prueba", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "diferentes",
      alternativa: "dos-colas" });
    escribir({ "nivel-significancia": "0.05", "dm1-n": "15", "dm1-xbarra": "23.1", "dm1-s": "2.9",
      "dm2-n": "11", "dm2-xbarra": "20.4", "dm2-s": "5.8", "h0-valor": "0" });
    revisar();
    // A mano: t = 2.7 / √(2.9²/15 + 5.8²/11) = 1.419; ν (Welch) = 13.67 → ⌊13.67⌋ = 13
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 1.419, 0.001, "t");
    igual(fila("prueba", "Distribución de referencia")[1], "t de Student, ν = 13", "gl de Welch redondeados hacia abajo");
    igual(ultimoValor(fila("prueba", "Grados de libertad (Welch)")[2]), 13, "gl de Welch en el procedimiento");
    igual(destacados("prueba")[0], "Decisión: no se rechaza H₀", "decisión");
  });

  prueba("prueba, dos proporciones, cola derecha: se rechaza H₀ (Walpole 10.12)", function () {
    elegirTodo({ tipo: "prueba", caso: "dos-proporciones", formato: "resumen", alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.05", "dp1-n": "200", "dp1-x": "120", "dp2-n": "500", "dp2-x": "240" });
    revisar();
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 2.9, 0.05, "z");  // libro: z = 2.9
    igual(destacados("prueba")[0], "Decisión: se rechaza H₀", "decisión");
  });

  prueba("prueba, muestras pareadas desde listas, cola derecha (a mano: t = 3.669 > t_0.01,7 = 2.998)", function () {
    elegirTodo({ tipo: "prueba", caso: "pareadas", formato: "lista", alternativa: "derecha" });
    escribir({ "nivel-significancia": "0.01", "par1-datos": "12 14 11 13 15 9 12 14",
      "par2-datos": "10 10 10 10 10 10 10 10", "h0-valor": "0" });
    revisar();
    cerca(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 3.669, 0.001, "t");
    igual(filasDeTabla("prueba", "Valor")[0][0], "t_0.01,7", "valor crítico de cola derecha");
    igual(destacados("prueba")[0], "Decisión: se rechaza H₀", "decisión");
  });

  prueba("prueba, cociente de varianzas, F, dos colas con α = 0.10 (Walpole 10.14)", function () {
    elegirTodo({ tipo: "prueba", caso: "cociente-varianzas", formato: "resumen", alternativa: "dos-colas" });
    escribir({ "nivel-significancia": "0.10", "cv1-n": "12", "cv1-s": "4", "cv2-n": "10", "cv2-s": "5" });
    revisar();
    igual(ultimoValor(fila("prueba", "Estadístico de prueba")[2]), 0.64, "F");
    const criticos = filasDeTabla("prueba", "Valor").map(function (c) { return Number(c[1]); });
    cerca(criticos[0], 0.34, 0.01, "valor crítico izquierdo");  // libro: 1 / f_0.05(9,11) = 0.34
    cerca(criticos[1], 3.11, 0.01, "valor crítico derecho");    // libro: f_0.05(11,9) = 3.11
    igual(destacados("prueba")[0], "Decisión: no se rechaza H₀", "decisión");
  });

  // ----- Selector con tarjetas (paso 1) -----

  prueba("tarjetas: al cargar solo se pregunta el tipo y el parámetro, y nada está elegido", function () {
    const visibles = Array.from(doc.querySelectorAll(".grupo-tarjetas")).filter(function (g) { return !g.hidden; });
    igual(visibles.map(function (g) { return g.dataset.pregunta; }).join(","), "tipo,parametro", "preguntas visibles");
    igual(doc.querySelectorAll('.tarjeta-opcion[aria-pressed="true"]').length, 0, "tarjetas elegidas");
    contiene(texto("vista-metodo"), "Método: falta información", "vista del método");
    contiene(texto("vista-metodo"), "¿Es un intervalo de confianza o una prueba de hipótesis?", "pregunta del tipo");
  });

  prueba("tarjetas: un clic elige, otro clic quita, y elegir otra reemplaza a la anterior", function () {
    tocar("tipo", "intervalo");
    verdadero(elegida("tipo", "intervalo"), "intervalo debería quedar elegido");
    verdadero(!doc.querySelector('[data-tipo="intervalo"]').hidden, "debería verse el nivel de confianza");
    tocar("tipo", "prueba");
    verdadero(elegida("tipo", "prueba") && !elegida("tipo", "intervalo"), "solo prueba debería quedar elegida");
    tocar("tipo", "prueba");
    verdadero(!elegida("tipo", "prueba"), "un segundo clic debería quitarla");
    verdadero(!doc.getElementById("aviso-nivel").hidden, "debería volver el aviso del paso 2");
  });

  prueba("tarjetas: solo aparecen las preguntas que tienen sentido", function () {
    tocar("parametro", "proporcion");
    tocar("muestras", "dos");
    verdadero(oculto(tarjeta("relacion", "pareadas")), "dos proporciones no deberían ofrecer muestras pareadas");
    verdadero(oculto(tarjeta("sigma", "conocida")), "una proporción no usa σ");
    tocar("parametro", "media");
    verdadero(!oculto(tarjeta("relacion", "pareadas")), "dos medias preguntan si son independientes o pareadas");
    verdadero(oculto(tarjeta("sigma", "conocida")), "σ se pregunta después de la relación");
    tocar("relacion", "pareadas");
    verdadero(oculto(tarjeta("sigma", "conocida")), "las muestras pareadas no usan σ");
    tocar("relacion", "independientes");
    tocar("sigma", "conocida");
    verdadero(oculto(tarjeta("varianzas", "iguales")), "con σ conocidas no se pregunta por las varianzas");
    tocar("sigma", "desconocida");
    verdadero(!oculto(tarjeta("varianzas", "iguales")), "con σ desconocidas sí");
  });

  prueba("tarjetas: al cambiar una respuesta se quitan las que ya no corresponden", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-medias", sigma: "desconocida", varianzas: "iguales" });
    tocar("muestras", "una");
    verdadero(!elegida("relacion", "independientes"), "la relación debería quitarse");
    verdadero(!elegida("varianzas", "iguales") && oculto(tarjeta("varianzas", "iguales")), "las varianzas deberían quitarse");
    verdadero(elegida("sigma", "desconocida"), "σ sigue teniendo sentido con una muestra");
    tocar("parametro", "media"); // quitar el parámetro quita todo lo que depende de él
    igual(doc.querySelectorAll('.tarjeta-opcion[aria-pressed="true"]').length, 1, "solo debería quedar el tipo");
  });

  prueba("tarjetas: el método aparece solo cuando hay datos suficientes y no se adivina sin n", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-media" });
    contiene(texto("vista-metodo"), "¿El enunciado da la desviación estándar poblacional σ", "pregunta por σ");
    tocar("sigma", "desconocida");
    contiene(texto("vista-metodo"), "Método: falta un dato", "falta n");
    contiene(texto("vista-metodo"), "Falta el tamaño de la muestra (n)", "pide n");
    contiene(texto("vista-metodo"), "Elige cómo vienen los datos (paso 3)", "dice dónde escribirlo");
    verdadero(!texto("vista-metodo").includes("t de Student") && !texto("vista-metodo").includes("normal estándar Z"),
      "no debería mostrar un método sin n");
    elegir("formato", "resumen");
    escribir({ "media-n": "12" });
    doc.getElementById("media-n").dispatchEvent(new app.Event("input", { bubbles: true }));
    contiene(texto("vista-metodo"), "Método: Intervalo de confianza para una media (μ) con n < 30", "con n = 12");
    contiene(texto("vista-metodo"), "t de Student", "distribución t");
    escribir({ "media-n": "40" });
    doc.getElementById("media-n").dispatchEvent(new app.Event("input", { bubbles: true }));
    contiene(texto("vista-metodo"), "normal estándar Z", "con n = 40 se usa Z");
  });

  prueba("tarjetas: con datos en lista, n se cuenta de la lista", function () {
    elegirTodo({ tipo: "prueba", caso: "una-media", formato: "lista", sigma: "desconocida" });
    contiene(texto("vista-metodo"), "Escribe la lista de datos en el paso 4", "pide la lista");
    escribir({ "media-datos": "1 2 x" });
    doc.getElementById("media-datos").dispatchEvent(new app.Event("input", { bubbles: true }));
    contiene(texto("vista-metodo"), "tiene un dato que no es número", "lista con error");
    escribir({ "media-datos": "1 2 3 4" });
    doc.getElementById("media-datos").dispatchEvent(new app.Event("input", { bubbles: true }));
    contiene(texto("vista-metodo"), "Prueba de hipótesis para una media (μ) con n < 30", "método con n = 4");
    contiene(texto("vista-metodo"), "n − 1 = 3", "grados de libertad");
  });

  prueba("tarjetas: casos sin método seguro se explican en vez de elegir uno", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "diferentes" });
    escribir({ "dm1-n": "40", "dm2-n": "35" });
    doc.getElementById("dm2-n").dispatchEvent(new app.Event("input", { bubbles: true }));
    contiene(texto("vista-metodo"), "No se puede determinar el método con seguridad", "vista del método");
    igual(doc.getElementById("vista-metodo").dataset.estado, "no-determinado", "estado de la vista");
  });

  prueba("tarjetas: cada caso completo muestra su método (igual que «Revisar datos»)", function () {
    const casos = [
      [{ caso: "una-media", sigma: "conocida" }, "una media (μ) con σ conocida"],
      [{ caso: "una-proporcion" }, "una proporción (p)"],
      [{ caso: "una-varianza" }, "una varianza (σ²)"],
      [{ caso: "dos-medias", sigma: "conocida" }, "la diferencia de dos medias (μ₁ − μ₂) con σ₁ y σ₂ conocidas"],
      [{ caso: "pareadas" }, "la media de las diferencias pareadas (μ_d)"],
      [{ caso: "dos-proporciones" }, "la diferencia de dos proporciones (p₁ − p₂)"],
      [{ caso: "cociente-varianzas" }, "el cociente de varianzas (σ₁² / σ₂²)"],
    ];
    for (const [opciones, metodo] of casos) {
      limpiar();
      elegirTodo(Object.assign({ tipo: "intervalo" }, opciones));
      contiene(texto("vista-metodo"), "Método: Intervalo de confianza para " + metodo, opciones.caso);
    }
  });

  prueba("tarjetas: «Limpiar selección» quita las tarjetas pero no lo escrito", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-proporcion", formato: "resumen" });
    escribir({ "prop-n": "100" });
    doc.getElementById("boton-limpiar-seleccion").click();
    igual(doc.querySelectorAll('.tarjeta-opcion[aria-pressed="true"]').length, 0, "tarjetas elegidas");
    verdadero(oculto(tarjeta("muestras", "una")), "las preguntas dependientes se ocultan");
    contiene(texto("vista-metodo"), "Método: falta información", "vista del método");
    igual(doc.getElementById("prop-n").value, "100", "lo escrito se conserva");
    revisar();
    contiene(estado(), "Falta elegir: el tipo de ejercicio (paso 1), el parámetro (paso 1)", "mensaje");
  });

  // ----- Botón «Reiniciar» -----

  prueba("reiniciar después de un resultado: pide confirmación y vuelve al estado inicial", function () {
    const inicial = foto();
    elegirTodo({ tipo: "prueba", caso: "una-media", formato: "resumen", sigma: "conocida", alternativa: "derecha" });
    escribir({ "media-n": "100", "media-xbarra": "71.8", "media-sigma": "8.9", "h0-valor": "70" });
    revisar();
    igual(tarjetasVisibles().join(","), "metodo,prueba", "hay resultado antes de reiniciar");

    let preguntas = 0;
    app.confirm = function () { preguntas++; return false; };   // «Cancelar»
    const antes = foto();
    doc.getElementById("boton-reiniciar").click();
    igual(preguntas, 1, "preguntas al cancelar");
    igual(foto(), antes, "al cancelar no debería cambiar nada");

    app.confirm = function () { preguntas++; return true; };    // «Aceptar»
    doc.getElementById("boton-reiniciar").click();
    igual(preguntas, 2, "preguntas al aceptar");
    igual(foto(), inicial, "estado después de reiniciar");
    igual(doc.activeElement.dataset.pregunta, "tipo", "el foco vuelve a la primera tarjeta del paso 1");
  });

  prueba("reiniciar sin datos escritos no pregunta y no envía el formulario", function () {
    const inicial = foto();
    let preguntas = 0;
    app.confirm = function () { preguntas++; return true; };
    elegirTodo({ tipo: "intervalo", caso: "una-proporcion" });
    doc.getElementById("boton-reiniciar").click();
    igual(preguntas, 0, "preguntas");
    igual(foto(), inicial, "estado después de reiniciar");
    igual(estado(), "", "si se hubiera enviado el formulario habría un mensaje");
  });

  // ----- Errores -----

  prueba("error: sin elegir nada, se indica qué falta y no hay resultados", function () {
    revisar();
    contiene(estado(), "Falta elegir: el tipo de ejercicio (paso 1)", "mensaje");
    igual(doc.getElementById("estado").className, "error", "el mensaje es de error");
    igual(tarjetasVisibles().length, 0, "tarjetas");
  });

  prueba("error: dato no numérico en una lista, se marca el campo y no se calcula", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-media", formato: "lista", sigma: "desconocida" });
    escribir({ "media-datos": "1, dos, 3" });
    revisar();
    contiene(estado(), "«dos»", "mensaje con el dato inválido");
    igual(doc.getElementById("media-datos").getAttribute("aria-invalid"), "true", "aria-invalid");
    igual(doc.activeElement.id, "media-datos", "el foco va al campo con error");
    igual(tarjetasVisibles().length, 0, "tarjetas");
  });

  prueba("error: listas pareadas de distinto tamaño", function () {
    elegirTodo({ tipo: "intervalo", caso: "pareadas", formato: "lista" });
    escribir({ "par1-datos": "1 2 3", "par2-datos": "1 2" });
    revisar();
    igual(doc.getElementById("estado").className, "error", "el mensaje es de error");
    igual(tarjetasVisibles().length, 0, "tarjetas");
  });

  prueba("error: falta el valor de H₀ → «Sin resultado» en la tarjeta de la prueba", function () {
    elegirTodo({ tipo: "prueba", caso: "una-varianza", formato: "resumen", alternativa: "derecha" });
    escribir({ "var-n": "10", "var-s": "1.2" });
    revisar();
    contiene(texto("prueba"), "Sin resultado", "tarjeta");
    contiene(texto("prueba"), "Falta σ₀²", "motivo");
    igual(doc.querySelectorAll("#prueba .resultado-intervalo").length, 0, "no debe haber decisión");
    contiene(estado(), "No se pudo resolver la prueba de hipótesis", "mensaje junto al botón");
  });

  prueba("error: éxitos mayores que n → «Sin resultado» en la tarjeta del intervalo", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-proporcion", formato: "resumen" });
    escribir({ "prop-n": "10", "prop-x": "12" });
    revisar();
    contiene(texto("intervalo"), "Sin resultado", "tarjeta");
    igual(doc.querySelectorAll("#intervalo .resultado-intervalo").length, 0, "no debe haber intervalo");
  });

  prueba("error: falta elegir H₁ en una prueba", function () {
    elegirTodo({ tipo: "prueba", caso: "una-media", formato: "resumen", sigma: "conocida" });
    escribir({ "media-n": "100", "media-xbarra": "71.8", "media-sigma": "8.9", "h0-valor": "70" });
    revisar();
    contiene(estado(), "la hipótesis alternativa H₁", "mensaje");
    igual(tarjetasVisibles().length, 0, "tarjetas");
  });

  prueba("error: nivel de confianza fuera de rango", function () {
    elegirTodo({ tipo: "intervalo", caso: "una-proporcion", formato: "resumen" });
    escribir({ "nivel-confianza": "150", "prop-n": "100", "prop-x": "40" });
    revisar();
    contiene(estado(), "El nivel de confianza debe ser", "mensaje");
    igual(tarjetasVisibles().length, 0, "tarjetas");
  });

  prueba("caso sin método seguro (varianzas diferentes y ambas n ≥ 30): se explica y no se calcula", function () {
    elegirTodo({ tipo: "intervalo", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "diferentes" });
    escribir({ "dm1-n": "40", "dm1-xbarra": "10", "dm1-s": "2", "dm2-n": "35", "dm2-xbarra": "9", "dm2-s": "3" });
    revisar();
    contiene(texto("metodo"), "No se puede determinar el método con seguridad", "tarjeta del método");
    igual(tarjetasVisibles().join(","), "metodo", "solo la tarjeta del método");
  });

  // ----- Accesibilidad, teclado y móvil -----

  prueba("accesibilidad: cada campo tiene etiqueta y los ids no se repiten", function () {
    const ids = {};
    for (const el of doc.querySelectorAll("[id]")) {
      verdadero(!ids[el.id], "id repetido: " + el.id);
      ids[el.id] = true;
    }
    for (const campo of formulario.querySelectorAll("input, select, textarea")) {
      if (campo.type === "radio") {
        verdadero(campo.closest("label") && campo.closest("label").textContent.trim() !== "", "radio sin etiqueta: " + campo.name);
        const grupo = campo.closest("fieldset");
        verdadero(grupo && grupo.querySelector("legend"), "radio sin fieldset/legend: " + campo.name);
      } else {
        const etiqueta = doc.querySelector('label[for="' + campo.id + '"]');
        verdadero(etiqueta && etiqueta.textContent.trim() !== "", "campo sin etiqueta: #" + campo.id);
      }
      const describe = campo.getAttribute("aria-describedby");
      if (describe) verdadero(doc.getElementById(describe), "aria-describedby apunta a un id que no existe: " + describe);
    }
  });

  prueba("accesibilidad: idioma, viewport, mensajes anunciados y orden de teclado natural", function () {
    igual(doc.documentElement.lang, "es", "idioma de la página");
    verdadero(doc.querySelector('meta[name="viewport"]'), "falta la etiqueta viewport");
    igual(doc.getElementById("estado").getAttribute("aria-live"), "polite", "el mensaje se anuncia");
    igual(doc.querySelectorAll("[tabindex]").length, 0, "tabindex cambia el orden del teclado");
    for (const boton of doc.querySelectorAll("button")) {
      verdadero(boton.textContent.trim() !== "", "botón sin texto");
      verdadero(boton.type === "submit" || boton.type === "button", "botón sin tipo claro");
    }
    let foco = false;
    for (const hoja of doc.styleSheets) {
      for (const regla of hoja.cssRules) {
        if (regla.selectorText && regla.selectorText.includes(":focus-visible")) foco = true;
      }
    }
    verdadero(foco, "no hay estilo visible para el foco del teclado");
  });

  prueba("móvil: a 360 px y 320 px no hay desplazamiento horizontal de la página", function () {
    for (const ancho of [360, 320]) {
      limpiar();
      marco.style.width = ancho + "px";
      // El resultado más ancho: prueba de Welch (tablas con fórmulas largas).
      elegirTodo({ tipo: "prueba", caso: "dos-medias", formato: "resumen", sigma: "desconocida", varianzas: "diferentes",
        alternativa: "dos-colas" });
      escribir({ "dm1-n": "15", "dm1-xbarra": "23.1", "dm1-s": "2.9", "dm2-n": "11", "dm2-xbarra": "20.4", "dm2-s": "5.8",
        "h0-valor": "0" });
      revisar();
      const raiz = doc.documentElement;
      verdadero(raiz.scrollWidth <= raiz.clientWidth + 1,
        "a " + ancho + " px la página mide " + raiz.scrollWidth + " px de ancho (ventana: " + raiz.clientWidth + " px)");
    }
  });

  prueba("sin errores de JavaScript en la consola durante todas las pruebas", function () {
    igual(erroresConsola.length, 0, "errores: " + erroresConsola.join(" | "));
  });
}

// Filas (celdas) de la tabla de valores críticos: las que tienen el encabezado «Valor».
function filasDeTabla(idTarjeta, encabezado) {
  for (const tabla of doc.querySelectorAll("#" + idTarjeta + " table")) {
    if (tabla.tHead.rows[0].cells[0].textContent === encabezado) {
      return Array.from(tabla.tBodies[0].rows).map(function (tr) {
        return Array.from(tr.cells).map(function (c) { return c.textContent; });
      });
    }
  }
  throw new Error("No se encontró la tabla «" + encabezado + "» en #" + idTarjeta);
}

// Lo que se ve en la página, para comparar antes y después de reiniciar.
function foto() {
  const valores = Array.from(formulario.elements).map(function (c) {
    return c.type === "radio" ? c.checked : c.value;
  });
  const visibles = Array.from(formulario.querySelectorAll(".condicional, .grupo-tarjetas")).map(function (b) {
    return !b.hidden;
  });
  const elegidas = Array.from(doc.querySelectorAll(".tarjeta-opcion")).map(function (b) {
    return b.getAttribute("aria-pressed");
  });
  return JSON.stringify({
    valores: valores, visibles: visibles, elegidas: elegidas, vistaMetodo: texto("vista-metodo"),
    tarjetas: tarjetasVisibles(), estado: estado(),
    nota: doc.getElementById("nota-redondeo").hidden, invalidos: formulario.querySelectorAll("[aria-invalid]").length,
  });
}

// ---------- Inicio ----------

function mostrarResultados() {
  const fallos = resultados.filter(function (r) { return !r.ok; });
  const lista = document.getElementById("lista");
  const lineas = [];
  for (const r of resultados) {
    const li = document.createElement("li");
    li.className = r.ok ? "ok" : "fallo";
    li.textContent = (r.ok ? "✔ " : "✖ ") + r.nombre + (r.ok ? "" : " — " + r.detalle);
    lista.appendChild(li);
    lineas.push((r.ok ? "OK " : "FALLO ") + r.nombre + (r.ok ? "" : " — " + r.detalle));
  }
  lineas.push("TOTAL " + resultados.length + " FALLOS " + fallos.length);
  document.getElementById("salida").textContent = lineas.join("\n");
  const resumen = document.getElementById("resumen");
  resumen.textContent = resultados.length + " pruebas, " + fallos.length + " fallos.";
  resumen.className = fallos.length === 0 ? "ok" : "fallo";
}

marco = document.createElement("iframe");
marco.title = "Página de la aplicación";
marco.onload = function () {
  try {
    app = marco.contentWindow;
    doc = marco.contentDocument;
    formulario = doc.getElementById("formulario-ejercicio");
    app.addEventListener("error", function (e) { erroresConsola.push(e.message); });
    const consolaError = app.console.error;
    app.console.error = function () {
      erroresConsola.push(Array.from(arguments).join(" "));
      consolaError.apply(app.console, arguments);
    };
    todasLasPruebas();
  } catch (error) {
    // Por ejemplo, si el navegador no deja leer el iframe al abrir la página como archivo.
    resultados.push({ nombre: "cargar la página en el iframe", ok: false,
      detalle: error.message + " (abre esta página con un servidor local; ver el comentario de tests/integracion.html)" });
  }
  mostrarResultados();
};
marco.src = "../index.html";
document.body.appendChild(marco);
