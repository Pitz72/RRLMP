# CAPÍTULO 8: SOLUCIÓN DE PROBLEMAS Y PREGUNTAS FRECUENTES (FAQ)

Incluso en el software más estable, pueden ocurrir imprevistos debido al hardware o al sistema operativo. Aquí encontrará las soluciones a los problemas más comunes.

---

## 8.1 Problemas de Audio

### El Temporizador corre y los Vúmetros se mueven, pero no escucho nada.
El software está reproduciendo el audio correctamente (lo ve en las barras de colores en la parte superior), pero la señal no llega a sus altavoces/auriculares.
1.  **Revise el Volumen Maestro**: Asegúrese de que el control deslizante de volumen en la parte superior no esté en cero.
2.  **Verifique la Salida (Enrutamiento)**:
    *   Haga clic en el icono de **Engranaje** (Configuración).
    *   Verifique qué dispositivo está seleccionado en "Audio Output Device".
    *   A veces Windows cambia el ID de los dispositivos USB si se desconectan y se vuelven a conectar. Intente volver a seleccionar su tarjeta de audio (ej. *Rødecaster Pro* o *Auriculares*) de la lista.
3.  **Mezclador Externo**: Si sale a un mezclador USB, verifique que el fader físico de ese canal no esté bajado o en "Mute".

### El audio "crepita" o salta.
Esto sucede raramente gracias al motor nativo, pero puede suceder si la CPU de la computadora está bajo estrés extremo.
*   Cierre otras aplicaciones pesadas (edición de video, juegos).
*   Si usa una tarjeta de audio profesional, verifique que el *Tamaño del Búfer (Buffer Size)* en los controladores de la tarjeta no sea demasiado bajo (recomendado: 256 o 512 muestras).

---

## 8.2 Gestión de Archivos y Clips Rojos

### Un Clip se ha vuelto Rojo y ya no suena.
Una **Tarjeta Roja** indica que el software ya no puede encontrar el archivo de audio en el disco.
*   **Causa**: Ha movido, renombrado o eliminado el archivo MP3/WAV original. O el archivo estaba en una memoria USB/Disco Externo que ahora está desconectado.
*   **Solución**:
    1.  Vuelva a conectar el disco externo.
    2.  Mueva el archivo de nuevo a su ubicación original.
    3.  O, arrastre el archivo de nuevo a la cuadrícula (creando una nueva tarjeta) y elimine la antigua roja.

> **Prevención**: Para evitar este problema, use la función **Export Package** (Cap. 7) que copia todos los archivos en una carpeta segura junto con el proyecto.

---

## 8.3 Problemas MIDI

### Mi controlador MIDI no funciona / no es detectado.
1.  **Regla de Oro del MIDI**: El controlador debe estar conectado a la computadora **ANTES** de iniciar Runtime Live Machine Pro.
    *   Si lo conecta con el software abierto, el navegador interno podría no verlo. Cierre y vuelva a abrir RRLMP.
2.  **Learn Mode**: Verifique que no haya dejado el modo "MIDI Learn" activo (Icono Cian). En este modo, presionar las teclas sirve solo para mapear, no para tocar.
3.  **Controladores (Drivers)**: Algunos controladores avanzados requieren controladores específicos. Verifique que Windows lo reconozca correctamente.

---

## 8.4 Preguntas Frecuentes (FAQ)

**P: ¿Puedo usar RRLMP para automatizar la radio las 24 horas?**
R: No. RRLMP está diseñado para la dirección *En Vivo* (programas atendidos por una persona). No tiene funciones de programación horaria o rotación musical automática infinita.

**P: ¿Qué formatos de audio son compatibles?**
R: Soporta nativamente **MP3, WAV, AAC, OGG, FLAC**. Recomendamos usar WAV para máxima calidad o MP3 320kbps para ahorrar espacio.

**P: ¿El software funciona en iPad o Android?**
R: No, Runtime Live Machine Pro es un software de Escritorio profesional para **Windows** y **macOS**. Requiere la potencia de gestión de archivos de una computadora real.

**P: ¿Cómo actualizo el software?**
R: Al inicio, la Welcome Screen le notificará si hay una nueva versión disponible (indicador Amarillo/Naranja). Visite el sitio oficial para descargar el instalador actualizado. Sus proyectos .lmp guardados serán compatibles con las nuevas versiones.

**P: ¿Dónde encuentro los archivos de guardado automático?**
R: Si está trabajando en un archivo guardado, la copia de seguridad .bak está en la misma carpeta que el proyecto. Si estaba trabajando en un proyecto "Sin Título" y la PC se apagó, verifique en la carpeta de datos de aplicación del sistema (en Windows: %APPDATA%\runtime-live-machine\).
