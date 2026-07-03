# Capítulo 13 — Funciones avanzadas

---

Este capítulo reúne las funcionalidades que no pertenecen al flujo de trabajo básico, pero que, una vez descubiertas, entran de forma estable en la práctica de quien produce shows con cuidado y regularidad: la NoteBoard, la gestión cromática de las columnas, las transiciones, los ajustes generales, el registro de los lanzamientos y el historial de cambios.

---

## 13.1 NoteBoard: el guion en regia

La **NoteBoard** es el sistema de notas integradas a los clips. Permite asociar a cualquier clip un texto escrito (instrucciones operativas, escaletas, apuntes sobre una entrevista, el texto completo de una cuña) y hacerlo aparecer automáticamente en la pantalla en el momento en que ese clip entra en reproducción.

### Insertar una nota

1. Abre los ajustes del clip (clic derecho sobre la card) y ve a la sección *Notas*.
2. Escribe el texto en el campo libre. No hay límite de longitud.

Los clips con una nota muestran la insignia 📋 en la card.

### El panel en directo

Cuando un clip con notas entra en reproducción, el **panel NoteBoard** aparece en la parte inferior de la pantalla con el texto asociado, encabezado por el nombre y el color del clip. El panel permanece visible durante toda la reproducción y se cierra solo cuando el clip termina. Si varios clips con notas suenan a la vez, el panel muestra el de mayor prioridad.

### Casos de uso

- **Regia hablada.** Asocia a cada sintonía las primeras líneas del bloque hablado que sigue: cuando la sintonía arranca, el texto ya está delante de tus ojos.
- **Contenido para leer.** Una cuña publicitaria con el texto completo en la nota: en cuanto arranca, se lee.
- **Instrucciones operativas.** «Bajar el monitor», «Comprobar el nivel de los auriculares del invitado», «Iniciar la grabación».
- **Entrevistas.** Las preguntas para el invitado quedan visibles durante toda la duración del clip.

---

## 13.2 Personalización cromática de las columnas

Los colores por defecto tienen un significado consolidado (verde para los Assets, rojo para las Canciones, y así sucesivamente), pero cada columna es personalizable. Haz clic en el **punto de color** del encabezado de la columna: se abre una paleta de **30 colores**. Elige uno y la columna (encabezado, cards, indicadores) asume de inmediato el nuevo color. La elección se guarda en el archivo de proyecto.

Las cards heredan dinámicamente el color de la columna: en reposo aparecen en un tono atenuado, en reproducción en el color pleno. Cada proyecto puede tener así su propia identidad cromática.

---

## 13.3 Transiciones entre clips

Cuando un clip está configurado en *Play Next*, el paso al clip siguiente de la columna se produce según el modo de transición configurado:

- **Crossfade.** El clip saliente se funde mientras el entrante sube, superpuestos. Duración por defecto: 2 segundos.
- **Segue.** El clip saliente se funde a la salida mientras el siguiente arranca enseguida a pleno volumen. Duración por defecto del fundido: 0,8 segundos.
- **Gapless (corte seco).** El clip saliente se detiene de golpe y el siguiente arranca de inmediato, sin fundido.

Puedes fijar una transición a nivel de cada clip o dejar **Predeterminado global**, que aplica la elección general definida en los Ajustes. La columna Pre-Show usa el crossfade como opción por defecto. Todos los modos son probables sin salir al aire mediante el botón «Test →» del editor (Capítulo 5).

---

## 13.4 La ventana de Ajustes generales

Los **Ajustes** (menú Herramientas) reúnen las preferencias globales del software, organizadas en pestañas.

### Generales

- **Idioma.** Selecciona el idioma de la interfaz entre los ocho disponibles. El cambio es inmediato.
- **Control Remoto (Beta).** Activa el mando a distancia vía navegador y muestra PIN, puerto y direcciones (Capítulo 11).
- **Diseño de regia.** Muestra u oculta individualmente las columnas de la rejilla. Ocultar una columna no elimina sus clips: permanecen en el proyecto. Es una preferencia global, válida para todos los proyectos.

### Audio & Mix

- **Dispositivo de salida.** El destino de audio (Capítulo 8).
- **Inteligencia de mezcla.** La magnitud del ducking (cuánto baja la música cuando habla una voz, por defecto 20 %) y su rapidez (por defecto 500 ms).
- **Transiciones.** El modo de transición por defecto y las duraciones de crossfade y segue.

### Grabación

Resumen del punto de captura (después del limiter) y elección del formato por defecto propuesto en la exportación (Capítulo 9).

### Master Chain

- **Homologación del volumen.** Activa/desactiva la normalización de loudness y fija su objetivo (por defecto −16 LUFS).
- **Master Chain.** Activa o hace bypass de toda la cadena, y ajusta cada etapa: frecuencia del HPF, estilo del glue multibanda, umbral del limiter. Un botón restaura los valores por defecto (Capítulo 6).

---

## 13.5 Playout Log

El **Playout Log** (icono en el encabezado) es el registro cronológico de los lanzamientos: lleva la cuenta de lo que salió al aire y cuándo, hasta los últimos miles de eventos. Es útil para reconstruir una escaleta a posteriori, verificar qué se transmitió o compilar un resumen del directo.

---

## 13.6 Deshacer y Rehacer

Los cambios en la escaleta (adiciones, movimientos, borrados) son reversibles. `Ctrl+Z` deshace la última operación, `Ctrl+Y` (o `Ctrl+Shift+Z`) la rehace, con un historial profundo de varias decenas de pasos. Las mismas opciones están disponibles en el menú Herramientas. Es la red de seguridad para las operaciones hechas con prisa durante la preparación.

---

## 13.7 Sistema de notificaciones toast

RLMP no usa ventanas bloqueantes para las comunicaciones de rutina. Las notificaciones no críticas aparecen como **toast**: pequeños banners no intrusivos en una esquina de la pantalla, que permanecen unos segundos y desaparecen solos sin interrumpir la reproducción. Se usan para confirmar un guardado, el fin de una exportación, una operación de MIDI Learn o para avisar de archivos ausentes.

Las **ventanas de confirmación**, necesarias cuando una acción es irreversible (el borrado de clips, el cierre de un proyecto sin guardar), son en cambio modales y requieren una respuesta, pero están diseñadas para no cortar la reproducción en curso: el audio continúa mientras decides.
