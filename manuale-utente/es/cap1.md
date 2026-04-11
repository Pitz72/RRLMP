# CAPÍTULO 1: INTRODUCCIÓN Y CONFIGURACIÓN

Bienvenido a **Runtime Live Machine Pro (RRLMP)**.
Este capítulo le guiará a través de los primeros pasos: desde la comprensión de la filosofía del software hasta el primer inicio.

## 1.1 Qué es Runtime Live Machine Pro (RRLMP)

**Runtime Live Machine Pro** es una arquitectura de audio profesional de clase "Pro" diseñada para la dirección de **espectáculos en vivo individuales**, podcasts, eventos y radios web.

A diferencia del complejo software de automatización de radio 24/7 (que reproduce música en rotación durante días), RRLMP es una herramienta de **Rendimiento** (Performance). Está diseñado para ser "tocado" en tiempo real por un director o locutor, ofreciendo un control quirúrgico sobre cada transición.

### ¿Por qué elegir RRLMP?
*   **Filosofía "Single Show"**: Cada proyecto es un contenedor aislado que guarda todo lo necesario para ese episodio o evento específico.
*   **Arquitectura Main-Side-Heavy**: Utiliza un proxy Node.js para la decodificación de audio pesada (FFmpeg), garantizando que la interfaz (Renderer) permanezca fluida y sin bloqueos incluso con archivos WAV de gran tamaño.
*   **Seguridad Total**: Incluye sistemas de Auto-Backup, verificación de integridad de archivos .lmp y advertencias visuales para los puntos de inserción Intro/Outro.
*   **Control Físico**: Soporta nativamente controladores MIDI (con MIDI Learn) y teclados para una dirección táctil y reactiva.

---

## 1.2 Instalación

### Requisitos del Sistema
*   **Windows**: Windows 10 o Windows 11 (64-bit).
*   **macOS**: macOS 11 (Big Sur) o posteriores (Soporte nativo Apple Silicon & Intel).
*   **Linux**: Soporte para AppImage y paquetes .deb (Ubuntu/Debian/Mint).
*   **RAM**: Mínimo 4GB (8GB Recomendados).
*   **Espacio en Disco**: 200MB para la aplicación + espacio para sus archivos de audio.

### Instalación en Windows
1.  Descargue el archivo `Runtime Live Machine Pro Setup 1.0.0.exe` desde el sitio oficial o el repositorio.
2.  Haga doble clic en el ejecutable.
3.  El instalador automático copiará los archivos y creará un acceso directo en el Escritorio.
4.  Al finalizar, la aplicación se iniciará automáticamente.

> **Nota de Seguridad**: Dado que el software se actualiza con frecuencia, Windows SmartScreen podría mostrar una advertencia "PC protegido por Windows". Haga clic en **"Más información"** y luego en **"Ejecutar de todas formas"**. El software es seguro, está firmado y libre de malware.

### Instalación en macOS
1.  Descargue el archivo `.dmg`.
2.  Abra el archivo de imagen y arrastre el icono de **Runtime Live Machine Pro** a la carpeta **Aplicaciones**.
3.  En el primer inicio, es posible que deba autorizar la aplicación en *Ajustes del Sistema > Seguridad y Privacidad*.

---

## 1.3 La Pantalla de Bienvenida (Welcome Screen)

En el primer inicio, será recibido por la nueva **Welcome Screen** con diseño horizontal. Este es su panel de inicio, diseñado para permitirle comenzar a trabajar en segundos.

### Elementos de la Pantalla
1.  **Nuevo Logotipo**: El logotipo Pro (5 barras de vúmetro con un triángulo de reproducción) identifica la versión estable del software.
2.  **Estado de la Versión**: Debajo del logotipo, verá el número de la versión actual (ej. `v1.0.0`).
    *   ✅ **Verde**: Tiene la última versión disponible.
    *   ⬇️ **Amarillo/Naranja**: Hay una actualización disponible.
3.  **Selector de Idioma**: En la parte superior derecha encontrará banderas (8 idiomas soportados) para cambiar instantáneamente la interfaz.
    *   *Idiomas*: IT, EN, FR, DE, ES, PT, RU, ZH.
    *   Su elección se guardará en el perfil de usuario.

### Acciones Disponibles
*   **Nuevo Proyecto (New Project)**: Crea una sesión vacía. Las 5 columnas (Assets, Music, Voice, SFX, PRE-SHOW) estarán listas para cargar archivos.
*   **Cargar Proyecto (Load Project)**: Abre un archivo `.lmp` existente. RRLMP realizará un control de integridad: si faltan archivos de audio, se resaltarán en rojo.
*   **Manual en Línea**: Abre la documentación actualizada en su navegador.

> **Primer Inicio**: RRLMP se inicia preferiblemente en pantalla completa. Una vez cargado un proyecto, notará el distintivo **PRO** cian en el encabezado, confirmando la licencia y la estabilidad del motor de audio.
