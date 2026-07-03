# Capítulo 8 — Hardware, teclado y MIDI

---

Runtime Live Machine Pro está diseñado para integrarse con el hardware existente en el estudio sin exigir configuraciones elaboradas. Este capítulo describe cómo dirigir la salida de audio, cómo usar el teclado del ordenador como controlador y cómo conectar dispositivos MIDI físicos para un control táctil de la regia.

---

## 8.1 Enrutamiento de audio

### Seleccionar el dispositivo de salida

Por defecto, RLMP sale por el dispositivo de audio predeterminado del sistema operativo. En un contexto profesional o semiprofesional, con mixers USB, tarjetas de sonido externas o sistemas multipista, conviene seleccionar explícitamente el destino de la señal.

1. Abre los **Ajustes** desde el menú Herramientas.
2. En la pestaña *Audio & Mix*, abre el menú del dispositivo de salida: encontrarás la lista de los dispositivos de audio disponibles en el sistema.
3. Selecciona el dispositivo deseado.

Si el dispositivo elegido se desconecta, RLMP recurre automáticamente al del sistema; la app monitoriza las conexiones y reacciona a la inserción o la retirada de dispositivos USB.

### Mixers USB y setup multicanal

Los mixers USB como el Rødecaster Pro, el RØDECaster Duo o el Focusrite Scarlett suelen exponer varios canales USB al sistema operativo (Main Mix, Sounds/Chat, Monitor, etc.). RLMP aparece como una única fuente estéreo; la elección del canal USB al que dirigirlo está en tus manos.

**Setup recomendado con mixer USB.** Asigna RLMP a un canal secundario del mixer (p. ej. «Sounds» en el Rødecaster Pro) en lugar del canal principal. Así controlas el volumen de RLMP con un fader físico dedicado, lo separas de la señal del micrófono físico y aplicas el procesado hardware que quieras solo a ese canal.

### Latencia y buffer

RLMP utiliza las API de audio nativas del sistema operativo. La latencia de salida la determina el buffer del dispositivo de audio, no el software. Con tarjetas de sonido profesionales la latencia es del orden de pocos milisegundos, imperceptible en un contexto de playout.

Si notas artefactos de audio (chasquidos, dropouts), el valor de buffer del dispositivo probablemente sea demasiado bajo. Súbelo desde el panel de control de la tarjeta de sonido (no desde RLMP, que no gestiona directamente el driver): un buffer de 256 o 512 muestras es el punto de equilibrio ideal entre latencia y estabilidad.

---

## 8.2 Control desde el teclado

El teclado del ordenador es el controlador más rápido disponible en directo: no exige coordinación ojo-mano, funciona a oscuras y está siempre al alcance. RLMP prevé un conjunto de atajos globales y la posibilidad de asignar teclas a cada clip.

### Atajos globales

| Tecla | Acción |
|---|---|
| **Esc** | PARAR TODO — detiene todos los clips activos |
| **Supr / Backspace** | Elimina los clips seleccionados |
| **Ctrl+Z** | Deshace el último cambio en la escaleta |
| **Ctrl+Y** (o **Ctrl+Shift+Z**) | Rehace el cambio deshecho |
| **Ctrl+Shift+D** | Muestra/oculta el Debug Overlay |
| **Ctrl+Shift+M** | Abre el simulador MIDI (para pruebas sin controlador) |

`Esc` actúa como PARAR TODO cuando RLMP es la ventana activa, incluso mientras el cursor está en un campo de texto. Ya no es un atajo registrado a nivel de sistema operativo: si la app está en segundo plano, trae primero la ventana al frente.

> **Nota.** No existen teclas de función (F1–F5) preasignadas al lanzamiento de las columnas. Para lanzar rápidamente un clip concreto, asígnale una tecla dedicada, como se describe a continuación.

### Teclas personalizadas por clip

Además de los atajos globales, cada clip puede tener una tecla dedicada. La insignia correspondiente aparece en la card.

**Para asignar una tecla:**
1. Abre los ajustes del clip (clic derecho sobre la card) o la ventana **Keybinds** desde el menú Herramientas.
2. Haz clic en el campo de la tecla.
3. Pulsa la tecla deseada.

**Teclas disponibles.** Casi cualquier tecla: letras (A–Z), números (0–9), teclado numérico, barra espaciadora, teclas de función libres. Si la tecla ya está asignada a otro clip, el software avisa del conflicto antes de sobrescribir, para que no crees duplicados invisibles.

**Seguridad durante la escritura.** Las teclas personalizadas se desactivan automáticamente cuando estás en modo de inserción de texto (estás renombrando un clip o escribiendo una nota). Esto evita lanzamientos accidentales mientras tecleas.

---

## 8.3 Controlador MIDI

El MIDI es la opción profesional para un control físico, táctil y fiable. RLMP admite los controladores USB-MIDI: teclados, pads (p. ej. Novation Launchpad), controladores de fader (p. ej. Korg nanoKONTROL2), superficies de control híbridas.

### Conexión

Conecta el controlador USB al ordenador y arranca RLMP. El software detecta los dispositivos mediante la Web MIDI API del sistema y reconoce en tiempo real la conexión y la desconexión de un controlador. La mayoría de los controladores USB-MIDI es *class-compliant* y no requiere driver; para superficies profesionales con driver propietario, instala el driver antes de conectar el dispositivo.

### MIDI Learn

RLMP no exige conocer la numeración de las notas MIDI ni configurar los mensajes a mano. El aprendizaje se realiza mediante el modo **MIDI Learn**, desde el menú Herramientas (o desde la ventana Keybinds).

**Para mapear un clip a una tecla/pad:**
1. Activa MIDI Learn. Las cards entran en estado de espera.
2. Selecciona el clip (o la celda del pad FX) que quieras mapear.
3. Toca la nota, pulsa el pad o la tecla del controlador. La insignia `M` con el número de nota aparece en la card.

**Para mapear las funciones globales:**
- Selecciona **PARAR TODO** y pulsa una tecla del controlador: esa tecla ejecutará el Stop All.
- Selecciona el **Master Volume** y mueve un fader o un potenciómetro: ese control gestionará el volumen máster de forma continua.

Al terminar, desactiva MIDI Learn para volver al modo operativo.

### Tipos de mensajes admitidos

**Note On** — mensajes generados por botones, pads y teclas. Ideales para el lanzamiento de los clips y de las acciones globales; RLMP responde a la pulsación de la tecla y reconoce todos los canales MIDI. Los mensajes Note Off se ignoran.

**Control Change (CC)** — mensajes generados por faders y potenciómetros, con valor continuo de 0 a 127. Ideales para el Master Volume: un fader físico mapeado en el máster ofrece el control más natural del nivel de salida.

### Portabilidad de los mapeos

Los mapeos MIDI de los **clips** se guardan en el archivo de proyecto `.lmp`: al llevar el proyecto a otro ordenador con el mismo controlador, funcionarán sin reconfiguración. Los mapeos de las **funciones globales** (Stop All, Master Volume), en cambio, están ligados al ordenador, guardados en las preferencias locales de la aplicación, y siguen siendo válidos para todos los proyectos de esa máquina.
