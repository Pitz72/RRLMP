# Capítulo 7 — O Pad FX e a vista Automix

---

Duas superfícies de trabalho vivem por cima da grelha, chamáveis com uma tecla e pensadas para dois momentos opostos da regia: o **pad FX**, para disparar efeitos e separadores a golpe certo sem interromper nada, e a **vista Automix**, para gerir o fluxo musical como faria um DJ. Nenhuma das duas rouba espaço à grelha: abrem-se quando são precisas e fecham-se com um clique.


---

## 7.1 O pad FX: a jingle machine

![O pad FX «jingle machine» aberto por cima da grelha de regia.](../screenshots-pt/pad-fx.png)

*Figura 7.1 — O pad FX: a jingle machine 5×5 dos efeitos sonoros, com disparo em sobreposição.*

Os efeitos sonoros não têm coluna na grelha. Vivem no **pad FX**, um painel em grelha de células (uma *jingle machine*) que se abre a partir do botão **FX** no cabeçalho e fica flutuante num canto do ecrã.

O pad é um **overlay não bloqueante**: não obscurece o painel e não interceta os cliques dirigidos a outro lado. Pode disparar um efeito e, no mesmo instante, continuar a operar sobre as colunas ou sobre os comandos do cabeçalho. Por essa razão, a tecla `Esc` não fecha o pad: continua a ser o comando de STOP ALL, sempre disponível. O pad fecha-se pelo seu botão de fecho ou de novo pelo toggle FX.

### Carregar e disparar os efeitos

O pad nasce com uma grelha de 25 células (5×5) e cresce em linhas à medida que adiciona mais efeitos. Para o preencher, **arraste os ficheiros de áudio diretamente para as células** do pad, tal como faria com uma coluna da grelha.

Um clique numa célula **dispara o efeito**. Os efeitos do pad são polifónicos e sobrepõem-se: várias células podem tocar em conjunto, por cima de tudo o que está no ar, sem o parar. O comportamento de áudio é idêntico ao de uma clip normal: muda apenas a superfície de disparo. Um contador junto ao botão FX no cabeçalho indica quantos efeitos estão a tocar naquele momento.

### Configurar um efeito

Os efeitos configuram-se em dois níveis, pensados para duas necessidades diferentes:

- **Definições rápidas** — o caso comum para uma jingle machine: nome, cor, volume, loop. Bastam poucos segundos.
- **Definições completas** — a mesma janela das clips da grelha (editor da forma de onda, trim, marcadores, fade, atribuição de teclas), acessível pela opção «Definições completas…» dentro das rápidas.

### Posição do pad

O pad pode ficar no canto inferior esquerdo ou inferior direito do ecrã: a preferência define-se com as setas no próprio pad e fica memorizada entre as sessões. À direita, cobre a NoteBoard e a última coluna; escolha o lado consoante a forma como dispôs o seu alinhamento.

> **Nota.** Em modo MIDI Learn, um clique numa célula do pad **seleciona** o efeito para a atribuição em vez de o tocar — assim não coloca um jingle no ar enquanto está a mapear os controlos (ver Capítulo 8).

---

## 7.2 A vista Automix

![A vista Automix com o deck da coluna Música e os pontos de compatibilidade de BPM.](../screenshots-pt/vista-automix.png)

*Figura 7.2 — A vista Automix: o deck da coluna Música, a compatibilidade de BPM e o modo automático no fim da faixa.*

A **vista Automix** é o deck da coluna Música: um ecrã a toda a largura, chamado a partir do botão **MIX** no cabeçalho, que apresenta o alinhamento musical como uma consola de DJ. Abre-se por cima do painel mas por baixo do pad FX, para que os efeitos continuem utilizáveis mesmo com a Automix aberta. Tal como no pad, o `Esc` não a fecha: continua a ser o comando de emergência, e o botão STOP ALL permanece acessível no cabeçalho.

### O deck

Ao centro encontra a faixa **no ar** e, em fila, a **próxima** faixa da coluna Música, com o tempo restante. A partir daqui pode fazer arrancar uma faixa e gerir a passagem de uma para a outra com um único comando: o grande botão de transição aplica o mesmo crossfade que usaria a partir da grelha, mas com o cuidado adicional do engate rítmico.

### Compatibilidade e transições beat-matched

Junto a cada faixa, um **ponto de compatibilidade** com a faixa anterior indica a sua afinidade rítmica:

- **Verde** — os dois tempos engatam bem: a transição pode ser beat-matched.
- **Amarelo** — engate possível mas com algumas reservas.
- **Vermelho** — tempos demasiado distantes para um engate limpo.

Quando o engate rítmico não é praticável (BPM não detetado, beat incerto, tempos demasiado diferentes), o software declara-o e recorre automaticamente a um **crossfade clássico**, sem surpresas em direto.

### O modo automático

No fundo da vista existe um interruptor para a **automação no fim da faixa**. Quando está ativo, o RLMP faz arrancar sozinho a passagem à faixa seguinte quando a faixa no ar se aproxima do fim.

Este modo é uma exceção deliberada à filosofia do software, que por opção não automatiza o show. Por isso está **desativado por predefinição** e funciona **apenas enquanto a vista Automix está aberta**: fechar a vista desativa a automação. É a ferramenta certa para um bloco musical contínuo, a meia hora de só música antes de voltar à voz, não para o direto inteiro.
