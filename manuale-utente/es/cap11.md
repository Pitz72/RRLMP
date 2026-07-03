# Capítulo 11 — Control Remoto

---

No siempre quien conduce está sentado frente al ordenador. A veces el conductor está al otro lado del estudio, tras un cristal, o se mueve con un invitado. El **Control Remoto** de Runtime Live Machine Pro permite comandar los pasos esenciales del show desde un segundo dispositivo (una tablet, un teléfono, un portátil) conectado a la misma red local, usando simplemente el navegador. No hace falta instalar nada en el dispositivo remoto.

La función está de momento marcada como **Beta**.

---

## 11.1 Cómo funciona

Cuando lo activas, RLMP pone en marcha en su interior un pequeño **servidor web local**. El dispositivo remoto se conecta a este servidor abriendo una dirección en el navegador: de ahí aparece una página de control que refleja el estado de la columna Música y permite actuar sobre ella.

Todo ocurre **dentro de la red local**: el servidor es accesible desde los aparatos conectados a la misma red Wi-Fi o LAN del estudio, y no pasa por internet.

---

## 11.2 Activación

1. Abre los **Ajustes** desde el menú Herramientas y ve a la pestaña *Generales*.
2. Activa el toggle **Control Remoto (Beta)**.
3. Aparecen un **PIN de seis cifras**, el **puerto** del servidor y las **direcciones de red** a las que el dispositivo remoto puede conectarse.
4. El botón **Copiar enlace** copia al portapapeles la dirección lista para usar (con la forma `http://<dirección-del-ordenador>:8787`).

El servidor escucha en el puerto **8787**. El PIN se **regenera en cada arranque** de la aplicación y no se memoriza: cerrar y reabrir RLMP produce un nuevo PIN. También el propio Control Remoto arranca siempre apagado en cada inicio, a reactivar cuando haga falta.

---

## 11.3 Conectarse desde el dispositivo remoto

1. En la tablet o el teléfono, abre el navegador y escribe la dirección mostrada en los Ajustes (o pégala desde el enlace copiado).
2. Aparece una página con un teclado numérico: introduce el **PIN de seis cifras**.
3. Con el PIN correcto, la página muestra la lista de los clips de la columna **Música**, con los comandos de reproducción, y un botón **Stop All**. Un botón dedicado lleva la página a pantalla completa, cómodo en tablet.

Desde aquí puedes arrancar y detener los temas de la columna Música y, si hace falta, detener todo. El estado se actualiza en tiempo real: lo que arranca o se detiene en el ordenador principal se refleja en la página remota, y a la inversa.

---

## 11.4 Qué se controla en remoto

El Control Remoto es deliberadamente esencial. En remoto puedes:

- **Arrancar** un clip de la columna Música.
- **Detener** un clip de la columna Música.
- Ejecutar un **Stop All**.

Son las únicas acciones permitidas. El resto de la regia (las demás columnas, el pad FX, el editor, los ajustes) permanece en el ordenador principal. Es una decisión de seguridad: el mando a distancia sirve para gestionar el flujo musical a distancia, no para sustituir la posición de regia.

---

## 11.5 Seguridad y límites

- **PIN obligatorio.** Ningún dispositivo puede enviar comandos sin haber superado la verificación del PIN de seis cifras.
- **Protección frente a los intentos.** Los intentos de introducción del PIN están limitados en el tiempo: tras varios intentos fallidos seguidos, el acceso desde ese aparato se bloquea temporalmente.
- **Comandos en lista blanca.** El servidor solo acepta los tres comandos previstos (arrancar, detener, Stop All): cualquier otra petición se ignora.
- **Solo red local.** El servidor está pensado para la red del estudio. Si tu red Wi-Fi está abierta o compartida, valora con atención quién puede alcanzarla.
- **Sin persistencia.** El PIN y el estado de activación no se guardan: en cada reinicio partes de una configuración limpia.

> **Nota.** Al tratarse de una función en Beta, el conjunto de comandos disponibles podrá ampliarse en versiones futuras. Por ahora está ajustado al caso de uso más frecuente: gestionar la música a distancia durante la conducción.
