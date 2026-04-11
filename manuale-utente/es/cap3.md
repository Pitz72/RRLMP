# CAPÍTULO 3: GESTIÓN DE AUDIO (FLUJO DE TRABAJO BÁSICO)

Ahora que conoce la interfaz, es el momento de "cargar la máquina".
En este capítulo aprenderá cómo importar archivos de audio, cómo controlar la reproducción y cómo mantener su lista de reproducción ordenada.

---

## 3.1 Importación (Drag & Drop)

Runtime Live Machine Pro no utiliza menús complejos de "Archivo > Importar". Está diseñado para trabajar directamente con las carpetas de su computadora.

### Cómo cargar los archivos
1.  Abra la carpeta de su computadora (Explorador de Archivos en Windows o Finder en Mac) donde guarda sus archivos de audio.
2.  Haga clic en el archivo deseado y, manteniéndolo presionado, **arrástrelo** dentro de una de las 5 columnas del software.
3.  Suelte el mouse.

El clip aparecerá instantáneamente como una nueva Tarjeta.

### Detalles de Importación
*   **Carga Múltiple**: Puede seleccionar 10, 20 o 50 archivos simultáneamente desde su carpeta y arrastrarlos todos juntos. El software creará una tarjeta para cada uno de ellos en secuencia.
*   **Formatos Soportados**: Gracias al motor nativo, RRLMP soporta casi todos los formatos de audio estándar: **MP3, WAV, AAC (m4a), OGG, FLAC**.
*   **Rendimiento**: No importa si carga un jingle de 2 segundos o un DJ Set de 2 horas en formato WAV no comprimido. La carga es **instantánea** y no consume la memoria RAM de la computadora, gracias a la tecnología *Direct Disk Streaming*.

> **Nota**: El software memoriza la "ruta" del archivo (ej. C:\Musica\Cancion.mp3). Si mueve o renombra el archivo original en su computadora, RRLMP ya no podrá encontrarlo (la tarjeta se volverá roja/inactiva). Para evitar este problema si cambia de PC, use la función "Export Package" (ver Cap. 7).

---

## 3.2 Reproducción (Play & Stop)

El sistema de reproducción está optimizado para evitar errores en vivo.

### Iniciar un Clip (Play)
*   **Clic Izquierdo**: Haga clic una vez en una tarjeta para iniciarla.
*   **Feedback**: El borde de la tarjeta se vuelve **Verde Brillante**, el icono "Play" pulsa y el temporizador comienza la cuenta regresiva.
*   **Barra Espaciadora**: Si ha asignado una tecla personalizada al clip (ver Cap. 6), puede presionarla para iniciarlo sin usar el mouse.

### Detener un Clip (Stop / Fade)
*   **Clic en Clip Activo**: Si hace clic en un clip que ya está sonando, este se detendrá.
    *   *Comportamiento Estándar*: El clip realiza un **Fade Out** (fundido) rápido en lugar de cortarse de golpe, para un efecto más profesional. (Los tiempos de fundido son personalizables, ver Cap. 4).
*   **Stop All**: Para detener todo inmediatamente (sin fundidos), presione la **Barra Espaciadora** (si está configurada), la tecla **ESC** o el botón rojo **STOP ALL** en la parte superior.

### La Regla de la Columna (Exclusión)
En una dirección de radio, generalmente no desea que dos canciones suenen simultáneamente una sobre la otra.
*   **Regla**: Si en la columna "CANCIONES" está sonando la *Canción A* y hace clic en la *Canción B* (en la misma columna), la *Canción A* se detiene automáticamente (con fundido) y comienza la *Canción B*.
*   **Excepción**: Esta regla no se aplica a la columna "SFX" o a los clips configurados como "Interrupción" (Stacco), que pueden sonar sobre los otros.

---

## 3.3 Organización de la Lista de Reproducción

Durante un show, las necesidades cambian. RRLMP le permite reorganizar la cuadrícula sobre la marcha.

### Mover los Clips (Reordenar)
¿Ha cargado la lista pero decide cambiar el orden de las canciones?
*   Haga clic en un clip y, manteniéndolo presionado, **arrástrelo** hacia arriba o hacia abajo. Una línea guía le mostrará dónde aterrizará.
*   **Movimiento entre Columnas**: Puede arrastrar un clip de una columna a otra (ej. del "Pre-Show" a la columna "Música").
    *   *Atención*: Cuando mueve un clip, este **hereda las reglas de la nueva columna**. Si mueve un jingle a la columna Música, comenzará a comportarse como una canción (sufrirá ducking por las voces, etc.).

### Selección Múltiple y Eliminación
Para limpiar rápidamente:
1.  **Selección Única**: Ctrl + Clic (Windows) o Cmd + Clic (Mac) en un clip lo selecciona (borde Azul) sin hacerlo sonar.
2.  **Selección Múltiple**: Mantenga presionado Ctrl y haga clic en diferentes clips para resaltarlos todos.
3.  **Eliminación**: Presione la tecla SUPR (o Del / Backspace) en el teclado.
    *   El software le pedirá confirmación si está eliminando muchos clips, para evitar errores accidentales.

> **Consejo Pro**: Use la selección múltiple para vaciar rápidamente la columna "Pre-Show" una vez iniciada la transmisión en vivo real, para tener una interfaz más limpia.
