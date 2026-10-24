
const PROBABILIDAD_MINIMA = 0.000001;
const PROBABILIDAD_MAXIMA = 0.999999;
const GL_MINIMO = 1;
const GL_MAXIMO = 1000000;

const PRECISION = 1e-15;
const MAX_ITERACIONES = 100000;
const MUY_PEQUENO = 1e-300;

// ---------- Funciones matemáticas auxiliares ----------

const COEFICIENTES_LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(x) {
  x = x - 1;
  let suma = COEFICIENTES_LANCZOS[0];
  for (let i = 1; i < 9; i++) {
    suma += COEFICIENTES_LANCZOS[i] / (x + i);
  }
  const t = x + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(suma);
}

function gammaIncompleta(a, x) {
  if (x <= 0) return 0;
  const factor = Math.exp(-x + a * Math.log(x) - logGamma(a));

  if (x < a + 1) {
    let termino = 1 / a;
    let suma = termino;
    for (let n = 1; n <= MAX_ITERACIONES; n++) {
      termino *= x / (a + n);
      suma += termino;
      if (Math.abs(termino) < Math.abs(suma) * PRECISION) return suma * factor;
    }
    return NaN;
  }

  let b = x + 1 - a;
  let c = 1 / MUY_PEQUENO;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= MAX_ITERACIONES; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < MUY_PEQUENO) d = MUY_PEQUENO;
    c = b + an / c;
    if (Math.abs(c) < MUY_PEQUENO) c = MUY_PEQUENO;
    d = 1 / d;
    const cambio = d * c;
    h *= cambio;
    if (Math.abs(cambio - 1) < PRECISION) return 1 - factor * h;
  }
  return NaN;
}

function fraccionBeta(x, a, b) {
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < MUY_PEQUENO) d = MUY_PEQUENO;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITERACIONES; m++) {
    let aa = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + aa * d;
    if (Math.abs(d) < MUY_PEQUENO) d = MUY_PEQUENO;
    c = 1 + aa / c;
    if (Math.abs(c) < MUY_PEQUENO) c = MUY_PEQUENO;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < MUY_PEQUENO) d = MUY_PEQUENO;
    c = 1 + aa / c;
    if (Math.abs(c) < MUY_PEQUENO) c = MUY_PEQUENO;
    d = 1 / d;
    const cambio = d * c;
    h *= cambio;
    if (Math.abs(cambio - 1) < PRECISION) return h;
  }
  return NaN;
}

function betaIncompleta(x, y, a, b) {
  if (x <= 0) return 0;
  if (y <= 0) return 1;
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(y));
  if (x < (a + 1) / (a + b + 2)) {
    return factor * fraccionBeta(x, a, b) / a;
  }
  return 1 - factor * fraccionBeta(y, b, a) / b;
}

// ---------- Funciones de distribución acumulada: P(X ≤ x) ----------

function cdfNormal(z) {
  const mitad = 0.5 * gammaIncompleta(0.5, z * z / 2);
  return z >= 0 ? 0.5 + mitad : 0.5 - mitad;
}

function cdfT(t, gl) {
  const x = gl / (gl + t * t);
  const y = (t * t) / (gl + t * t);
  const cola = 0.5 * betaIncompleta(x, y, gl / 2, 0.5);
  return t >= 0 ? 1 - cola : cola;
}

function cdfChi2(x, gl) {
  return gammaIncompleta(gl / 2, x / 2);
}

function cdfF(f, gl1, gl2) {
  if (f <= 0) return 0;
  const x = (gl1 * f) / (gl1 * f + gl2);
  const y = gl2 / (gl1 * f + gl2);
  return betaIncompleta(x, y, gl1 / 2, gl2 / 2);
}

// ---------- Búsqueda del valor crítico ----------

