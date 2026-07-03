# Capítulo 14 — Resolución de problemas y FAQ

---

Este capítulo reúne los problemas más comunes en el uso diario de Runtime Live Machine Pro, con sus respectivas soluciones. Cada sección describe el síntoma, la causa más probable y el procedimiento de resolución.

---

## 14.1 Problemas de audio

### El temporizador avanza y los VU meter se mueven, pero no se oye nada

El software está reproduciendo correctamente (la señal está presente en el bus interno), pero no llega al dispositivo de escucha.

**Comprueba en este orden:**

1. **Master Volume.** ¿El slider del encabezado está a cero? Llévalo al 100 %.
2. **Dispositivo de salida.** Abre los Ajustes → *Audio & Mix* y comprueba qué dispositivo está seleccionado. Windows y macOS pueden cambiar el identificador de los dispositivos USB cuando se desconectan y se vuelven a conectar. Si el nombre no corresponde al que está físicamente conectado, selecciónalo de nuevo.
3. **Mixer externo.** Si la señal llega a un mixer hardware, comprueba que el fader del canal no esté bajado ni en mute, y que la salida del mixer esté conectada a los monitores o a la cadena de transmisión.

### El audio salta, chisporrotea o tiene interrupciones

En condiciones normales el motor de audio es robusto frente a estos artefactos. Si se producen, la causa es casi siempre externa al software.

- **CPU bajo carga extrema.** Cierra las aplicaciones pesadas en paralelo (montaje de vídeo, renderizado, copias de seguridad intensivas).
- **Buffer de audio demasiado bajo.** Con una tarjeta de sonido profesional, comprueba el valor de buffer en el panel de control del driver. Un valor de 256 o 512 muestras es el equilibrio correcto; por debajo de 128 muestras pueden aparecer dropouts.
- **Disco lento o bajo estrés.** RLMP transmite el audio en streaming desde el disco. Un disco mecánico lento, o un SSD casi lleno, puede causar interrupciones en archivos de gran tamaño.

### El nivel de audio es demasiado bajo o demasiado alto

- **Gain por clip.** Ajusta el Gain en las propiedades del clip (clic derecho → sección Volume).
- **Master Volume.** Si el nivel general es incorrecto, actúa sobre el slider del encabezado.
- **Homologación y Master Chain.** La homologación del volumen acerca los niveles de los clips a una referencia común; el glue de la Master Chain puede hacer el sonido más compacto. Si algún resultado no te convence, puedes ajustar o desactivar estas etapas en los Ajustes → Master Chain.

---

## 14.2 Clips rojos y archivos ausentes

### Una card se ha puesto roja («ARCHIVO AUSENTE») y no responde al clic

El borde rojo indica que el archivo de audio no es accesible en la ruta memorizada en el proyecto.

**Causas posibles:**

- El archivo se ha movido o renombrado en el disco.
- El archivo estaba en un disco externo o una memoria USB ahora desconectada.
- El proyecto se ha abierto en un ordenador distinto, donde las rutas no coinciden.

**Soluciones:**

1. **Reconecta el disco.** Si el archivo estaba en una unidad externa, vuelve a conectarla.
2. **Devuelve el archivo a su ubicación original.** Si se ha movido, ponlo de nuevo en la ruta original.
3. **Sustituye el clip.** Arrastra de nuevo el archivo correcto a la rejilla y borra la card roja.
4. **Usa Exportar archivo autónomo en el futuro.** La prevención más eficaz es crear un archivo autónomo antes de mover o transferir el proyecto (Capítulo 10).

---

## 14.3 Problemas MIDI

### El controlador no se detecta

1. **Conexión.** Comprueba que el controlador esté conectado y reconocido por el sistema operativo. RLMP detecta la conexión y la desconexión de los dispositivos en tiempo real; si no aparece, desconecta y vuelve a conectar el cable USB.
2. **Driver.** La mayoría de los controladores USB-MIDI es *class-compliant* y no requiere driver. Para superficies profesionales con driver propietario, comprueba que el driver esté instalado.
3. **Verificación en modo Learn.** Activa MIDI Learn y pulsa una tecla del controlador: si la card recibe el mapeo, el controlador está detectado.

