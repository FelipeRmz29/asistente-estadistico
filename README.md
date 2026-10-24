# asistente-estadistico

Aplicación web sencilla para resolver ejercicios del segundo parcial de Estadística:
intervalos de confianza y pruebas de hipótesis, paso a paso.

## Qué ejercicios resuelve

Cada caso se puede resolver como **intervalo de confianza** o como **prueba de
hipótesis**, con datos individuales (listas) o con estadísticas resumidas.

- Una media
- Una proporción
- Una varianza (y desviación estándar)
- Dos medias de muestras independientes
- Dos proporciones
- Cociente de varianzas
- Muestras pareadas

## Distribuciones que utiliza

Solo se usan las distribuciones normal (Z), t de Student, chi-cuadrada y F.

| Caso | Distribución |
|---|---|
| Una media, σ conocida o n ≥ 30 | Z |
| Una media, σ desconocida y n < 30 | t, ν = n − 1 |
| Una proporción | Z |
| Una varianza | chi-cuadrada, ν = n − 1 |
| Dos medias, σ conocidas (o ambas n ≥ 30 con varianzas iguales) | Z |
| Dos medias, σ desconocidas, varianzas iguales, ambas n < 30 | t, ν = n₁ + n₂ − 2 |
| Dos medias, σ desconocidas, varianzas diferentes (no ambas n ≥ 30) | t, ν de Welch |
| Dos proporciones | Z |
| Muestras pareadas | t, ν = n − 1 |
| Cociente de varianzas | F, ν₁ = n₁ − 1, ν₂ = n₂ − 1 |

## Tecnología

Está hecha solo con HTML, CSS y JavaScript, sin dependencias ni paso de compilación.
