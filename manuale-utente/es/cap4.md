# CAPÍTULO 4: EDICIÓN AVANZADA DE CLIPS (PROPIEDADES)

Cada archivo de audio es diferente: algunos tienen largos silencios iniciales, otros tienen un volumen demasiado bajo, y otros necesitan repetirse infinitamente.
Para acceder al panel de configuración avanzada, haga **Clic Derecho** en cualquier clip y seleccione **"Edit"** (Editar).

Se abrirá una ventana modal dividida en dos secciones principales: **Visual & Basic** (Izquierda) y **Behavior & Timing** (Derecha).

---

## 4.1 Configuración Básica (Visual y Audio)

En esta sección controla la apariencia y el volumen bruto del clip.

*   **Nombre del Clip**: Puede renombrar el clip como prefiera (ej. de pista_01_final.mp3 a TEMA DE APERTURA). Esto solo cambia la etiqueta en el software, no el nombre del archivo original en el disco.
*   **Volumen (Gain)**: Un control deslizante que va del 0% al 150%.
    *   Si tiene una grabación baja (ej. un audio de WhatsApp), puede subirlo más allá del 100% para alinearlo con el resto del show.
*   **Color Personalizado**: Por defecto, el clip hereda el color de su columna (ej. Verde para Assets). Aquí puede forzar un color diferente para resaltarlo (ej. colorear de Rojo un jingle importante en la columna Gris).

---

## 4.2 Precisión Quirúrgica: Cue Points & Trim

A menudo los archivos de audio no están "listos para el aire": tienen segundos de silencio al principio o colas demasiado largas. En lugar de usar un editor de audio externo, puede arreglarlos aquí. Estos cambios son **no destructivos** (el archivo original permanece intacto).

### Controles Manuales
*   **Trim Start (Inicio)**: Establece cuántos segundos saltar al principio.
    *   *Ejemplo*: Si pone 2.5, cuando presione Play el clip comenzará instantáneamente desde el segundo 2.5, saltando el silencio inicial ("a golpe").
*   **Trim End (Fin)**: Establece cuántos segundos cortar del final.
    *   *Ejemplo*: Si la canción tiene 20 segundos de aplausos finales inútiles, aumente este valor hasta que la "Nueva Duración" le satisfaga.

### ?? La Varita Mágica (Smart Trim / Detección Auto)
Para acelerar el trabajo, RRLMP incluye un algoritmo de inteligencia artificial básico.
1.  Haga clic en el botón con el icono de **Varita Mágica** junto a los controles de Trim.
2.  El software escanea el archivo en una fracción de segundo.
3.  Detecta automáticamente dónde comienza y termina el sonido real (por encima del umbral de -40dB).
4.  Rellena automáticamente los campos *Start* y *End* por usted.

> **Consejo**: Use siempre la Varita Mágica en grabaciones de voz o entrevistas para limpiarlas instantáneamente.

---

## 4.3 Comportamientos (Behaviors & Logic)

Aquí define la inteligencia del clip: qué debe hacer cuando comienza y qué debe hacer cuando termina.

### Behavior (Modo de Superposición)
*   **Normal (Por defecto)**: Cuando lanza este clip, cualquier otro clip que esté sonando **en la misma columna** se detiene. Es el comportamiento estándar para las canciones (una excluye a la otra).
*   **Stacco** (Interrupción): Cuando lanza este clip, este **NO detiene** los otros clips de la columna, sino que los "silencia" temporalmente (o se superpone).
    *   *Uso típico*: Un efecto de sonido o un jingle vocal que quiere reproducir sobre una base musical ubicada en la misma columna, sin interrumpir la base.

### Next Action (Automatización Final)
¿Qué sucede cuando el clip termina?
*   **Stop**: El clip termina y se detiene. (Comportamiento estándar).
*   **Loop**: El clip comienza de nuevo desde el principio infinitamente. Útil para bases y fondos. Aparecerá una insignia **[LOOP]** en la tarjeta.
*   **Play Next**: Tan pronto como este clip comienza a desvanecerse (Fade Out), el software lanza automáticamente el siguiente clip en la columna.
    *   *Crossfade*: La transición es fluida, sin huecos de silencio. Aparecerá una insignia **[NEXT]** en la tarjeta.

---

## 4.4 Fades (Fundidos)

Cada columna tiene valores predeterminados (ej. la Música hace fundido en 2 segundos, los Jingles son secos), pero aquí puede sobrescribirlos.

*   **Fade In (ms)**: Cuánto tiempo tarda el volumen en llegar al máximo cuando presiona Play. (Ej. 2000ms = 2 segundos de subida gradual).
*   **Fade Out (ms)**: Cuánto tiempo tarda en desvanecerse cuando presiona Stop o cuando el clip termina naturalmente.
    *   *Nota*: Un Fade Out largo es útil para las canciones. Un Fade Out a 0 es obligatorio para los cortes secos.

---

## 4.5 Asignación de Controles (Entrada)

En la parte inferior del panel encontrará las referencias para el control externo:
*   **Trigger Keybind**: Haga clic aquí y presione una tecla en el teclado (ej. "Q") para asignarla a este clip.
*   **MIDI Bind**: Muestra la nota MIDI asignada (ej. NOTE:60). Para modificarla, use el modo "MIDI Learn" desde la pantalla principal (ver Cap. 6).
