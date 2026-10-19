# asistente-estadistico

Aplicación web sencilla para resolver ejercicios del segundo parcial de Estadística
(intervalos de confianza y pruebas de hipótesis). Está hecha solo con HTML, CSS y
JavaScript, sin dependencias ni paso de compilación.

> Estado actual: interfaz para elegir el ejercicio (Parte 2), cálculo de
> estadísticos descriptivos a partir de listas de datos (Parte 3), funciones
> para obtener valores críticos de Z, t, chi-cuadrada y F (Parte 4),
> identificación del método que corresponde al ejercicio (Parte 5) e
> intervalos de confianza de una muestra: media, proporción y varianza (Parte 6)
> e intervalos de dos muestras: diferencia de medias, diferencia de proporciones,
> muestras pareadas y cociente de varianzas (Parte 7), criterios de decisión de
> los intervalos (Parte 8) y pruebas de hipótesis de esos mismos casos (Parte 9).

## Cómo se usa la interfaz

1. **¿Qué vas a resolver?** Intervalo de confianza (pide el nivel de confianza en %)
   o prueba de hipótesis (pide el nivel de significancia α).
2. **Caso:** una media, una proporción, una varianza, dos medias, dos proporciones,
   cociente de varianzas o muestras pareadas.
3. **Formato de los datos:** lista de valores individuales o estadísticas resumidas.
4. **Datos del ejercicio:** aparecen solo los campos del caso y formato elegidos.
   En una media y dos medias se pregunta si σ es conocida; en dos medias con σ
   desconocida, si las varianzas se suponen iguales o diferentes. En pruebas de
   hipótesis también se piden el valor del parámetro en H₀ y la hipótesis
   alternativa H₁ (que indica la cola: ≠ dos colas, < izquierda, > derecha).

El botón **Reiniciar** vuelve el ejercicio al estado inicial (borra datos,
opciones, resultados y mensajes, sin recargar la página); si ya se escribieron
datos, primero pide confirmación.

El botón **Revisar datos** indica si falta elegir algo. Si los datos vienen en
lista, también calcula y muestra los estadísticos de cada muestra. Después
muestra el **método identificado** con su distribución, grados de libertad y
por qué corresponde, o explica qué dato falta o por qué no se puede decidir.
En intervalos (una o dos muestras), además calcula y muestra el **intervalo de
confianza** paso a paso, y en pruebas de hipótesis, la **prueba** completa (ver abajo).

## Identificación del método (`js/metodos.js`)

La función `identificarMetodo` aplica reglas explícitas a lo que elige el
usuario: tipo de ejercicio, caso, si σ es conocida, qué se supone de las
varianzas y el tamaño de cada muestra (en lista se cuentan los datos; en
estadísticas resumidas se usa el campo n). Una muestra es **grande si n ≥ 30**.

| Caso | Condición | Método |
|---|---|---|
| Una media | σ conocida (cualquier n) | Z |
| Una media | σ desconocida y n ≥ 30 | Z, usando s en lugar de σ |
| Una media | σ desconocida y n < 30 | t, gl = n − 1 |
| Dos medias | σ₁ y σ₂ conocidas | Z |
| Dos medias | σ desconocidas, varianzas iguales, n₁ y n₂ ≥ 30 | Z (con s₁ y s₂) |
| Dos medias | σ desconocidas, varianzas iguales, n₁ y n₂ < 30 | t con varianza combinada, gl = n₁ + n₂ − 2 |
| Dos medias | σ desconocidas, varianzas diferentes, no ambas n ≥ 30 | t con gl de Welch |
| Una o dos proporciones | — | Z |
| Una varianza | — | chi-cuadrada, gl = n − 1 |
| Cociente de varianzas | — | F, gl = n₁ − 1 y n₂ − 1 |
| Muestras pareadas | — | t, gl = n − 1 (n = número de pares) |

Las reglas de una media siguen el formulario: Z si "n ≥ 30 o σ² conocida" y t si
"n < 30 y σ² desconocida". Las de dos medias siguen las filas del formulario
(σ² conocidas, varianzas iguales o diferentes). Una combinación que no coincide
con exactamente una fila **no se asigna a ningún método**: la página explica por
qué y pide confirmarlo con el profesor. Hoy eso ocurre con:

