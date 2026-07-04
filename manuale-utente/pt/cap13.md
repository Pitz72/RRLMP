# Capítulo 13 — Funções avançadas

---

Este capítulo reúne as funcionalidades que não pertencem ao fluxo de trabalho básico, mas que, uma vez descobertas, passam a fazer parte estável da rotina de quem produz shows com cuidado: a NoteBoard, a gestão cromática das colunas, as transições, as definições gerais, o registo dos disparos e o histórico de alterações.

---

## 13.1 NoteBoard: o guião em regia

A **NoteBoard** é o sistema de notas integradas nas clips. Com ela associa-se a qualquer clip um texto escrito, seja uma instrução operacional, um alinhamento, apontamentos sobre uma entrevista ou o texto completo de um spot, que surge automaticamente no ecrã assim que essa clip entra em reprodução.

### Inserir uma nota

1. Abra as definições da clip (clique direito na card) e vá à secção *Notas*.
2. Escreva o texto no campo livre; não há limite de comprimento.

As clips com uma nota associada mostram o badge 📋 na card.

### O painel em direto

Quando uma clip com notas entra em reprodução, surge na parte inferior do ecrã o **painel NoteBoard**, encabeçado pelo nome e pela cor da clip e com o respetivo texto. Fica visível durante toda a reprodução e fecha-se sozinho assim que a clip termina. Caso várias clips com notas toquem em simultâneo, o painel mostra a de prioridade mais alta.

### Casos de uso

- **Regia falada.** Associe a cada genérico as primeiras linhas do bloco falado seguinte, para que o texto já esteja à frente dos olhos assim que o genérico arranca.
- **Conteúdo a ler.** Um spot publicitário com o texto completo na nota permite lê-lo mal a clip arranque.
- **Instruções operacionais.** «Baixar o monitor», «Verificar o nível dos auscultadores do convidado», «Iniciar a gravação».
- **Entrevistas.** As perguntas para o convidado permanecem visíveis durante toda a duração da clip.

---

## 13.2 Personalização cromática das colunas

As cores predefinidas obedecem a um significado consolidado, verde para os Assets, vermelho para as Músicas e assim sucessivamente, mas cada coluna pode ser personalizada. Basta clicar no **círculo colorido** no cabeçalho da coluna para abrir uma paleta de **30 cores**: ao escolher uma, a coluna inteira (cabeçalho, cards, indicadores) assume de imediato a nova cor, e a escolha fica guardada no ficheiro de projeto.

As cards herdam dinamicamente a cor da coluna: em repouso aparecem num tom atenuado, em reprodução na cor plena. Assim, cada projeto pode ter a sua própria identidade cromática.

---

## 13.3 Transições entre clips

Quando uma clip está definida em *Play Next*, a passagem para a seguinte na mesma coluna segue o modo de transição configurado:

- **Crossfade.** A clip cessante esbate-se enquanto a entrante sobe, ficando ambas sobrepostas por 2 segundos (duração predefinida).
- **Segue.** A clip cessante esbate-se à saída enquanto a seguinte arranca já em cheio; a dissolvência dura 0,8 segundos por predefinição.
- **Gapless (corte seco).** A clip cessante para de repente e a seguinte arranca de imediato, sem qualquer dissolvência.

A transição pode ser definida ao nível de cada clip ou deixada em **Padrão global**, aplicando-se então a escolha geral configurada nas Definições. A coluna Pré-Show usa o crossfade por predefinição. Todos os modos podem ser testados sem ir para o ar, através do botão «Test →» no editor (Capítulo 5).

---

## 13.4 A janela de Definições gerais

As **Definições** (menu Ferramentas) reúnem as preferências globais do software, organizadas em separadores.

### Gerais

- **Idioma.** Permite escolher o idioma da interface entre os oito disponíveis, com alteração imediata.
- **Controlo Remoto (Beta).** Ativa o comando à distância via browser e mostra PIN, porta e endereços (Capítulo 11).
- **Layout de regia.** Mostra ou oculta individualmente as colunas da grelha. Ocultar uma coluna não elimina as respetivas clips, que permanecem no projeto; trata-se de uma preferência global, válida para todos os projetos.

### Áudio & Mix

- **Dispositivo de saída.** O destino de áudio (Capítulo 8).
- **Inteligência de mixagem.** A intensidade do ducking, ou seja, quanto a música baixa quando uma voz fala (predefinido 20%), e a rapidez com que o faz (predefinido 500 ms).
- **Transições.** O modo de transição predefinido e as durações de crossfade e segue.

### Gravação

Resumo do ponto de captura (depois do limiter) e escolha do formato predefinido proposto na exportação (Capítulo 9).

### Master Chain

- **Homologação do volume.** Ativa ou desativa a normalização de loudness e define o respetivo alvo (predefinido −16 LUFS).
- **Master Chain.** Ativa ou faz bypass de toda a cadeia e regula os andares individuais: frequência do HPF, estilo do multiband glue, limiar do limiter. Um botão repõe os valores predefinidos (Capítulo 6).

---

## 13.5 Playout Log

O **Playout Log** (ícone no cabeçalho) regista cronologicamente os disparos: guarda o rasto do que foi para o ar e quando, até aos últimos milhares de eventos. Serve para reconstruir um alinhamento a posteriori, verificar o que foi transmitido ou compilar um resumo do direto.

---

## 13.6 Anular e Repetir

As alterações ao alinhamento, adições, movimentações ou eliminações, são todas reversíveis. `Ctrl+Z` anula a última operação e `Ctrl+Y` (ou `Ctrl+Shift+Z`) repete-a, com um histórico que chega a várias dezenas de passos. As mesmas opções estão disponíveis no menu Ferramentas: é a rede de segurança para as operações feitas à pressa durante a preparação.

---

## 13.7 Sistema de notificações toast

O RLMP evita janelas bloqueantes para as comunicações de rotina. As notificações não críticas surgem como **toast**: pequenos banners discretos num canto do ecrã, que permanecem alguns segundos e desaparecem sozinhos sem interromper a reprodução. Servem para confirmar uma gravação, assinalar o fim de uma exportação, uma operação de MIDI Learn ou avisar de ficheiros em falta.

Já as **janelas de confirmação**, necessárias quando uma ação é irreversível, como a eliminação de clips ou o fecho de um projeto não guardado, são modais e exigem resposta. Ainda assim, foram concebidas para não cortar a reprodução em curso: o áudio continua enquanto decide.
