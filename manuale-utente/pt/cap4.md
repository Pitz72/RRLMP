# Capítulo 4 — O workflow base: carregar e reproduzir

---

O ciclo operacional fundamental do Runtime Live Machine Pro articula-se em três fases: importar os ficheiros de áudio, organizá-los na grelha, reproduzi-los durante o direto. Este capítulo descreve cada fase com a precisão necessária para trabalhar em segurança mesmo sob pressão.

---

## 4.1 Importar os ficheiros de áudio

O RLMP não dispõe de um explorador interno nem de uma biblioteca centralizada. A importação faz-se por **drag & drop** direto a partir do gestor de ficheiros do sistema operativo (Explorador de Ficheiros no Windows, Finder no macOS, Nautilus ou equivalentes no Linux). Em alternativa, a partir do menu FICHEIRO pode importar uma playlist **M3U** e transformá-la numa sequência de clips.

### O gesto base

1. Abra a pasta do seu computador onde estão os ficheiros de áudio.
2. Selecione um ou mais ficheiros. Para selecionar vários: `Ctrl+Clique` para seleção descontínua, `Shift+Clique` para seleção contínua.
3. Arraste os ficheiros selecionados para cima de uma das colunas da grelha e largue. Para os efeitos sonoros, arraste-os diretamente para o pad FX (Capítulo 7).

Cada ficheiro gera uma card na coluna de destino. Se arrastar vários ficheiros ao mesmo tempo, as cards são criadas pela ordem em que os ficheiros aparecem no gestor de ficheiros, de cima para baixo.

**Indicador de inserção.** Durante o arrasto, uma linha azul luminosa percorre a coluna a indicar a posição exata em que as cards vão ser inseridas. Pode inserir novas clips no topo, no fundo ou numa posição intermédia, com precisão.

### Formatos suportados

O motor FFmpeg integrado garante compatibilidade com uma ampla gama de formatos de áudio:

| Formato | Extensão | Notas |
|---|---|---|
| MP3 | `.mp3` | Todos os bitrates |
| WAV | `.wav` | PCM não comprimido, qualquer profundidade de bit |
| FLAC | `.flac` | Lossless, qualquer sample rate |
| AAC / M4A | `.aac`, `.m4a` | Inclui ficheiros do iTunes/Apple Music |
| OGG Vorbis | `.ogg` | |
| Opus | `.opus` | |
| WMA | `.wma` | Windows Media Audio |
| WebM / MP4 | `.webm`, `.mp4` | Faixas de áudio contidas nestes containers |

**Uma nota sobre o desempenho.** O protocolo de streaming `media://` garante que os ficheiros de áudio não são carregados na memória RAM no momento da importação. Um ficheiro WAV não comprimido de 2 GB comporta-se exatamente como um MP3 de 5 MB: o carregamento é instantâneo e o impacto na memória do sistema é negligenciável. Os recursos da CPU só são solicitados durante a descodificação ativa, ou seja, durante a reprodução.

### O caminho dos ficheiros

O RLMP guarda o **caminho absoluto** do ficheiro no disco, não uma cópia do próprio ficheiro. Se mover, renomear ou apagar o ficheiro original, a card correspondente fica vermelha e deixa de ser reproduzível. Para trabalhar em vários computadores ou criar arquivos portáteis, utilize a função **Export Package** descrita no Capítulo 10.

---

## 4.2 Reprodução: iniciar e parar as clips

### Iniciar uma clip

Um **clique esquerdo** na card é suficiente para iniciar a reprodução. O feedback é imediato: a card acende-se no verde de estado ativo, o timer passa à contagem decrescente e os VU meter no cabeçalho refletem o sinal à saída.

Se à clip tiver sido atribuída uma tecla do teclado (ver Capítulo 8), essa tecla funciona como alternativa ao clique — útil quando está a operar noutra parte da interface e não quer deslocar o rato.

### Parar uma clip

**Clique na clip ativa** — a clip entra na fase de **fade out** e pára dentro do tempo configurado nas suas propriedades (ver Capítulo 5).

**Tecla `Esc`** — pára todas as clips ativas instantaneamente. É o comando de emergência. Funciona quando o RLMP é a janela ativa, mesmo enquanto está a escrever num campo de texto.

**Botão STOP ALL** no cabeçalho — idêntico ao `Esc`, acessível com o rato.

### A lógica de exclusão por coluna

Na maioria das colunas, o RLMP aplica a regra **«uma clip de cada vez»**: se está a reproduzir a *Faixa A* na coluna Músicas e clica na *Faixa B* da mesma coluna, a *Faixa A* pára (com fade out) e a *Faixa B* arranca. Não é preciso parar manualmente a clip em curso antes de iniciar outra.

Os **efeitos do pad FX** são a exceção principal: sobrepõem-se a tudo, incluindo outros efeitos, e não interrompem o que está a tocar. Um aplauso pode arrancar enquanto uma canção está a tocar sem interromper a sua reprodução.

Também as clips com o comportamento **Stacco** (separador; configurável nas propriedades, ver Capítulo 5) se sobrepõem sem parar as outras clips da coluna, independentemente de onde se encontrem.

---

## 4.3 Organizar o alinhamento

### Reordenar as clips

Durante a preparação do show, ou mesmo enquanto o show está a decorrer, pode reorganizar a ordem das clips a qualquer momento.

**Arrasto interno.** Clique numa card, mantenha premido e arraste-a para cima ou para baixo na mesma coluna. A linha-guia azul indica a posição de inserção. A clip insere-se na nova posição sem interromper as reproduções em curso.

**Movimentação entre colunas.** Pode arrastar uma clip de uma coluna para outra. Quando o faz, a clip **herda as regras da coluna de destino**: uma voz pré-gravada movida para a coluna Músicas começa a sofrer o ducking exatamente como uma faixa musical.

Mover as clips entre colunas é uma operação poderosa e intencional. Use a função de forma consciente, especialmente durante o direto.

### Seleção múltipla e eliminação

Para remover várias clips da grelha numa só operação:

1. `Ctrl+Clique` (Windows/Linux) ou `Cmd+Clique` (macOS) em cada clip a selecionar. O contorno fica azul.
2. Prima `Del` ou `Delete`. O software pede confirmação se o número de clips selecionadas for superior a uma.

A eliminação da grelha remove as clips do projeto atual, não os ficheiros de áudio do disco. Se se enganar, `Ctrl+Z` anula a operação.

> **Sugestão prática.** Com o direto iniciado, esvaziar a coluna Pré-Show com uma seleção múltipla e `Del` é a forma mais rápida de libertar espaço visual na interface e passar ao modo operacional.

---

## 4.4 Cues de estrutura: INTRO e OUTRO

Cada clip pode ter dois **marcadores estruturais** configurados no editor da forma de onda (Capítulo 5):

- **Intro Marker** — o ponto em que a melodia principal da faixa entra efetivamente, depois da introdução instrumental. Útil para saber exatamente quando começar a falar por cima da intro.
- **Outro Marker** — o ponto em que começa a cauda final da faixa. Assinala o momento certo para preparar a transição para a faixa seguinte.

Quando a reprodução de uma clip se aproxima destes pontos, na card surge um aviso visual:

- **INTRO: −MM:SS** — contagem decrescente até ao Intro Marker.
- **OUTRO IN: −MM:SS** — contagem decrescente até ao Outro Marker, seguida de **🚨 OUTRO** quando a cauda começou.

Estes avisos só são mostrados se os marcadores tiverem sido configurados. Nas clips sem marcadores, a card mostra apenas a contagem decrescente padrão no final da faixa.