- Dos medias con σ desconocidas y varianzas iguales, con una muestra grande y otra pequeña.
- Dos medias con σ desconocidas, varianzas diferentes y ambas muestras grandes
  (coinciden Z para muestras grandes y t de Welch).

La página nunca toma una desviación muestral (s) como σ: σ solo se considera
conocida si el usuario lo indica en el paso 4. Cuando σ es desconocida y n ≥ 30,
el resultado indica explícitamente que en la fórmula se usa s en lugar de σ.

## Intervalos de confianza de una muestra (`js/intervalos.js`)

Fórmulas del formulario implementadas:

| Caso | Intervalo | Margen de error | gl |
|---|---|---|---|
| Media, n ≥ 30 o σ² conocida | x̄ − e ≤ μ ≤ x̄ + e | e = z_α/2 · σ / √n | — |
| Media, n < 30 y σ² desconocida | x̄ − e ≤ μ ≤ x̄ + e | e = t_α/2,ν · s / √n | ν = n − 1 |
| Proporción | p − e ≤ π ≤ p + e | e = z_α/2 · √(p·q / n), p = x / n, q = 1 − p | — |
| Varianza | (n − 1)S² / χ²_α/2,ν ≤ σ² ≤ (n − 1)S² / χ²_1−α/2,ν | no tiene (no es simétrico) | ν = n − 1 |

En una varianza también se muestra el intervalo de la desviación estándar:
√(límite inferior de σ²) ≤ σ ≤ √(límite superior de σ²), calculado con los
límites sin redondear. Los límites de varianza y σ se escriben con 4 decimales o,
si son menores que 0.1, con 4 cifras significativas (`formatearLimite`), para que
valores como 0.00001353 no se vean como 0.0000.

Tamaño de muestra (opcional, si se escribe el error máximo deseado e):

- Media (solo con σ conocida): n = (z_α/2 · σ / e)²
- Proporción (con la p de la muestra): n = z_α/2² · p · q / e²

El resultado se redondea hacia arriba al siguiente entero.

**Valores críticos.** En el formulario, z_α/2, t_α/2,ν y χ²_α/2,ν dejan α/2 a la
**derecha**, con α = 1 − confianza/100. Se obtienen con las funciones de la
Parte 4 pidiendo el área a la izquierda 1 − α/2 (χ²_1−α/2,ν se pide con α/2).

**Qué se muestra:** datos usados, valor crítico (con distribución, gl y áreas),
fórmula con sustitución de cada paso, límites, interpretación y notas sobre los
supuestos (población normal para t y chi-cuadrada).

**Validaciones** (si algo falla se explica y no se muestra intervalo):

- Datos faltantes o que no son números; n entero (n ≥ 2 para t y varianza).
- Desviaciones y varianzas mayores que 0.
- Proporción: x entero entre 0 y n, o p̂ entre 0 y 1, pero no ambos. Con p = 0
  o p = 1 el margen sería 0 y el método no se aplica.
- Proporción: si n·p < 5 o n·q < 5, o un límite sale de [0, 1], se muestra el
  intervalo con una advertencia (el formulario no fija esa condición).
- Tamaño de muestra: e > 0 (y e < 1 en proporciones). Si e no es válido, el
  intervalo se muestra igual y se explica por qué no se calculó n.

## Intervalos de confianza de dos muestras (`js/intervalos.js`)

Fórmulas del formulario implementadas (x̄₁ − x̄₂ es la diferencia de medias de
muestras **independientes**):

