# Capítulo 12 — Actualizaciones

---

Runtime Live Machine Pro se actualiza solo, pero nunca en tu contra. Dos reglas rigen todo: ninguna actualización debe interferir con un directo, y ninguna descarga arranca sin tu consentimiento. Este capítulo explica cómo el software comprueba la presencia de nuevas versiones, cómo las instala y por qué a veces se comporta de forma distinta según el sistema operativo.

---

## 12.1 El control en el arranque

Poco después del arranque (unos tres segundos), RLMP comprueba de forma silenciosa si existe una versión más reciente. El resultado aparece en la pantalla de bienvenida, junto al número de versión:

- **«Versión más reciente»** (verde) — estás usando la última versión.
- **«Actualización disponible»** (ámbar) — hay disponible una versión más reciente. Es un botón: haz clic para abrir la ventana de actualización.
- **«OFFLINE»** — no se ha podido contactar con el servicio; inténtalo más tarde. El software funciona con normalidad.

El control es opcional y no bloqueante: si estás offline, RLMP arranca y trabaja sin problemas.

---

## 12.2 La ventana de actualización

Cuando hay una actualización disponible, la ventana dedicada muestra la versión actual, la nueva versión y las notas de la versión. Desde aquí decides tú:

- **Más tarde** — cierra la ventana sin hacer nada. Podrás reabrirla cuando quieras.
- **Descargar** — inicia la descarga de la nueva versión. La descarga **nunca arranca sola**: empieza solo cuando pulsas este botón. Una barra de avance muestra el progreso.
- **Reiniciar e instalar** — aparece cuando la descarga está completa: reinicia la aplicación aplicando la actualización.

---

## 12.3 La regla «nunca durante la emisión»

El control automático puede encontrar una actualización justo mientras estás en antena. En ese caso, RLMP **no te interrumpe**: la ventana de actualización queda a la espera y se abre por sí sola solo cuando el directo ha terminado (cuando detienes todo). La prioridad es siempre el show en curso.

Hay una sola excepción, y es intencionada: el botón **Comprobar actualizaciones ahora**, en el panel *Info* (menú Herramientas), es una acción explícita tuya y abre de inmediato la ventana, incluso en directo. Si lo pulsas, es porque quieres.

---

## 12.4 Diferencias entre plataformas

El modo en que se instala la actualización depende del sistema operativo.

**Windows y Linux (AppImage).**
La actualización está completamente integrada: descargas la nueva versión desde la ventana y el software la instala en el siguiente reinicio, sin pasos manuales.

**macOS y Linux (paquete .deb).**
En estos sistemas RLMP no puede instalar la actualización de forma fiable. En lugar de la instalación automática, la ventana te avisa y abre el navegador en la página de descarga de la nueva versión: de ahí descargas el paquete y lo instalas como harías con una instalación nueva (Capítulo 2). Tus proyectos y los archivos `.lmp` quedan intactos.

> **Nota.** En todos los casos, actualizar RLMP no implica la pérdida de los proyectos: los archivos `.lmp` son compatibles entre versiones y no requieren migración manual.
