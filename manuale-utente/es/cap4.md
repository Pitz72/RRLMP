# Capítulo 4 — El flujo de trabajo básico: cargar y reproducir

---

El ciclo de trabajo de Runtime Live Machine Pro tiene tres fases: importar los archivos de audio, organizarlos en la rejilla y reproducirlos durante el directo. Este capítulo describe cada una con el detalle necesario para que puedas trabajar con seguridad incluso bajo presión.

---

## 4.1 Importar los archivos de audio

RLMP no tiene explorador interno ni biblioteca centralizada. La importación se hace con **arrastrar y soltar** directamente desde el gestor de archivos del sistema operativo (Explorador de archivos en Windows, Finder en macOS, Nautilus o equivalente en Linux). Si lo prefieres, desde el menú FILE puedes importar una lista de reproducción **M3U** y convertirla en una secuencia de clips.

### El gesto básico

1. Abre la carpeta de tu ordenador donde están los archivos de audio.
2. Selecciona uno o varios archivos. Para seleccionar varios: `Ctrl+Clic` para selección discontinua, `Shift+Clic` para selección continua.
3. Arrastra los archivos seleccionados sobre una de las columnas de la rejilla y suéltalos. Para los efectos de sonido, arrástralos directamente al pad FX (Capítulo 7).

Cada archivo genera una card en la columna de destino. Si arrastras varios archivos a la vez, las cards se crean siguiendo el orden en que aparecen en el gestor de archivos, de arriba abajo.

**Indicador de inserción.** Mientras arrastras, una línea azul luminosa recorre la columna señalando la posición exacta donde se insertarán las cards. Así puedes colocar los clips nuevos arriba, abajo o justo en medio, con total precisión.

### Formatos admitidos

El motor FFmpeg integrado garantiza compatibilidad con una amplia gama de formatos de audio:

| Formato | Extensión | Notas |
|---|---|---|
| MP3 | `.mp3` | Todos los bitrates |
| WAV | `.wav` | PCM sin comprimir, cualquier profundidad de bits |
| FLAC | `.flac` | Lossless, cualquier sample rate |
| AAC / M4A | `.aac`, `.m4a` | Incluye archivos de iTunes/Apple Music |
| OGG Vorbis | `.ogg` | |
| Opus | `.opus` | |
| WMA | `.wma` | Windows Media Audio |
| WebM / MP4 | `.webm`, `.mp4` | Pistas de audio contenidas en estos contenedores |

**Una nota sobre el rendimiento.** Gracias al protocolo de streaming `media://`, los archivos de audio no se cargan en la memoria RAM al importarlos. Un WAV sin comprimir de 2 GB se comporta igual que un MP3 de 5 MB: la carga es instantánea y el impacto en la memoria del sistema, insignificante. La CPU solo entra en juego durante la decodificación activa, es decir, mientras el clip suena.

### La ruta de los archivos

RLMP memoriza la **ruta absoluta** del archivo en el disco, no una copia del archivo. Si mueves, renombras o borras el original, la card correspondiente se pondrá roja y dejará de reproducirse. Para trabajar en varios ordenadores o crear versiones portables del proyecto, usa la función **Export Package**, descrita en el Capítulo 10.

---

## 4.2 Reproducción: arrancar y detener los clips

### Arrancar un clip

Basta un **clic izquierdo** sobre la card para arrancar la reproducción. La respuesta es inmediata: la card se enciende con el verde de estado activo, el temporizador pasa a cuenta atrás y los VU meter del encabezado reflejan la señal de salida.

Si al clip se le ha asignado una tecla (véase el Capítulo 8), esa tecla sirve como alternativa al clic, algo útil cuando estás operando en otra parte de la interfaz y prefieres no mover el ratón.

### Detener un clip

**Clic en el clip activo** — entra en fase de **fade out** y se detiene según el tiempo configurado en sus propiedades (véase el Capítulo 5).

**Tecla `Esc`** — detiene al instante todos los clips activos. Es el comando de emergencia, y funciona siempre que RLMP sea la ventana activa, incluso mientras estás escribiendo en un campo de texto.

**Botón PARAR TODO** del encabezado — hace lo mismo que `Esc`, pero con el ratón.

### La lógica de exclusión por columna

En la mayoría de las columnas, RLMP aplica la regla de **«un clip a la vez»**: si tienes sonando el *Tema A* en la columna Canciones y haces clic en el *Tema B* de esa misma columna, el *Tema A* se detiene con fade out y arranca el *Tema B*. No necesitas parar manualmente el clip en curso antes de lanzar otro.

La excepción principal son los **efectos del pad FX**: se superponen a todo, incluidos otros efectos, sin interrumpir nada de lo que ya esté sonando. Un aplauso puede arrancar en mitad de una canción sin cortarla.

Lo mismo ocurre con los clips que tienen el comportamiento **Stacco** (ráfaga, configurable en las propiedades; véase el Capítulo 5): se superponen sin detener el resto de clips de la columna, sea cual sea su posición.

---

## 4.3 Organizar la escaleta

### Reordenar los clips

Puedes reorganizar el orden de los clips en cualquier momento, tanto mientras preparas el show como con el show ya en marcha.

**Arrastre interno.** Haz clic en una card, mantenla pulsada y arrástrala hacia arriba o hacia abajo dentro de la misma columna. Una guía azul marca la posición de inserción, y el clip se coloca en su nuevo sitio sin interrumpir lo que esté sonando.

**Movimiento entre columnas.** También puedes arrastrar un clip de una columna a otra. Al hacerlo, el clip **hereda las reglas de la columna de destino**: si mueves una voz pregrabada a la columna Canciones, empezará a sufrir el ducking igual que cualquier tema musical.

Mover clips entre columnas cambia su comportamiento de audio, así que conviene hacerlo con cabeza, sobre todo durante el directo.

### Selección múltiple y borrado

Para quitar varios clips de la rejilla en una sola operación:

1. Haz `Ctrl+Clic` (Windows/Linux) o `Cmd+Clic` (macOS) sobre cada clip que quieras seleccionar. El borde se vuelve azul.
2. Pulsa `Supr` o `Delete`. Si has seleccionado más de un clip, el software te pedirá confirmación.

Borrar desde la rejilla solo quita los clips del proyecto actual, no los archivos de audio del disco. Si te equivocas, `Ctrl+Z` deshace la operación.

> **Consejo práctico.** Cuando el directo ya ha empezado, vaciar la columna Pre-Show con una selección múltiple y `Supr` es la manera más rápida de despejar la interfaz y pasar al modo operativo.

---

## 4.4 Cues de estructura: INTRO y OUTRO

Cada clip admite dos **marcadores estructurales**, configurables en el editor de la forma de onda (Capítulo 5):

- **Intro Marker** — marca el punto en el que entra la melodía principal del tema, tras la introducción instrumental. Útil para saber exactamente cuándo empezar a hablar sobre la intro.
- **Outro Marker** — marca el punto en el que arranca la cola final del tema, y avisa del momento justo para preparar la transición a la siguiente pista.

A medida que la reproducción se acerca a estos puntos, aparece un aviso visual en la card:

- **INTRO: −MM:SS** — cuenta atrás hasta el Intro Marker.
- **OUTRO IN: −MM:SS** — cuenta atrás hasta el Outro Marker, seguida de **🚨 OUTRO** en cuanto empieza la cola.

Estos avisos solo aparecen si has configurado los marcadores. Los clips sin marcadores muestran únicamente la cuenta atrás estándar hacia el final del tema.
