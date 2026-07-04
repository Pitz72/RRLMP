# Capítulo 7 — El pad FX y la vista Automix

---

Sobre la rejilla conviven dos superficies de trabajo, cada una invocable con una tecla y pensada para un momento distinto de la regia: el **pad FX**, para lanzar efectos y ráfagas al toque sin interrumpir nada, y la **vista Automix**, para llevar el flujo musical como lo haría un DJ. Ninguna resta espacio a la rejilla: se abren cuando hacen falta y se cierran con un clic.

---

## 7.1 El pad FX: la jingle machine

![El pad FX «jingle machine» abierto sobre la rejilla de regia.](../screenshots-es/pad-fx.png)

*Figura 7.1 — El pad FX: la jingle machine 5×5 de los efectos de sonido, con lanzamiento superpuesto.*

Los efectos de sonido no tienen columna propia en la rejilla: viven en el **pad FX**, un panel en forma de rejilla de celdas (una *jingle machine*) que se abre desde el botón **FX** del encabezado y queda flotando en una esquina de la pantalla.

El pad es un **overlay no bloqueante**: no oscurece la board ni intercepta los clics que hagas en otro sitio. Puedes lanzar un efecto y, en el mismo instante, seguir trabajando sobre las columnas o los comandos del encabezado. Por eso la tecla `Esc` no lo cierra: sigue reservada al comando PARAR TODO, siempre disponible. El pad se cierra desde su propio botón de cierre o volviendo a pulsar el toggle FX.

### Cargar y lanzar los efectos

El pad arranca con una rejilla de 25 celdas (5×5) y va añadiendo filas a medida que incorporas más efectos. Para llenarlo basta con **arrastrar los archivos de audio directamente sobre las celdas**, igual que harías con una columna de la rejilla.

Un clic en una celda **lanza el efecto**. Los efectos del pad son polifónicos y se superponen entre sí: varias celdas pueden sonar a la vez, encima de lo que esté en antena, sin detenerlo. El comportamiento del audio es idéntico al de un clip normal; lo único que cambia es desde dónde se lanza. Un contador junto al botón FX del encabezado muestra cuántos efectos están sonando en cada momento.

### Configurar un efecto

Los efectos se configuran en dos niveles, cada uno pensado para una necesidad distinta:

- **Ajustes rápidos** — lo habitual en una jingle machine: nombre, color, volumen, loop. Se resuelve en pocos segundos.
- **Ajustes completos** — la misma ventana que usan los clips de la rejilla (editor de la forma de onda, trim, marcadores, fade, asignación de teclas), a la que se llega desde la opción «Ajustes completos…» dentro de los rápidos.

### Posición del pad

El pad puede colocarse en la esquina inferior izquierda o en la inferior derecha: la preferencia se fija con las flechas del propio pad y queda recordada entre sesiones. A la derecha tapa la NoteBoard y la última columna, así que conviene elegir el lado según cómo tengas dispuesta la escaleta.

> **Nota.** En modo MIDI Learn, un clic en una celda del pad **selecciona** el efecto para la asignación en lugar de reproducirlo, de modo que no acabes mandando un jingle al aire mientras mapeas los controles (véase el Capítulo 8).

---

## 7.2 La vista Automix

![La vista Automix con el deck de la columna Música y los puntos de compatibilidad BPM.](../screenshots-es/vista-automix.png)

*Figura 7.2 — La vista Automix: el deck de la columna Música, la compatibilidad BPM y el modo automático al final del tema.*

La **vista Automix** es el deck de la columna Música: una pantalla a pantalla completa, invocada con el botón **MIX** del encabezado, que presenta la escaleta musical como una consola de DJ. Se abre por encima de la board pero por debajo del pad FX, de modo que los efectos siguen disponibles aunque el Automix esté abierto. Igual que en el pad, `Esc` no la cierra: sigue siendo el comando de emergencia, y el botón PARAR TODO se mantiene accesible en el encabezado.

### El deck

En el centro aparece el tema **en antena** y, junto a él, el **próximo** tema de la columna Música con su tiempo restante. Desde aquí se puede arrancar una pista y resolver el paso de un tema a otro con un solo comando: el botón grande de transición aplica el mismo crossfade que usarías desde la rejilla, pero además cuida el enganche rítmico.

### Compatibilidad y transiciones beat-matched

Junto a cada tema hay un **punto de compatibilidad** con el tema anterior que indica su afinidad rítmica:

- **Verde** — los dos tempos encajan bien y la transición puede ser beat-matched.
- **Amarillo** — el enganche es posible, aunque con alguna reserva.
- **Rojo** — los tempos están demasiado alejados para un enganche limpio.

Cuando el enganche rítmico no es viable —BPM no detectado, beat incierto, tempos demasiado distintos—, el software lo indica y recurre por su cuenta a un **crossfade clásico**, sin sorpresas en directo.

### El modo automático

Al final de la vista hay un interruptor para la **automatización al final del tema**. Activado, hace que RLMP resuelva por su cuenta el paso al tema siguiente cuando la pista en antena se acerca al final.

Este modo es una excepción deliberada dentro de la filosofía del software, que por principio no automatiza el show entero. De ahí que venga **desactivado por defecto** y solo funcione **mientras la vista Automix permanece abierta**: al cerrarla, la automatización se desactiva. Es la herramienta indicada para un bloque musical continuo —la media hora de solo música antes de volver a la voz—, no para todo el directo.