| Caso | Margen de error e | gl |
|---|---|---|
| Dos medias, σ² conocidas (o n₁ y n₂ ≥ 30 con s₁ y s₂) | e = z_α/2 · √(σ₁²/n₁ + σ₂²/n₂) | — |
| Dos medias, σ² desconocidas e **iguales** (n < 30) | e = t_α/2,ν · Sp · √(1/n₁ + 1/n₂), Sp = √(((n₁−1)s₁² + (n₂−1)s₂²) / (n₁+n₂−2)) | ν = n₁ + n₂ − 2 |
| Dos medias, σ² desconocidas y **diferentes** | e = t_α/2,ν · √(s₁²/n₁ + s₂²/n₂) | ν de Welch (no entero) |
| Dos proporciones | e = z_α/2 · √(p₁q₁/n₁ + p₂q₂/n₂) | — |
| Muestras pareadas | e = t_α/2,ν · s_d / √n, sobre d = muestra 1 − muestra 2 | ν = n − 1 |
| Cociente de varianzas | (S₁²/S₂²)·1/F_α/2(ν₁,ν₂) ≤ σ₁²/σ₂² ≤ (S₁²/S₂²)·F_α/2(ν₂,ν₁); no tiene e | ν₁ = n₁ − 1, ν₂ = n₂ − 1 |

Los intervalos de medias, proporciones y pareadas son (x̄₁ − x̄₂) ± e, (p₁ − p₂) ± e
y d̄ ± e. F_α/2(a,b) deja α/2 a la derecha y tiene a grados de libertad en el
numerador; se pide a la Parte 4 con área a la izquierda 1 − α/2 (en el límite
superior los grados de libertad van intercambiados).

**Cómo se eligen los datos.** Con listas se calculan n, x̄, s (o p̂, S²) de cada
muestra; con estadísticas resumidas se leen los campos. σ₁ y σ₂ solo se toman de
los campos de σ conocida: una s calculada o escrita nunca se usa como σ, salvo en
el caso del formulario de muestras grandes, donde se avisa. En **pareadas** con
listas, las dos listas deben tener la misma cantidad de datos; se calculan las
diferencias d = muestra 1 − muestra 2 y se trabajan como una sola muestra. En
dos medias, las listas pueden tener tamaños distintos.

**Interpretación.** Cada intervalo de dos muestras trae el texto general del
nivel de confianza y, aparte, el criterio de decisión (ver abajo).

**Validaciones** (si algo falla se explica y no se muestra intervalo): datos
faltantes o no numéricos, n entero (n ≥ 2 donde se calcula s), desviaciones y
varianzas > 0, x entero entre 0 y n o p̂ entre 0 y 1 (no ambos) en cada muestra,
p = 0 o p = 1 en una muestra (no se puede usar la aproximación normal), Z con
σ desconocidas solo si ambas n ≥ 30, t con varianza combinada solo si ambas
n < 30, y Welch no se usa si ambas n ≥ 30 (coincide con Z; hay que confirmarlo).
Con n·p o n·q < 5, o un límite fuera de [−1, 1], se muestra el intervalo con
una advertencia.

**Tamaño de muestra:** el formulario solo trae esa fórmula para una media y una
proporción, así que en dos muestras no se calcula.

## Criterios de decisión (`js/decisiones.js`)

La función `decidirIntervalo(clave, inferior, superior)` aplica la columna
"Criterios de decisión" del formulario a los límites **sin redondear** del
intervalo. Cada pareja son los dos límites (inferior, superior). La página
muestra el criterio, los signos de los límites, la explicación y la decisión.

| Caso | (+,+) | (−,+) | (−,−) |
|---|---|---|---|
| Dos medias (Z, t iguales, t diferentes) y pareadas (μ_D = μ₁ − μ₂) | μ₁ > μ₂ | μ₁ = μ₂ | μ₁ < μ₂ |
| Dos proporciones | π₁ > π₂ | π₁ = π₂ | π₁ < π₂ |

| Cociente de varianzas | (>1,>1) | (<1,>1) | (<1,<1) |
|---|---|---|---|
| Decisión | σ₁² > σ₂² | σ₁² = σ₂² | σ₁² < σ₂² |

En diferencias se mira el signo de cada límite (se compara con 0); en el
cociente, si cada límite es menor o mayor que 1. Un intervalo que contiene el 0
(o el 1) significa que no se puede afirmar que sean diferentes. No es una
prueba de hipótesis.

**Sin decisión automática** (se explica qué confirmar):

- Una media, una proporción y una varianza: el formulario no trae criterio.
- Un límite exactamente igual a 0 (o 1): el formulario solo trae los tres casos de
  arriba y no dice cuál corresponde. Confirmar con el profesor.
