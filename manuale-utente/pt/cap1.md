# Capítulo 1 — Runtime Live Machine Pro: uma filosofia

---

*Nota do autor*

Quinze anos de microfones abertos deixam uma marca precisa em quem os viveu. Geri podcasts, conduzi programas de conversa, mantive uma rádio online de pé e, durante boa parte desse tempo, fiz tudo sozinho: o alinhamento, a música, as entrevistas, os volumes, o timing. Sei o que é dar-se conta, em direto, de que a canção está prestes a terminar enquanto ainda estou a formular a ideia que quero exprimir. Sei o que é ter de baixar o fader com uma mão e encontrar a clip certa com a outra, enquanto a terceira mão — a que não temos — devia manter-me o fio do discurso.

O Runtime Live Machine Pro nasce dessa frustração e de uma convicção simples: a regia de áudio não devia ser um trabalho à parte. Devia ser transparente. O locutor, o podcaster, o criador de conteúdos que conduz sozinho uma conversa noite adentro — sem um técnico de som que lhe faça de apoio — tem de poder concentrar-se naquilo que sabe fazer: falar, pensar, construir a relação com quem o ouve. O software trata do resto.

Coloquei no RLMP as regras que um bom técnico de som aplica automaticamente: a hierarquia entre os eventos de áudio, o ducking que dispara quando falamos, a música que pára e recomeça no momento certo. Regras complexas, escondidas por baixo de uma interface que pede um único gesto: clicar na clip certa no momento certo.

Este software foi pensado sobretudo para quem gere pequenas e médias rádios de conversa, para quem produz podcasts com ambição profissional, para quem coloca no ar uma emissão em direto sem uma equipa técnica à volta. Mas a sua natureza não é exclusiva: quem trabalha em contextos mais estruturados encontrará ferramentas adequadas às suas necessidades. O objetivo é um só: tornar o locutor independente de figuras de apoio que nem sempre existem, e nem sempre são precisas.

---

Toda a ferramenta nasce de uma resposta. O Runtime Live Machine Pro responde a um problema preciso: a regia de áudio ao vivo (rádio, podcast, eventos, teatro) é uma atividade de performance, não de automação. Exige controlo instantâneo, nervos de aço e um software que não falhe no momento errado.

O software que encontra instalado no seu computador não é um sistema de programação musical 24 horas, nem uma DAW para pós-produção, nem um simples leitor com fila de espera. É algo de diferente: uma **máquina de regia em tempo real**, construída em torno da ideia de que cada show é um ato único, irrepetível, que merece um contentor dedicado e um controlo cirúrgico sobre cada transição.

---

## 1.1 Para quem foi construído

O Runtime Live Machine Pro dirige-se a dois tipos de utilizadores que, apesar das diferenças de contexto, partilham a mesma necessidade fundamental.

O **profissional de broadcast** — o realizador de uma rádio comercial, o técnico de som de uma emissão de áudio ou vídeo em direto, o locutor que gere o seu próprio show — encontrará no RLMP um sistema à altura das ferramentas profissionais de gama alta, com a agilidade operacional que esses sistemas muitas vezes sacrificam em nome da complexidade.

O **criador de conteúdos** — o podcaster independente, o apresentador de uma rádio online, o organizador de eventos ao vivo — encontrará uma ferramenta que não exige anos de formação técnica para ser dominada, mas que não faz cedências quanto à qualidade do resultado.

Ambos encontrarão uma interface que responde à tecla instantaneamente, um motor de áudio estável e um sistema de gravação que não esquece.

---

## 1.2 A filosofia «Single Show»

O conceito fundador do Runtime Live Machine Pro é o **projeto isolado**. Cada show que produz — um episódio de podcast, um direto de rádio, um espetáculo de teatro — vive num ficheiro `.lmp` autónomo que contém tudo: a disposição das clips, os volumes, os mapeamentos MIDI, os pontos de cue, as notas de regia. Quando carrega esse ficheiro, reencontra o show exatamente como o deixou.

