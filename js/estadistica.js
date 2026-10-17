// Lectura de listas de datos y estadísticos descriptivos (Parte 3).
// Estas funciones no usan la página (document), así que también se pueden
// probar con Node: ver tests/estadistica.test.js.

// Forma válida de un número: signo opcional, dígitos con punto decimal
// opcional y notación científica opcional. Ejemplos: 12, -3.5, .5, 2e3
const FORMATO_NUMERO = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

const AYUDA_FORMATO =
  "Usa punto decimal (12.5, 14) o, si usas coma decimal, separa los datos con punto y coma (12,5; 14).";

// Convierte el texto escrito por el usuario en una lista de números.
// Reglas:
//   - Si el texto tiene ";", los datos se separan con ";" (o espacios) y la
//     coma es decimal: "1,5; 2,7; 3,1" -> [1.5, 2.7, 3.1]
//   - Si no, los datos se separan con comas o espacios y el decimal es el
//     punto: "1.5, 2.7 3.1" -> [1.5, 2.7, 3.1]
// Devuelve { valores: [...] } si todo es válido, o { error: "mensaje" }.
// Los valores se devuelven en el mismo orden en que se escribieron.
function leerLista(texto) {
  const limpio = texto.trim();
  if (limpio === "") {
    return { error: "La lista está vacía. Escribe al menos un valor." };
  }

  const usaPuntoYComa = limpio.includes(";");
  const separador = usaPuntoYComa ? /[;\s]+/ : /[,\s]+/;
  const piezas = limpio.split(separador).filter(function (pieza) {
    return pieza !== "";
  });

  if (piezas.length === 0) {
    return { error: "La lista no contiene ningún valor, solo separadores." };
  }

  const valores = [];
  for (let i = 0; i < piezas.length; i++) {
    const original = piezas[i];
    const pieza = usaPuntoYComa ? original.replace(",", ".") : original;

    if (!FORMATO_NUMERO.test(pieza)) {
      return {
        error: "El dato " + (i + 1) + " («" + original + "») no es un número válido. " + AYUDA_FORMATO,
      };
    }

    const numero = Number(pieza);
    if (!Number.isFinite(numero)) {
      return { error: "El dato " + (i + 1) + " («" + original + "») es demasiado grande." };
    }
    valores.push(numero);
  }

  return { valores: valores };
}

// Igual que leerLista, pero solo acepta 0 (fracaso) y 1 (éxito).
function leerListaBinaria(texto) {
  const lectura = leerLista(texto);
  if (lectura.error) return lectura;

  for (let i = 0; i < lectura.valores.length; i++) {
    const valor = lectura.valores[i];
    if (valor !== 0 && valor !== 1) {
      return {
        error: "El dato " + (i + 1) + " (" + valor + ") no es válido: para proporciones escribe solo 1 (éxito) o 0 (fracaso).",
      };
    }
  }
  return lectura;
}

// Suma de los valores: Σxᵢ
function calcularSuma(valores) {
  let suma = 0;
  for (const x of valores) {
    suma += x;
  }
  return suma;
}

// Media muestral: x̄ = Σxᵢ / n
function calcularMedia(valores) {
  return calcularSuma(valores) / valores.length;
}

// Varianza muestral: s² = Σ(xᵢ − x̄)² / (n − 1)
// Se calcula primero la media y después las desviaciones respecto a ella,
// lo cual es más preciso que usar la fórmula abreviada Σx² − n·x̄².
// Con un solo dato no está definida (n − 1 = 0) y se devuelve null.
function calcularVarianzaMuestral(valores) {
  const n = valores.length;
  if (n < 2) return null;

  const media = calcularMedia(valores);
  let sumaCuadrados = 0;
  for (const x of valores) {
    sumaCuadrados += (x - media) * (x - media);
  }
  return sumaCuadrados / (n - 1);
}

// Reúne los estadísticos descriptivos de una lista de números.
// varianza y desviacion son null si n < 2.
function calcularDescriptivos(valores) {
  const varianza = calcularVarianzaMuestral(valores);
  return {
    n: valores.length,
    suma: calcularSuma(valores),
    media: calcularMedia(valores),
    varianza: varianza,
    desviacion: varianza === null ? null : Math.sqrt(varianza), // s = √s²
  };
}

// Proporción muestral a partir de datos 0/1: p̂ = x / n,
// donde x es el número de éxitos (cantidad de unos).
function calcularProporcion(valores) {
  let exitos = 0;
  for (const valor of valores) {
    if (valor === 1) exitos++;
  }
  return {
    n: valores.length,
    exitos: exitos,
    proporcion: exitos / valores.length,
  };
}

// Diferencias de datos pareados: dᵢ = (muestra 1)ᵢ − (muestra 2)ᵢ
// Las dos listas deben tener la misma cantidad de datos.
// Devuelve { diferencias: [...] } o { error: "mensaje" }.
function calcularDiferencias(muestra1, muestra2) {
  if (muestra1.length !== muestra2.length) {
    return {
      error: "Las listas pareadas deben tener la misma cantidad de datos: la muestra 1 tiene " +
        muestra1.length + " y la muestra 2 tiene " + muestra2.length + ".",
    };
  }

  const diferencias = [];
  for (let i = 0; i < muestra1.length; i++) {
    diferencias.push(muestra1[i] - muestra2[i]);
  }
  return { diferencias: diferencias };
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    leerLista,
    leerListaBinaria,
    calcularSuma,
    calcularMedia,
    calcularVarianzaMuestral,
    calcularDescriptivos,
    calcularProporcion,
    calcularDiferencias,
  };
}
