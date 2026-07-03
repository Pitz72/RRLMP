# Capítulo 10 — Gestión de proyectos y seguridad de los datos

---

Preparar un show lleva tiempo: seleccionar los archivos, organizarlos en las columnas, configurar los volúmenes, fijar los fades, asignar las teclas. Este trabajo es un patrimonio operativo que debe sobrevivir a cualquier imprevisto: un fallo del sistema, un cambio de ordenador, la vuelta a un episodio archivado meses antes.

RLMP aborda la seguridad de los datos en varios niveles, cada uno diseñado para cubrir un riesgo específico.

---

## 10.1 El archivo de proyecto (.lmp)

Todo el estado de un show (la disposición de los clips en las columnas, los nombres personalizados, los volúmenes y los fades, los cue points del editor, las notas de la NoteBoard, los mapeos MIDI y de teclado, el color de las columnas) se guarda en un archivo con extensión **`.lmp`** (Live Machine Project).

El formato es JSON: un archivo de texto estructurado, legible desde cualquier editor, no propietario. Si algún día RLMP no estuviera disponible, los datos del proyecto seguirían siendo accesibles.

**Qué contiene el archivo `.lmp`:** todos los ajustes enumerados arriba, incluidas las rutas absolutas a los archivos de audio referenciados.

**Qué no contiene:** los archivos de audio en sí. El `.lmp` memoriza dónde están los archivos en el disco, no copia su contenido. Un archivo de proyecto suele estar en el orden de los kilobytes, con independencia de cuántos o cuán grandes sean los archivos de audio que referencia.

Al abrirlo, RLMP valida el archivo: reconstruye eventuales identificadores duplicados, devuelve los valores fuera de escala a límites sanos y, si abres un proyecto creado con una versión anterior, añade automáticamente las columnas introducidas entretanto (Jingle, Promo), sin tocar los datos existentes.

---

## 10.2 Guardado

### Guardado rápido

La opción *Guardar proyecto* del menú FILE ejecuta un guardado inmediato en el archivo `.lmp` abierto. El guardado es silencioso: ningún cuadro de diálogo. La opción se resalta en amarillo cuando hay cambios sin guardar, un recordatorio visual de un vistazo. Úsala con frecuencia durante la preparación del show.

El guardado es **atómico**: el archivo se escribe primero en una copia temporal y luego se renombra al vuelo. Si el ordenador se apaga durante la escritura, el `.lmp` original nunca queda a medias.

### Guardar como

La opción *Guardar como…* abre siempre el cuadro de diálogo, aunque el proyecto ya tenga nombre. Úsala para:

- Crear versiones progresivas del mismo show (`Ep47_borrador.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Guardar una variante con configuraciones distintas.
- Crear un archivo nuevo sin sobrescribir el actual.

### Protección al cerrar

RLMP monitoriza de forma continua el estado de los cambios. Si intentas cerrar el software (o abrir un proyecto nuevo) con cambios sin guardar, la operación se suspende y aparece una petición de confirmación con tres opciones: guardar, descartar los cambios o cancelar. No es posible perder trabajo por un clic accidental al cerrar la ventana.

---

## 10.3 Auto-Backup y autoguardado

Además de los guardados que decides tú, el software mantiene una red de protección automática.

**Copia de seguridad del proyecto.** Cada vez que un proyecto ya guardado se actualiza en segundo plano, RLMP mantiene junto al `.lmp` una copia `.bak` con el último estado válido.

**Autoguardado por rotación.** En paralelo, RLMP escribe instantáneas del estado actual en una carpeta dedicada de la aplicación, `autosaves`, con un nombre basado en la fecha y la hora. Se conservan las **diez instantáneas más recientes**: las más antiguas se van eliminando. Esta red captura también el trabajo sobre un proyecto «sin título» nunca guardado en disco.

La carpeta `autosaves` está en el directorio de datos de la aplicación:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Cómo recuperar.** Si el archivo `.lmp` principal se ha corrompido o el ordenador se ha apagado de golpe, abre la carpeta `autosaves`, localiza la instantánea con la fecha y la hora más cercanas al momento de la interrupción y cárgala desde RLMP como un archivo de proyecto normal. Como alternativa, renombra el archivo `.bak` junto al proyecto a `.lmp` y ábrelo.

---

## 10.4 Export Package: portabilidad completa

Como el archivo `.lmp` contiene solo las rutas a los archivos de audio, no los archivos en sí, llevar el proyecto a otro ordenador exige atención: si la máquina de destino no tiene los archivos en las mismas rutas absolutas, los clips se ponen rojos. La función **Exportar archivo autónomo** (Export Package), en el menú FILE, resuelve el problema de raíz.

### Cómo funciona

RLMP analiza todas las rutas a los archivos de audio del proyecto, crea una subcarpeta `audio/` y **copia físicamente** cada archivo referenciado en su interior. Los archivos ya presentes e idénticos no se vuelven a copiar; los eventuales duplicados de nombre se renombran para no sobrescribirse, y los archivos huérfanos (ya no referenciados) se eliminan de la carpeta.

La operación tiene dos modos:

- **Junto al proyecto** — si exportas hacia la carpeta donde ya reside el `.lmp`, RLMP sincroniza la subcarpeta `audio/` junto a él.
- **Carpeta libre** — si eliges una carpeta nueva (una memoria USB, un NAS), RLMP escribe en ella un `project.lmp` con las rutas ya actualizadas para apuntar a la subcarpeta `audio/` local.

### El resultado

La carpeta de destino se vuelve autocontenida: contiene todo lo necesario para ejecutar el show en cualquier ordenador con RLMP instalado, con independencia de la estructura de carpetas de esa máquina.

> **Práctica recomendada.** Usa Exportar archivo autónomo al terminar la preparación de cada show para crear un «master» que llevar al estudio o archivar. Ante problemas técnicos de última hora, siempre tendrás una copia completa y portable lista.

### Control de integridad al abrir

Cada vez que abres un archivo `.lmp`, RLMP ejecuta un **control de integridad** automático: comprueba que cada archivo de audio referenciado sea accesible. Los archivos ausentes se señalan con el borde rojo y la etiqueta ARCHIVO AUSENTE en la card correspondiente. El resto del proyecto, todos los clips con archivos accesibles, sigue plenamente funcional.
