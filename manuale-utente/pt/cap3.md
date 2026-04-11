# CAPÍTULO 3: GESTÃO DE ÁUDIO (FLUXO DE TRABALHO BÁSICO)

Agora que conhece a interface, é altura de "carregar a máquina".
Neste capítulo aprenderá como importar ficheiros de áudio, como controlar a reprodução e como manter o seu alinhamento ordenado.

---

## 3.1 Importação (Drag & Drop)

O Runtime Live Machine Pro não utiliza menus complexos "Ficheiro > Importar". Foi concebido para trabalhar diretamente com as pastas do seu computador.

### Como carregar os ficheiros
1.  Abra a pasta do seu computador (Explorador de Ficheiros no Windows ou Finder no Mac) onde guarda os seus ficheiros de áudio.
2.  Clique no ficheiro desejado e, mantendo premido, **arraste-o** para dentro de uma das 5 colunas do software.
3.  Solte o rato.

O clip aparecerá instantaneamente como um novo Cartão.

### Detalhes de Importação
*   **Carregamento Múltiplo**: Pode selecionar 10, 20 ou 50 ficheiros simultaneamente da sua pasta e arrastá-los todos juntos. O software criará um cartão para cada um deles em sequência.
*   **Formatos Suportados**: Graças ao motor nativo, o RRLMP suporta quase todos os formatos de áudio padrão: **MP3, WAV, AAC (m4a), OGG, FLAC**.
*   **Performance**: Não importa se carrega um jingle de 2 segundos ou um DJ Set de 2 horas em formato WAV não comprimido. O carregamento é **instantâneo** e não consome a memória RAM do computador, graças à tecnologia *Direct Disk Streaming*.

> **Nota**: O software memoriza o "caminho" do ficheiro (ex. C:\Musica\Song.mp3). Se mover ou renomear o ficheiro original no seu computador, o RRLMP deixará de o conseguir encontrar (o cartão ficará vermelho/inativo). Para evitar este problema se mudar de PC, use a função "Export Package" (ver Cap. 7).

---

## 3.2 Reprodução (Play & Stop)

O sistema de reprodução está otimizado para evitar erros em direto.

### Iniciar um Clip (Play)
*   **Clique Esquerdo**: Clique uma vez num cartão para o iniciar.
*   **Feedback**: A borda do cartão torna-se **Verde Brilhante**, o ícone "Play" pulsa e o temporizador inicia a contagem decrescente.
*   **Barra de Espaços**: Se tiver atribuído uma tecla personalizada ao clip (ver Cap. 6), pode premi-la para o iniciar sem usar o rato.

### Parar um Clip (Stop / Fade)
*   **Clique em Clip Ativo**: Se clicar num clip que já esteja a tocar, este irá parar.
    *   *Comportamento Padrão*: O clip executa um **Fade Out** (desvanecimento) rápido em vez de cortar abruptamente, para um efeito mais profissional. (Os tempos de fade são personalizáveis, ver Cap. 4).
*   **Stop All**: Para parar tudo imediatamente (sem desvanecimentos), prima a **Barra de Espaços** (se configurada), a tecla **ESC** ou o botão vermelho **STOP ALL** no topo.

### A Regra da Coluna (Exclusão)
Numa realização de rádio, geralmente não quer que duas músicas toquem simultaneamente uma sobre a outra.
*   **Regra**: Se na coluna "MÚSICAS" estiver a tocar a *Música A* e clicar na *Música B* (na mesma coluna), a *Música A* para automaticamente (desvanecendo) e a *Música B* começa.
*   **Exceção**: Esta regra não se aplica à coluna "SFX" ou a clips definidos como "Interrupção" (Stacco), que podem tocar sobre os outros.

---

## 3.3 Organização do Alinhamento

Durante um show, as necessidades mudam. O RRLMP permite-lhe reorganizar a grelha na hora.

### Mover os Clips (Reordenar)
Carregou o alinhamento mas decidiu mudar a ordem das músicas?
*   Clique num clip e, mantendo premido, **arraste-o** para cima ou para baixo. Uma linha guia mostrar-lhe-á onde aterrará.
*   **Movimento entre Colunas**: Pode arrastar um clip de uma coluna para outra (ex. do "Pré-Show" para a coluna "Música").
    *   *Atenção*: Quando move um clip, este **herda as regras da nova coluna**. Se mover um jingle para a coluna Música, começará a comportar-se como uma música (sofrerá ducking das vozes, etc.).

### Seleção Múltipla e Eliminação
Para limpar rapidamente:
1.  **Seleção Única**: Ctrl + Clique (Windows) ou Cmd + Clique (Mac) num clip seleciona-o (borda Azul) sem o fazer tocar.
2.  **Seleção Múltipla**: Mantenha premido Ctrl e clique em diferentes clips para os realçar a todos.
3.  **Eliminação**: Prima a tecla DEL (ou Delete / Backspace) no teclado.
    *   O software pedir-lhe-á confirmação se estiver a eliminar muitos clips, para evitar erros acidentais.

> **Dica Pro**: Use a seleção múltipla para esvaziar rapidamente a coluna "Pré-Show" assim que o direto propriamente dito começar, para ter uma interface mais limpa.
