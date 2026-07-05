# Capítulo 1 — Runtime Live Machine Pro: uma filosofia

---

*Nota do autor*

Quinze anos de microfones abertos deixam marca em quem os viveu. Já geri podcasts, conduzi programas de conversa, mantive uma rádio online no ar e, durante boa parte desse tempo, fi-lo tudo sozinho: o alinhamento, a música, as entrevistas, os volumes, o timing. Sei bem o que é perceber, em direto, que a canção está quase a terminar enquanto ainda se está a formular a ideia seguinte. Sei o que é baixar o fader com uma mão e procurar a clip certa com a outra, enquanto a terceira mão, essa que ninguém tem, devia estar a segurar o fio do discurso.

É dessa frustração que nasce o Runtime Live Machine Pro, e de uma convicção simples: a regia de áudio não devia ser um trabalho à parte, devia ser transparente. O locutor, o podcaster, o criador de conteúdos que conduz sozinho uma conversa noite dentro, sem um técnico de som a fazer-lhe de apoio, precisa de se poder concentrar naquilo que sabe fazer: falar, pensar, construir a relação com quem o ouve. Do resto trata o software.

Coloquei no RLMP as regras que um bom técnico de som aplica quase sem pensar: a hierarquia entre os eventos de áudio, o ducking que dispara assim que se fala, a música que pára e recomeça no momento certo. São regras complexas, escondidas atrás de uma interface que pede um único gesto: clicar na clip certa na altura certa.

Este software foi pensado, acima de tudo, para quem gere pequenas e médias rádios de conversa, para quem produz podcasts com ambição profissional, para quem coloca uma emissão no ar sem ter uma equipa técnica por perto. Ainda assim, a sua natureza não é exclusiva: quem trabalha em contextos mais estruturados também encontrará aqui ferramentas à altura das suas necessidades. O objetivo é um só: libertar o locutor de figuras de apoio que nem sempre existem, e que nem sempre são necessárias.

---

Toda a ferramenta nasce de uma resposta a um problema. No caso do Runtime Live Machine Pro, o problema é preciso: a regia de áudio ao vivo, seja em rádio, podcast, eventos ou teatro, é uma atividade de performance, não de automação. Exige controlo instantâneo, nervos de aço e um software que não falhe no momento errado.

O que encontra instalado no seu computador não é um sistema de programação musical 24 horas, nem uma DAW de pós-produção, nem um simples leitor com fila de espera. É outra coisa: uma **máquina de regia em tempo real**, pensada a partir da ideia de que cada show é um ato único e irrepetível, que merece um contentor próprio e um controlo cirúrgico sobre cada transição.

---

## 1.1 Para quem foi construído

O Runtime Live Machine Pro dirige-se a dois tipos de utilizador que, apesar das diferenças de contexto, partilham a mesma necessidade de base.

O **profissional de broadcast** (o realizador de uma rádio comercial, o técnico de som de uma emissão de áudio ou vídeo em direto, o locutor que gere o seu próprio show) encontrará no RLMP um sistema à altura das ferramentas profissionais de gama alta, com a agilidade operacional que esses sistemas tantas vezes sacrificam em nome da complexidade.

Já o **criador de conteúdos** (o podcaster independente, o apresentador de uma rádio online, o organizador de eventos ao vivo) encontrará uma ferramenta que não exige anos de formação técnica para se dominar, mas que também não cede em qualidade.

Em ambos os casos, a interface responde à tecla de forma instantânea, o motor de áudio é estável, e o sistema de gravação não perde nada pelo caminho.

---

## 1.2 A filosofia «Single Show»

O conceito fundador do Runtime Live Machine Pro é o **projeto isolado**. Cada show que produz, seja um episódio de podcast, um direto de rádio ou um espetáculo de teatro, vive num ficheiro `.lmp` autónomo que contém tudo: a disposição das clips, os volumes, os mapeamentos MIDI, os pontos de cue, as notas de regia. Ao carregar esse ficheiro, reencontra o show exatamente como o deixou.

