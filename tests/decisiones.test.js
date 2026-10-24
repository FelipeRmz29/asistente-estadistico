// Pruebas de js/decisiones.js (criterios de decisión del formulario, Parte 8).

const test = require("node:test");
const assert = require("node:assert/strict");
const { decidirIntervalo } = require("../js/decisiones.js");
const ic = require("../js/intervalos.js");

const DIFERENCIAS = [
  ["dos-medias-z", "μ₁", "μ₂"],
  ["dos-medias-t-iguales", "μ₁", "μ₂"],
  ["dos-medias-t-diferentes", "μ₁", "μ₂"],
  ["pareadas", "μ₁", "μ₂"],
  ["dos-proporciones", "π₁", "π₂"],
];

// ---------- Diferencias: (+,+), (−,+), (−,−) ----------

test("diferencias: (+,+) ⇒ el primero es mayor", function () {
  for (const [clave, a, b] of DIFERENCIAS) {
    const d = decidirIntervalo(clave, 0.69, 7.31);
    assert.equal(d.estado, "decidido", clave);
    assert.equal(d.decision, a + " > " + b);
    assert.equal(d.signos, "(+,+)");
  }
});

test("diferencias: (−,+) ⇒ iguales", function () {
  for (const [clave, a, b] of DIFERENCIAS) {
    const d = decidirIntervalo(clave, -0.0017, 0.0217);
    assert.equal(d.estado, "decidido", clave);
    assert.equal(d.decision, a + " = " + b);
    assert.equal(d.signos, "(−,+)");
    assert.match(d.explicacion, /contiene el 0/);
  }
});

test("diferencias: (−,−) ⇒ el primero es menor", function () {
  for (const [clave, a, b] of DIFERENCIAS) {
    const d = decidirIntervalo(clave, -8.58, -3.42);
    assert.equal(d.estado, "decidido", clave);
    assert.equal(d.decision, a + " < " + b);
    assert.equal(d.signos, "(−,−)");
  }
});

test("diferencias: el criterio mostrado es el del formulario", function () {
  const d = decidirIntervalo("dos-medias-z", 1, 2);
  assert.equal(d.criterio, "(+,+) ⇒ μ₁ > μ₂;  (−,+) ⇒ μ₁ = μ₂;  (−,−) ⇒ μ₁ < μ₂");
  assert.equal(decidirIntervalo("dos-proporciones", 1, 2).criterio,
    "(+,+) ⇒ π₁ > π₂;  (−,+) ⇒ π₁ = π₂;  (−,−) ⇒ π₁ < π₂");
});

test("diferencias: límites muy cerca de 0 siguen decidiendo por su signo", function () {
  assert.equal(decidirIntervalo("dos-medias-z", 1e-12, 1).decision, "μ₁ > μ₂");
  assert.equal(decidirIntervalo("dos-medias-z", -1, -1e-12).decision, "μ₁ < μ₂");
  assert.equal(decidirIntervalo("dos-medias-z", -1e-12, 1e-12).decision, "μ₁ = μ₂");
});

// ---------- Cociente: (<1,<1), (<1,>1), (>1,>1) ----------

test("cociente de varianzas: se compara con 1", function () {
  const mayor = decidirIntervalo("cociente-varianzas", 1.5, 6);
  assert.equal(mayor.decision, "σ₁² > σ₂²");
  assert.equal(mayor.signos, "(>1,>1)");

  const iguales = decidirIntervalo("cociente-varianzas", 0.5124, 6.031);
  assert.equal(iguales.decision, "σ₁² = σ₂²");
  assert.equal(iguales.signos, "(<1,>1)");
  assert.match(iguales.explicacion, /contiene el 1/);

  const menor = decidirIntervalo("cociente-varianzas", 0.1, 0.9);
  assert.equal(menor.decision, "σ₁² < σ₂²");
  assert.equal(menor.signos, "(<1,<1)");

  assert.equal(mayor.criterio, "(>1,>1) ⇒ σ₁² > σ₂²;  (<1,>1) ⇒ σ₁² = σ₂²;  (<1,<1) ⇒ σ₁² < σ₂²");
});

