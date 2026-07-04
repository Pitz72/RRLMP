# Capítulo 13 — Funciones avanzadas

---

Este capítulo reúne funciones que quedan fuera del flujo de trabajo básico, pero que, una vez descubiertas, se incorporan de forma estable a la práctica de quien produce shows con cuidado y regularidad. Hablamos de la NoteBoard, la gestión cromática de las columnas, las transiciones, los ajustes generales, el registro de los lanzamientos y el historial de cambios.

---

## 13.1 NoteBoard: el guion en regia

La **NoteBoard** es el sistema de notas integradas en los clips. Permite asociar a cualquier clip un texto escrito —instrucciones operativas, escaletas, apuntes sobre una entrevista, el texto completo de una cuña— para que aparezca automáticamente en pantalla en cuanto ese clip entra en reproducción.

### Insertar una nota

1. Abre los ajustes del clip con clic derecho sobre la card y ve a la sección *Notas*.
2. Escribe el texto en el campo libre; no hay límite de longitud.

Los clips que tienen una nota muestran la insignia 📋 en la card.

### El panel en directo

Cuando un clip con notas entra en reproducción, el **panel NoteBoard** aparece en la parte inferior de la pantalla con el texto asociado, encabezado por el nombre y el color del clip. Permanece visible mientras dura la reproducción y se cierra solo al terminar el clip. Si suenan varios clips con notas a la vez, el panel muestra el de mayor prioridad.

### Casos de uso

- **Regia hablada.** Asocia a cada sintonía las primeras líneas del bloque hablado que viene después: cuando arranca la sintonía, ya tienes el texto delante.
- **Contenido para leer.** Una cuña publicitaria con el texto completo en la nota, lista para leerse en cuanto arranca.
- **Instrucciones operativas.** «Bajar el monitor», «Comprobar el nivel de los auriculares del invitado», «Iniciar la grabación».
- **Entrevistas.** Las preguntas para el invitado quedan a la vista durante toda la duración del clip.

---

## 13.2 Personalización cromática de las columnas

Los colores por defecto siguen una convención ya asentada (verde para los Assets, rojo para las Canciones, y así con el resto), pero cada columna admite personalización. Al hacer clic en el **punto de color** del encabezado se abre una paleta de **30 colores**; elige uno y la columna entera —encabezado, cards, indicadores— adopta de inmediato el nuevo tono. La elección queda guardada en el archivo de proyecto.

Las cards heredan dinámicamente el color de su columna: en reposo se ven en un tono atenuado, y a pleno color cuando están en reproducción. Así, cada proyecto puede tener su propia identidad cromática.

---

## 13.3 Transiciones entre clips

Cuando un clip está configurado en *Play Next*, el paso al siguiente clip de la columna sigue el modo de transición que tengas configurado:

- **Crossfade.** El clip saliente se funde mientras el entrante sube, y ambos se superponen. Duración por defecto: 2 segundos.
- **Segue.** El clip saliente se funde a la salida mientras el siguiente arranca ya a pleno volumen. Duración por defecto del fundido: 0,8 segundos.
- **Gapless (corte seco).** El clip saliente se detiene en seco y el siguiente arranca de inmediato, sin fundido alguno.

Puedes fijar la transición para cada clip en particular o dejar **Predeterminado global**, que aplica la elección general definida en los Ajustes; la columna Pre-Show usa el crossfade por defecto. Todos los modos se pueden probar sin salir al aire, con el botón «Test →» del editor (Capítulo 5).

---

## 13.4 La ventana de Ajustes generales

Los **Ajustes** (menú Herramientas) reúnen las preferencias globales del software, organizadas por pestañas.

### Generales

- **Idioma.** Selecciona el idioma de la interfaz entre los ocho disponibles; el cambio se aplica al instante.
- **Control Remoto (Beta).** Activa el mando a distancia vía navegador y muestra PIN, puerto y direcciones (Capítulo 11).
- **Diseño de regia.** Muestra u oculta cada columna de la rejilla por separado. Ocultar una columna no borra sus clips, que siguen en el proyecto; es una preferencia global, válida para todos los proyectos.

### Audio & Mix

- **Dispositivo de salida.** El destino del audio (Capítulo 8).
- **Inteligencia de mezcla.** La magnitud del ducking —cuánto baja la música cuando habla una voz, 20 % por defecto— y su rapidez (500 ms por defecto).
- **Transiciones.** El modo de transición por defecto y las duraciones de crossfade y segue.

### Grabación

Aquí se resume el punto de captura (después del limiter) y se elige el formato por defecto que se propondrá en la exportación (Capítulo 9).

### Master Chain

- **Homologación del volumen.** Activa o desactiva la normalización de loudness y fija su objetivo (−16 LUFS por defecto).
- **Master Chain.** Activa la cadena completa o la deja en bypass, y permite ajustar cada etapa: frecuencia del HPF, estilo del glue multibanda, umbral del limiter. Un botón restaura los valores por defecto (Capítulo 6).

---

## 13.5 Playout Log

El **Playout Log** (icono en el encabezado) es el registro cronológico de los lanzamientos: guarda constancia de qué salió al aire y cuándo, hasta los últimos miles de eventos. Resulta útil para reconstruir una escaleta a posteriori, comprobar qué se transmitió o preparar un resumen del directo.

---

## 13.6 Deshacer y Rehacer

Los cambios en la escaleta —añadidos, movimientos, borrados— son reversibles. `Ctrl+Z` deshace la última operación y `Ctrl+Y` (o `Ctrl+Shift+Z`) la rehace, con un historial que llega a cubrir varias decenas de pasos. Las mismas opciones están disponibles en el menú Herramientas: es la red de seguridad para esas operaciones que se hacen con prisas durante la preparación.

---

## 13.7 Sistema de notificaciones toast

RLMP evita las ventanas bloqueantes para las comunicaciones de rutina. Las notificaciones no críticas aparecen como **toast**: pequeños avisos discretos en una esquina de la pantalla que se quedan unos segundos y luego desaparecen solos, sin interrumpir la reproducción. Sirven para confirmar un guardado, avisar de que una exportación ha terminado, de una operación de MIDI Learn o de archivos ausentes.

Las **ventanas de confirmación**, necesarias cuando una acción no tiene vuelta atrás (borrar clips, cerrar un proyecto sin guardar), sí son modales y exigen una respuesta, pero están pensadas para no cortar la reproducción en curso: el audio sigue sonando mientras decides.
