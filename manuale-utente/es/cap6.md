# Capítulo 6 — El motor de mezcla

---

El problema de fondo de la regia radiofónica manual es que las acciones se acumulan todas a la vez: arrancar un tema, bajar la música, hablar al micrófono, preparar el clip siguiente, sin perder de vista el reloj. Cada operación de más es una ocasión para el error, y aquí el error es público e inmediato.

El motor de mezcla de Runtime Live Machine Pro se encarga de la mayoría de esas acciones intermedias. No hablamos de automatización en el sentido de «el software actúa por ti sin que te enteres», sino de automatizar las reglas que tú mismo aplicarías si tuvieras manos de sobra para ejecutarlas todas a la vez.

---

## 6.1 La jerarquía de audio

El sistema de mezcla automática se apoya en una **jerarquía de prioridad** entre los tipos de clip. La forma más rápida de entenderla es pensar en una escala de «derecho a la palabra».

**Voz / Grabaciones — prioridad absoluta.**
Cuando un clip de voz está en reproducción, se mantiene en su volumen nominal y todo lo demás baja. Ninguna otra señal puede sobrescribir esta regla.

**Canciones del episodio.**
Ceden ante las Voces, pero mandan sobre las bases de los Assets. Cuando entra una canción, las bases musicales de los Assets se anulan —no se detienen: siguen girando en silencio, listas para reaparecer—. Es la Music Dominance, que se describe más adelante.

**Show Assets, Jingle y Promo — las bases de servicio.**
Las Voces las bajan y las Canciones las silencian del todo. La excepción es cuando un asset está marcado como **Stacco** (ráfaga): entonces pasa a mandar él (véase §6.4).

**Efectos del pad FX.**
Quedan fuera de la jerarquía: suenan a su propio volumen, se superponen a lo que esté en antena y nunca se silencian. Solo hay una cortesía hacia el habla: mientras una voz está activa, los efectos bajan a la mitad de volumen (50 %) para no taparla, y vuelven a subir solos en cuanto termina.

---

## 6.2 Ducking automático

El **ducking** es el mecanismo que baja una señal en cuanto entra en reproducción otra de prioridad superior.

El caso más habitual: una canción suena en plena dinámica y lanzas una entrevista pregrabada desde la columna Voz. RLMP lleva entonces la canción a cerca del **20 % del volumen** (unos 14 dB menos) con un fundido suave de medio segundo, para que la voz ocupe el espacio sonoro con claridad. En cuanto termina la entrevista, la canción recupera su volumen original con un fade in igual de fluido.

El operador no toca nada más allá de un clic: arrancar la entrevista. La magnitud de la reducción y su velocidad se pueden ajustar desde los Ajustes (Capítulo 13).

---

## 6.3 Music Dominance: gestión inteligente de las bases

Un clásico error de sonido ocurre cuando una canción y una base musical (*bed*) se pisan: dos elementos rítmicos que chocan, dos bombos que no coinciden, y el resultado es un embrollo.

RLMP resuelve este escenario con la **Music Dominance**.

**El escenario típico.** Una base gira en loop en la columna Assets, bajo la voz del conductor, y este lanza un tema desde la columna Canciones.

**Qué hace RLMP.** No detiene la base —hacerlo obligaría luego a reiniciarla a mano—, sino que la lleva en silencio a **volumen cero** y la mantiene reproduciéndose «en fantasma»: el archivo sigue corriendo, el loop continúa, pero no se oye nada.

**El resultado sonoro.** Solo suena la canción. La base ha desaparecido sin que el operador haya movido un dedo.

**El regreso.** Cuando la canción termina, la base reaparece con un fade in automático, retomando el punto exacto en el que iba el loop. Todo el ciclo —base, canción, base de nuevo— sucede sin un solo clic adicional.

---

## 6.4 Stacchi: la excepción a la regla

El comportamiento **Stacco** (ráfaga; configurable en las propiedades de cada clip, véase el Capítulo 5) invierte por un momento la jerarquía: el clip que lo lleva activado pasa a mandar. Silencia el resto de assets de su columna y baja la música, pero no detiene nada. El fundido que aplica es más rápido que el del ducking ordinario, lo que da una entrada más percusiva y limpia.

El uso típico es el *station ID* vocal («Estás escuchando…»), que debe oírse con claridad mientras la base de debajo sigue girando. Para un resultado más cuidado, combínalo con un fade in breve (300–500 ms): así la entrada resulta suave en vez de brusca.

---

## 6.5 Homologación del volumen (loudness)

Los clips de origen distinto casi nunca llegan con el mismo nivel: una sintonía masterizada correctamente, un vocal telefónico grabado bajo, un tema descargado con su propio volumen. Para no tener que retocar el Gain a cada rato, RLMP aplica de serie una **homologación del volumen** basada en el estándar de loudness EBU R128, con un objetivo de **−16 LUFS**.

En la práctica, el software mide la sonoridad percibida de cada clip y la acerca a una referencia común, así canciones, voces y bases arrancan ya en un plano coherente entre sí. La función viene activada por defecto, y el valor objetivo puede ajustarse en Ajustes → Master Chain.

---

## 6.6 Master Chain: la cadena de procesadores del master bus

![La pestaña Master Chain en la ventana de Ajustes.](../screenshots-es/impostazioni-master-chain.png)

*Figura 6.1 — La Master Chain: homologación del volumen (−16 LUFS), HPF a 30 Hz, glue multibanda y limiter brickwall.*

La señal combinada de todos los clips en reproducción, ya pasado el Master Volume, atraviesa una **cadena de procesadores** en el bus máster antes de llegar al dispositivo de salida. Viene activa de serie y está pensada para un sonido de nivel broadcast sin necesidad de tocar nada.

Consta de tres etapas en serie.

**High-Pass Filter (HPF) a 30 Hz.**
Quita, con una pendiente suave, las frecuencias sub-graves que solo consumen headroom y pueden ensuciar los sistemas de difusión. La frecuencia de corte se puede ajustar (20–200 Hz), y al desactivar la etapa esta se vuelve del todo transparente.

**Glue multibanda.**
No es un compresor único, sino tres compresores «suaves» trabajando en paralelo sobre tres bandas de frecuencia —graves, medios, agudos— separadas por un crossover. Cada banda tiene umbrales y ratios calibrados para «pegar» la mezcla sin aplastarla, conteniendo así la varianza dinámica entre clips de nivel distinto. El estilo se elige entre varios presets (Neutro, Rock, Jazz, Electrónico), con Neutro como opción por defecto.

**Limiter Brickwall.**
Umbral en −1 dBFS, ratio de limitación elevado y reacción prácticamente instantánea. Garantiza que la señal nunca sobrepase el nivel máximo permitido, evitando la distorsión digital (clipping) pase lo que pase aguas arriba.

Toda la cadena, y cada etapa por separado, se puede configurar y desactivar desde Ajustes → Master Chain, donde también hay un botón para restaurar los valores de fábrica. Si la señal ya pasa por un mixer hardware o una cadena externa, conviene desactivarla para no duplicar el procesado.
