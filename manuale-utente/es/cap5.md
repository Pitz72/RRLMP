# Capítulo 5 — Propiedades del clip y Waveform Editor

---

Cada archivo de audio llega con su propia historia antes de caer en la rejilla: grabaciones con segundos de silencio al principio, temas con colas interminables, entrevistas grabadas a un nivel demasiado bajo respecto al resto del show. Abrir un editor de audio externo cada vez que un archivo no está «listo para emisión» sería un incordio, así que RLMP incorpora un panel de ajustes para cada clip y un editor visual de la forma de onda con funciones de corte y marcado.

Todas las modificaciones hechas con estas herramientas son **no destructivas**: el archivo original del disco no se toca. RLMP guarda los ajustes en el archivo de proyecto `.lmp` y los aplica al vuelo durante la reproducción.

Para abrir los ajustes de un clip, haz **clic con el botón derecho** sobre la card.

---

## 5.1 Propiedades básicas

![La ventana de ajustes del clip, pestaña General.](../screenshots-es/impostazioni-clip.png)

*Figura 5.1 — Los ajustes del clip: Clip Name, Color Label, Volume Gain, Playback Behavior, Next Action y asignación de teclas.*

### Nombre y apariencia

**Clip Name.** Puedes ponerle al clip un nombre propio, distinto del nombre del archivo original, que se mostrará en la card de la rejilla. Conviene usar nombres descriptivos y útiles en el momento del directo: «SINTONÍA DE APERTURA» se lee de un vistazo, cosa que no ocurre con `sintonia_rev3_final_def.mp3` cuando solo tienes tres segundos para dar con el clip correcto.

**Color Label.** Por defecto el clip hereda el color de su columna, pero aquí puedes asignarle uno propio para que destaque a simple vista. Resulta útil para marcar clips críticos —la sintonía de cierre, por ejemplo— o para diferenciar grupos temáticos dentro de una misma columna.

### Volume Gain

El slider de ganancia va del 0 % al 150 % y actúa como un pre-fader sobre ese clip en concreto, antes del Master Volume global.

Se usa sobre todo para igualar niveles: si tienes un vocal grabado flojo —un mensaje de WhatsApp, una llamada telefónica— puedes subirlo por encima del 100 % para acercarlo al volumen del resto de las pistas. Y a la inversa, si un clip suena demasiado «caliente», puedes bajarlo sin tocar el Master Volume.

---

## 5.2 El editor de la forma de onda

![El editor de la forma de onda con las maniguetas de trim y los marcadores de estructura.](../screenshots-es/waveform-editor.png)

*Figura 5.2 — El editor de la forma de onda: maniguetas de Trim, marcadores de Intro y Outro, Auto-Trim, Smart Cues y fundidos.*

El editor visual es la herramienta más potente de todo el panel de ajustes. Ocupa la zona central y muestra la representación gráfica del audio completo del clip.

### Navegación en el editor

**Zoom horizontal.** La vista de la forma de onda se puede ampliar desde 1× (vista completa) hasta 8×, con pasos intermedios (1×, 2×, 3×, 4×, 6×, 8×), moviendo el slider de zoom o la rueda del ratón sobre el editor. Con zoom elevado, la vista se desplaza siguiendo la posición actual.

**Regla adaptativa.** El eje temporal de la parte superior del editor se adapta al nivel de zoom: en vista completa muestra referencias espaciadas, y al máximo zoom las condensa hasta marcar los segundos.

**Playhead.** Durante la reproducción de vista previa, un indicador vertical blanco recorre la forma de onda en tiempo real y señala la posición actual. Basta un clic sobre la forma de onda para mover la reproducción a ese punto.

### Las cuatro maniguetas

El editor tiene cuatro **handles** arrastrables, cada uno con su función y su color:

**Trim Start (manigueta roja, izquierda).** Define el punto de inicio real del clip: todo lo que quede a su izquierda se salta en la reproducción. Arrástrala hacia la derecha para quitar silencios o partes indeseadas del principio.

**Trim End (manigueta roja, derecha).** Define el punto final real; lo que quede a su derecha se ignora. Arrástrala hacia la izquierda para acortar la cola. Trim Start y Trim End no pueden cruzarse entre sí.

**Intro Marker (manigueta cian).** Señala el punto en el que la melodía principal entra en el tema, tras la introducción si la hay. Una vez fijado, la card en reproducción muestra la cuenta atrás **INTRO: −MM:SS**.

**Outro Marker (manigueta naranja).** Marca dónde empieza la cola del tema, normalmente el momento en el que conviene empezar a hablar para rellenar la transición. La card muestra entonces la cuenta atrás **OUTRO IN: −MM:SS**. Si el valor resulta incoherente con el trim o con la duración del clip, el software lo desactiva y avisa.

Además de arrastrarlas, cuatro botones *Set* fijan cada manigueta en la posición actual del playhead, útiles para marcar al vuelo mientras escuchas. Después puedes seguir ajustando los valores con precisión desde sus campos correspondientes.

### Auto-Trim (varita mágica)

