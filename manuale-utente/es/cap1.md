# Capítulo 1 — Runtime Live Machine Pro: una filosofía

---

*Nota del autor*

Quince años de micrófonos abiertos dejan una huella precisa en quien los ha vivido. He gestionado podcasts, he conducido programas de entrevistas, he mantenido en pie una radio en la web, y durante buena parte de ese tiempo lo hice todo solo: la escaleta, la música, las entrevistas, los volúmenes, el timing. Sé lo que significa darse cuenta en directo de que la canción está a punto de terminar mientras aún estás formulando la idea que quieres expresar. Sé lo que es tener que bajar el fader con una mano y encontrar el clip correcto con la otra, mientras la tercera mano —la que no tienes— debería sostenerte el hilo del discurso.

Runtime Live Machine Pro nace de esa frustración, y de una convicción sencilla: la regia de audio no debería ser un trabajo aparte. Debería ser transparente. El locutor, el podcaster, el creador de contenido que conduce solo un programa de madrugada —sin un técnico de sonido que le haga de apoyo— tiene que poder concentrarse en lo que sabe hacer: hablar, pensar, construir la relación con quien escucha. El software se ocupa del resto.

He puesto en RLMP las reglas que un buen regidor de sonido aplica automáticamente: la jerarquía entre los eventos de audio, el ducking que se dispara cuando hablas, la música que se detiene y vuelve en el momento justo. Reglas complejas, ocultas bajo una interfaz que pide un solo gesto: pulsar el clip correcto en el momento correcto.

Este software está pensado sobre todo para quien gestiona radios de entrevistas pequeñas y medianas, para quien produce podcasts con ambición profesional, para quien emite un directo en streaming sin un equipo técnico alrededor. Pero su naturaleza no es excluyente: quien trabaja en contextos más estructurados encontrará herramientas adecuadas a sus necesidades. El objetivo es uno solo: hacer al locutor independiente de figuras de apoyo que no siempre están, y no siempre hacen falta.

---

Toda herramienta nace de una respuesta. Runtime Live Machine Pro responde a un problema preciso: la regia de audio en directo (radio, podcast, eventos, teatro) es una actividad de performance, no de automatización. Requiere control instantáneo, nervios templados y un software que no te traicione en el momento equivocado.

El software que tienes instalado en tu ordenador no es un sistema de programación musical 24 horas, ni una DAW para la posproducción, ni un simple reproductor con cola. Es algo distinto: una **máquina de regia en tiempo real**, construida en torno a la idea de que cada show es un acto único, irrepetible, que merece un contenedor dedicado y un control quirúrgico sobre cada transición.

---

## 1.1 Para quién se ha construido

Runtime Live Machine Pro se dirige a dos tipos de usuario que, pese a las diferencias de contexto, comparten la misma necesidad fundamental.

El **profesional del broadcast** —el regidor de una radio comercial, el técnico de sonido de un directo en streaming de audio o vídeo, el locutor que gestiona su propio programa— encontrará en RLMP un sistema a la altura de las herramientas profesionales de gama alta, con la agilidad operativa que esos sistemas a menudo sacrifican en el altar de la complejidad.

El **creador de contenido** —el podcaster independiente, el conductor de una radio en la web, el organizador de eventos en directo— encontrará una herramienta que no exige años de formación técnica para dominarse, pero que no hace concesiones en la calidad del resultado.

Ambos encontrarán una interfaz que responde a la tecla al instante, un motor de audio estable y un sistema de guardado que no olvida.

---

## 1.2 La filosofía «Single Show»

El concepto fundacional de Runtime Live Machine Pro es el **proyecto aislado**. Cada show que realizas —un episodio de podcast, un directo de radio, una función de teatro— vive en un archivo `.lmp` autónomo que lo contiene todo: la disposición de los clips, los volúmenes, los mapeos MIDI, los puntos de cue, las notas de regia. Cuando cargas ese archivo, recuperas el show exactamente como lo dejaste.

