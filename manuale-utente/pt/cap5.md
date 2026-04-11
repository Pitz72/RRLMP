# CAPÍTULO 5: O MOTOR DE MISTURA (O CÉREBRO)

O Runtime Live Machine Pro não é um simples leitor que toca ficheiros de áudio ao acaso. No seu interior existe um **"Cérebro" de Mistura** sempre ativo.
O software age como um técnico de som virtual invisível: escuta o que está a fazer e ajusta automaticamente os volumes das outras faixas para garantir que o resultado final seja sempre limpo e inteligível.

Não tem de se preocupar em baixar manualmente a música quando começa uma entrevista: o RRLMP trata disso.

---

## 5.1 A Hierarquia de Áudio (A Pirâmide)

Para perceber como funciona, imagine as colunas como uma pirâmide de importância. Quem está no topo "manda" no volume de quem está em baixo.

1.  **NÍVEL 1 (Chefes Supremos): VOZES / PRÉ-GRAVADOS** (Coluna Laranja)
    *   Têm sempre a prioridade absoluta. Ninguém pode baixar o seu volume. Quando falam, todos os outros se calam.
2.  **NÍVEL 2 (Classe Média): MÚSICAS DO EPISÓDIO** (Coluna Vermelha)
    *   São baixadas pelas Vozes. Mas mandam nos Assets.
3.  **NÍVEL 3 (Fundo): SHOW ASSETS** (Coluna Verde)
    *   São as bases e os tapetes sonoros. São silenciados por quase tudo o resto.

> **Nota Bem**: A coluna **SFX / CARTWALL** (Cinzenta) está "fora do sistema". Os efeitos sonoros tocam sempre no volume máximo e sobrepõem-se a tudo sem influenciar ou ser influenciados pelos outros. Um aplauso deve ouvir-se forte, mesmo sobre uma voz.

---

## 5.2 O Ducking Automático (Efeito Rádio)

Esta é a função mais utilizada em rádio. O "Ducking" é o abaixamento automático da música quando alguém fala.

*   **Como funciona**:
    1.  Tem uma Música ou uma Base em reprodução (Volume 100%).
    2.  Lança um clip da coluna **VOZES** (ex. uma entrevista ou um áudio).
    3.  O software baixa imediata e suavemente a Música/Base para um nível de fundo (cerca de 20% do volume, ou -14dB).
    4.  A Voz soa clara sobre a música.
    5.  Assim que o clip Voz acaba, a música sobe automaticamente para 100%.

*   **Vantagem**: Não tem de usar o rato para baixar faders enquanto tenta lançar a entrevista. É tudo automático.

---

## 5.3 Dominância Musical (Gestão Inteligente de Bases)

Um erro clássico dos realizadores principiantes é fazer tocar uma música *sobre* uma base rítmica (Bed), criando um caos sonoro (bateria contra bateria). O RRLMP resolve este problema com a **Dominância Musical**.

*   **O Cenário**:
    Tem uma Base (Show Asset) em loop sob a voz do locutor. A dada altura lança um disco (Música).
*   **O que faz o RRLMP**:
    Em vez de parar a base (que precisaria pronta depois da música), o software leva-a a **Volume 0 (Mudo)** mas continua a fazê-la rodar "em fantasma".
*   **O Resultado**:
    Ouve-se apenas a Música. A base desapareceu.
*   **O Regresso**:
    Quando a Música acaba (ou prime Stop na música), a Base reemerge automaticamente em desvanecimento (Fade In).

Isto permite-lhe ter um fluxo contínuo "Base -> Música -> Base" sem nunca ter de clicar em "Play" na base uma segunda vez.

---

## 5.4 Exceções: As "Interrupções" (Stacchi)

O que acontece se quiser tocar um Jingle da rádio *sobre* a base, sem que a base desapareça de todo?
Aqui entra em jogo a definição **Behavior: Stacco** (ver Cap. 4).

*   Se um clip na coluna Assets estiver definido como "Normal", parará as outras bases.
*   Se estiver definido como **"Stacco"**, sobrepor-se-á às outras bases baixando-as ligeiramente, mas sem as parar. É ideal para os Station ID ("Estão a ouvir a Runtime Radio...") que devem "cavalgar" a intro de uma faixa ou uma base.
