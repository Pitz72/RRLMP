# CAPÍTULO 6: CONTROL DE HARDWARE Y ENRUTAMIENTO

Un software de dirección profesional no vive aislado en la computadora. Debe comunicarse con el mezclador del estudio, con los auriculares y con los dedos del director.
En este capítulo veremos cómo configurar la salida de audio y cómo controlar el software sin tocar el mouse.

---

## 6.1 Configuración de Audio (Enrutamiento)

Por defecto, RRLMP sale por el dispositivo de audio predeterminado de Windows. Sin embargo, en un estudio (o con configuraciones de podcast avanzadas como el *Rødecaster Pro*), necesita separar los flujos.

### Seleccionar la Salida
1.  Haga clic en el icono de **Engranaje (Configuración)** en la barra de comandos superior.
2.  Se abrirá el panel **General Settings**.
3.  En el menú desplegable "Audio Output Device", verá la lista de todas las tarjetas de audio conectadas a su PC.
4.  Seleccione el dispositivo deseado (ej. *Rødecaster Pro Stereo* o *Focusrite USB*).

### Cambio en Vivo (Live Switch)
El cambio es instantáneo. Si la música está sonando mientras cambia de dispositivo, el audio "saltará" a la nueva salida sin interrumpirse.

> **Consejo para Rødecaster/Mezcladores USB**: Si su mezclador tiene múltiples canales USB (ej. Main y Sounds/Chat), configure RRLMP en un canal secundario (ej. "Sounds") para poder controlar su volumen con un fader dedicado en el mezclador físico, separándolo de los sonidos del sistema de Windows.

---

## 6.2 El Teclado (Teclas Rápidas)

El teclado de la computadora es el controlador más rápido que tiene. RRLMP incluye comandos globales preestablecidos y teclas personalizables.

### Comandos Globales (Teclas F)
Las teclas de función (F1-F5) están asignadas para lanzar las columnas. Tienen una lógica "inteligente": buscan el primer clip libre.
*   **F1**: Lanza la columna 1 (Assets).
*   **F2**: Lanza la columna 2 (Música).
*   **F3**: Lanza la columna 3 (Voces).
*   **F4**: Lanza la columna 4 (SFX).
*   **F5**: Lanza la columna 5 (Pre-Show).
*   **ESC**: **BOTÓN DE PÁNICO**. Detiene todo inmediatamente (Stop All).

### Teclas Personalizadas (Custom Binds)
¿Quiere lanzar la intro presionando la barra espaciadora o la letra "Q"?
1.  Haga clic derecho en el clip -> **Edit**.
2.  Haga clic en el campo **Trigger Keybind**.
3.  Presione la tecla deseada en el teclado.
4.  Guarde.
5.  Aparecerá una insignia (ej. **[Q]**) en la tarjeta para recordarle la asignación.

> **Seguridad**: Los comandos de teclado se desactivan automáticamente si está escribiendo texto (ej. renombrando un clip), para evitar que el audio comience mientras escribe.

---

## 6.3 Controlador MIDI (El Poder Físico)

Esta es la función "Pro" por excelencia. Puede conectar teclados musicales, pads (como *Novation Launchpad*) o controladores de fader (como *Korg nanoKONTROL*) y usarlos para manejar el software.

### Conexión
1.  Conecte su controlador USB-MIDI a la computadora **antes** de iniciar Runtime Live Machine Pro.
2.  Inicie el software. El motor MIDI reconocerá automáticamente el dispositivo.

### Modo MIDI Learn (Mapeo Fácil)
No necesita conocer códigos complicados. RRLMP aprende observando lo que hace.

1.  Haga clic en el icono **MIDI** (Conector DIN) en la barra superior.
    *   El icono se vuelve **Cian (Encendido)**.
    *   Los clips adoptan una apariencia punteada ("En espera").
2.  **Para mapear un Clip**:
    *   Haga clic con el mouse en el Clip deseado.
    *   Presione el botón/pad físico en su controlador.
    *   Aparecerá una insignia (ej. **[M:60]**) en el clip. Hecho.
3.  **Para mapear funciones Globales**:
    *   Haga clic en el botón rojo **STOP ALL** en la pantalla -> Presione un botón grande en el controlador.
    *   Haga clic en el control deslizante **MASTER VOL** en la pantalla -> Mueva un fader o una perilla en el controlador.
4.  Haga clic de nuevo en el icono **MIDI** para salir del modo Learn.

### Tipos de Comandos Soportados
*   **Note On/Off**: Perfecto para botones y pads (Lanzamiento de Clip, Stop All).
*   **Control Change (CC)**: Perfecto para faders y perillas giratorias. Úselo para controlar el Volumen Maestro de manera analógica y fluida.

> **Portabilidad**: Los mapeos MIDI de los clips se guardan dentro del proyecto .lmp. Si lleva el proyecto a otra PC con el mismo controlador, todo funcionará inmediatamente.
