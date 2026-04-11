# CAPÍTULO 7: GESTIÓN DE PROYECTOS Y SEGURIDAD

Configurar un show requiere tiempo: cargar los clips, ajustar los volúmenes, establecer los recortes. Perder este trabajo sería desastroso.
Runtime Live Machine Pro utiliza un sistema de guardado de múltiples niveles para garantizar que sus datos estén siempre seguros.

---

## 7.1 El Archivo de Proyecto (.lmp)

Todos los ajustes de su show (posiciones de los clips, colores, volúmenes, mapeo MIDI, ajustes de fundido) se guardan en un único archivo con extensión **.lmp** (Live Machine Project).

> **Importante**: El archivo .lmp es un archivo de texto (JSON) que contiene las "instrucciones" para el software. **NO contiene los archivos de audio físicos**. Solo memoriza la *ruta* donde se encuentran los archivos en su computadora (ej. C:\Musica\Intro.mp3).

### Guardar el trabajo
En la barra de comandos superior, tiene dos opciones distintas:

1.  **?? Guardar (Quick Save)**:
    *   Haga clic en el icono del Disquete.
    *   Sobrescribe inmediatamente el archivo .lmp abierto actualmente.
    *   Es la acción que debe realizar regularmente mientras trabaja.
2.  **??? Guardar Como (Save As)**:
    *   Haga clic en el icono del Disquete con la Pluma.
    *   Abre siempre un cuadro de diálogo para crear un **nuevo archivo**.
    *   Úselo para crear diferentes versiones del show (ej. "Podcast_Ep1.lmp", "Podcast_Ep2.lmp").

### Protección de Cierre (Cambios No Guardados)
El software monitorea constantemente sus acciones. Si ha realizado cambios no guardados (cargado un clip, cambiado un volumen) e intenta cerrar el programa, RRLMP **bloqueará el cierre** y le mostrará una advertencia: *"Hay cambios no guardados"*.
Nunca perderá el trabajo por un clic accidental en la "X".

---

## 7.2 Auto-Backup (La Red de Seguridad)

No siempre se acuerda uno de guardar. Por esto, RRLMP incluye un sistema de **Auto-Backup** invisible que trabaja en segundo plano.

*   **Frecuencia**: Cada **5 minutos**, el software guarda automáticamente una copia de seguridad del estado actual.
*   **¿Dónde va el backup?**
    *   Si está trabajando en un proyecto ya guardado (ej. MiShow.lmp), el software crea un archivo "sombra" en la misma carpeta llamado **MiShow.lmp.bak**.
*   **Cómo recuperarlo**:
    *   Si la PC se apaga repentinamente o el archivo principal se corrompe, vaya a la carpeta del proyecto.
    *   Busque el archivo .bak.
    *   Renómbrelo quitando el .bak (o ábralo directamente con RRLMP). Habrá recuperado el trabajo hasta los últimos 5 minutos.

---

## 7.3 Collect & Save (Exportación Portátil)

Esta es la función fundamental para quien trabaja en varias computadoras o quiere archivar el show.
Dado que el archivo .lmp solo memoriza los *enlaces* a los archivos de audio, si copia solo ese archivo a otra PC (o a una memoria USB), el software ya no encontrará la música (rutas rotas).

Para mover el show, debe usar la función **Export Package**.

### Cómo crear un Paquete Portátil
1.  Haga clic en el icono **?? Export (Caja)** en la barra superior.
2.  El sistema le pedirá que seleccione una carpeta vacía (ej. en su memoria USB).
3.  **El proceso de Copia**:
    *   El software analiza todo el proyecto.
    *   Crea una subcarpeta llamada udio/ en el destino.
    *   **Copia físicamente** todos los archivos MP3/WAV originales dentro de esa carpeta.
    *   Crea un nuevo archivo project.lmp en el que todos los enlaces han sido reescritos para apuntar a la carpeta local udio/.

### El Resultado
Obtendrá una carpeta que contiene todo lo necesario. Puede conectar la memoria USB a cualquier computadora con Runtime Live Machine Pro instalado, abrir el archivo project.lmp y todo funcionará perfectamente, independientemente de las letras de unidad o de las rutas originales.

> **Uso Recomendado**: Use esta función al final de la preparación de cada show para crear un "Master" para llevar al estudio o para archivar como respaldo histórico completo.
