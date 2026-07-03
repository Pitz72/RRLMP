# Capítulo 3 — La interfaz de trabajo

---

La interfaz de Runtime Live Machine Pro está construida para el contexto operativo más exigente: el directo. Cada decisión visual —el tema oscuro, el alto contraste, el tamaño de los controles— responde a un requisito funcional. No es estética por la estética, sino ergonomía.

Cuando abres un proyecto, la pantalla se divide en dos zonas distintas: la **Barra de Control** arriba, que gestiona el proyecto y el sistema, y la **Rejilla de Regia** central, donde se desarrolla el trabajo real.

---

## 3.1 La Barra de Control (Header)

El encabezado ocupa todo el ancho de la pantalla. De izquierda a derecha, reúne la identidad del software, los comandos sobre los archivos, la monitorización y los controles de transporte, el menú de herramientas y los indicadores de sesión.

### Identidad

**Logo e insignia PRO.** A la izquierda, el logo acompaña al rótulo **RLM PRO** —la palabra «PRO» se representa con un gradiente iridiscente que pasa del cian al verde, al ámbar, al rojo. Al lado, en caracteres monoespaciados, se indica la versión instalada (`v1.11.5`). Al pasar el ratón sobre el logo aparece el nombre completo del software con el número de versión.

### Menú Archivo

El botón **FILE** abre un menú con las operaciones sobre los proyectos:

- *Nuevo Proyecto* — abre una sesión vacía. Si hay cambios sin guardar, el software pide confirmación.
- *Guardar proyecto* — guardado rápido en el archivo `.lmp` actual. La opción se resalta en amarillo cuando hay cambios sin guardar.
- *Guardar como…* — abre siempre el cuadro de diálogo, para crear versiones progresivas (p. ej. `Ep47_borrador.lmp`, `Ep47_final.lmp`).
- *Cargar Proyecto* — abre un proyecto `.lmp` del disco.
- *Importar M3U* — importa una lista de reproducción en formato M3U como secuencia de clips.
- *Exportar archivo autónomo* — crea una copia autocontenida del proyecto, incluidos los archivos de audio. Descrito en el Capítulo 10.

### Monitorización y transporte

**VU Meter estéreo (L/R).** Dos barras horizontales muestran el nivel de audio real en la salida, después del Master Volume. La escala cromática es intuitiva: verde hasta cerca del 85 % del recorrido, luego amarillo y por último rojo cerca del fondo de escala. El rojo persistente indica clipping: baja el nivel.

**Master Volume.** El fader controla el volumen general de salida del software, de 0 a 100 %. Actúa como un fader máster: llevado a cero, no sale ningún sonido, con independencia del estado de cada clip. Si has mapeado un control MIDI en el Master Volume, una pequeña insignia muestra su asignación.

**PARAR TODO (botón rojo «ALL»).** Detiene al instante todos los clips activos y anula los fades en curso. Es el comando de emergencia del sistema. La tecla `Esc` del teclado ejecuta la misma función cuando la aplicación tiene el foco, incluso mientras escribes en un campo de texto.

> **Nota.** A diferencia de las versiones anteriores, `Esc` ya no está registrada como atajo global del sistema: actúa cuando RLMP es la ventana activa. Esta decisión permite que los cuadros de diálogo usen `Esc` para cerrarse sin detener el directo.

**FX.** Abre y cierra el pad FX, la *jingle machine* de los efectos (Capítulo 7). Un pequeño contador señala cuántos efectos se están reproduciendo en ese momento.

**MIX.** Abre y cierra la vista Automix, el deck dedicado a la columna Música (Capítulo 7).

### Herramientas

El menú **Herramientas** (icono de llave inglesa) reúne:

