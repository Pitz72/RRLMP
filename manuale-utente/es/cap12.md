# Capítulo 12 — Actualizaciones

---

Runtime Live Machine Pro se actualiza por su cuenta, pero nunca a tus espaldas. Dos reglas gobiernan el proceso: ninguna actualización interfiere con un directo y ninguna descarga arranca sin que tú lo autorices. Este capítulo explica cómo comprueba el software la existencia de nuevas versiones, cómo las instala y por qué el comportamiento cambia según el sistema operativo.

---

## 12.1 El control en el arranque

Unos tres segundos después de arrancar, RLMP comprueba en silencio si existe una versión más reciente. El resultado aparece en la pantalla de bienvenida, junto al número de versión:

- **«Versión más reciente»** (verde): estás usando la última versión.
- **«Actualización disponible»** (ámbar): hay una versión más reciente. Es un botón, así que haz clic para abrir la ventana de actualización.
- **«OFFLINE»**: no se ha podido contactar con el servicio; prueba más tarde. El software sigue funcionando con normalidad.

Esta comprobación es opcional y no bloquea nada: si estás offline, RLMP arranca y trabaja sin ningún problema.

---

## 12.2 La ventana de actualización

Cuando hay una actualización disponible, la ventana dedicada muestra la versión actual, la nueva versión y las **notas de la versión**: la lista real de novedades de esa versión (el mismo changelog de este software), formateada y legible, no un simple listado de archivos. Las notas siguen visibles incluso cuando la descarga ha terminado, justo antes de instalar, de modo que siempre sabes qué estás a punto de aplicar. A partir de ahí, la decisión es tuya:

- **Más tarde**: cierra la ventana sin hacer nada. Podrás volver a abrirla cuando quieras.
- **Descargar**: inicia la descarga de la nueva versión. La descarga **nunca arranca sola**, solo empieza cuando pulsas este botón, y una barra de avance muestra el progreso.
- **Reiniciar e instalar**: aparece cuando la descarga ha terminado: cierra la aplicación y aplica la actualización. El cierre es limpio e inmediato: como ya has confirmado el reinicio, el software no vuelve a pedir que guardes ni se queda abierto por detrás del instalador.

---

## 12.3 La regla «nunca durante la emisión»

Puede ocurrir que la comprobación automática encuentre una actualización justo mientras estás en antena. En ese caso RLMP **no te interrumpe**: la ventana de actualización espera y solo se abre sola cuando el directo ha terminado, es decir, cuando detienes todo. El show en curso tiene siempre la prioridad.

Existe una única excepción, y es deliberada: el botón **Comprobar actualizaciones ahora**, en el panel *Info* del menú Herramientas, responde a una acción explícita tuya y abre la ventana de inmediato, incluso en directo. Si lo pulsas, es porque así lo has decidido.

---

## 12.4 Diferencias entre plataformas

La forma de instalar la actualización varía según el sistema operativo.

**Windows y Linux (AppImage).**
Aquí la actualización está completamente integrada: descargas la nueva versión desde la ventana y el software la instala en el siguiente reinicio, sin ningún paso manual.

**macOS y Linux (paquete .deb).**
En estos sistemas RLMP no puede instalar la actualización de forma fiable, así que en lugar de la instalación automática, la ventana te avisa y abre el navegador en la página de descarga de la nueva versión. Desde ahí descargas el paquete y lo instalas como harías con una instalación nueva (Capítulo 2). Tus proyectos y los archivos `.lmp` quedan intactos.

> **Nota.** En todos los casos, actualizar RLMP no supone perder los proyectos: los archivos `.lmp` son compatibles entre versiones y no requieren ninguna migración manual.
