# Capítulo 13 — Funções avançadas

---

Este capítulo reúne as funcionalidades que não pertencem ao fluxo de trabalho básico mas que, uma vez descobertas, entram de forma estável na prática de quem produz shows com cuidado e regularidade: a NoteBoard, a gestão cromática das colunas, as transições, as definições gerais, o registo dos disparos e o histórico das alterações.

---

## 13.1 NoteBoard: o guião em regia

A **NoteBoard** é o sistema de notas integradas nas clips. Permite associar a qualquer clip um texto escrito (instruções operacionais, alinhamentos, apontamentos sobre uma entrevista, o texto completo de um spot) e fazê-lo surgir automaticamente no ecrã no momento em que essa clip entra em reprodução.

### Inserir uma nota

1. Abra as definições da clip (clique direito na card) e vá à secção *Notas*.
2. Escreva o texto no campo livre. Não há limite de comprimento.

As clips com uma nota mostram o badge 📋 na card.

### O painel em direto

Quando uma clip com notas entra em reprodução, o **painel NoteBoard** surge na parte inferior do ecrã com o texto associado, encabeçado pelo nome e pela cor da clip. O painel permanece visível durante toda a reprodução e fecha-se sozinho quando a clip termina. Se várias clips com notas tocarem em conjunto, o painel mostra a de prioridade mais alta.

### Casos de uso

- **Regia falada.** Associe a cada genérico as primeiras linhas do bloco falado que se segue: quando o genérico arranca, o texto já está à frente dos olhos.
- **Conteúdo a ler.** Um spot publicitário com o texto completo na nota: mal arranca, lê-se.
- **Instruções operacionais.** «Baixar o monitor», «Verificar o nível dos auscultadores do convidado», «Iniciar a gravação».
- **Entrevistas.** As perguntas para o convidado ficam visíveis durante toda a duração da clip.

---

## 13.2 Personalização cromática das colunas

As cores predefinidas têm um significado consolidado (verde para os Assets, vermelho para as Músicas, e assim por diante), mas cada coluna é personalizável. Clique no **círculo colorido** no cabeçalho da coluna: abre-se uma paleta de **30 cores**. Escolha uma e a coluna (cabeçalho, cards, indicadores) assume imediatamente a nova cor. A escolha fica guardada no ficheiro de projeto.

As cards herdam dinamicamente a cor da coluna: em repouso surgem num tom atenuado, em reprodução na cor plena. Cada projeto pode assim ter a sua própria identidade cromática.

---

## 13.3 Transições entre clips

Quando uma clip está definida em *Play Next*, a passagem para a clip seguinte da coluna faz-se segundo o modo de transição configurado:

- **Crossfade.** A clip cessante esbate-se enquanto a entrante sobe, sobrepostas. Duração predefinida: 2 segundos.
- **Segue.** A clip cessante esbate-se à saída enquanto a seguinte arranca logo em cheio. Duração predefinida da dissolvência: 0,8 segundos.
- **Gapless (corte seco).** A clip cessante pára de repente e a seguinte arranca de imediato, sem dissolvência.

Pode definir uma transição ao nível de cada clip ou deixar em **Padrão global**, que aplica a escolha geral definida nas Definições. A coluna Pré-Show usa o crossfade como predefinição. Todos os modos são testáveis sem ir para o ar, através do botão «Test →» no editor (Capítulo 5).

---

## 13.4 A janela de Definições gerais

As **Definições** (menu Ferramentas) reúnem as preferências globais do software, organizadas em separadores.

### Gerais

- **Idioma.** Selecione o idioma da interface entre os oito disponíveis. A alteração é imediata.
- **Controlo Remoto (Beta).** Ativa o comando à distância via browser e mostra PIN, porta e endereços (Capítulo 11).
- **Layout de regia.** Mostra ou oculta individualmente as colunas da grelha. Ocultar uma coluna não elimina as suas clips: permanecem no projeto. É uma preferência global, válida para todos os projetos.

### Áudio & Mix

- **Dispositivo de saída.** O destino de áudio (Capítulo 8).
- **Inteligência de mixagem.** A intensidade do ducking (quanto baixa a música quando fala uma voz, predefinido 20%) e a sua rapidez (predefinido 500 ms).
- **Transições.** O modo de transição predefinido e as durações de crossfade e segue.

### Gravação

Resumo do ponto de captura (depois do limiter) e escolha do formato predefinido proposto na exportação (Capítulo 9).

### Master Chain

- **Homologação do volume.** Ativa/desativa a normalização de loudness e define o seu alvo (predefinido −16 LUFS).
- **Master Chain.** Ativa ou faz bypass de toda a cadeia, e regula os andares individuais: frequência do HPF, estilo do multiband glue, limiar do limiter. Um botão repõe os valores predefinidos (Capítulo 6).

---

## 13.5 Playout Log

O **Playout Log** (ícone no cabeçalho) é o registo cronológico dos disparos: guarda o rasto do que foi para o ar e quando, até aos últimos milhares de eventos. É útil para reconstruir um alinhamento a posteriori, verificar o que foi transmitido ou compilar um resumo do direto.

---

## 13.6 Anular e Repetir

As alterações ao alinhamento (adições, movimentações, eliminações) são reversíveis. `Ctrl+Z` anula a última operação, `Ctrl+Y` (ou `Ctrl+Shift+Z`) repete-a, com um histórico profundo de várias dezenas de passos. As mesmas opções estão disponíveis no menu Ferramentas. É a rede de segurança para as operações feitas à pressa durante a preparação.

---

## 13.7 Sistema de notificações toast

O RLMP não usa janelas bloqueantes para as comunicações de rotina. As notificações não críticas surgem como **toast**: pequenos banners não intrusivos num canto do ecrã, que permanecem alguns segundos e desaparecem sozinhos sem interromper a reprodução. São usados para confirmar uma gravação, o fim de uma exportação, uma operação de MIDI Learn ou para avisar de ficheiros em falta.

As **janelas de confirmação**, necessárias quando uma ação é irreversível (a eliminação de clips, o fecho de um projeto não guardado), são por sua vez modais e exigem uma resposta, mas foram concebidas para não cortar a reprodução em curso: o áudio continua enquanto decide.
