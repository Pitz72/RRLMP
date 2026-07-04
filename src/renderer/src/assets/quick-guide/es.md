# Runtime Live Machine Pro — Guía Rápida

**Versión 1.15.6 · Español**

Bienvenido a Runtime Live Machine Pro (RLMP), el software de playout de audio para radio, programas en directo y eventos live. Esta guía te lleva desde la instalación hasta tu primera reproducción en pocos minutos. Para la documentación completa, consulta el Manual de Usuario (descargable desde el software con el botón "Manual").

---

## 1. Requisitos del sistema

| | Mínimo | Recomendado |
|---|---|---|
| Windows | 10 de 64 bits | 11 de 64 bits |
| macOS | 11 Big Sur | 13 Ventura o posterior |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB o más |
| Disco | 300 MB | 1 GB + espacio para los archivos de audio |

No se necesita una tarjeta de sonido dedicada: RLMP funciona con cualquier dispositivo reconocido por el sistema, desde la salida integrada hasta mezcladores USB profesionales (Rødecaster Pro, Rødecaster Duo, etc.). Optimizado de forma nativa para Apple Silicon (M1/M2/M3).

---

## 2. Instalación

**Windows**
1. Abre el archivo `.exe` descargado.
2. Si aparece el aviso *"Windows ha protegido su PC"*, haz clic en **Más información** → **Ejecutar de todas formas**. Esto es normal en software actualizado con frecuencia: no hay ningún malware, el código es verificable públicamente.
3. Sigue el asistente de instalación. Al finalizar se crea un acceso directo en el Escritorio y en el menú Inicio.

**macOS**
1. Abre el archivo `.dmg` descargado.
2. Arrastra el icono de Runtime Live Machine Pro a la carpeta **Aplicaciones**.
3. En el primer inicio, si macOS muestra un aviso de Gatekeeper, ve a **Ajustes del Sistema → Privacidad y seguridad** y haz clic en **Abrir de todas formas** junto al nombre de la aplicación.

**Linux**
- **AppImage** (portátil, sin instalación): haz el archivo ejecutable con `chmod +x` y ejecútalo.
- **.deb** (Debian/Ubuntu/Mint): instala con `sudo dpkg -i nombrearchivo.deb` o con el gestor de paquetes gráfico.
- Si la aplicación no arranca, comprueba que tienes instalado el paquete `libasound2` para el soporte de ALSA.

---

## 3. Primer inicio

Al abrir la aplicación verás la **Welcome Screen**: desde aquí puedes crear un nuevo proyecto, cargar uno existente (`.lmp`), descargar el Manual de Usuario o abrir esta Guía Rápida. En la esquina superior derecha puedes elegir el idioma de la interfaz entre los ocho disponibles.

Una vez abierto un proyecto, el badge **PRO** cian en la cabecera confirma que el motor de audio está activo. Pulsa `F11` (Windows/Linux) o `Ctrl+Cmd+F` (macOS) para pasar a pantalla completa, el modo de trabajo recomendado durante la emisión en directo.

---

## 4. Las seis columnas

RLMP organiza todo en seis columnas fijas, cada una con un comportamiento propio:

| Columna | Color | Comportamiento |
|---|---|---|
| **Show Assets** | Verde | Sintonías, bases musicales, cortinillas institucionales |
| **Jingle** | Ámbar | Jingles identificativos |
| **Promo** | Cian | Promos y autopromociones |
| **Canciones** | Rojo | Lista de reproducción musical, sujeta a ducking, detección de BPM |
| **Voces** | Naranja | Máxima prioridad: baja el volumen de todo lo demás |
| **Pre-Show** | Morado | Música de espera antes de salir en directo, con rotación opcional |

Cada columna tiene un punto de color en la cabecera: haz clic en él para elegir un color diferente entre las 30 tonalidades disponibles.

---

## 5. Pad FX y Automix

Además de las seis columnas, la cabecera ofrece dos herramientas rápidas:

- **FX** — abre el pad de efectos sonoros: reproducción con superposición libre, ideal para stingers, aplausos y transiciones sonoras.
- **MIX** — abre la vista Automix, el deck dedicado a la columna Canciones: compatibilidad de BPM, transiciones beat-matched y modo automático.

---

## 6. Carga y reproduce tu primer archivo

1. Arrastra un archivo de audio (MP3, WAV, AAC/M4A, OGG, FLAC) desde el Explorador de archivos / Finder directamente a una columna.
2. **Clic izquierdo** sobre la tarjeta para iniciar la reproducción.
3. **Vuelve a hacer clic** sobre la tarjeta activa para detenerla con fundido de salida, o pulsa `Esc` para un stop de emergencia inmediato de todos los clips.

En la mayoría de las columnas rige la regla de "un clip a la vez": al iniciar uno nuevo se detiene automáticamente el que esté en curso en esa misma columna. El pad FX y los clips en modo Stacco (Interrupción) son la excepción y se superponen libremente.

---

## 7. Dónde encontrar ayuda

- **Manual de Usuario completo** — descargable directamente desde el software (botón "Manual" en la pantalla Info), cubre en detalle cada función (editor de forma de onda, ducking, MIDI, grabación, gestión de proyectos, control remoto).
- **Sitio web oficial y actualizaciones** — el color junto al número de versión en la Welcome Screen indica si hay una actualización disponible (verde = actualizado, amarillo/naranja = nueva versión disponible).

Buena emisión.

*Runtime Live Machine Pro es un proyecto Ecosystem.Runtime — © Simone Pizzi.*
