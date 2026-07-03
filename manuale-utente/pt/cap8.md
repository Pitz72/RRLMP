# Capítulo 8 — Hardware, teclado e MIDI

---

O Runtime Live Machine Pro foi concebido para se integrar com o hardware existente no estúdio sem exigir configurações elaboradas. Este capítulo descreve como encaminhar a saída de áudio, como usar o teclado do computador como controlador e como ligar dispositivos MIDI físicos para um controlo tátil da regia.

---

## 8.1 Encaminhamento de áudio

### Selecionar o dispositivo de saída

Por predefinição, o RLMP sai pelo dispositivo de áudio predefinido do sistema operativo. Num contexto profissional ou semiprofissional, com mixers USB, placas de som externas ou sistemas multipista, é útil selecionar explicitamente o destino do sinal.

1. Abra as **Definições** a partir do menu Ferramentas.
2. No separador *Áudio & Mix*, abra o menu do dispositivo de saída: encontra a lista dos dispositivos de áudio disponíveis no sistema.
3. Selecione o dispositivo pretendido.

Se o dispositivo escolhido for desligado, o RLMP recorre automaticamente ao do sistema; a aplicação monitoriza as ligações e reage à inserção ou remoção de dispositivos USB.

### Mixers USB e setup multicanal

Os mixers USB como o Rødecaster Pro, o RØDECaster Duo ou o Focusrite Scarlett expõem tipicamente vários canais USB ao sistema operativo (Main Mix, Sounds/Chat, Monitor, etc.). O RLMP aparece como uma única fonte estéreo; a escolha do canal USB para onde o encaminhar está nas suas mãos.

**Setup recomendado com mixer USB.** Atribua o RLMP a um canal secundário do mixer (ex. «Sounds» no Rødecaster Pro) em vez do canal principal. Assim controla o volume do RLMP com um fader físico dedicado, separa-o do sinal do microfone físico e aplica eventual processamento de hardware apenas a esse canal.

### Latência e buffer

O RLMP utiliza as APIs de áudio nativas do sistema operativo. A latência de saída é determinada pelo buffer do dispositivo de áudio, não pelo software. Com placas de som profissionais, a latência fica na ordem de poucos milissegundos, impercetível num contexto de playout.

Se notar artefactos de áudio (crepitações, dropouts), o valor de buffer do dispositivo está provavelmente demasiado baixo. Aumente-o no painel de controlo da placa de som (não a partir do RLMP, que não gere diretamente o driver): um buffer de 256 ou 512 amostras é o ponto de equilíbrio ideal entre latência e estabilidade.

---

## 8.2 Controlo por teclado

O teclado do computador é o controlador mais rápido disponível em direto: não exige coordenação olho-mão, funciona às escuras e está sempre à mão. O RLMP prevê um conjunto de atalhos globais e a possibilidade de atribuir teclas a cada clip.

### Atalhos globais

| Tecla | Ação |
|---|---|
| **Esc** | STOP ALL — pára todas as clips ativas |
| **Del / Backspace** | Elimina as clips selecionadas |
| **Ctrl+Z** | Anula a última alteração ao alinhamento |
| **Ctrl+Y** (ou **Ctrl+Shift+Z**) | Repete a alteração anulada |
| **Ctrl+Shift+D** | Mostra/oculta o Debug Overlay |
| **Ctrl+Shift+M** | Abre o simulador MIDI (para testes sem controlador) |

O `Esc` atua como STOP ALL quando o RLMP é a janela ativa, mesmo enquanto o cursor está num campo de texto. Já não é um atalho registado ao nível do sistema operativo: se a aplicação estiver em segundo plano, traga primeiro a janela para primeiro plano.

> **Nota.** Não existem teclas de função (F1–F5) pré-atribuídas ao lançamento das colunas. Para lançar rapidamente uma clip específica, atribua-lhe uma tecla dedicada, como se descreve a seguir.

### Teclas personalizadas por clip

Além dos atalhos globais, cada clip pode ter uma tecla dedicada. O badge correspondente surge na card.

**Para atribuir uma tecla:**
1. Abra as definições da clip (clique direito na card) ou a janela **Keybinds** a partir do menu Ferramentas.
2. Clique no campo da tecla.
3. Prima a tecla pretendida.

**Teclas disponíveis.** Quase qualquer tecla: letras (A–Z), números (0–9), teclado numérico, barra de espaços, teclas de função livres. Se a tecla já estiver atribuída a outra clip, o software assinala o conflito antes de sobrepor, para não criar duplicados invisíveis.

**Segurança durante a digitação.** As teclas personalizadas são desativadas automaticamente quando está em modo de inserção de texto (a renomear uma clip ou a escrever uma nota). Isto previne disparos acidentais enquanto digita.

---

## 8.3 Controlador MIDI

O MIDI é a escolha profissional para um controlo físico, tátil e fiável. O RLMP suporta os controladores USB-MIDI: teclados, pads (ex. Novation Launchpad), controladores de faders (ex. Korg nanoKONTROL2), superfícies de controlo híbridas.

### Ligação

Ligue o controlador USB ao computador e arranque o RLMP. O software deteta os dispositivos através da Web MIDI API do sistema e reconhece em tempo real a ligação e a desconexão de um controlador. A maioria dos controladores USB-MIDI é *class-compliant* e não exige drivers; para superfícies profissionais com drivers proprietários, instale o driver antes de ligar o dispositivo.

### MIDI Learn

O RLMP não exige conhecer a numeração das notas MIDI nem configurar as mensagens à mão. A aprendizagem faz-se através do modo **MIDI Learn**, a partir do menu Ferramentas (ou da janela Keybinds).

**Para mapear uma clip a uma tecla/pad:**
1. Ative o MIDI Learn. As cards entram em estado de espera.
2. Selecione a clip (ou a célula do pad FX) a mapear.
3. Toque a nota, prima o pad ou a tecla no controlador. O badge `M` com o número de nota surge na card.

**Para mapear as funções globais:**
- Selecione **STOP ALL** e prima uma tecla no controlador: essa tecla executa o Stop All.
- Selecione o **Master Volume** e mova um fader ou um potenciómetro: esse controlo gere o volume master de forma contínua.

No final, desative o MIDI Learn para voltar ao modo operacional.

### Tipos de mensagens suportados

**Note On** — mensagens geradas por botões, pads e teclas. Ideais para o lançamento das clips e das ações globais; o RLMP responde à pressão da tecla e reconhece todos os canais MIDI. As mensagens Note Off são ignoradas.

**Control Change (CC)** — mensagens geradas por faders e potenciómetros, com valor contínuo de 0 a 127. Ideais para o Master Volume: um fader físico mapeado no master oferece o controlo mais natural do nível de saída.

### Portabilidade dos mapeamentos

Os mapeamentos MIDI das **clips** ficam guardados no ficheiro de projeto `.lmp`: ao levar o projeto para outro computador com o mesmo controlador, funcionam sem reconfiguração. Os mapeamentos das **funções globais** (Stop All, Master Volume) estão, por sua vez, ligados ao computador, guardados nas preferências locais da aplicação, e mantêm-se válidos para todos os projetos nessa máquina.
