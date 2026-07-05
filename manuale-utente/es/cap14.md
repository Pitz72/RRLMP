# Capítulo 14 — Resolución de problemas y FAQ

---

Este capítulo reúne los problemas más habituales en el uso diario de Runtime Live Machine Pro junto con su solución. Cada sección describe el síntoma, la causa más probable y el procedimiento para resolverlo.

---

## 14.1 Problemas de audio

### El temporizador avanza y los VU meter se mueven, pero no se oye nada

El software reproduce correctamente —la señal está presente en el bus interno—, pero no llega al dispositivo de escucha.

**Comprueba en este orden:**

1. **Master Volume.** ¿Está a cero el slider del encabezado? Súbelo al 100 %.
2. **Dispositivo de salida.** Abre los Ajustes → *Audio & Mix* y comprueba qué dispositivo tienes seleccionado. Windows y macOS pueden cambiar el identificador de los dispositivos USB al desconectarlos y volver a conectarlos, así que si el nombre no coincide con el que está físicamente conectado, vuelve a seleccionarlo.
3. **Mixer externo.** Si la señal llega a un mixer de hardware, comprueba que el fader del canal no esté bajado ni en mute, y que la salida del mixer esté conectada a los monitores o a la cadena de transmisión.

### El audio salta, chisporrotea o tiene interrupciones

En condiciones normales, el motor de audio resiste bien este tipo de artefactos. Si aparecen, la causa suele estar fuera del software.

- **CPU con carga extrema.** Cierra las aplicaciones pesadas que tengas abiertas en paralelo, como montaje de vídeo, renderizado o copias de seguridad intensivas.
- **Buffer de audio demasiado bajo.** Si usas una tarjeta de sonido profesional, comprueba el valor del buffer en el panel de control del driver. Un valor de 256 o 512 muestras suele ser el punto justo; por debajo de 128 pueden aparecer cortes.
- **Disco lento o saturado.** RLMP transmite el audio en streaming desde el disco, y un disco mecánico lento —o un SSD casi lleno— puede provocar interrupciones en archivos de gran tamaño.

### El nivel de audio es demasiado bajo o demasiado alto

- **Gain por clip.** Ajusta el Gain en las propiedades del clip (clic derecho → sección Volume).
- **Master Volume.** Si el nivel general no es el correcto, actúa sobre el slider del encabezado.
- **Homologación y Master Chain.** La homologación del volumen acerca los niveles de los clips a una referencia común, y el glue de la Master Chain puede compactar el sonido. Si el resultado no te convence, puedes ajustar o desactivar estas etapas en Ajustes → Master Chain.

---

## 14.2 Clips rojos y archivos ausentes

### Una card se ha puesto roja («ARCHIVO AUSENTE») y no responde al clic

El borde rojo indica que el archivo de audio no está accesible en la ruta que el proyecto tiene memorizada.

**Causas posibles:**

- El archivo se ha movido o se ha renombrado en el disco.
- Estaba en un disco externo o una memoria USB que ahora está desconectada.
- El proyecto se ha abierto en otro ordenador, donde las rutas no coinciden.

**Soluciones:**

1. **Reconecta el disco.** Si el archivo estaba en una unidad externa, vuelve a conectarla.
2. **Devuelve el archivo a su ubicación original.** Si lo has movido, colócalo de nuevo en la ruta original.
3. **Sustituye el clip.** Arrastra el archivo correcto a la rejilla y borra la card roja.
4. **A partir de ahora, usa Exportar proyecto con audio.** La prevención más eficaz consiste en consolidar el audio dentro del proyecto antes de mover o transferir la carpeta (Capítulo 10).

---

## 14.3 Problemas MIDI

### El controlador no se detecta

1. **Conexión.** Comprueba que el controlador esté conectado y que el sistema operativo lo reconozca. RLMP detecta en tiempo real la conexión y desconexión de dispositivos; si no aparece, desconecta y vuelve a conectar el cable USB.
2. **Driver.** La mayoría de los controladores USB-MIDI son *class-compliant* y no necesitan driver. Si usas una superficie profesional con driver propietario, comprueba que esté instalado.
3. **Verificación en modo Learn.** Activa MIDI Learn y pulsa una tecla del controlador: si la card recibe el mapeo, es que el controlador se ha detectado.