- *Deshacer* y *Rehacer* — el historial de cambios de la escaleta (`Ctrl+Z` / `Ctrl+Y`).
- *MIDI Learn* — activa el modo de aprendizaje MIDI (Capítulo 8).
- *Keybinds* — la ventana de asignación de teclas a los clips.
- *Ajustes* — las preferencias globales del software (Capítulo 13).
- *Info* — versión, créditos y control manual de las actualizaciones.

Justo debajo del menú aparece durante unos instantes el indicador *Auto-saved*, que confirma que el proyecto se ha guardado automáticamente.

![La Barra de Control con el menú Herramientas abierto.](../screenshots-es/barra-controllo.png)

*Figura 3.1 — La Barra de Control y el menú Herramientas abierto (Deshacer/Rehacer, MIDI Learn, Keybinds, Ajustes generales, Info).*

### Indicadores de sesión

En el lado derecho del encabezado encuentran su sitio el botón del **Playout Log** (el registro cronológico de los lanzamientos, Capítulo 13), el botón de **Grabación** (Capítulo 9), el **temporizador On Air** (que en directo muestra `ON AIR HH:MM:SS` sobre fondo rojo) y el **reloj de estudio** digital en formato de 24 horas, sincronizado con el reloj del sistema.

En la zona del encabezado pueden aparecer además notificaciones no intrusivas (**toast**) relativas a operaciones completadas o avisos del sistema. A diferencia de los diálogos bloqueantes, los toast desaparecen solos tras unos segundos y no interrumpen la reproducción.

---

## 3.2 La rejilla de seis columnas

![La rejilla de regia de seis columnas con clips de ejemplo y sus indicadores de estado.](../screenshots-es/interfaccia-principale.png)

*Figura 3.2 — La interfaz de trabajo: la rejilla de seis columnas con las cards de audio.*

La rejilla es el centro operativo del software: seis columnas verticales una junto a otra, cada una con su propio encabezado cromático y su propia lógica de comportamiento de audio. Los efectos de sonido no tienen columna en la rejilla: viven en el pad FX (Capítulo 7).

### Encabezados de columna

Cada encabezado indica el nombre de la columna, su tipología y hace de indicador de estado. En condiciones normales es estático y está coloreado en el tono característico de la columna. Cuando el clip en reproducción es el último disponible de la columna, no está en loop y faltan menos de **20 segundos** para el final, el encabezado entra en alarma **DEAD AIR**: pulsa, vira al ámbar, muestra un icono de aviso y la insignia **END**. Es la antelación que te da tiempo a preparar la pista siguiente antes del silencio.

El color de cada columna es personalizable: haz clic en el punto de color del encabezado para abrir una paleta de **30 tonos**. La elección se guarda en el archivo de proyecto.

En el encabezado de la columna **Pre-Show** aparece además un botón de **rotación**: cuando está activo, la cola previa al directo inserta automáticamente jingles y promos a intervalos regulares (Capítulo 13).

### Las seis columnas

**Show Assets (Verde)**
Los elementos estructurales del show: sintonías, bases musicales, fondos (*bed*), ráfagas institucionales. Se comportan como elementos de segundo plano: ceden espacio cuando llegan voces o canciones, pero mantienen la rotación interna hasta que se detienen.

**Jingle (Ámbar)** y **Promo (Cian)**
Dos columnas dedicadas, respectivamente, a los jingles identificativos y a las promos o autopromociones. En el plano del audio se comportan exactamente como los Show Assets (pertenecen a la misma familia), pero mantenerlas separadas conserva la escaleta ordenada y legible.

**Canciones del episodio (Rojo)**
La lista de reproducción musical. Los clips de esta columna participan activamente en la mezcla automática: se bajan cuando suenan las voces y, a su vez, silencian las bases de los Assets cuando entran en reproducción (Capítulo 6). En los clips musicales el software detecta automáticamente el **BPM**, mostrado con su insignia.

**Voz / Grabaciones (Naranja)**
Entrevistas, bloques hablados pregrabados, mensajes de voz. Esta columna tiene la **máxima prioridad** en el sistema de mezcla: cuando un clip de aquí está en reproducción, todas las demás señales se bajan a un nivel de fondo.

