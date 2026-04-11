# CAPÍTULO 4: EDIÇÃO AVANÇADA DE CLIPS (PROPRIEDADES)

Cada ficheiro de áudio é diferente: alguns têm longos silêncios iniciais, outros têm um volume demasiado baixo, e outros precisam de se repetir infinitamente.
Para aceder ao painel de configuração avançada, faça **Clique Direito** em qualquer clip e selecione **"Edit"** (Editar).

Abrir-se-á uma janela modal dividida em duas secções principais: **Visual & Basic** (Esquerda) e **Behavior & Timing** (Direita).

---

## 4.1 Definições Básicas (Visual & Áudio)

Nesta secção controla a aparência e o volume bruto do clip.

*   **Nome do Clip**: Pode renomear o clip como preferir (ex. de aixa_01_final.mp3 para GENÉRICO DE ABERTURA). Isto altera apenas a etiqueta no software, não o nome do ficheiro original no disco.
*   **Volume (Gain)**: Um cursor que vai de 0% a 150%.
    *   Se tiver uma gravação baixa (ex. um áudio de WhatsApp), pode empurrá-lo para além dos 100% para o alinhar com o resto do show.
*   **Cor Personalizada**: Por defeito, o clip herda a cor da sua coluna (ex. Verde para Assets). Aqui pode forçar uma cor diferente para o destacar (ex. colorir de Vermelho um jingle importante na coluna Cinzenta).

---

## 4.2 Precisão Cirúrgica: Cue Points & Trim

Muitas vezes os ficheiros de áudio não estão "prontos para o ar": têm segundos de silêncio no início ou caudas demasiado longas. Em vez de usar um editor de áudio externo, pode arranjá-los aqui. Estas alterações são **não destrutivas** (o ficheiro original permanece intacto).

### Controlos Manuais
*   **Trim Start (Início)**: Define quantos segundos saltar no início.
    *   *Exemplo*: Se puser 2.5, quando premir Play o clip partirá instantaneamente do segundo 2.5, saltando o silêncio inicial ("à batida").
*   **Trim End (Fim)**: Define quantos segundos cortar do fim.
    *   *Exemplo*: Se a música tiver 20 segundos de aplausos finais inúteis, aumente este valor até que a "Nova Duração" o satisfaça.

### ?? A Varinha Mágica (Smart Trim / Deteção Auto)
Para acelerar o trabalho, o RRLMP inclui um algoritmo de inteligência artificial básico.
1.  Clique no botão com o ícone de **Varinha Mágica** junto aos controlos de Trim.
2.  O software analisa o ficheiro numa fração de segundo.
3.  Deteta automaticamente onde começa e acaba o som real (acima do limiar de -40dB).
4.  Preenche automaticamente os campos *Start* e *End* para si.

> **Dica**: Use sempre a Varinha Mágica nas gravações de voz ou entrevistas para as limpar instantaneamente.

---

## 4.3 Comportamentos (Behaviors & Logic)

Aqui define a inteligência do clip: o que deve fazer quando começa e o que deve fazer quando acaba.

### Behavior (Modo de Sobreposição)
*   **Normal (Predefinição)**: Quando lança este clip, qualquer outro clip que esteja a tocar **na mesma coluna** é parado. É o comportamento padrão para as músicas (uma exclui a outra).
*   **Stacco** (Interrupção): Quando lança este clip, este **NÃO para** os outros clips da coluna, mas "silencia-os" temporariamente (ou sobrepõe-se).
    *   *Uso típico*: Um efeito sonoro ou um jingle vocal que quer tocar sobre uma base musical localizada na mesma coluna, sem interromper a base.

### Next Action (Automação Final)
O que acontece quando o clip acaba?
*   **Stop**: O clip acaba e para. (Comportamento padrão).
*   **Loop**: O clip recomeça do início infinitamente. Útil para bases e fundos. Aparecerá um crachá **[LOOP]** no cartão.
*   **Play Next**: Assim que este clip começa a desvanecer (Fade Out), o software lança automaticamente o clip seguinte na coluna.
    *   *Crossfade*: A transição é fluida, sem buracos de silêncio. Aparecerá um crachá **[NEXT]** no cartão.

---

## 4.4 Fades (Desvanecimentos)

Cada coluna tem predefinições (ex. a Música faz fade em 2 segundos, os Jingles são secos), mas aqui pode sobrescrevê-los.

*   **Fade In (ms)**: Quanto tempo demora o volume a chegar ao máximo quando prime Play. (Ex. 2000ms = 2 segundos de subida gradual).
*   **Fade Out (ms)**: Quanto tempo demora a desvanecer quando prime Stop ou quando o clip acaba naturalmente.
    *   *Nota*: Um Fade Out longo é útil para as músicas. Um Fade Out a 0 é obrigatório para os cortes secos.

---

## 4.5 Atribuição de Controlos (Input)

No fundo do painel encontra as referências para o controlo externo:
*   **Trigger Keybind**: Clique aqui e prima uma tecla no teclado (ex. "Q") para a atribuir a este clip.
*   **MIDI Bind**: Mostra a nota MIDI atribuída (ex. NOTE:60). Para a modificar, use o modo "MIDI Learn" a partir do ecrã principal (ver Cap. 6).
