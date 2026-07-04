# Capítulo 1 — Runtime Live Machine Pro: una filosofía

---

*Nota del autor*

Quince años de micrófonos abiertos dejan una huella precisa en quien los ha vivido. He llevado podcasts, he presentado programas de entrevistas, he sacado adelante una radio en internet, y durante buena parte de ese tiempo hice todo yo solo: la escaleta, la música, las entrevistas, los volúmenes, el timing. Sé lo que se siente al darte cuenta, en directo, de que la canción está a punto de terminar justo cuando todavía estás pensando qué vas a decir. Sé lo que es bajar el fader con una mano mientras buscas el clip correcto con la otra, con la tercera mano —esa que nadie tiene— reservada para sostener el hilo del discurso.

Runtime Live Machine Pro nace de esa frustración y de una idea sencilla: la regia de audio no tendría que ser un trabajo aparte, sino algo transparente. El locutor, el podcaster, el creador de contenido que lleva solo un programa de madrugada, sin nadie que le haga de técnico de sonido, necesita poder concentrarse en lo suyo: hablar, pensar, construir la relación con quien escucha. De todo lo demás se encarga el software.

En RLMP están las reglas que aplicaría de forma automática un buen técnico de sonido: la jerarquía entre los distintos eventos de audio, el ducking que entra en cuanto hablas, la música que se detiene y vuelve justo en el momento adecuado. Son reglas complejas, pero quedan escondidas bajo una interfaz que solo pide un gesto: pulsar el clip correcto en el momento correcto.

Este software se ha pensado, ante todo, para quien lleva radios de entrevistas pequeñas o medianas, para quien produce podcasts con ambición profesional y para quien emite un directo en streaming sin un equipo técnico detrás. Eso no significa que se cierre a otros usos: quien trabaja en contextos más estructurados también encontrará aquí herramientas a la altura de sus necesidades. Al final, la meta es una sola: que el locutor no dependa de un apoyo que no siempre está disponible, y que muchas veces ni siquiera hace falta.

---

Toda herramienta responde a una necesidad. Runtime Live Machine Pro responde a una muy concreta: la regia de audio en directo (radio, podcast, eventos, teatro) es una disciplina de performance, no de automatización. Exige control instantáneo, nervios templados y un software que no falle justo cuando no debe.

El programa que tienes instalado en tu ordenador no es un sistema de programación musical de 24 horas, ni un DAW pensado para la posproducción, ni un simple reproductor con cola de espera. Es otra cosa: una **máquina de regia en tiempo real**, pensada desde la idea de que cada show es un acto único e irrepetible que merece un contenedor propio y un control quirúrgico sobre cada transición.

---

## 1.1 Para quién se ha construido

Runtime Live Machine Pro se dirige a dos perfiles de usuario que, más allá de sus diferencias de contexto, comparten la misma necesidad de fondo.

El **profesional del broadcast** —el regidor de una radio comercial, el técnico de un directo en streaming de audio o vídeo, el locutor que lleva su propio programa— encuentra en RLMP un sistema a la altura de las herramientas profesionales de gama alta, sin la rigidez operativa que esos sistemas suelen arrastrar por su propia complejidad.

El **creador de contenido** —el podcaster independiente, quien conduce una radio en internet, el organizador de eventos en directo— encuentra una herramienta que no pide años de formación técnica para dominarla, ni por eso renuncia a la calidad del resultado final.

En ambos casos hablamos de una interfaz que responde a la tecla sin retardo, un motor de audio estable y un sistema de guardado en el que se puede confiar.

---

## 1.2 La filosofía «Single Show»

El concepto que sostiene todo Runtime Live Machine Pro es el **proyecto aislado**. Cada show que realizas —un episodio de podcast, un directo de radio, una función de teatro— vive en un archivo `.lmp` autónomo que lo contiene todo: la disposición de los clips, los volúmenes, los mapeos MIDI, los puntos de cue, las notas de regia. Al cargar ese archivo, recuperas el show tal y como lo dejaste.

