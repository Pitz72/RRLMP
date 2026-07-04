# Capítulo 8 — Hardware, teclado y MIDI

---

Runtime Live Machine Pro está pensado para integrarse con el hardware que ya tengas en el estudio, sin exigir configuraciones complicadas. Este capítulo explica cómo dirigir la salida de audio, cómo usar el teclado del ordenador como controlador y cómo conectar dispositivos MIDI físicos para un control táctil de la regia.

---

## 8.1 Enrutamiento de audio

### Seleccionar el dispositivo de salida

Por defecto, RLMP saca el audio por el dispositivo predeterminado del sistema operativo. En un contexto profesional o semiprofesional, con mixers USB, tarjetas de sonido externas o sistemas multipista, conviene elegir explícitamente el destino de la señal.

1. Abre los **Ajustes** desde el menú Herramientas.
2. En la pestaña *Audio & Mix*, abre el menú del dispositivo de salida: encontrarás la lista de los dispositivos de audio disponibles en el sistema.
3. Selecciona el dispositivo deseado.

Si el dispositivo elegido se desconecta, RLMP vuelve automáticamente al del sistema; la app vigila las conexiones y reacciona en cuanto se conecta o se retira un dispositivo USB.

### Mixers USB y setup multicanal

Los mixers USB como el Rødecaster Pro, el RØDECaster Duo o el Focusrite Scarlett suelen exponer varios canales USB al sistema operativo (Main Mix, Sounds/Chat, Monitor, etc.). RLMP aparece ante el sistema como una única fuente estéreo, y decidir a qué canal USB dirigirla depende de ti.

**Setup recomendado con mixer USB.** Conviene asignar RLMP a un canal secundario del mixer —«Sounds» en el Rødecaster Pro, por ejemplo— en lugar del canal principal. De esa forma controlas el volumen de RLMP con un fader físico dedicado, lo mantienes separado de la señal del micrófono y puedes aplicar el procesado hardware que quieras solo a ese canal.

### Latencia y buffer

RLMP se apoya en las API de audio nativas del sistema operativo. La latencia de salida la fija el buffer del dispositivo de audio, no el software. Con tarjetas de sonido profesionales, esa latencia ronda unos pocos milisegundos, imperceptible en un contexto de playout.

Si notas artefactos de audio (chasquidos, dropouts), es probable que el buffer del dispositivo esté demasiado bajo. Súbelo desde el panel de control de la tarjeta de sonido —RLMP no gestiona el driver directamente—: un buffer de 256 o 512 muestras suele ser el punto de equilibrio entre latencia y estabilidad.

---

## 8.2 Control desde el teclado

El teclado del ordenador es el controlador más rápido que tienes en directo: no exige coordinación ojo-mano, funciona a oscuras y está siempre al alcance de la mano. RLMP incluye un conjunto de atajos globales y permite además asignar una tecla a cada clip.

### Atajos globales

| Tecla | Acción |
|---|---|
| **Esc** | PARAR TODO — detiene todos los clips activos |
| **Supr / Backspace** | Elimina los clips seleccionados |
| **Ctrl+Z** | Deshace el último cambio en la escaleta |
| **Ctrl+Y** (o **Ctrl+Shift+Z**) | Rehace el cambio deshecho |
| **Ctrl+Shift+D** | Muestra/oculta el Debug Overlay |
| **Ctrl+Shift+M** | Abre el simulador MIDI (para pruebas sin controlador) |

`Esc` funciona como PARAR TODO siempre que RLMP sea la ventana activa, incluso con el cursor dentro de un campo de texto. No es un atajo registrado a nivel del sistema operativo: si la app está en segundo plano, primero trae la ventana al frente.

> **Nota.** No hay teclas de función (F1–F5) preasignadas al lanzamiento de las columnas. Para lanzar rápido un clip concreto, asígnale una tecla propia, tal como se explica a continuación.

### Teclas personalizadas por clip

Además de los atajos globales, cada clip puede tener su propia tecla, con la insignia correspondiente visible en la card.

**Para asignar una tecla:**
1. Abre los ajustes del clip (clic derecho sobre la card) o la ventana **Keybinds** desde el menú Herramientas.
2. Haz clic en el campo de la tecla.
3. Pulsa la tecla deseada.

**Teclas disponibles.** Prácticamente cualquiera: letras (A–Z), números (0–9), teclado numérico, barra espaciadora, teclas de función libres. Si la tecla ya está asignada a otro clip, el software avisa del conflicto antes de sobrescribir nada, así evitas duplicados invisibles.

**Seguridad durante la escritura.** Las teclas personalizadas se desactivan solas mientras estás escribiendo texto —renombrando un clip o redactando una nota, por ejemplo—, lo que evita lanzamientos accidentales al teclear.

---

## 8.3 Controlador MIDI

El MIDI es la opción profesional para un control físico, táctil y fiable. RLMP admite controladores USB-MIDI: teclados, pads (Novation Launchpad, por ejemplo), controladores de fader (como el Korg nanoKONTROL2) y superficies de control híbridas.

### Conexión

Conecta el controlador USB al ordenador y arranca RLMP. El software detecta los dispositivos mediante la Web MIDI API del sistema y reconoce en tiempo real cuándo se conecta o se desconecta un controlador. La mayoría de los controladores USB-MIDI es *class-compliant* y no necesita driver; en superficies profesionales con driver propietario, instálalo antes de conectar el dispositivo.

### MIDI Learn

RLMP no exige memorizar la numeración de las notas MIDI ni configurar mensajes a mano: el aprendizaje se hace con el modo **MIDI Learn**, disponible desde el menú Herramientas (o desde la ventana Keybinds).

**Para mapear un clip a una tecla/pad:**
1. Activa MIDI Learn. Las cards entran en estado de espera.
2. Selecciona el clip (o la celda del pad FX) que quieras mapear.
3. Toca la nota, pulsa el pad o la tecla del controlador. La insignia `M` con el número de nota aparece en la card.

**Para mapear las funciones globales:**
- Selecciona **PARAR TODO** y pulsa una tecla del controlador: esa tecla ejecutará el Stop All.
- Selecciona el **Master Volume** y mueve un fader o un potenciómetro: ese control gestionará el volumen máster de forma continua.

Al terminar, desactiva MIDI Learn para volver al modo operativo.

### Tipos de mensajes admitidos

**Note On** — mensajes generados por botones, pads y teclas, ideales para lanzar clips y acciones globales; RLMP responde a la pulsación y reconoce todos los canales MIDI. Los mensajes Note Off se ignoran.

**Control Change (CC)** — mensajes generados por faders y potenciómetros, con valor continuo de 0 a 127. Son la opción natural para el Master Volume: un fader físico mapeado al máster da el control más intuitivo del nivel de salida.

### Portabilidad de los mapeos

Los mapeos MIDI de los **clips** se guardan en el archivo de proyecto `.lmp`, así que al llevar el proyecto a otro ordenador con el mismo controlador seguirán funcionando sin reconfigurar nada. Los mapeos de las **funciones globales** (Stop All, Master Volume), en cambio, quedan ligados al ordenador —se guardan en las preferencias locales de la aplicación— y valen para todos los proyectos que abras en esa máquina.