Isto tem consequências práticas. Não é preciso reconfigurar o software sempre que se muda de show. Um projeto pode ser levado para qualquer computador, através da função Exportar projeto com áudio, com a garantia de que vai funcionar. E os episódios passados podem ser arquivados e reabertos meses depois sem surpresas.

O ficheiro `.lmp` não contém os ficheiros de áudio físicos: guarda os caminhos no disco. Para a passagem entre computadores, a função **Exportar projeto com áudio** copia fisicamente tudo o que é necessário para uma pasta autocontida.

---

## 1.3 A arquitetura Main-Side-Heavy

Perceber a arquitetura interna não é indispensável para usar o software, mas ajuda a entender por que certos problemas comuns noutros leitores aqui simplesmente não acontecem.

O Runtime Live Machine Pro assenta em **Electron**, uma plataforma que separa com clareza o processo principal (*Main Process*, em Node.js) do processo de renderização da interface (*Renderer Process*). Essa separação é aproveitada de propósito.

Todas as operações pesadas (descodificação de áudio via FFmpeg, leitura dos ficheiros do disco, análise das formas de onda, gestão das cópias de segurança) ficam a cargo do Main Process. O Renderer trata só da interface: mostra as clips, anima os VU meter, responde aos cliques. Daqui resulta uma interface que se mantém fluida mesmo durante operações intensivas, e um motor de áudio que não disputa recursos com os pixéis no ecrã.

Já o protocolo personalizado `media://` garante que os ficheiros de áudio nunca são carregados por inteiro para a memória RAM: são antes transmitidos em streaming, diretamente do disco para o leitor. Por isso é possível gerir ficheiros WAV não comprimidos com horas de duração sem que o consumo de memória da aplicação mude de forma percetível.

---

## 1.4 A grelha de regia: uma gramática visual

A interface operacional do RLMP organiza-se em colunas verticais, cada uma com um papel semântico preciso. Vale a pena fixar esta gramática antes de sequer arrancar o software.

Seis colunas são visíveis na grelha principal. Uma sétima superfície — o **pad FX**, a *jingle machine* dos efeitos — vive fora da grelha, num painel dedicado descrito no Capítulo 7.

| Coluna | Cor | Função |
|---|---|---|
| **Show Assets** | Verde | Genéricos, bases, fundos estruturais do show |
| **Jingle** | Âmbar | Jingles e separadores identificativos recorrentes |
| **Promo** | Ciano | Promos, autopromoções, anúncios programados |
| **Músicas do episódio** | Vermelho | A playlist musical |
| **Voz / Gravações** | Laranja | Entrevistas, vozes, blocos falados |
| **Pré-Show** | Roxo | Música de espera antes do direto, com rotação de jingles e promos |

As três primeiras colunas (Show Assets, Jingle e Promo) partilham a mesma natureza de áudio: são elementos de estrutura e serviço, tratados da mesma forma pelo motor de mistura. A distinção entre elas é apenas organizativa, mas separar os genéricos dos jingles e das promos mantém o alinhamento legível mesmo quando está cheio.

Cada coluna tem comportamentos de áudio distintos (prioridade na mistura, regras de exclusão, valores de fade), pormenores que ficam para o Capítulo 6. Por agora basta saber que a posição de uma clip na grelha não é decorativa: é ela que determina como o software a vai tratar durante a emissão. As colunas de que não precisar podem ser ocultadas da vista em Definições → Gerais → Layout de regia, sem que isso implique perder as clips que contêm.

---

## 1.5 Versão atual e atualizações

Este manual descreve a versão **1.15.10** do Runtime Live Machine Pro. No arranque, o software verifica silenciosamente se há uma versão mais recente e, se a encontrar, abre um aviso de atualização, nunca durante um direto. O sistema de atualização está descrito no Capítulo 12. Quanto aos ficheiros de projeto `.lmp`, são compatíveis com as versões seguintes: atualizar o software não implica perder nem migrar manualmente os projetos existentes.
