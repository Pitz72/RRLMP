# Capítulo 9 — Grabación de la sesión

---

Grabar la sesión convierte a Runtime Live Machine Pro en algo más que una herramienta de playout: lo transforma en un auténtico sistema de producción. No hace falta un software de grabación aparte ni montar una cadena de enrutamiento virtual, porque RLMP captura directamente el **master mix posprocesado** —todo lo que sale de la aplicación, efectos de la Master Chain incluidos— y lo vuelca en un archivo de audio en el disco.

---

## 9.1 Iniciar la grabación

El control de grabación está en el encabezado, marcado con el icono correspondiente.

**Inicio.**
Haz clic en el botón de grabación. Un indicador rojo junto con un contador confirman que la captura ya está en marcha, y arranca de inmediato: desde ese instante, todo lo que sale por la salida del software queda capturado.

No necesitas tener clips en reproducción para empezar a grabar. De hecho conviene arrancar la captura un poco antes del inicio del show, así te aseguras de no perder los primeros segundos si la partida se adelanta.

**Qué se graba.**
La señal capturada es el **master después del limiter**: la mezcla de todos los clips en reproducción con el procesado completo de la Master Chain (HPF, glue multibanda, limiter) ya aplicado. Es, literalmente, la misma señal que llega al dispositivo de salida de audio.

**El formato interno.**
Mientras dura la captura, RLMP escribe un flujo comprimido Opus (en contenedor WebM) a 320 kbps, muy ligero en disco y transparente al oído. Existe eso sí un límite de seguridad de unas **cuatro horas** de grabación continua; pasado ese tiempo, la captura se detiene sola para no saturar la memoria.

**Overhead del sistema.**
Como la captura ocurre aguas abajo del motor de audio, no supone carga adicional para el Renderer. Puedes grabar sesiones de varias horas sin que el consumo de recursos sea un problema.

---

## 9.2 Detener la grabación y elegir el formato

Al volver a hacer clic en el botón se detiene la grabación y se abre la **ventana de exportación**, donde eliges el formato final del archivo. De la conversión del flujo interno a ese formato se encarga FFmpeg.

### Formatos disponibles

| Formato | Extensión | Características |
|---|---|---|
| **WAV** | `.wav` | Lossless sin comprimir. Máxima calidad, archivos grandes. Ideal para archivo y posproducción. |
| **FLAC** | `.flac` | Lossless comprimido. Misma calidad que el WAV, tamaño reducido. Ideal para archivo. |
| **MP3** | `.mp3` | Lossy. Bitrate seleccionable. Ideal para distribución y podcast. |
| **OGG** | `.ogg` | Lossy open-source. Buena relación calidad/tamaño. |
| **WEBM** | `.webm` | Lossy, optimizado para la web. Corresponde al formato interno de captura. |

### Opciones de calidad

En los formatos lossless (WAV y FLAC) puedes elegir la **profundidad de bits**: 16 bits (estándar CD), 24 bits (estándar profesional de broadcast y valor por defecto) o 32 bits float, pensado para cuando la grabación se va a masterizar más adelante.

En los formatos lossy (MP3, OGG, WEBM) se elige en cambio el **bitrate**, entre 128, 192, 256 y 320 kbps. Si el podcast va a distribuirse online, 192 kbps estéreo es el mínimo recomendable; 256 kbps se ha convertido en el estándar de facto para una calidad que suena «transparente».

### Selección de la ruta de guardado

Aquí también eliges la carpeta de destino y el nombre del archivo. Si no le pones nombre, RLMP genera uno a partir de la fecha y la hora de la sesión, y al terminar la conversión un toast de confirmación indica dónde ha quedado guardado el archivo.

---

## 9.3 Consideraciones prácticas

### Sincronización con el show

La grabación registra todo lo que pasa entre Start y Stop, silencios incluidos. Si arrancaste la captura 30 segundos antes del inicio real del show, esos 30 segundos quedarán al principio del archivo. Para tener un resultado listo para distribuir sin necesidad de postedición, lo mejor es iniciar la grabación justo cuando arranca el show.

### Grabación y backup simultáneos

El sistema de autoguardado del proyecto (Capítulo 10) funciona en paralelo a la grabación de la sesión, sin que una dependa de la otra. Puedes grabar un show mientras el autoguardado va salvando el estado del proyecto en silencio: no hay interferencia entre ambas.

### Formato recomendado para distintos contextos

Para **podcast**, lo habitual es MP3 256 kbps estéreo si vas a distribuir el archivo tal cual, o FLAC 16 bits si todavía pasará por un editor.

Cuando se trata de **archivo histórico**, conviene apostar por WAV 24 bits o FLAC 24 bits: pesan más, pero dejan margen para remasterizaciones futuras.

Para **radio o streaming**, conviene revisar antes los requisitos de la plataforma de destino. La mayoría admite MP3 entre 128 y 192 kbps, aunque alguna exige WAV sin comprimir; RLMP cubre ambos casos exportando en los formatos más habituales del sector.