De ahí se derivan varias ventajas prácticas. No hace falta reconfigurar el software cada vez que cambias de show. Un proyecto puede llevarse a cualquier ordenador con la función Export Package, con la garantía de que va a funcionar. Y los episodios pasados se pueden archivar y reabrir meses después sin ninguna sorpresa desagradable.

El archivo `.lmp` no contiene los archivos de audio físicos: memoriza sus rutas en el disco. Para el traslado entre ordenadores, la función **Export Package** copia físicamente todo lo necesario en una carpeta autocontenida.

---

## 1.3 La arquitectura Main-Side-Heavy

No hace falta entender la arquitectura interna para usar el software, pero conocerla ayuda a ver por qué ciertos problemas típicos de otros reproductores aquí simplemente no aparecen.

Runtime Live Machine Pro está construido sobre **Electron**, una plataforma que mantiene bien separado el proceso principal (*Main Process*, en Node.js) del proceso que renderiza la interfaz (*Renderer Process*). Esa separación no es casual: se explota a propósito.

Las operaciones más pesadas —decodificación de audio mediante FFmpeg, lectura de archivos del disco, análisis de formas de onda, gestión de las copias de seguridad— quedan delegadas al Main Process. El Renderer se limita a la interfaz: dibuja los clips, anima los VU meter, responde a los clics. Así, la interfaz sigue respondiendo con fluidez incluso durante operaciones intensivas, porque el motor de audio no tiene que competir por recursos con los píxeles de la pantalla.

Gracias al protocolo personalizado `media://`, los archivos de audio nunca se cargan enteros en la memoria RAM: se transmiten en streaming directamente del disco al reproductor. Por eso puedes trabajar con archivos WAV sin comprimir de varias horas sin que el consumo de memoria de la aplicación se resienta de forma apreciable.

---

## 1.4 La rejilla de regia: una gramática visual

La interfaz operativa de RLMP se organiza en columnas verticales, cada una con un papel semántico preciso. Conviene fijar esta gramática visual incluso antes de arrancar el software por primera vez.

La rejilla principal muestra seis columnas. Hay una séptima superficie, el **pad FX** —la *jingle machine* de los efectos—, que vive fuera de la rejilla, en un panel propio descrito en el Capítulo 7.

| Columna | Color | Función |
|---|---|---|
| **Show Assets** | Verde | Sintonías, bases, fondos estructurales del show |
| **Jingle** | Ámbar | Jingles y ráfagas identificativas recurrentes |
| **Promo** | Cian | Promos, autopromociones, anuncios programados |
| **Canciones del episodio** | Rojo | La lista de reproducción musical |
| **Voz / Grabaciones** | Naranja | Entrevistas, vocales, bloques hablados |
| **Pre-Show** | Violeta | Música de espera antes del directo, con rotación de jingles y promos |

Las tres primeras columnas (Show Assets, Jingle y Promo) comparten la misma naturaleza de audio: son elementos de estructura y de servicio, y el motor de mezcla los trata exactamente igual. La distinción entre ellas es solo organizativa, para mantener la escaleta legible aunque esté cargada de clips: separa las sintonías de los jingles y de las promos.

Cada columna tiene su propio comportamiento de audio —prioridad en la mezcla, reglas de exclusión, valores de fade—, que se explica con detalle en el Capítulo 6. De momento basta con saber que la posición de un clip en la rejilla no es un detalle decorativo, sino lo que determina cómo lo va a tratar el software durante la emisión. Si alguna columna no te hace falta, puedes ocultarla desde Ajustes → Generales → Diseño de regia sin perder los clips que contiene.

---

## 1.5 Versión actual y actualizaciones

Este manual describe la versión **1.11.5** de Runtime Live Machine Pro. En el arranque, el software comprueba de forma silenciosa si hay una versión más reciente y, si la encuentra, abre un aviso de actualización, nunca durante un directo. El sistema de actualización se describe en el Capítulo 12. Los archivos de proyecto `.lmp` son compatibles con las versiones posteriores: actualizar el software no implica la pérdida ni la migración manual de los proyectos existentes.
