// Valores críticos de las distribuciones Z, t de Student, chi-cuadrada y F (Parte 4).
// No se usa ninguna librería: cada distribución tiene su función de distribución
// acumulada (CDF) y el valor crítico es el número x tal que CDF(x) = probabilidad,
// que se busca por bisección.
//
// Convención: la probabilidad que reciben las funciones es el ÁREA ACUMULADA A LA
// IZQUIERDA del valor crítico (como NORM.S.INV, T.INV, CHISQ.INV y F.INV de Excel).
// Ejemplo: con 95 % de confianza, z_{α/2} = z_{0.025} deja 0.025 a la derecha,
// es decir 0.975 a la izquierda, y se obtiene con valorCriticoZ(0.975).
//
// Los valores se devuelven sin redondear; el redondeo se hace solo al mostrarlos.
// Estas funciones no usan la página (document), así que también se pueden probar
// con Node: ver tests/valores-criticos.test.js.

// Rango admitido. Fuera de él se devuelve un error en lugar de un valor dudoso.
const PROBABILIDAD_MINIMA = 0.000001;   // 1e-6
const PROBABILIDAD_MAXIMA = 0.999999;   // 1 − 1e-6
const GL_MINIMO = 1;
const GL_MAXIMO = 1000000;

// Precisión de las sumas y fracciones continuas, y límite de repeticiones.
const PRECISION = 1e-15;
const MAX_ITERACIONES = 100000;
const MUY_PEQUENO = 1e-300; // evita divisiones entre cero en las fracciones continuas

// ---------- Funciones matemáticas auxiliares ----------

// Logaritmo de la función gamma, ln Γ(x), con la aproximación de Lanczos
// (g = 7, 9 coeficientes; error relativo cercano a 1e-15). Válida para x ≥ 0.5,
// que es lo que se usa aquí (los argumentos son gl/2 ≥ 0.5 y 1/2).
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

// Función gamma incompleta regularizada P(a, x) = (1/Γ(a)) ∫₀ˣ e^(−t) t^(a−1) dt.
// Si x < a + 1 se usa la serie; si no, la fracción continua para Q = 1 − P
// (método de Numerical Recipes). Devuelve NaN si no converge.
function gammaIncompleta(a, x) {
  if (x <= 0) return 0;
  const factor = Math.exp(-x + a * Math.log(x) - logGamma(a));

  if (x < a + 1) {
    // Serie: P = factor · Σ xⁿ / (a (a+1) ··· (a+n))
    let termino = 1 / a;
    let suma = termino;
    for (let n = 1; n <= MAX_ITERACIONES; n++) {
      termino *= x / (a + n);
      suma += termino;
      if (Math.abs(termino) < Math.abs(suma) * PRECISION) return suma * factor;
    }
    return NaN;
  }

  // Fracción continua (método de Lentz) para Q(a, x)
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

// Fracción continua de la beta incompleta (método de Lentz, Numerical Recipes).
function fraccionBeta(x, a, b) {
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < MUY_PEQUENO) d = MUY_PEQUENO;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITERACIONES; m++) {
    // Término par
    let aa = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + aa * d;
    if (Math.abs(d) < MUY_PEQUENO) d = MUY_PEQUENO;
    c = 1 + aa / c;
    if (Math.abs(c) < MUY_PEQUENO) c = MUY_PEQUENO;
    d = 1 / d;
    h *= d * c;
    // Término impar
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

// Función beta incompleta regularizada Iₓ(a, b).
// y = 1 − x se recibe ya calculado para no perder decimales al restar.
function betaIncompleta(x, y, a, b) {
  if (x <= 0) return 0;
  if (y <= 0) return 1;
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(y));
  // La fracción converge rápido si x < (a+1)/(a+b+2); si no, se usa
  // la simetría Iₓ(a, b) = 1 − I_y(b, a).
  if (x < (a + 1) / (a + b + 2)) {
    return factor * fraccionBeta(x, a, b) / a;
  }
  return 1 - factor * fraccionBeta(y, b, a) / b;
}

// ---------- Funciones de distribución acumulada: P(X ≤ x) ----------

// Normal estándar: Φ(z) = ½ [1 + P(½, z²/2)] para z ≥ 0 y Φ(z) = 1 − Φ(−z).
function cdfNormal(z) {
  const mitad = 0.5 * gammaIncompleta(0.5, z * z / 2);
  return z >= 0 ? 0.5 + mitad : 0.5 - mitad;
}

// t de Student con gl grados de libertad.
// El área de la cola es ½ · Iₓ(gl/2, ½) con x = gl / (gl + t²).
function cdfT(t, gl) {
  const x = gl / (gl + t * t);
  const y = (t * t) / (gl + t * t);
  const cola = 0.5 * betaIncompleta(x, y, gl / 2, 0.5);
  return t >= 0 ? 1 - cola : cola;
}

// Chi-cuadrada con gl grados de libertad: P(gl/2, x/2).
function cdfChi2(x, gl) {
  return gammaIncompleta(gl / 2, x / 2);
}

