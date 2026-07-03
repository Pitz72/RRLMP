# Capítulo 9 — Grabación de la sesión

---

La grabación de la sesión transforma Runtime Live Machine Pro de herramienta de playout en herramienta de producción completa. En lugar de exigir un software de grabación aparte o una cadena de enrutamiento virtual, RLMP captura directamente el **master mix posprocesado**, es decir, todo lo que sale de la aplicación, incluidos los efectos de la Master Chain, en un archivo de audio en el disco.

---

## 9.1 Iniciar la grabación

El control de la grabación está en el encabezado, identificado por el icono de grabación.

**Inicio.**
Haz clic en el botón de grabación. Un indicador rojo y un contador muestran que la captura está en curso. La grabación arranca de inmediato: todo lo que salga de la salida del software a partir de ese momento se captura.

No hace falta tener clips en reproducción para iniciar la grabación: puedes arrancar la captura por adelantado respecto al inicio del show, para no perder los primeros segundos en caso de partida anticipada.

**Qué se graba.**
La señal capturada es el **master después del limiter**: incluye la mezcla de todos los clips en reproducción y el procesado de toda la Master Chain (HPF, glue multibanda, limiter). Es exactamente la señal que llega al dispositivo de salida de audio.

**El formato interno.**
Durante la captura, RLMP escribe un flujo comprimido Opus (en contenedor WebM) a 320 kbps: ligerísimo en el disco y transparente a la escucha. La grabación continua tiene un límite de seguridad de unas **cuatro horas**; más allá de esa duración la captura se detiene automáticamente para no saturar la memoria.

**Overhead del sistema.**
La captura se realiza aguas abajo del motor de audio, sin cargar al Renderer. Puedes grabar sesiones de horas sin preocuparte por el consumo de recursos.

---

## 9.2 Detener la grabación y elegir el formato

Cuando vuelves a hacer clic en el botón para detener la grabación, se abre la **ventana de exportación**. Es el momento en que eliges en qué formato guardar el archivo: la conversión del flujo interno al formato final corre a cargo de FFmpeg.

### Formatos disponibles

| Formato | Extensión | Características |
|---|---|---|
| **WAV** | `.wav` | Lossless sin comprimir. Máxima calidad, archivos grandes. Ideal para archivo y posproducción. |
| **FLAC** | `.flac` | Lossless comprimido. Misma calidad que el WAV, tamaño reducido. Ideal para archivo. |
| **MP3** | `.mp3` | Lossy. Bitrate seleccionable. Ideal para distribución y podcast. |
| **OGG** | `.ogg` | Lossy open-source. Buena relación calidad/tamaño. |
| **WEBM** | `.webm` | Lossy, optimizado para la web. Corresponde al formato interno de captura. |

### Opciones de calidad

Para los formatos lossless (WAV y FLAC) puedes seleccionar la **profundidad de bits**: 16 bits (estándar CD), 24 bits (estándar profesional broadcast, valor por defecto) o 32 bits float (máxima precisión, si la grabación se va a masterizar después).

Para los formatos lossy (MP3, OGG, WEBM) puedes seleccionar el **bitrate** entre 128, 192, 256 y 320 kbps. Para un podcast destinado a la distribución en línea, 192 kbps estéreo es el mínimo recomendado; 256 kbps es el estándar actual para la calidad «transparente».

### Selección de la ruta de guardado

En la ventana de exportación eliges la carpeta de destino y el nombre del archivo. Si no especificas un nombre, RLMP genera uno basado en la fecha y la hora de la sesión. Al terminar la conversión, un toast de confirmación muestra la ruta del archivo guardado.

---

## 9.3 Consideraciones prácticas

### Sincronización con el show

La grabación captura todo el tiempo transcurrido entre Start y Stop, incluidos los silencios. Si arrancaste la captura 30 segundos antes del inicio real del show, el archivo resultante incluirá esos 30 segundos iniciales. Para un resultado listo para la distribución sin postedición, inicia la grabación exactamente cuando empieza el show.

### Grabación y backup simultáneos

El sistema de autoguardado del proyecto (véase el Capítulo 10) y la grabación de la sesión operan de forma independiente. Puedes grabar un show mientras el autoguardado salva silenciosamente el estado del proyecto: las dos operaciones no interfieren.

### Formato recomendado para distintos contextos

**Podcast** — MP3 256 kbps estéreo o FLAC 16 bits. El primero si distribuyes directamente el archivo, el segundo si pasarás por un editor.

**Archivo histórico** — WAV 24 bits o FLAC 24 bits. Tamaños generosos, máxima flexibilidad para eventuales remasterizaciones futuras.

**Radio / Streaming** — comprueba los requisitos de tu plataforma. La mayoría acepta MP3 128–192 kbps; algunas exigen WAV sin comprimir. RLMP exporta en los formatos más difundidos para cubrir cualquier escenario.