- Límites no válidos (no numéricos o inferior > superior).

Pendiente de confirmar con el material de clase: el formulario muestra una sola
celda de criterios para dos medias y pareadas; se aplicó a pareadas porque su fila
está dentro de esa celda. Si el intervalo de dos proporciones tiene la advertencia
de n·p o n·q < 5, la decisión se muestra con un aviso para revisarla.

## Pruebas de hipótesis (`js/pruebas.js`)

Se resuelven los mismos casos y con las mismas reglas que los intervalos (Z o t
según σ y n, varianzas iguales o diferentes, etc.; ver `js/metodos.js`). Los
datos se leen igual que en los intervalos (listas o estadísticas resumidas,
función `leerDatosCaso` de `js/app.js`).

| Caso | H₀ | Estadístico de prueba | gl |
|---|---|---|---|
| Media, n ≥ 30 o σ² conocida | μ = μ₀ | z = (x̄ − μ₀) / (σ / √n) (s en lugar de σ si σ es desconocida) | — |
| Media, n < 30 y σ² desconocida | μ = μ₀ | t = (x̄ − μ₀) / (s / √n) | ν = n − 1 |
| Proporción | π = π₀ | z = (p − π₀) / √(π₀·q₀ / n), q₀ = 1 − π₀ | — |
| Varianza | σ² = σ₀² | χ² = (n − 1)S² / σ₀² | ν = n − 1 |
| Dos medias, σ² conocidas (o n₁ y n₂ ≥ 30) | μ₁ − μ₂ = d₀ | z = ((x̄₁ − x̄₂) − d₀) / √(σ₁²/n₁ + σ₂²/n₂) | — |
| Dos medias, σ² desconocidas e iguales | μ₁ − μ₂ = d₀ | t = ((x̄₁ − x̄₂) − d₀) / (Sp · √(1/n₁ + 1/n₂)) | ν = n₁ + n₂ − 2 |
| Dos medias, σ² desconocidas y diferentes | μ₁ − μ₂ = d₀ | t = ((x̄₁ − x̄₂) − d₀) / √(s₁²/n₁ + s₂²/n₂) | ν de Welch |
| Dos proporciones | π₁ = π₂ | z = (p₁ − p₂) / √(p·q·(1/n₁ + 1/n₂)), p = (x₁ + x₂)/(n₁ + n₂) | — |
| Muestras pareadas | μ_D = d₀ | t = (d̄ − d₀) / (s_d / √n) | ν = n − 1 |
| Cociente de varianzas | σ₁² = σ₂² | F = S₁² / S₂² | ν₁ = n₁ − 1, ν₂ = n₂ − 1 |

**Hipótesis alternativa y cola.** H₁ se elige con el signo, y el signo decide la cola:

| H₁ | Cola | Región de rechazo | Valor p |
|---|---|---|---|
| parámetro < valor de H₀ | izquierda | estadístico < valor crítico con área α a la izquierda | P(X ≤ estadístico) |
| parámetro > valor de H₀ | derecha | estadístico > valor crítico con área α a la derecha | P(X ≥ estadístico) |
| parámetro ≠ valor de H₀ | dos colas | fuera de los valores críticos con α/2 en cada cola | 2 · mín(P(X ≤ est.), P(X ≥ est.)) |

Los valores críticos se piden a la Parte 4 y el valor p usa la CDF de la misma
distribución. Se muestran con la notación del formulario (el subíndice es el área a
la derecha: z_0.05, χ²_0.975,9, F_0.05(11,9)). Se **rechaza H₀** si el estadístico
cae en la región de rechazo, que es lo mismo que valor p < α; si no, **no se
rechaza H₀** (no se dice que H₀ sea cierta). Un estadístico exactamente igual al
valor crítico no se rechaza.

**Qué se muestra:** H₀ y H₁ con la cola, datos, distribución de referencia y gl,
cálculo del estadístico con sustitución, valores críticos y región de rechazo,
valor p, decisión, conclusión en palabras y notas sobre los supuestos.