### Los clips mapeados no responden a las teclas del controlador

- **El modo MIDI Learn sigue activo.** En MIDI Learn las teclas del controlador registran nuevos mapeos en lugar de ejecutar los clips. Desactiva el modo desde el menú Herramientas.
- **El mapeo se ha perdido.** Los mapeos de los clips están en el archivo `.lmp`; comprueba que el proyecto se haya guardado tras la sesión de MIDI Learn. Los mapeos de las funciones globales, en cambio, están ligados a cada ordenador.

---

## 14.4 Problemas de arranque

### La aplicación no arranca en macOS (aviso de Gatekeeper)

Véase la sección 2.3: desbloqueo mediante *Ajustes del Sistema → Privacidad y seguridad*.

### La aplicación no arranca en Windows (aviso de SmartScreen)

Véase la sección 2.2. Haz clic en *Más información* y luego en *Ejecutar de todas formas*.

### Comportamientos anómalos en el arranque

Si el software se comporta de forma inesperada al abrirse, cierra y reabre RLMP. Si el problema persiste, comprueba que la ruta de instalación no contenga caracteres especiales que puedan interferir con la carga de los componentes de FFmpeg.

---

## 14.5 Preguntas frecuentes

**¿Puede RLMP automatizar una radio 24 horas sin supervisión?**
No. RLMP está diseñado para la regia en directo: shows atendidos por un operador. No dispone de programación horaria ni de rotación automática de la lista de reproducción. La vista Automix ofrece una automatización limitada y voluntaria solo del flujo musical, activa mientras la vista está abierta (Capítulo 7). Para la automatización 24 horas existen softwares dedicados (Zara Radio, PlayIt Live, Rivendell): responden a necesidades distintas.

**¿Cuál es la diferencia entre Guardar y Guardar como?**
*Guardar proyecto* sobrescribe el archivo `.lmp` abierto, en silencio. *Guardar como…* abre siempre el cuadro de diálogo y crea un archivo nuevo, sin tocar el actual.

**¿Puedo usar RLMP en iPad o en dispositivos móviles?**
No como aplicación principal: RLMP es un software de escritorio para Windows, macOS y Linux. Una tablet o un teléfono pueden, sin embargo, hacer de **mando a distancia** vía navegador, mediante el Control Remoto (Capítulo 11).

**¿Los archivos `.lmp` de las versiones anteriores son compatibles con la 1.11.5?**
Sí. Al abrir un proyecto creado con una versión anterior, RLMP actualiza automáticamente su estructura, incluidas las columnas añadidas entretanto, sin modificar el archivo hasta que ejecutas un guardado.

**¿Cómo actualizo RLMP a una nueva versión?**
El software comprueba las actualizaciones en el arranque y te avisa. En Windows y Linux AppImage la instalación es automática desde la ventana de actualización; en macOS y Linux `.deb` se abre el navegador en la página de descarga. Todos los detalles en el Capítulo 12.

**¿Dónde se guardan las copias de seguridad automáticas?**
En la carpeta `autosaves` dentro del directorio de datos de la aplicación (`%APPDATA%\runtime-live-machine-pro\autosaves\` en Windows; rutas equivalentes en macOS y Linux, Capítulo 10). Se conservan las diez instantáneas más recientes.

**¿El software funciona offline?**
Sí, completamente. RLMP no necesita conexión a internet para funcionar. La red solo se usa para el control de las actualizaciones (opcional) y para el Control Remoto en red local (opcional).

**El Control Remoto no se conecta. ¿Por qué?**
Comprueba que el dispositivo remoto esté en la **misma red** que el ordenador, que hayas introducido el **PIN correcto** (cambia en cada arranque) y que uses la dirección mostrada en los Ajustes. Recuerda que el Control Remoto arranca apagado en cada inicio de la aplicación (Capítulo 11).
