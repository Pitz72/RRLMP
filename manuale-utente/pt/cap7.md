# CAPÍTULO 7: GESTÃO DE PROJETOS E SEGURANÇA

Configurar um show requer tempo: carregar os clips, ajustar os volumes, definir os trims. Perder este trabalho seria desastroso.
O Runtime Live Machine Pro utiliza um sistema de salvamento a vários níveis para garantir que os seus dados estejam sempre seguros.

---

## 7.1 O Ficheiro de Projeto (.lmp)

Todas as definições do seu show (posições dos clips, cores, volumes, mapeamento MIDI, definições de fade) são guardadas num único ficheiro com a extensão **.lmp** (Live Machine Project).

> **Importante**: O ficheiro .lmp é um ficheiro de texto (JSON) que contém as "instruções" para o software. **NÃO contém os ficheiros de áudio físicos**. Memoriza apenas o *caminho* onde se encontram os ficheiros no seu computador (ex. C:\Musica\Intro.mp3).

### Guardar o trabalho
Na barra de comandos em cima, tem duas opções distintas:

1.  **?? Guardar (Quick Save)**:
    *   Clique no ícone da Disquete.
    *   Sobrescreve imediatamente o ficheiro .lmp aberto no momento.
    *   É a ação a fazer regularmente enquanto trabalha.
2.  **??? Guardar Como (Save As)**:
    *   Clique no ícone da Disquete com a Caneta.
    *   Abre sempre uma caixa de diálogo para criar um **novo ficheiro**.
    *   Use-o para criar versões diferentes do show (ex. "Podcast_Ep1.lmp", "Podcast_Ep2.lmp").

### Proteção de Encerramento (Alterações Não Guardadas)
O software monitoriza constantemente as suas ações. Se fez alterações não guardadas (carregou um clip, alterou um volume) e tentar fechar o programa, o RRLMP **bloqueará o encerramento** e mostrar-lhe-á um aviso: *"Existem alterações não guardadas"*.
Nunca perderá o trabalho por um clique acidental no "X".

---

## 7.2 Auto-Backup (A Rede de Segurança)

Nem sempre nos lembramos de guardar. Por isso, o RRLMP inclui um sistema de **Auto-Backup** invisível que trabalha em segundo plano.

*   **Frequência**: A cada **5 minutos**, o software guarda automaticamente uma cópia de segurança do estado atual.
*   **Para onde vai o backup?**
    *   Se estiver a trabalhar num projeto já guardado (ex. OMeuShow.lmp), o software cria um ficheiro "sombra" na mesma pasta chamado **OMeuShow.lmp.bak**.
*   **Como recuperá-lo**:
    *   Se o PC se desligar subitamente ou o ficheiro principal se corromper, vá à pasta do projeto.
    *   Procure o ficheiro .bak.
    *   Renomeie-o retirando o .bak (ou abra-o diretamente com o RRLMP). Terá recuperado o trabalho até aos últimos 5 minutos.

---

## 7.3 Collect & Save (Exportação Portátil)

Esta é a função fundamental para quem trabalha em vários computadores ou quer arquivar o show.
Como o ficheiro .lmp memoriza apenas as *ligações* aos ficheiros de áudio, se copiar apenas esse ficheiro para outro PC (ou para uma pen USB), o software deixará de encontrar a música (caminhos interrompidos).

Para mover o show, deve usar a função **Export Package**.

### Como criar um Pacote Portátil
1.  Clique no ícone **?? Export (Caixa)** na barra em cima.
2.  O sistema pedir-lhe-á para selecionar uma pasta vazia (ex. na sua pen USB).
3.  **O processo de Cópia**:
    *   O software analisa todo o projeto.
    *   Cria uma subpasta chamada udio/ no destino.
    *   **Copia fisicamente** todos os ficheiros MP3/WAV originais para dentro dessa pasta.
    *   Cria um novo ficheiro project.lmp em que todas as ligações foram reescritas para apontar para a pasta local udio/.

### O Resultado
Obterá uma pasta contendo tudo o necessário. Pode ligar a pen USB a qualquer computador com o Runtime Live Machine Pro instalado, abrir o ficheiro project.lmp e tudo funcionará perfeitamente, independentemente das letras de unidade ou dos caminhos originais.

> **Uso Recomendado**: Use esta função no final da preparação de cada show para criar um "Master" para levar para o estúdio ou para arquivar como backup histórico completo.