### Los clips mapeados no responden a las teclas del controlador

- **El modo MIDI Learn sigue activo.** Mientras esté activo, las teclas del controlador registran nuevos mapeos en vez de ejecutar los clips. Desactívalo desde el menú Herramientas.
- **El mapeo se ha perdido.** Los mapeos de los clips viven en el archivo `.lmp`, así que comprueba que el proyecto se haya guardado después de la sesión de MIDI Learn. Los mapeos de las funciones globales, en cambio, están ligados a cada ordenador.

---

## 14.4 Problemas de arranque

### La aplicación no arranca en macOS (aviso de Gatekeeper)

Véase la sección 2.3: desbloqueo mediante *Ajustes del Sistema → Privacidad y seguridad*.

### La aplicación no arranca en Windows (aviso de SmartScreen)

Véase la sección 2.2. Haz clic en *Más información* y luego en *Ejecutar de todas formas*.

### Comportamientos anómalos en el arranque

Si el software se comporta de forma extraña al abrirse, cierra RLMP y vuelve a abrirlo. Si el problema no desaparece, comprueba que la ruta de instalación no tenga caracteres especiales que puedan interferir con la carga de los componentes de FFmpeg.

---

## 14.5 Preguntas frecuentes

**¿Puede RLMP automatizar una radio 24 horas sin supervisión?**
No. RLMP está pensado para la regia en directo, para shows atendidos por un operador, y no incluye programación horaria ni rotación automática de la lista de reproducción. La vista Automix ofrece una automatización limitada y voluntaria, solo para el flujo musical, activa mientras esa vista permanece abierta (Capítulo 7). Para automatizar 24 horas existen programas pensados justamente para eso, como Zara Radio, PlayIt Live o Rivendell.

**¿Cuál es la diferencia entre Guardar y Guardar como?**
*Guardar proyecto* sobrescribe en silencio el archivo `.lmp` que tienes abierto. *Guardar como…*, en cambio, abre siempre el cuadro de diálogo y crea un archivo nuevo sin tocar el actual.

**¿Puedo usar RLMP en iPad o en dispositivos móviles?**
No como aplicación principal, porque RLMP es un software de escritorio para Windows, macOS y Linux. Una tablet o un teléfono sí pueden hacer de **mando a distancia** vía navegador, a través del Control Remoto (Capítulo 11).

**¿Los archivos `.lmp` de versiones anteriores son compatibles con la 1.15.10?**
Sí. Cuando abres un proyecto creado con una versión anterior, RLMP actualiza automáticamente su estructura —incluidas las columnas que se hayan añadido mientras tanto— sin tocar el archivo hasta que tú mismo ejecutes un guardado.

**¿Cómo actualizo RLMP a una nueva versión?**
El software comprueba las actualizaciones al arrancar y te avisa. En Windows y en Linux AppImage la instalación es automática desde la ventana de actualización; en macOS y en Linux `.deb` se abre el navegador en la página de descarga. Encontrarás todos los detalles en el Capítulo 12.

**¿Dónde se guardan las copias de seguridad automáticas?**
En la carpeta `autosaves`, dentro del directorio de datos de la aplicación (`%APPDATA%\runtime-live-machine-pro\autosaves\` en Windows, con rutas equivalentes en macOS y Linux; Capítulo 10). Se conservan las diez instantáneas más recientes.

**¿El software funciona offline?**
Sí, sin ninguna limitación. RLMP no necesita conexión a internet para funcionar; la red solo entra en juego para comprobar actualizaciones (opcional) y para el Control Remoto en red local (opcional).

**El Control Remoto no se conecta. ¿Por qué?**
Comprueba que el dispositivo remoto esté en la **misma red** que el ordenador, que hayas puesto el **PIN correcto** (cambia en cada arranque) y que uses la dirección que aparece en los Ajustes. Ten en cuenta que el Control Remoto arranca apagado cada vez que inicias la aplicación (Capítulo 11).