**Validaciones** (si algo falla se explica y no se muestra decisión): falta la
hipótesis alternativa o el valor de H₀; α fuera de (0, 1); π₀ fuera de (0, 1);
σ₀² ≤ 0; las mismas de los intervalos para n, medias, desviaciones, x y p̂; Z con
σ desconocida solo si n ≥ 30 (en dos medias, ambas); t con varianza combinada solo
si ambas n < 30; Welch no se usa si ambas n ≥ 30; en dos proporciones, error si
la proporción combinada es 0 o 1. Con n·π₀, n·q₀ (o n·p, n·q en dos proporciones)
menor que 5 se muestra una advertencia. A diferencia del intervalo, una proporción
muestral de 0 o 1 sí se admite en la prueba, porque el error estándar usa π₀ o p.

**Pendiente de confirmar con el profesor** (el formulario solo trae intervalos, así
que estas fórmulas no salen de él; se usaron las versiones usuales y la página lo
indica en una nota):

- Una proporción: el error estándar usa π₀ (el valor de H₀), no la p de la muestra.
- Dos proporciones: se usa la proporción combinada p, y solo se admite H₀: π₁ = π₂
  (no H₀: π₁ − π₂ = d₀ con d₀ ≠ 0).
- Cociente de varianzas: solo se admite H₀: σ₁² = σ₂².
- χ² y F en dos colas: el valor p es el doble de la cola más pequeña.

## Formato de las listas de datos

- Separa los datos con comas, espacios o saltos de línea y usa punto decimal:
  `12.5, 14, 15.2`
- Si usas coma decimal, separa los datos con punto y coma: `12,5; 14; 15,2`
  (cuando el texto tiene `;`, la coma se interpreta como decimal).
- Para proporciones escribe solo `1` (éxito) y `0` (fracaso).
- En datos pareados, las dos listas deben tener la misma cantidad de datos y el
  mismo orden. Las diferencias se calculan como d = muestra 1 − muestra 2.

Si un dato no es un número válido, la página indica cuál es (por ejemplo
"El dato 2 («a») no es un número válido") y marca el campo en rojo.

Estadísticos calculados (fórmulas implementadas en `js/estadistica.js`):

| Estadístico | Fórmula |
|---|---|
| Media muestral | x̄ = Σxᵢ / n |
| Varianza muestral | s² = Σ(xᵢ − x̄)² / (n − 1) |
| Desviación estándar muestral | s = √s² |
| Proporción muestral | p̂ = x / n (x = número de unos) |

Con un solo dato no se puede calcular la varianza (n − 1 = 0) y la página lo indica.
Los resultados se muestran redondeados a 4 decimales, pero los cálculos usan
todos los decimales.

## Valores críticos (`js/valores-criticos.js`)

No se usa ninguna librería. Cada distribución tiene su función de distribución
acumulada (CDF), calculada con las funciones gamma y beta incompletas, y el valor
crítico es el número x tal que CDF(x) = probabilidad, que se busca por bisección.

**Convención:** la probabilidad es el **área acumulada a la izquierda** del valor
(igual que `NORM.S.INV`, `T.INV`, `CHISQ.INV` y `F.INV` de Excel). Por ejemplo,
con 95 % de confianza z_{α/2} = z₀.₀₂₅ deja 0.025 a la derecha, o sea 0.975 a la
izquierda.

| Función | Distribución y parámetros | Ejemplo |
|---|---|---|
| `valorCriticoZ(p)` | Normal estándar | `valorCriticoZ(0.975)` → 1.95996… |
| `valorCriticoT(p, gl)` | t de Student, gl grados de libertad | `valorCriticoT(0.975, 10)` → 2.22814… |
| `valorCriticoChi2(p, gl)` | Chi-cuadrada, gl grados de libertad | `valorCriticoChi2(0.95, 10)` → 18.30704… |
| `valorCriticoF(p, gl1, gl2)` | F, gl1 del numerador y gl2 del denominador | `valorCriticoF(0.95, 5, 10)` → 3.32583… |

Cada función devuelve un objeto con `distribucion`, `parametros`,
`areaIzquierda`, `areaDerecha`, `valor` y un texto `descripcion`, por ejemplo:
"Distribución t de Student, gl = 10; área a la izquierda = 0.975, área a la
derecha = 0.025". Si algo no es válido devuelve `{ error: "mensaje" }`.

