# CAPÍTULO 6: CONTROLO DE HARDWARE E ROUTING

Um software de realização profissional não vive isolado no computador. Deve comunicar com a mesa de mistura do estúdio, com os auscultadores e com os dedos do realizador.
Neste capítulo veremos como configurar a saída de áudio e como comandar o software sem tocar no rato.

---

## 6.1 Configuração de Áudio (Routing)

Por defeito, o RRLMP sai no dispositivo de áudio predefinido do Windows. No entanto, num estúdio (ou com configurações de podcast avançadas como o *Rødecaster Pro*), precisa de separar os fluxos.

### Selecionar a Saída
1.  Clique no ícone **Engrenagem (Definições)** na barra de comandos em cima.
2.  Abrir-se-á o painel **General Settings**.
3.  No menu suspenso "Audio Output Device", verá a lista de todas as placas de áudio ligadas ao seu PC.
4.  Selecione o dispositivo desejado (ex. *Rødecaster Pro Stereo* ou *Focusrite USB*).

### Mudança em Direto (Live Switch)
A mudança é instantânea. Se a música estiver a tocar enquanto muda de dispositivo, o áudio "saltará" para a nova saída sem se interromper.

> **Dica para Rødecaster/Misturadores USB**: Se a sua mesa de mistura tiver vários canais USB (ex. Main e Sounds/Chat), defina o RRLMP num canal secundário (ex. "Sounds") para poder controlar o seu volume com um fader dedicado na mesa física, separando-o dos sons de sistema do Windows.

---

## 6.2 O Teclado (Hotkeys)

O teclado do computador é o controlador mais rápido que tem. O RRLMP inclui comandos globais predefinidos e teclas personalizáveis.

### Comandos Globais (Teclas F)
As teclas de função (F1-F5) estão mapeadas para lançar as colunas. Têm uma lógica "inteligente": procuram o primeiro clip livre.
*   **F1**: Lança a coluna 1 (Assets).
*   **F2**: Lança a coluna 2 (Música).
*   **F3**: Lança a coluna 3 (Vozes).
*   **F4**: Lança a coluna 4 (SFX).
*   **F5**: Lança a coluna 5 (Pré-Show).
*   **ESC**: **BOTÃO DE PÂNICO**. Para tudo imediatamente (Stop All).

### Teclas Personalizadas (Custom Binds)
Quer lançar o genérico premindo a barra de espaços ou a letra "Q"?
1.  Faça clique direito no clip -> **Edit**.
2.  Clique no campo **Trigger Keybind**.
3.  Prima a tecla desejada no teclado.
4.  Guarde.
5.  Aparecerá um crachá (ex. **[Q]**) no cartão para o lembrar da atribuição.

> **Segurança**: Os comandos de teclado são automaticamente desativados se estiver a escrever texto (ex. a renomear um clip), para evitar fazer partir o áudio enquanto digita.

---

## 6.3 Controlador MIDI (O Poder Físico)

Esta é a função "Pro" por excelência. Pode ligar teclados musicais, pads (como *Novation Launchpad*) ou controladores de fader (como *Korg nanoKONTROL*) e usá-los para guiar o software.

### Ligação
1.  Ligue o seu controlador USB-MIDI ao computador **antes** de iniciar o Runtime Live Machine Pro.
2.  Inicie o software. O motor MIDI reconhecerá automaticamente o dispositivo.

### Modo MIDI Learn (Mapeamento Fácil)
Não precisa de saber códigos complicados. O RRLMP aprende observando o que faz.

1.  Clique no ícone **MIDI** (Conector DIN) na barra em cima.
    *   O ícone torna-se **Ciano (Ligado)**.
    *   Os clips assumem um aspeto tracejado ("Em espera").
2.  **Para mapear um Clip**:
    *   Clique com o rato no Clip desejado.
    *   Prima o botão/pad físico no seu controlador.
    *   Aparecerá um crachá (ex. **[M:60]**) no clip. Feito.
3.  **Para mapear funções Globais**:
    *   Clique no botão vermelho **STOP ALL** no ecrã -> Prima um botão grande no controlador.
    *   Clique no cursor **MASTER VOL** no ecrã -> Mova um fader ou um botão rotativo no controlador.
4.  Clique novamente no ícone **MIDI** para sair do modo Learn.

### Tipos de Comandos Suportados
*   **Note On/Off**: Perfeito para botões e pads (Lançamento de Clip, Stop All).
*   **Control Change (CC)**: Perfeito para faders e botões rotativos. Use-o para controlar o Volume Mestre de modo analógico e fluido.

> **Portabilidade**: Os mapeamentos MIDI dos clips são guardados dentro do projeto .lmp. Se levar o projeto para outro PC com o mesmo controlador, funcionará tudo logo.
