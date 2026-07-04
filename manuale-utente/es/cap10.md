# Capítulo 10 — Gestión de proyectos y seguridad de los datos

---

Preparar un show lleva su tiempo: hay que seleccionar los archivos, organizarlos en las columnas, ajustar los volúmenes, fijar los fades y asignar las teclas. Todo ese trabajo es un patrimonio operativo, y como tal debe sobrevivir a cualquier imprevisto: un fallo del sistema, un cambio de ordenador o la simple necesidad de recuperar un episodio archivado meses atrás.

Por eso RLMP protege los datos en varios niveles a la vez, cada uno pensado para cubrir un riesgo distinto.

---

## 10.1 El archivo de proyecto (.lmp)

Todo el estado de un show —disposición de los clips en las columnas, nombres personalizados, volúmenes y fades, cue points del editor, notas de la NoteBoard, mapeos MIDI y de teclado, color de las columnas— queda guardado en un archivo con extensión **`.lmp`** (Live Machine Project).

Se trata de un formato JSON: texto estructurado, legible desde cualquier editor, sin nada propietario de por medio. Así, si algún día RLMP dejara de estar disponible, los datos del proyecto seguirían siendo perfectamente accesibles.

**Qué contiene el archivo `.lmp`:** todos los ajustes que acabamos de enumerar, incluidas las rutas absolutas a los archivos de audio referenciados.

**Qué no contiene:** los archivos de audio en sí. El `.lmp` se limita a anotar dónde están esos archivos en el disco, sin copiar su contenido, así que un archivo de proyecto suele pesar apenas unos kilobytes, sin importar cuántos audios referencie ni cuánto ocupen.

Cada vez que lo abres, RLMP valida el archivo: reconstruye los identificadores duplicados que pueda haber, corrige los valores fuera de rango y, si el proyecto viene de una versión anterior, añade automáticamente las columnas incorporadas desde entonces (Jingle, Promo) sin tocar nada de lo que ya existía.

---

## 10.2 Guardado

### Guardado rápido

La opción *Guardar proyecto* del menú FILE guarda al instante sobre el `.lmp` que tengas abierto, sin mostrar ningún cuadro de diálogo. Cuando hay cambios pendientes de guardar, la opción se resalta en amarillo: un aviso visual que basta con mirar de reojo. Conviene usarla a menudo mientras preparas el show.

El guardado es **atómico**: primero se escribe una copia temporal y solo después se renombra sobre el archivo original. Así, si el ordenador se apaga a mitad de la escritura, el `.lmp` nunca queda a medio hacer.

### Guardar como

A diferencia de la anterior, *Guardar como…* siempre abre el cuadro de diálogo, tenga o no nombre ya el proyecto. Resulta útil para:

- Crear versiones progresivas del mismo show (`Ep47_borrador.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Guardar una variante con configuraciones distintas.
- Crear un archivo nuevo sin sobrescribir el actual.

### Protección al cerrar

RLMP vigila en todo momento si hay cambios sin guardar. Si intentas cerrar el software, o abrir otro proyecto, mientras quede algo pendiente, la operación se detiene y aparece una confirmación con tres salidas posibles: guardar, descartar los cambios o cancelar. Basta este mecanismo para que un clic accidental al cerrar la ventana nunca se lleve por delante tu trabajo.

---

## 10.3 Auto-Backup y autoguardado

Más allá de los guardados manuales, el software mantiene también una red de protección que trabaja sola.

**Copia de seguridad del proyecto.** Cada vez que un proyecto ya guardado cambia en segundo plano, RLMP guarda junto al `.lmp` una copia `.bak` con el último estado válido conocido.

**Autoguardado por rotación.** Paralelamente, RLMP va dejando instantáneas del estado actual en una carpeta propia de la aplicación llamada `autosaves`, cada una con un nombre basado en la fecha y la hora. Se conservan las **diez más recientes**, y las antiguas se eliminan a medida que llegan otras nuevas. Esta red cubre incluso el trabajo hecho sobre un proyecto «sin título» que nunca llegaste a guardar.

La carpeta `autosaves` está en el directorio de datos de la aplicación:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Cómo recuperar.** Si el `.lmp` principal se corrompe, o el ordenador se apaga de golpe, ve a la carpeta `autosaves`, busca la instantánea con la fecha y la hora más próximas al momento del corte y ábrela desde RLMP como cualquier otro proyecto. También puedes renombrar a `.lmp` el archivo `.bak` que está junto al proyecto y abrirlo directamente.

---

## 10.4 Export Package: portabilidad completa

Como el `.lmp` guarda solo las rutas a los archivos de audio, y no los archivos en sí, llevar el proyecto a otro ordenador tiene su riesgo: si la máquina de destino no tiene esos archivos exactamente en las mismas rutas absolutas, los clips aparecen en rojo. Para evitarlo de raíz está la función **Exportar archivo autónomo** (Export Package), disponible en el menú FILE.

### Cómo funciona

RLMP recorre todas las rutas de audio del proyecto, crea una subcarpeta `audio/` y **copia físicamente** dentro cada archivo referenciado. Lo que ya está copiado e idéntico no se vuelve a duplicar; si hay coincidencias de nombre se renombran para no pisarse entre sí, y los archivos huérfanos que ya no se usan se eliminan de la carpeta.

Hay dos formas de hacerlo:

- **Junto al proyecto** — si exportas a la misma carpeta donde ya vive el `.lmp`, RLMP se limita a sincronizar la subcarpeta `audio/` junto a él.
- **Carpeta libre** — si en cambio eliges una carpeta nueva (una memoria USB, un NAS), RLMP escribe allí un `project.lmp` con las rutas ya apuntando a la subcarpeta `audio/` local.

### El resultado

La carpeta de destino queda autocontenida, con todo lo necesario para ejecutar el show en cualquier ordenador que tenga RLMP instalado, sin que importe cómo esté organizado el disco de esa máquina.

> **Práctica recomendada.** Conviene usar Exportar archivo autónomo al cerrar la preparación de cada show, para dejar listo un «master» que llevarte al estudio o guardar en el archivo. Si surge un imprevisto técnico de última hora, tendrás siempre a mano una copia completa y portable.

### Control de integridad al abrir

Cada apertura de un `.lmp` viene acompañada de un **control de integridad** automático, que comprueba si cada archivo de audio referenciado sigue siendo accesible. Los que faltan se marcan con el borde rojo y la etiqueta ARCHIVO AUSENTE en su card; el resto del proyecto, es decir todos los clips cuyos archivos sí están disponibles, sigue funcionando con normalidad.