test("cociente de varianzas: cerca de 1 decide; ni el 0 ni los negativos son la referencia", function () {
  assert.equal(decidirIntervalo("cociente-varianzas", 1.0000001, 2).decision, "σ₁² > σ₂²");
  assert.equal(decidirIntervalo("cociente-varianzas", 0.5, 0.9999999).decision, "σ₁² < σ₂²");
  assert.equal(decidirIntervalo("cociente-varianzas", 0.2, 0.8).decision, "σ₁² < σ₂²");
});

// ---------- Límite exactamente en la referencia: no se decide ----------

test("un límite exactamente en 0 (o 1) no tiene decisión automática", function () {
  for (const [clave] of DIFERENCIAS) {
    for (const [inferior, superior] of [[0, 3], [-3, 0], [0, 0]]) {
      const d = decidirIntervalo(clave, inferior, superior);
      assert.equal(d.estado, "sin-decision", clave + " " + inferior + "," + superior);
      assert.equal(d.decision, undefined);
      assert.match(d.mensaje, /exactamente 0.*no indica.*Confirma con tu profesor/);
      assert.ok(d.criterio);
    }
  }
  for (const [inferior, superior] of [[1, 4], [0.2, 1], [1, 1]]) {
    const d = decidirIntervalo("cociente-varianzas", inferior, superior);
    assert.equal(d.estado, "sin-decision");
    assert.match(d.mensaje, /exactamente 1.*\(<1,<1\)/);
  }
});

// ---------- Casos sin criterio en el formulario ----------

test("una media, una proporción y una varianza no tienen criterio", function () {
  for (const clave of ["media-z", "media-t", "proporcion", "varianza", "otra-cosa", undefined]) {
    const d = decidirIntervalo(clave, -1, 1);
    assert.equal(d.estado, "sin-decision", String(clave));
    assert.match(d.mensaje, /no trae criterio de decisión/);
    assert.equal(d.decision, undefined);
  }
});

test("límites no válidos no se deciden", function () {
  for (const [inferior, superior] of [[NaN, 1], [1, NaN], [-Infinity, 1], [1, Infinity], [undefined, 1], [null, 1], [3, 1]]) {
    const d = decidirIntervalo("dos-medias-z", inferior, superior);
    assert.equal(d.estado, "sin-decision", inferior + "," + superior);
    assert.match(d.mensaje, /límites del intervalo no son válidos/);
  }
});

// ---------- Con intervalos reales de la Parte 7 ----------

test("decisión a partir de los intervalos calculados (límites sin redondear)", function () {
  const t = ic.intervaloDosMediasTIguales(12, 85, 4, 10, 81, 5, 90);
  assert.equal(decidirIntervalo("dos-medias-t-iguales", t.inferior, t.superior).decision, "μ₁ > μ₂");

  const z = ic.intervaloDosMediasZ(50, 76, 6, 75, 82, 8, false, 96);
  assert.equal(decidirIntervalo("dos-medias-z", z.inferior, z.superior).decision, "μ₁ < μ₂");
  const cerca = ic.intervaloDosMediasZ(50, 76, 6, 75, 77, 8, false, 95);
  assert.equal(decidirIntervalo("dos-medias-z", cerca.inferior, cerca.superior).decision, "μ₁ = μ₂");

  const p = ic.intervaloDosProporciones(1500, 75, null, 2000, 80, null, 90);
  assert.equal(decidirIntervalo("dos-proporciones", p.inferior, p.superior).decision, "π₁ = π₂");

  const par = ic.intervaloPareadas(12, 0.5, 0.8, 95);
  assert.equal(decidirIntervalo("pareadas", par.inferior, par.superior).decision, "μ₁ = μ₂");

  const f = ic.intervaloCocienteVarianzas(10, null, 4, 16, null, 2.5, 95);
  assert.equal(decidirIntervalo("cociente-varianzas", f.inferior, f.superior).decision, "σ₁² = σ₂²");
  const g = ic.intervaloCocienteVarianzas(40, null, 9, 40, null, 2, 95);
  assert.equal(decidirIntervalo("cociente-varianzas", g.inferior, g.superior).decision, "σ₁² > σ₂²");
});

test("la decisión usa el límite sin redondear, no el que se muestra", function () {
  assert.equal(decidirIntervalo("dos-medias-z", 0.00004, 1).decision, "μ₁ > μ₂");
  assert.equal(decidirIntervalo("dos-medias-z", -0.00004, 1).decision, "μ₁ = μ₂");
});