function buscarValorCritico(cdf, p, soloPositivos) {
  let abajo = soloPositivos ? 0 : -1;
  let arriba = 1;
  for (let i = 0; i < 100 && cdf(arriba) < p; i++) arriba *= 2;
  for (let i = 0; i < 100 && !soloPositivos && cdf(abajo) > p; i++) abajo *= 2;
  if (!(cdf(abajo) <= p && p <= cdf(arriba))) return NaN;

  for (let i = 0; i < 2000; i++) {
    const medio = (abajo + arriba) / 2;
    if (medio === abajo || medio === arriba) break;
    const valor = cdf(medio);
    if (Number.isNaN(valor)) return NaN;
    if (valor === p) return medio;
    if (valor < p) {
      abajo = medio;
    } else {
      arriba = medio;
    }
  }
  return (abajo + arriba) / 2;
}

// ---------- Validación de datos ----------

function validarProbabilidad(p) {
  if (typeof p !== "number" || !(p >= PROBABILIDAD_MINIMA && p <= PROBABILIDAD_MAXIMA)) {
    return "La probabilidad acumulada debe ser un número entre " + PROBABILIDAD_MINIMA +
      " y " + PROBABILIDAD_MAXIMA + " (se recibió " + p + ").";
  }
  return null;
}

const TOLERANCIA_GL = 1e-9;
function redondearGL(gl) {
  return typeof gl === "number" ? Math.floor(gl + TOLERANCIA_GL) : gl;
}

function validarGL(gl, nombre) {
  if (typeof gl !== "number" || !(gl >= GL_MINIMO && gl <= GL_MAXIMO)) {
    return "Los grados de libertad " + nombre + " deben ser un número entre " + GL_MINIMO +
      " y " + GL_MAXIMO + " (se recibió " + gl + ").";
  }
  return null;
}

function armarResultado(distribucion, parametros, p, valor) {
  if (!Number.isFinite(valor)) {
    return { error: "No se pudo calcular el valor crítico de la distribución " + distribucion +
      " con " + parametros + " y probabilidad " + p + "." };
  }
  const areaDerecha = 1 - p;
  return {
    distribucion: distribucion,
    parametros: parametros,
    areaIzquierda: p,
    areaDerecha: areaDerecha,
    valor: valor,
    descripcion: "Distribución " + distribucion + (parametros ? ", " + parametros : "") +
      "; área a la izquierda = " + p + ", área a la derecha = " + Number(areaDerecha.toPrecision(12)),
  };
}

// ---------- Consultas de valores críticos ----------

function valorCriticoZ(p) {
  const error = validarProbabilidad(p);
  if (error) return { error: error };
  return armarResultado("normal estándar Z", "", p, buscarValorCritico(cdfNormal, p, false));
}

function valorCriticoT(p, gl) {
  gl = redondearGL(gl);
  const error = validarProbabilidad(p) || validarGL(gl, "(gl)");
  if (error) return { error: error };
  const valor = buscarValorCritico(function (t) { return cdfT(t, gl); }, p, false);
  return armarResultado("t de Student", "gl = " + gl, p, valor);
}

function valorCriticoChi2(p, gl) {
  gl = redondearGL(gl);
  const error = validarProbabilidad(p) || validarGL(gl, "(gl)");
  if (error) return { error: error };
  const valor = buscarValorCritico(function (x) { return cdfChi2(x, gl); }, p, true);
  return armarResultado("chi-cuadrada", "gl = " + gl, p, valor);
}

function valorCriticoF(p, gl1, gl2) {
  gl1 = redondearGL(gl1);
  gl2 = redondearGL(gl2);
  const error = validarProbabilidad(p) || validarGL(gl1, "del numerador (gl1)") ||
    validarGL(gl2, "del denominador (gl2)");
  if (error) return { error: error };
  const valor = buscarValorCritico(function (f) { return cdfF(f, gl1, gl2); }, p, true);
  return armarResultado("F", "gl1 = " + gl1 + " (numerador), gl2 = " + gl2 + " (denominador)", p, valor);
}

if (typeof module !== "undefined") {
  module.exports = {
    cdfNormal,
    cdfT,
    cdfChi2,
    cdfF,
    redondearGL,
    valorCriticoZ,
    valorCriticoT,
    valorCriticoChi2,
    valorCriticoF,
  };
}
