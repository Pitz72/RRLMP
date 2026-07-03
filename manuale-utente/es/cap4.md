# Capítulo 4 — El flujo de trabajo básico: cargar y reproducir

---

El ciclo operativo fundamental de Runtime Live Machine Pro se articula en tres fases: importar los archivos de audio, organizarlos en la rejilla, reproducirlos durante el directo. Este capítulo describe cada fase con la precisión necesaria para trabajar con seguridad incluso bajo presión.

---

## 4.1 Importar los archivos de audio

RLMP no dispone de un explorador interno ni de una biblioteca centralizada. La importación se hace mediante **arrastrar y soltar** directo desde el gestor de archivos del sistema operativo (Explorador de archivos en Windows, Finder en macOS, Nautilus o equivalentes en Linux). Como alternativa, desde el menú FILE puedes importar una lista de reproducción **M3U** y convertirla en una secuencia de clips.

### El gesto básico

1. Abre la carpeta de tu ordenador donde están los archivos de audio.
2. Selecciona uno o varios archivos. Para seleccionar varios: `Ctrl+Clic` para selección discontinua, `Shift+Clic` para selección continua.
3. Arrastra los archivos seleccionados sobre una de las columnas de la rejilla y suéltalos. Para los efectos de sonido, arrástralos directamente al pad FX (Capítulo 7).

Cada archivo genera una card en la columna de destino. Si arrastras varios archivos a la vez, las cards se crean en el orden en que los archivos aparecen en el gestor de archivos, de arriba abajo.

**Indicador de inserción.** Durante el arrastre, una línea azul luminosa recorre la columna indicando la posición exacta en la que se insertarán las cards. Puedes insertar clips nuevos arriba, abajo o en una posición intermedia con precisión.

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

**Una nota sobre el rendimiento.** El protocolo de streaming `media://` garantiza que los archivos de audio no se carguen en la memoria RAM en el momento de la importación. Un archivo WAV sin comprimir de 2 GB se comporta exactamente igual que un MP3 de 5 MB: la carga es instantánea y el impacto en la memoria del sistema es insignificante. Los recursos de la CPU solo se emplean durante la decodificación activa, es decir, durante la reproducción.

### La ruta de los archivos

RLMP memoriza la **ruta absoluta** del archivo en el disco, no una copia del archivo en sí. Si mueves, renombras o borras el archivo original, la card correspondiente se pondrá roja y dejará de ser reproducible. Para trabajar en varios ordenadores o crear archivos portables, utiliza la función **Export Package** descrita en el Capítulo 10.

---

## 4.2 Reproducción: arrancar y detener los clips

### Arrancar un clip

Un **clic izquierdo** sobre la card basta para arrancar la reproducción. La respuesta es inmediata: la card se enciende en el verde de estado activo, el temporizador pasa a la cuenta atrás y los VU meter del encabezado reflejan la señal de salida.

Si al clip se le ha asignado una tecla del teclado (véase el Capítulo 8), esa tecla funciona como alternativa al clic, útil cuando estás operando en otra parte de la interfaz y no quieres mover el ratón.

### Detener un clip

**Clic en el clip activo** — el clip entra en la fase de **fade out** y se detiene en el tiempo configurado en sus propiedades (véase el Capítulo 5).

**Tecla `Esc`** — detiene al instante todos los clips activos. Es el comando de emergencia. Funciona cuando RLMP es la ventana activa, incluso mientras escribes en un campo de texto.

**Botón PARAR TODO** en el encabezado — idéntico a `Esc`, accesible con el ratón.

### La lógica de exclusión por columna

En la mayoría de las columnas, RLMP aplica la regla **«un clip a la vez»**: si estás reproduciendo el *Tema A* en la columna Canciones y haces clic en el *Tema B* de la misma columna, el *Tema A* se detiene (con fade out) y arranca el *Tema B*. No hace falta detener manualmente el clip en curso antes de arrancar otro.

Los **efectos del pad FX** son la excepción principal: se superponen a todo, incluidos otros efectos, y no interrumpen lo que esté sonando. Un aplauso puede arrancar mientras suena una canción sin interrumpir su reproducción.

También los clips con el comportamiento **Stacco** (ráfaga; configurable en las propiedades, véase el Capítulo 5) se superponen sin detener los demás clips de la columna, con independencia de dónde se encuentren.

---

## 4.3 Organizar la escaleta

### Reordenar los clips

Durante la preparación del show, o incluso mientras el show está en marcha, puedes reorganizar el orden de los clips en cualquier momento.

**Arrastre interno.** Haz clic en una card, manténla pulsada y arrástrala hacia arriba o hacia abajo en la misma columna. La guía azul indica la posición de inserción. El clip se inserta en la nueva posición sin interrumpir las reproducciones en curso.

**Movimiento entre columnas.** Puedes arrastrar un clip de una columna a otra. Cuando lo haces, el clip **hereda las reglas de la columna de destino**: una voz pregrabada movida a la columna Canciones empezará a sufrir el ducking exactamente como un tema musical.

Mover clips entre columnas es una operación potente e intencionada. Usa la función de forma consciente, sobre todo durante el directo.

### Selección múltiple y borrado

Para quitar varios clips de la rejilla en una sola operación:

1. `Ctrl+Clic` (Windows/Linux) o `Cmd+Clic` (macOS) sobre cada clip que quieras seleccionar. El borde se vuelve azul.
2. Pulsa `Supr` o `Delete`. El software pide confirmación si el número de clips seleccionados es superior a uno.

El borrado desde la rejilla quita los clips del proyecto actual, no los archivos de audio del disco. Si te equivocas, `Ctrl+Z` deshace la operación.

> **Consejo práctico.** Con el directo ya empezado, vaciar la columna Pre-Show con una selección múltiple y `Supr` es la forma más rápida de liberar espacio visual en la interfaz y pasar al modo operativo.

---

## 4.4 Cues de estructura: INTRO y OUTRO

Cada clip puede tener dos **marcadores estructurales** configurados en el editor de la forma de onda (Capítulo 5):

- **Intro Marker** — el punto en el que la melodía principal del tema entra realmente, tras la introducción instrumental. Útil para saber exactamente cuándo empezar a hablar sobre la intro.
- **Outro Marker** — el punto en el que empieza la cola final del tema. Señala el momento justo para preparar la transición a la pista siguiente.

Cuando la reproducción de un clip se acerca a estos puntos, en la card aparece un aviso visual:

- **INTRO: −MM:SS** — cuenta atrás hasta el Intro Marker.
- **OUTRO IN: −MM:SS** — cuenta atrás hasta el Outro Marker, seguido de **🚨 OUTRO** cuando la cola ha comenzado.

Estos avisos solo se muestran si los marcadores se han configurado. En los clips sin marcadores, la card muestra únicamente la cuenta atrás estándar al final del tema.