Esta abordagem tem consequências concretas. Não precisa de reconfigurar o software sempre que passa de um show para outro. Pode levar um projeto para qualquer computador — através da função Export Package — e ter a certeza de que vai funcionar. Pode arquivar os episódios passados e reabri-los meses depois sem surpresas.

O ficheiro `.lmp` não contém os ficheiros de áudio físicos: guarda os caminhos no disco. Para a passagem entre computadores, a função **Export Package** copia fisicamente tudo o que é necessário para uma pasta autocontida.

---

## 1.3 A arquitetura Main-Side-Heavy

Compreender a arquitetura interna não é indispensável para usar o software, mas ajuda a perceber porque é que certos problemas comuns a outros leitores aqui não acontecem.

O Runtime Live Machine Pro é construído sobre **Electron**, uma plataforma que separa nitidamente o processo principal (*Main Process*, em Node.js) do processo de renderização da interface (*Renderer Process*). Esta separação é aproveitada de forma intencional.

Todas as operações pesadas — descodificação de áudio via FFmpeg, leitura dos ficheiros do disco, análise das formas de onda, gestão das cópias de segurança — são delegadas no Main Process. O Renderer ocupa-se exclusivamente da interface: mostrar as clips, animar os VU meter, responder aos cliques. O resultado é uma interface que se mantém fluida mesmo durante operações intensivas, e um motor de áudio que não compete por recursos com os pixéis no ecrã.

O protocolo personalizado `media://` garante que os ficheiros de áudio nunca são carregados por inteiro na memória RAM: são transmitidos em streaming diretamente do disco para o leitor. Pode gerir ficheiros WAV não comprimidos com horas de duração sem que o consumo de memória da aplicação mude de forma apreciável.

---

## 1.4 A grelha de regia: uma gramática visual

A interface operacional do RLMP está organizada em colunas verticais, cada uma com um papel semântico preciso. Antes mesmo de arrancar o software, vale a pena fixar esta gramática.

Seis colunas são visíveis na grelha principal. Uma sétima superfície — o **pad FX**, a *jingle machine* dos efeitos — vive fora da grelha, num painel dedicado descrito no Capítulo 7.

| Coluna | Cor | Função |
|---|---|---|
| **Show Assets** | Verde | Genéricos, bases, fundos estruturais do show |
| **Jingle** | Âmbar | Jingles e separadores identificativos recorrentes |
| **Promo** | Ciano | Promos, autopromoções, anúncios programados |
| **Músicas do episódio** | Vermelho | A playlist musical |
| **Voz / Gravações** | Laranja | Entrevistas, vozes, blocos falados |
| **Pré-Show** | Roxo | Música de espera antes do direto, com rotação de jingles e promos |

As três primeiras colunas (Show Assets, Jingle e Promo) partilham a mesma natureza de áudio: são elementos de estrutura e serviço, tratados da mesma maneira pelo motor de mistura. A distinção é organizativa: separar os genéricos dos jingles e das promos mantém o alinhamento legível mesmo quando está cheio.

Cada coluna tem comportamentos de áudio distintos — prioridade na mistura, regras de exclusão, valores de fade — que serão detalhados no Capítulo 6. Por agora, basta saber que a posição de uma clip na grelha não é decorativa: determina como o software a tratará durante a emissão. As colunas de que não precisa podem ser ocultadas da vista (Definições → Gerais → Layout de regia) sem perder as clips que contêm.

---

## 1.5 Versão atual e atualizações

Este manual descreve a versão **1.11.5** do Runtime Live Machine Pro. No arranque, o software verifica silenciosamente a disponibilidade de uma versão mais recente e, se encontrar uma, abre um aviso de atualização — nunca durante um direto. O sistema de atualização está descrito no Capítulo 12. Os ficheiros de projeto `.lmp` são compatíveis com as versões seguintes: atualizar o software não implica a perda nem a migração manual dos projetos existentes.