// F con gl1 (numerador) y gl2 (denominador): Iₓ(gl1/2, gl2/2) con x = gl1·f / (gl1·f + gl2).
function cdfF(f, gl1, gl2) {
  if (f <= 0) return 0;
  const x = (gl1 * f) / (gl1 * f + gl2);
  const y = gl2 / (gl1 * f + gl2);
  return betaIncompleta(x, y, gl1 / 2, gl2 / 2);
}

// ---------- Búsqueda del valor crítico ----------

// Busca por bisección el x tal que cdf(x) = p.
// soloPositivos: true para chi-cuadrada y F (x > 0); false para Z y t.
// Devuelve NaN si la CDF no se pudo calcular.
function buscarValorCritico(cdf, p, soloPositivos) {
  // 1) Encontrar un intervalo [abajo, arriba] que contenga la respuesta,
  //    duplicando los extremos hasta que cdf(abajo) ≤ p ≤ cdf(arriba).
  let abajo = soloPositivos ? 0 : -1;
  let arriba = 1;
  for (let i = 0; i < 100 && cdf(arriba) < p; i++) arriba *= 2;
  for (let i = 0; i < 100 && !soloPositivos && cdf(abajo) > p; i++) abajo *= 2;
  if (!(cdf(abajo) <= p && p <= cdf(arriba))) return NaN;

  // 2) Partir el intervalo a la mitad, quedándose con la mitad que contiene
  //    la respuesta, hasta que ya no se pueda dividir (precisión de la computadora).
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

// Devuelve un mensaje de error, o null si la probabilidad es válida.
function validarProbabilidad(p) {
  if (typeof p !== "number" || !(p >= PROBABILIDAD_MINIMA && p <= PROBABILIDAD_MAXIMA)) {
    return "La probabilidad acumulada debe ser un número entre " + PROBABILIDAD_MINIMA +
      " y " + PROBABILIDAD_MAXIMA + " (se recibió " + p + ").";
  }
  return null;
}

// Los grados de libertad siempre se redondean hacia abajo al entero inferior
// (por ejemplo, los gl de Welch: 23.9 → 23). Un entero no cambia. Lo que no es
// número (o null) se devuelve igual para que validarGL lo rechace.
// La tolerancia de 1e-9 solo corrige el error de punto flotante: Welch con n₁ = n₂
// y s₁ = s₂ debe dar exactamente 14, pero el cálculo da 13.999999999999998.
const TOLERANCIA_GL = 1e-9;
function redondearGL(gl) {
  return typeof gl === "number" ? Math.floor(gl + TOLERANCIA_GL) : gl;
}

// Devuelve un mensaje de error, o null si los grados de libertad son válidos.
function validarGL(gl, nombre) {
  if (typeof gl !== "number" || !(gl >= GL_MINIMO && gl <= GL_MAXIMO)) {
    return "Los grados de libertad " + nombre + " deben ser un número entre " + GL_MINIMO +
      " y " + GL_MAXIMO + " (se recibió " + gl + ").";
  }
  return null;
}

// Arma el resultado de una consulta, o un error si el cálculo no fue posible.
// areaDerecha = 1 − areaIzquierda (se muestra con 12 cifras para quitar el
// ruido de la resta, por ejemplo 0.025000000000000022 → 0.025).
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
// Cada función devuelve un objeto { distribucion, parametros, areaIzquierda,
// areaDerecha, valor, descripcion } o { error: "mensaje" }.

// Normal estándar Z: z tal que P(Z ≤ z) = p.
function valorCriticoZ(p) {
  const error = validarProbabilidad(p);
  if (error) return { error: error };
  return armarResultado("normal estándar Z", "", p, buscarValorCritico(cdfNormal, p, false));
}

// t de Student: t tal que P(T ≤ t) = p con gl grados de libertad (gl se redondea hacia abajo).
function valorCriticoT(p, gl) {
  gl = redondearGL(gl);
  const error = validarProbabilidad(p) || validarGL(gl, "(gl)");
  if (error) return { error: error };
  const valor = buscarValorCritico(function (t) { return cdfT(t, gl); }, p, false);
  return armarResultado("t de Student", "gl = " + gl, p, valor);
}

// Chi-cuadrada: χ² tal que P(X ≤ χ²) = p con gl grados de libertad.
function valorCriticoChi2(p, gl) {
  gl = redondearGL(gl);
  const error = validarProbabilidad(p) || validarGL(gl, "(gl)");
  if (error) return { error: error };
  const valor = buscarValorCritico(function (x) { return cdfChi2(x, gl); }, p, true);
  return armarResultado("chi-cuadrada", "gl = " + gl, p, valor);
}

// F: f tal que P(F ≤ f) = p con gl1 (numerador) y gl2 (denominador).
function valorCriticoF(p, gl1, gl2) {
  gl1 = redondearGL(gl1);
  gl2 = redondearGL(gl2);
  const error = validarProbabilidad(p) || validarGL(gl1, "del numerador (gl1)") ||
    validarGL(gl2, "del denominador (gl2)");
  if (error) return { error: error };
  const valor = buscarValorCritico(function (f) { return cdfF(f, gl1, gl2); }, p, true);
  return armarResultado("F", "gl1 = " + gl1 + " (numerador), gl2 = " + gl2 + " (denominador)", p, valor);
}

// Permite usar estas funciones desde Node (pruebas). En el navegador no hace nada.
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