**Pre-Show (Violeta)**
La lista de calentamiento previa al directo. Funciona como una cola musical autónoma, con rotación opcional de jingles y promos. Cuando empieza el directo propiamente dicho, esta columna suele vaciarse o desactivarse.

---

## 3.3 La Card de Audio (Clip)

Cada archivo de audio importado se materializa en la rejilla como una **card** rectangular. La card es la unidad operativa del sistema: la ves, la lanzas, la configuras, la mueves.

### Anatomía de una card

**Título y artista.** El nombre del archivo o el nombre personalizado asignado en las propiedades. El título personalizado solo cambia la etiqueta dentro del software; el archivo original en el disco permanece intacto. En los clips musicales, bajo el título puede aparecer el nombre del artista.

**Temporizador.** En reposo, muestra la duración total del clip en formato `MM:SS`. Durante la reproducción pasa a la **cuenta atrás**, con el prefijo negativo (p. ej. `−01:20`). Cuando faltan menos de 15 segundos para el final, el temporizador se pone **rojo**.

**Insignias de estado.** Pequeñas etiquetas comunican de forma inmediata las propiedades configuradas:

- **STACCO** — el clip está configurado para superponerse a los demás sin detenerlos.
- **LOOP** — el clip volverá a empezar desde el principio al terminar la reproducción.
- **NEXT** — al terminar este clip arrancará automáticamente el siguiente de la columna.
- **▶ UP NEXT** — resalta cuál será el próximo clip en arrancar en la secuencia automática.
- **### BPM** — el tempo detectado, en los clips musicales.
- **TRIM…** — análisis del silencio en curso (Auto-Trim).
- **FADE OUT** — aparece en el clip saliente durante un crossfade o un fundido.
- **📋** — el clip tiene una nota asociada en la NoteBoard (Capítulo 13).

**Asignaciones.** Si el clip tiene una tecla del teclado asignada, la letra aparece en una insignia del color de la columna; si tiene un binding MIDI, aparece la etiqueta `M` seguida del número de nota (p. ej. `M60`).

**Cues de estructura.** Si hay marcadores configurados, durante la reproducción aparecen las cuentas atrás `INTRO: −MM:SS` (en cian) y `OUTRO IN: −MM:SS` (en naranja), hasta el aviso `🚨 OUTRO` cuando la cola ha comenzado.

**Indicador de reproducción.** Cuando un clip está en play, la card se enciende: borde verde, fondo con un halo luminoso, un punto parpadeante y el título resaltado. La barra de avance recorre el fondo de la card.

### Interacción con las cards

- **Clic izquierdo** — arranca el clip si está parado; lo detiene (con fade out) si está en reproducción.
- **Ctrl + Clic** (Windows/Linux) o **Cmd + Clic** (macOS) — selecciona el clip sin arrancarlo. El borde se vuelve azul. Útil para la selección múltiple y el borrado en bloque.
- **Tecla Supr** (o *Delete* / *Backspace*) — borra los clips seleccionados de la rejilla. Si hay varios clips seleccionados, el software pide confirmación.
- **Clic derecho** — abre los **Ajustes del clip**: propiedades, editor de la forma de onda, notas (Capítulo 5).
- **Arrastrar y soltar** — arrastra una card para reordenarla dentro de la columna o moverla a otra. Un indicador luminoso azul muestra la posición de inserción durante el arrastre.

### Cards en estado de error

Una card con la indicación **ARCHIVO AUSENTE** y el borde rojo señala que el archivo de audio referenciado ya no es accesible: se ha movido, se ha renombrado o está en un disco externo no conectado. El clip no es reproducible hasta que el archivo vuelva a estar disponible en la ruta original. La gestión de los errores de ruta se trata en el Capítulo 14.
