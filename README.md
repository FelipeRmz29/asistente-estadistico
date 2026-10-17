# asistente-estadistico

Aplicación web sencilla para resolver ejercicios del segundo parcial de Estadística
(intervalos de confianza y pruebas de hipótesis). Está hecha solo con HTML, CSS y
JavaScript, sin dependencias ni paso de compilación.

> Estado actual: interfaz para elegir el ejercicio y capturar los datos (Parte 2).
> Todavía no se realizan cálculos.

## Cómo se usa la interfaz

1. **¿Qué vas a resolver?** Intervalo de confianza (pide el nivel de confianza en %)
   o prueba de hipótesis (pide el nivel de significancia α).
2. **Caso:** una media, una proporción, una varianza, dos medias, dos proporciones,
   cociente de varianzas o muestras pareadas.
3. **Formato de los datos:** lista de valores individuales o estadísticas resumidas.
4. **Datos del ejercicio:** aparecen solo los campos del caso y formato elegidos.
   En una media y dos medias se pregunta si σ es conocida; en dos medias con σ
   desconocida, si las varianzas se suponen iguales o diferentes.

El botón **Revisar selección** indica si falta elegir algo y muestra un resumen.

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
│   └── app.js       Muestra u oculta campos según lo elegido
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
