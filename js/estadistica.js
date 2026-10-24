// Lectura de listas de datos y estadísticos descriptivos (Parte 3).

const FORMATO_NUMERO = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

const AYUDA_FORMATO =
  "Usa punto decimal (12.5, 14) o, si usas coma decimal, separa los datos con punto y coma (12,5; 14).";

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

function calcularSuma(valores) {
  let suma = 0;
  for (const x of valores) {
    suma += x;
  }
  return suma;
}

function calcularMedia(valores) {
  return calcularSuma(valores) / valores.length;
}

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

function calcularDescriptivos(valores) {
  const varianza = calcularVarianzaMuestral(valores);
  return {
    n: valores.length,
    suma: calcularSuma(valores),
    media: calcularMedia(valores),
    varianza: varianza,
    desviacion: varianza === null ? null : Math.sqrt(varianza),
  };
}

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
