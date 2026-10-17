# asistente-estadistico

Aplicación web sencilla para resolver ejercicios del segundo parcial de Estadística
(intervalos de confianza y pruebas de hipótesis). Está hecha solo con HTML, CSS y
JavaScript, sin dependencias ni paso de compilación.

> Estado actual: interfaz para elegir el ejercicio (Parte 2) y cálculo de
> estadísticos descriptivos a partir de listas de datos (Parte 3).
> Todavía no se resuelven intervalos de confianza ni pruebas de hipótesis.

## Cómo se usa la interfaz

1. **¿Qué vas a resolver?** Intervalo de confianza (pide el nivel de confianza en %)
   o prueba de hipótesis (pide el nivel de significancia α).
2. **Caso:** una media, una proporción, una varianza, dos medias, dos proporciones,
   cociente de varianzas o muestras pareadas.
3. **Formato de los datos:** lista de valores individuales o estadísticas resumidas.
4. **Datos del ejercicio:** aparecen solo los campos del caso y formato elegidos.
   En una media y dos medias se pregunta si σ es conocida; en dos medias con σ
   desconocida, si las varianzas se suponen iguales o diferentes.

El botón **Revisar datos** indica si falta elegir algo. Si los datos vienen en
lista, también calcula y muestra los estadísticos de cada muestra.

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
│   └── app.js       Interfaz: muestra campos y resultados
├── tests/
│   └── estadistica.test.js  Pruebas de js/estadistica.js
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
