# CAPÍTULO 5: EL MOTOR DE MEZCLA (EL CEREBRO)

Runtime Live Machine no es un simple reproductor que toca archivos de audio al azar. En su interior hay un **"Cerebro" de Mezcla** siempre activo.
El software actúa como un ingeniero de sonido virtual invisible: escucha lo que está haciendo y ajusta automáticamente los volúmenes de las otras pistas para garantizar que el resultado final sea siempre limpio e inteligible.

No tiene que preocuparse por bajar manualmente la música cuando comienza una entrevista: RLM se encarga de ello.

---

## 5.1 La Jerarquía de Audio (La Pirámide)

Para entender cómo funciona, imagine las columnas como una pirámide de importancia. Quien está en la cima "manda" sobre el volumen de quien está abajo.

1.  **NIVEL 1 (Jefes Supremos): VOCES / PREGRABADOS** (Columna Naranja)
    *   Tienen siempre la prioridad absoluta. Nadie puede bajar su volumen. Cuando ellos hablan, todos los demás se callan.
2.  **NIVEL 2 (Clase Media): CANCIONES DEL EPISODIO** (Columna Roja)
    *   Son bajadas por las Voces. Pero mandan sobre los Assets.
3.  **NIVEL 3 (Fondo): SHOW ASSETS** (Columna Verde)
    *   Son las bases y las camas sonoras. Son silenciados por casi todo lo demás.

> **Nota**: La columna **SFX / CARTWALL** (Gris) está "fuera del sistema". Los efectos de sonido suenan siempre al volumen máximo y se superponen a todo sin influir o ser influenciados por los otros. Un aplauso debe escucharse fuerte, incluso sobre una voz.

---

## 5.2 El Ducking Automático (Efecto Radio)

Esta es la función más utilizada en radio. El "Ducking" es la bajada automática de la música cuando alguien habla.

*   **Cómo funciona**:
    1.  Tiene una Canción o una Base en reproducción (Volumen 100%).
    2.  Lanza un clip desde la columna **VOCES** (ej. una entrevista o un mensaje de voz).
    3.  El software baja inmediatamente y suavemente la Canción/Base a un nivel de fondo (aproximadamente el 20% del volumen, o -14dB).
    4.  La Voz suena clara sobre la música.
    5.  Tan pronto como el clip de Voz termina, la música sube automáticamente al 100%.

*   **Ventaja**: No tiene que usar el mouse para bajar faders mientras intenta lanzar la entrevista. Es todo automático.

---

## 5.3 Dominancia Musical (Gestión Inteligente de Bases)

Un error clásico de los directores novatos es hacer sonar una canción *sobre* una base rítmica (Bed), creando un caos sonoro (batería contra batería). RLM resuelve este problema con la **Dominancia Musical**.

*   **El Escenario**:
    Tiene una Base (Show Asset) en bucle bajo la voz del locutor. En cierto punto lanza un disco (Canción).
*   **Qué hace RLM**:
    En lugar de detener la base (que necesitaría lista después de la canción), el software la lleva a **Volumen 0 (Mudo)** pero continúa haciéndola girar "en fantasma".
*   **El Resultado**:
    Solo se escucha la Canción. La base ha desaparecido.
*   **El Retorno**:
    Cuando la Canción termina (o presiona Stop en la canción), la Base reaparece automáticamente en fundido (Fade In).

Esto le permite tener un flujo continuo "Base -> Canción -> Base" sin tener nunca que hacer clic en "Play" en la base una segunda vez.

---

## 5.4 Excepciones: Los "Stacchi" (Interrupciones)

¿Qué sucede si quiere reproducir un Jingle de la radio *sobre* la base, sin que la base desaparezca del todo?
Aquí entra en juego la configuración **Behavior: Stacco** (ver Cap. 4).

*   Si un clip en la columna Assets está configurado como "Normal", detendrá las otras bases.
*   Si está configurado como **"Stacco"**, se superpondrá a las otras bases bajándolas ligeramente, pero sin detenerlas. Es ideal para los Station ID ("Están escuchando Runtime Radio...") que deben "cabalgar" sobre la intro de un tema o una base.
