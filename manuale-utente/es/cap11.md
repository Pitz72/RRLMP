# Capítulo 11 — Control Remoto

---

No siempre quien conduce el programa está sentado frente al ordenador: a veces se encuentra al otro lado del estudio, tras un cristal, o se mueve por la sala junto a un invitado. Para esos casos existe el **Control Remoto** de Runtime Live Machine Pro, que permite manejar los pasos esenciales del show desde un segundo dispositivo —una tablet, un teléfono, un portátil— conectado a la misma red local, sin más que abrir el navegador. No hay que instalar nada en el aparato remoto.

Por ahora la función está marcada como **Beta**.

---

## 11.1 Cómo funciona

Al activarlo, RLMP levanta internamente un pequeño **servidor web local**. El dispositivo remoto se conecta a ese servidor abriendo una dirección en el navegador, y ahí aparece una página de control que refleja el estado de la columna Música y permite actuar sobre ella.

Todo sucede **dentro de la red local**: el servidor solo es accesible desde los aparatos conectados a la misma Wi-Fi o LAN del estudio, sin pasar en ningún momento por internet.

---

## 11.2 Activación

1. Abre los **Ajustes** desde el menú Herramientas y ve a la pestaña *Generales*.
2. Activa el toggle **Control Remoto (Beta)**.
3. Aparecen un **PIN de seis cifras**, el **puerto** del servidor y las **direcciones de red** a las que el dispositivo remoto puede conectarse.
4. El botón **Copiar enlace** copia al portapapeles la dirección lista para usar (con la forma `http://<dirección-del-ordenador>:8787`).

El servidor escucha en el puerto **8787**. El PIN se **regenera en cada arranque** de la aplicación y no queda memorizado en ningún sitio: cerrar y volver a abrir RLMP genera uno nuevo. Y el propio Control Remoto empieza siempre apagado en cada inicio, así que hay que reactivarlo cuando se necesite.

---

## 11.3 Conectarse desde el dispositivo remoto

1. En la tablet o el teléfono, abre el navegador y escribe la dirección que aparece en los Ajustes, o pégala directamente desde el enlace copiado.
2. Se muestra una página con un teclado numérico donde hay que introducir el **PIN de seis cifras**.
3. Una vez validado el PIN, la página despliega la lista de clips de la columna **Música** con sus comandos de reproducción, junto a un botón **Stop All**. Hay también un botón dedicado para llevar la página a pantalla completa, muy práctico en tablet.

Desde ahí se pueden arrancar y detener los temas de la columna Música, o parar todo de golpe si hace falta. El estado se sincroniza en tiempo real en ambos sentidos: lo que ocurre en el ordenador principal se refleja al instante en la página remota, y viceversa.

---

## 11.4 Qué se controla en remoto

El Control Remoto se ha mantenido deliberadamente básico. Desde él puedes:

- **Arrancar** un clip de la columna Música.
- **Detener** un clip de la columna Música.
- Ejecutar un **Stop All**.

Nada más está permitido: el resto de la regia —las demás columnas, el pad FX, el editor, los ajustes— sigue reservado al ordenador principal. Es una decisión deliberada de seguridad, porque el mando a distancia está pensado para gestionar la música desde fuera, no para sustituir el puesto de regia.

---

## 11.5 Seguridad y límites

- **PIN obligatorio.** Ningún dispositivo puede enviar comandos sin pasar antes por la verificación del PIN de seis cifras.
- **Protección frente a intentos repetidos.** Los intentos de introducir el PIN están limitados en el tiempo, de modo que tras varios fallos consecutivos el acceso desde ese aparato queda bloqueado temporalmente.
- **Comandos en lista blanca.** El servidor solo reconoce los tres comandos previstos —arrancar, detener, Stop All— e ignora cualquier otra petición.
- **Solo red local.** El servidor está pensado para funcionar dentro de la red del estudio, así que conviene valorar quién puede alcanzarla si tu Wi-Fi está abierta o compartida con otros.
- **Sin persistencia.** Ni el PIN ni el estado de activación quedan guardados en ningún sitio: cada reinicio arranca de una configuración limpia.

> **Nota.** Por tratarse de una función todavía en Beta, es de esperar que el catálogo de comandos se amplíe en próximas versiones. De momento cubre el caso de uso más habitual: manejar la música a distancia mientras se conduce el programa.