**Rango admitido** (fuera de él se devuelve un error, no un valor):

- Probabilidad entre 0.000001 y 0.999999.
- Grados de libertad entre 1 y 1 000 000. Se aceptan valores no enteros (por
  ejemplo, los gl de Welch para dos medias con varianzas diferentes).
- Si un cálculo interno no converge, también se devuelve un error.

**Precisión y redondeo:** el valor crítico se devuelve con todos los decimales
y así debe usarse en los cálculos. Comparado con SciPy, el error relativo es
menor que 1×10⁻¹⁰ con gl ≤ 1000 y menor que 1×10⁻⁸ en todo el rango. Al mostrar
resultados se redondea a 4 decimales (función `formatear` de `js/app.js`).

## Interfaz: campos condicionales

Para mostrar u ocultar campos, cada bloque del HTML con la clase `condicional`
indica en sus atributos `data-tipo`, `data-caso`, `data-formato` y `data-sigma`
para qué opciones se debe ver. La función `actualizarCampos()` de `js/app.js`
compara esos atributos con lo elegido.

## Estructura

```
asistente-estadistico/
├── index.html       Página principal
├── css/
│   └── estilos.css  Estilos del sitio
├── js/
│   ├── estadistica.js  Lectura de listas y fórmulas de estadísticos
│   ├── valores-criticos.js  Valores críticos de Z, t, chi-cuadrada y F
│   ├── metodos.js   Reglas para identificar el método
│   ├── decisiones.js  Criterios de decisión de los intervalos de dos muestras
│   ├── intervalos.js  Intervalos de confianza de una y dos muestras
│   ├── pruebas.js   Pruebas de hipótesis
│   └── app.js       Interfaz: muestra campos y resultados
├── tests/
│   ├── estadistica.test.js  Pruebas de js/estadistica.js
│   ├── valores-criticos.test.js  Pruebas de js/valores-criticos.js
│   ├── metodos.test.js  Pruebas de js/metodos.js
│   ├── decisiones.test.js  Pruebas de js/decisiones.js
│   ├── intervalos.test.js  Pruebas de los intervalos de una muestra
│   ├── intervalos-dos-muestras.test.js  Pruebas de los intervalos de dos muestras
│   └── pruebas.test.js  Pruebas de js/pruebas.js (pruebas de hipótesis)
└── README.md
```

## Ejecutar localmente

**Opción 1 — Abrir el archivo directamente**

Haz doble clic en `index.html` (o arrástralo al navegador). No necesita instalar nada.

**Opción 2 — Servidor local (recomendado)**

Así se comporta igual que en Vercel. Usa cualquiera de estas opciones desde la
carpeta del proyecto:

- VS Code: instala la extensión *Live Server*, haz clic derecho en `index.html`
  y elige **Open with Live Server**.
- Python: `python -m http.server 8000` y abre <http://localhost:8000>.
- Node.js: `npx serve .` y abre la dirección que aparece en la terminal.

Para comprobar que funciona, al elegir un caso y un formato deben aparecer sus
campos, y la consola del navegador (F12) no debe tener errores.

## Ejecutar las pruebas

Las pruebas usan el ejecutor incluido en Node.js (versión 18 o más reciente),
sin instalar nada más. Desde la carpeta del proyecto:

```
node --test
```

Debe terminar con `fail 0`.

## Desplegar en Vercel

El proyecto es un sitio estático, así que no necesita configuración especial
(no hay `vercel.json` ni `package.json`).

1. Sube los cambios a GitHub (`git push`).
2. Entra a <https://vercel.com> e inicia sesión con tu cuenta de GitHub.
3. Elige **Add New… → Project** e importa el repositorio `asistente-estadistico`.
4. En la configuración deja:
   - **Framework Preset:** Other
   - **Build Command:** vacío
   - **Output Directory:** vacío (la raíz del proyecto)
5. Pulsa **Deploy**. Vercel te dará una URL pública.

Cada vez que hagas `git push` a la rama `main`, Vercel volverá a publicar el sitio
automáticamente.