Este planteamiento tiene consecuencias concretas. No tienes que reconfigurar el software cada vez que pasas de un show a otro. Puedes llevar un proyecto a cualquier ordenador —mediante la función Export Package— y saber que funcionará. Puedes archivar los episodios pasados y reabrirlos meses después sin sorpresas.

El archivo `.lmp` no contiene los archivos de audio físicos: memoriza sus rutas en el disco. Para el traslado entre ordenadores, la función **Export Package** copia físicamente todo lo necesario en una carpeta autocontenida.

---

## 1.3 La arquitectura Main-Side-Heavy

Comprender la arquitectura interna no es indispensable para usar el software, pero ayuda a entender por qué ciertos problemas comunes a otros reproductores aquí no se producen.

Runtime Live Machine Pro está construido sobre **Electron**, una plataforma que separa con nitidez el proceso principal (*Main Process*, en Node.js) del proceso de renderizado de la interfaz (*Renderer Process*). Esta separación se aprovecha de forma intencionada.

Todas las operaciones pesadas —decodificación de audio mediante FFmpeg, lectura de los archivos del disco, análisis de las formas de onda, gestión de las copias de seguridad— se delegan al Main Process. El Renderer se ocupa exclusivamente de la interfaz: mostrar los clips, animar los VU meter, responder a los clics. El resultado es una interfaz que sigue fluida incluso durante operaciones intensivas, y un motor de audio que no compite por los recursos con los píxeles de la pantalla.

El protocolo personalizado `media://` garantiza que los archivos de audio nunca se carguen enteros en la memoria RAM: se transmiten en streaming directamente del disco al reproductor. Puedes gestionar archivos WAV sin comprimir de horas de duración sin que el consumo de memoria de la aplicación cambie de forma apreciable.

---

## 1.4 La rejilla de regia: una gramática visual

La interfaz operativa de RLMP se organiza en columnas verticales, cada una con un papel semántico preciso. Antes incluso de arrancar el software, vale la pena fijar esta gramática.

En la rejilla principal hay seis columnas visibles. Una séptima superficie —el **pad FX**, la *jingle machine* de los efectos— vive fuera de la rejilla, en un panel dedicado que se describe en el Capítulo 7.

| Columna | Color | Función |
|---|---|---|
| **Show Assets** | Verde | Sintonías, bases, fondos estructurales del show |
| **Jingle** | Ámbar | Jingles y ráfagas identificativas recurrentes |
| **Promo** | Cian | Promos, autopromociones, anuncios programados |
| **Canciones del episodio** | Rojo | La lista de reproducción musical |
| **Voz / Grabaciones** | Naranja | Entrevistas, vocales, bloques hablados |
| **Pre-Show** | Violeta | Música de espera antes del directo, con rotación de jingles y promos |

Las tres primeras columnas (Show Assets, Jingle y Promo) comparten la misma naturaleza de audio: son elementos de estructura y servicio, tratados del mismo modo por el motor de mezcla. La distinción es organizativa: separar las sintonías de los jingles y de las promos mantiene la escaleta legible incluso cuando está saturada.

Cada columna tiene comportamientos de audio distintos —prioridad en la mezcla, reglas de exclusión, valores de fade— que se detallarán en el Capítulo 6. Por ahora basta con saber que la posición de un clip en la rejilla no es decorativa: determina cómo lo tratará el software durante la emisión. Las columnas que no necesitas pueden ocultarse de la vista (Ajustes → Generales → Diseño de regia) sin perder los clips que contienen.

---

## 1.5 Versión actual y actualizaciones

Este manual describe la versión **1.11.5** de Runtime Live Machine Pro. En el arranque, el software comprueba de forma silenciosa si hay una versión más reciente y, si la encuentra, abre un aviso de actualización, nunca durante un directo. El sistema de actualización se describe en el Capítulo 12. Los archivos de proyecto `.lmp` son compatibles con las versiones posteriores: actualizar el software no implica la pérdida ni la migración manual de los proyectos existentes.