El botón con el icono de la **varita mágica** activa la detección automática de silencios mediante FFmpeg. El umbral no está fijado de antemano: el software estima primero el nivel medio del archivo y coloca el umbral de silencio unos 25 dB por debajo (dentro de un rango de seguridad de −55 a −20 dB; si no logra estimarlo, cae en −40 dB). Trim Start y Trim End quedan así fijados automáticamente, sin que haga falta tocar nada, y los silencios iniciales y las colas mudas desaparecen.

Es una función especialmente útil para grabaciones vocales sin procesar —llamadas telefónicas, notas de voz, entrevistas grabadas con el móvil—. Pasar el Auto-Trim por toda la columna Voz antes de un show lleva menos de un minuto y deja las transiciones mucho más limpias.

> **Nota técnica.** El análisis se realiza en el Main Process mediante FFmpeg, sin cargar el archivo en memoria en el Renderer. En archivos de gran tamaño, el tiempo de análisis se mantiene en el orden de pocos segundos.

### Smart Cues (detección automática de los marcadores)

Junto al Auto-Trim está **Smart Cues**, que propone por su cuenta los marcadores de Intro y Outro. Con un umbral más agresivo, localiza el punto en el que el audio alcanza su plena energía (Intro) y aquel en el que arranca el fundido final (Outro), y coloca ambos marcadores sin que tengas que buscarlos de oído.

### Vista previa de la transición

Si hay un clip **siguiente** en la misma columna, el botón **«Test →»** reproduce los últimos segundos del clip actual y deja que se dispare la transición hacia el siguiente, sin salir del editor. Durante la vista previa, un botón *Stop* corta la prueba en cualquier momento.

---

## 5.3 Comportamientos y automatización

### Playback Behavior (modo de superposición)

**Normal** — el comportamiento por defecto. Cuando este clip arranca, interrumpe (con fade out) cualquier otro clip que esté sonando en la misma columna: es lo que corresponde a canciones y bases, donde una excluye a la otra.

**Stacco (Jingle)** — el clip arranca sin interrumpir a los demás. Tiene prioridad alta: silencia el resto de assets de la columna y baja la música, pero no detiene nada. Es el caso típico de un *station ID* («Estás escuchando…») que debe «cabalgar» sobre la intro de un tema, o de un jingle breve superpuesto a una base en loop.

### Next Action (automatización al final)

Define qué ocurre cuando el clip alcanza el punto de Trim End.

**Stop** — comportamiento por defecto para Canciones, Voz y Assets. El clip termina y se detiene.

**Play Next** — cuando el clip se acerca al final, arranca automáticamente el siguiente de la columna con la transición configurada, y en la card aparece la insignia **NEXT**. Es el comportamiento por defecto de la columna Pre-Show, y de hecho crea una lista automática: puedes activarlo en varios clips seguidos para armar bloques que fluyen sin cortes.

La reproducción en **loop** es una opción independiente: si está activa, el clip vuelve a empezar desde el principio (desde el Trim Start) sin solución de continuidad, con la insignia **LOOP** visible en la card. Resulta ideal para bases musicales, ambientes sonoros o sintonías de fondo que deben girar hasta que alguien las pare explícitamente. Los modos de transición —Crossfade, Segue, Gapless— se explican en el Capítulo 13.

---

## 5.4 Fundidos (Fade In y Fade Out)

El panel permite fijar, para cada clip, cuánto duran los fundidos de entrada y de salida. Los valores van de 0 a 60 000 milisegundos (60 segundos) y la curva aplicada es siempre lineal.

**Fade In.** El tiempo que tarda el volumen en alcanzar el nivel máximo desde el arranque: 2000 ms, por ejemplo, dan una subida gradual de dos segundos. Úsalo en bases musicales que deban aparecer con suavidad; en cambio, déjalo en 0 para voces y efectos que necesitan oírse de inmediato.

**Fade Out.** El tiempo de fundido al cierre, ya sea al hacer clic sobre un clip activo o durante una transición. Como referencia: 2000–3000 ms para canciones, 500–1000 ms para bases, 0 ms para ráfagas secas.

Un fade out a 0 ms corta en seco («hard cut»), algo que en un tema musical en directo puede sonar a fallo técnico. Conviene pensarlo bien antes de usarlo.

---

## 5.5 Asignación de controles

Cada clip puede lanzarse también desde una tecla del teclado o desde un controlador MIDI.

**Global Keybind.** La tecla asignada al clip. Se fija desde el campo correspondiente en los ajustes del clip (clic y luego pulsa la tecla deseada) o desde la ventana **Keybinds**, accesible desde el menú Herramientas; la insignia correspondiente aparece en la card. Si la tecla ya estaba asignada a otro clip, el software avisa del conflicto antes de sobrescribir nada.

**MIDI Bind.** La nota MIDI asignada (por ejemplo, `NOTE:60`). Se asigna con el modo **MIDI Learn** (véase el Capítulo 8), no tecleando el número a mano.

Los bindings de los clips se guardan en el archivo de proyecto, así que al llevarlo a otro ordenador con el mismo controlador MIDI los mapeos seguirán funcionando sin necesidad de reconfigurar nada.
