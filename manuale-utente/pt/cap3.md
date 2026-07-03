# Capítulo 3 — A interface de trabalho

---

A interface do Runtime Live Machine Pro foi construída para o contexto operacional mais exigente: o direto. Cada opção visual — o tema escuro, o alto contraste, o tamanho dos controlos — responde a um requisito funcional. Não é estética pela estética, mas ergonomia.

Quando abre um projeto, o ecrã divide-se em duas zonas distintas: a **Barra de Controlo** em cima, que gere o projeto e o sistema, e a **Grelha de Regia** central, onde decorre o trabalho propriamente dito.

---

## 3.1 A Barra de Controlo (Cabeçalho)

O cabeçalho ocupa toda a largura do ecrã. Da esquerda para a direita, reúne a identidade do software, os comandos sobre ficheiros, a monitorização e os controlos de transporte, o menu de ferramentas e os indicadores de sessão.

### Identidade

**Logótipo e badge PRO.** À esquerda, o logótipo acompanha a inscrição **RLM PRO** — a palavra «PRO» é apresentada com um gradiente iridescente que passa do ciano ao verde, ao âmbar, ao vermelho. Ao lado, em carateres monoespaçados, aparece a versão instalada (`v1.11.5`). Ao passar o rato sobre o logótipo, surge o nome completo do software com o número de versão.

### Menu Ficheiro

O botão **FICHEIRO** abre um menu com as operações sobre projetos:

- *Novo Projeto* — abre uma sessão vazia. Se houver alterações não guardadas, o software pede confirmação.
- *Guardar Projeto* — gravação rápida no ficheiro `.lmp` atual. A opção fica realçada a amarelo quando há alterações não guardadas.
- *Guardar Como…* — abre sempre a caixa de diálogo, para criar versões progressivas (ex. `Ep47_rascunho.lmp`, `Ep47_final.lmp`).
- *Carregar Projeto* — abre um projeto `.lmp` do disco.
- *Importar M3U* — importa uma playlist em formato M3U como sequência de clips.
- *Exportar Arquivo* — cria uma cópia autocontida do projeto, incluindo os ficheiros de áudio. Descrito no Capítulo 10.

### Monitorização e transporte

**VU Meter estéreo (L/R).** Duas barras horizontais mostram o nível de áudio real à saída, depois do Master Volume. A escala cromática é intuitiva: verde até cerca de 85% do percurso, depois amarelo e, por fim, vermelho perto do fundo de escala. O vermelho persistente assinala clipping: reduza o nível.

**Master Volume.** O fader controla o volume geral de saída do software, de 0 a 100%. Funciona como um fader master: levado a zero, nenhum som sai, seja qual for o estado das clips individuais. Se tiver mapeado um controlo MIDI no Master Volume, um pequeno badge mostra a atribuição.

**STOP ALL (botão vermelho «ALL»).** Pára instantaneamente todas as clips ativas e cancela os fades em curso. É o comando de emergência do sistema. A tecla `Esc` do teclado executa a mesma função quando a aplicação está em foco — mesmo enquanto está a escrever num campo de texto.

> **Nota.** Ao contrário das versões anteriores, o `Esc` já não está registado como atalho global do sistema: atua quando o RLMP é a janela ativa. Esta opção permite às caixas de diálogo usarem o `Esc` para fechar sem parar o direto.

**FX.** Abre e fecha o pad FX, a *jingle machine* dos efeitos (Capítulo 7). Um pequeno contador indica quantos efeitos estão a tocar naquele momento.

**MIX.** Abre e fecha a vista Automix, o deck dedicado à coluna Música (Capítulo 7).

### Ferramentas

O menu **Ferramentas** (ícone de chave-inglesa) reúne:

- *Anular* e *Repetir* — o histórico das alterações ao alinhamento (`Ctrl+Z` / `Ctrl+Y`).
- *MIDI Learn* — ativa o modo de aprendizagem MIDI (Capítulo 8).
- *Keybinds* — a janela de atribuição de teclas às clips.
- *Definições* — as preferências globais do software (Capítulo 13).
- *Info* — versão, créditos e verificação manual das atualizações.

Logo abaixo do menu aparece por instantes o indicador *Auto-saved*, a confirmar que o projeto foi guardado automaticamente.

![A Barra de Controlo com o menu Ferramentas aberto.](../screenshots-pt/barra-controllo.png)

*Figura 3.1 — A Barra de Controlo e o menu Ferramentas aberto (Anular/Repetir, MIDI Learn, Keybinds, Definições gerais, Info).*

### Indicadores de sessão

No lado direito do cabeçalho encontram lugar o botão do **Playout Log** (o registo cronológico dos disparos, Capítulo 13), o botão de **Gravação** (Capítulo 9), o **Timer On Air** (que, quando em direto, mostra `ON AIR HH:MM:SS` sobre fundo vermelho) e o **relógio de estúdio** digital em formato de 24 horas, sincronizado com o relógio do sistema.

Na área do cabeçalho podem ainda surgir notificações não intrusivas (**toast**) relativas a operações concluídas ou a avisos do sistema. Ao contrário das caixas de diálogo bloqueantes, os toasts desaparecem sozinhos passados alguns segundos e não interrompem a reprodução.

---

## 3.2 A grelha de seis colunas

![A grelha de regia de seis colunas com clips de exemplo e os respetivos badges de estado.](../screenshots-pt/interfaccia-principale.png)

*Figura 3.2 — A interface de trabalho: a grelha de seis colunas com as cards de áudio.*

A grelha é o centro operacional do software: seis colunas verticais lado a lado, cada uma com o seu próprio cabeçalho cromático e a sua própria lógica de comportamento de áudio. Os efeitos sonoros não têm coluna na grelha: vivem no pad FX (Capítulo 7).

### Cabeçalhos de coluna

Cada cabeçalho indica o nome da coluna, o seu tipo e funciona como indicador de estado. Em condições normais é estático e colorido no tom caraterístico da coluna. Quando a clip em reprodução é a última disponível da coluna, não está em loop e faltam menos de **20 segundos** para o fim, o cabeçalho entra em alarme **DEAD AIR**: pulsa, vira ao âmbar, mostra um ícone de aviso e o badge **END**. É a antecipação que lhe dá tempo para preparar a faixa seguinte antes do silêncio.

A cor de cada coluna é personalizável: clique no círculo colorido do cabeçalho para abrir uma paleta de **30 tons**. A escolha fica guardada no ficheiro de projeto.

No cabeçalho da coluna **Pré-Show** aparece ainda um botão de **rotação**: quando está ativo, a fila de pré-direto insere automaticamente jingles e promos a intervalos regulares (Capítulo 13).

### As seis colunas

**Show Assets (Verde)**
Os elementos estruturais do show: genéricos, bases musicais, fundos (*bed*), separadores institucionais. Comportam-se como elementos de segundo plano: cedem espaço quando chegam vozes ou canções, mas mantêm a rotação interna enquanto não forem parados.

**Jingle (Âmbar)** e **Promo (Ciano)**
Duas colunas dedicadas, respetivamente, aos jingles identificativos e às promos ou autopromoções. No plano do áudio comportam-se exatamente como os Show Assets (pertencem à mesma família), mas mantê-las separadas conserva o alinhamento ordenado e legível.

**Músicas do episódio (Vermelho)**
A playlist musical. As clips desta coluna participam ativamente na mistura automática: são baixadas quando tocam as vozes e, por sua vez, silenciam as bases dos Assets quando entram em reprodução (Capítulo 6). Nas clips musicais o software deteta automaticamente o **BPM**, mostrado com um badge próprio.

**Voz / Gravações (Laranja)**
Entrevistas, blocos falados pré-gravados, mensagens de voz. Esta coluna tem a **prioridade máxima** no sistema de mistura: quando uma clip aqui está em reprodução, todos os outros sinais são baixados para um nível de fundo.

**Pré-Show (Roxo)**
A playlist de aquecimento antes do direto. Funciona como uma fila musical autónoma, com rotação opcional de jingles e promos. Quando começa o direto propriamente dito, esta coluna é tipicamente esvaziada ou desativada.

---

## 3.3 A Card de Áudio (Clip)

Cada ficheiro de áudio importado materializa-se na grelha como uma **card** retangular. A card é a unidade operacional do sistema: vê-se, dispara-se, configura-se, move-se.

### Anatomia de uma card

**Título e artista.** O nome do ficheiro ou o nome personalizado atribuído nas propriedades. O título personalizado muda apenas a etiqueta no software; o ficheiro original no disco fica intacto. Nas clips musicais, por baixo do título pode aparecer o nome do artista.

**Timer.** Em repouso, mostra a duração total da clip no formato `MM:SS`. Durante a reprodução passa à **contagem decrescente**, com o prefixo negativo (ex. `−01:20`). Quando faltam menos de 15 segundos para o fim, o timer fica **vermelho**.

**Badges de estado.** Pequenas etiquetas comunicam de forma imediata as propriedades configuradas:

- **STACCO** — a clip está definida para se sobrepor às outras sem as parar.
- **LOOP** — a clip recomeça do início ao terminar a reprodução.
- **NEXT** — no fim desta clip arranca automaticamente a seguinte na coluna.
- **▶ UP NEXT** — realça qual será a próxima clip a arrancar na sequência automática.
- **### BPM** — o tempo detetado, nas clips musicais.
- **TRIM…** — análise do silêncio em curso (Auto-Trim).
- **FADE OUT** — surge na clip cessante durante um crossfade ou uma dissolvência.
- **📋** — a clip tem uma nota associada na NoteBoard (Capítulo 13).

**Atribuições.** Se a clip tiver uma tecla do teclado atribuída, a letra surge num badge da cor da coluna; se tiver um binding MIDI, aparece a etiqueta `M` seguida do número da nota (ex. `M60`).

**Cues de estrutura.** Se estiverem configurados os marcadores, durante a reprodução surgem as contagens decrescentes `INTRO: −MM:SS` (em ciano) e `OUTRO IN: −MM:SS` (em laranja), até ao aviso `🚨 OUTRO` quando a cauda começou.

**Indicador de reprodução.** Quando uma clip está em play, a card acende-se: contorno verde, fundo com um halo luminoso, um círculo pulsante e o título realçado. A barra de progresso corre no fundo da card.

### Interação com as cards

- **Clique esquerdo** — inicia a clip se estiver parada; pára-a (com fade out) se estiver em reprodução.
- **Ctrl + Clique** (Windows/Linux) ou **Cmd + Clique** (macOS) — seleciona a clip sem a iniciar. O contorno fica azul. Útil para a seleção múltipla e a eliminação em bloco.
- **Tecla Del** (ou *Delete* / *Backspace*) — elimina as clips selecionadas da grelha. Se estiverem selecionadas várias clips, o software pede confirmação.
- **Clique direito** — abre as **Definições da clip**: propriedades, editor da forma de onda, notas (Capítulo 5).
- **Drag & Drop** — arraste uma card para a reordenar dentro da coluna ou movê-la para outra. Um indicador luminoso azul mostra a posição de inserção durante o arrasto.

### Card em estado de erro

Uma card com a indicação **FICHEIRO EM FALTA** e o contorno vermelho assinala que o ficheiro de áudio referenciado já não está acessível: foi movido, renomeado ou encontra-se num disco externo que não está ligado. A clip não é reproduzível enquanto o ficheiro não voltar a estar disponível no caminho original. A gestão dos erros de caminho é tratada no Capítulo 14.
