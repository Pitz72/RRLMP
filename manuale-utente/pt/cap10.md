# Capítulo 10 — Gestão de projetos e segurança dos dados

---

Preparar um show exige tempo: selecionar os ficheiros, organizá-los nas colunas, configurar os volumes, definir os fades, atribuir as teclas. Este trabalho constitui um património operacional que precisa de sobreviver a qualquer imprevisto, seja um crash do sistema, uma mudança de computador ou o regresso a um episódio arquivado meses antes.

O RLMP aborda a segurança dos dados a vários níveis, cada um pensado para cobrir um risco específico.

---

## 10.1 O ficheiro de projeto (.lmp)

Todo o estado de um show (a disposição das clips nas colunas, os nomes personalizados, os volumes e os fades, os cue points do editor, as notas da NoteBoard, os mapeamentos MIDI e de teclado, a cor das colunas) é guardado num ficheiro com extensão **`.lmp`** (Live Machine Project).

O formato é JSON: um ficheiro de texto estruturado, legível por qualquer editor e não proprietário. Assim, mesmo que um dia o RLMP deixasse de estar disponível, os dados do projeto continuariam acessíveis.

**O que o ficheiro `.lmp` contém:** todas as definições acima enumeradas, incluindo os caminhos absolutos para os ficheiros de áudio referenciados.

**O que não contém:** os próprios ficheiros de áudio. O `.lmp` guarda apenas onde estão os ficheiros no disco, sem copiar o seu conteúdo — por isso um ficheiro de projeto ronda tipicamente os kilobytes, independentemente de quantos ou de quão grandes sejam os ficheiros de áudio que referencia.

Ao abrir um projeto, o RLMP valida o ficheiro: reconstrói eventuais identificadores duplicados, repõe os valores fora de escala dentro de limites sãos e, tratando-se de um projeto criado numa versão anterior, acrescenta automaticamente as colunas entretanto introduzidas (Jingle, Promo), sem tocar nos dados já existentes.

---

## 10.2 Gravação

### Guardar rápido

A opção *Guardar Projeto* no menu FICHEIRO executa uma gravação imediata no ficheiro `.lmp` aberto, sem caixa de diálogo alguma. Fica realçada a amarelo quando há alterações não guardadas, o que funciona como lembrete visual num relance — vale a pena usá-la com frequência durante a preparação do show.

A gravação é **atómica**: o ficheiro é escrito primeiro numa cópia temporária e só depois renomeado. Assim, mesmo que o computador se desligue a meio da escrita, o `.lmp` original nunca fica corrompido a meio caminho.

### Guardar Como

A opção *Guardar Como…* abre sempre a caixa de diálogo, mesmo que o projeto já tenha nome. É útil para:

- Criar versões progressivas do mesmo show (`Ep47_rascunho.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Guardar uma variante com configurações diferentes.
- Criar um ficheiro novo sem sobrepor o atual.

### Proteção ao fechar

O RLMP monitoriza continuamente o estado das alterações. Ao tentar fechar o software (ou abrir um novo projeto) com alterações por guardar, a operação fica em suspenso e surge um pedido de confirmação com três opções: guardar, descartar as alterações ou cancelar. Não há forma de perder trabalho por causa de um clique acidental no fecho da janela.

---

## 10.3 Auto-Backup e autosave

Além das gravações que o utilizador decide fazer, o software mantém uma rede de proteção automática.

**Cópia de segurança do projeto.** Sempre que um projeto já guardado é atualizado em segundo plano, o RLMP mantém junto ao `.lmp` uma cópia `.bak` com o último estado válido.

**Autosave em rotação.** Em paralelo, o RLMP escreve instantâneos do estado atual numa pasta dedicada da aplicação, `autosaves`, com um nome baseado na data e hora. Conservam-se os **dez instantâneos mais recentes**, sendo os mais antigos eliminados à medida que surgem novos. Esta rede protege também o trabalho num projeto «sem título» que nunca chegou a ser guardado no disco.

A pasta `autosaves` encontra-se na diretoria de dados da aplicação:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Como recuperar.** Se o ficheiro `.lmp` principal se corromper ou o computador se desligar de repente, basta abrir a pasta `autosaves`, localizar o instantâneo com a data e hora mais próximas do momento da interrupção e carregá-lo no RLMP como um ficheiro de projeto normal. Em alternativa, renomeie o ficheiro `.bak` junto ao projeto para `.lmp` e abra-o.

---

## 10.4 Exportar projeto com áudio

Como o ficheiro `.lmp` contém apenas os caminhos para os ficheiros de áudio, e não os próprios ficheiros, um projeto é frágil: se mover, renomear ou eliminar um só dos ficheiros de origem, a clip correspondente fica vermelha. A função **Exportar projeto com áudio**, no menu FICHEIRO (logo abaixo de *Guardar Como…*), resolve o problema pela raiz, consolidando todo o áudio dentro do projeto.

### Como funciona

O RLMP analisa todos os caminhos para os ficheiros de áudio do projeto, cria uma subpasta `audio/` ao lado do ficheiro `.lmp` e **copia fisicamente** cada ficheiro referenciado para dentro dela. Os ficheiros já presentes e idênticos não são copiados de novo; eventuais duplicados de nome são renomeados para não se sobreporem, e os ficheiros órfãos, já não referenciados, são removidos da pasta.

A diferença face a um simples backup está no que acontece **depois** da cópia: o RLMP **reaponta cada clip para a nova cópia** dentro de `audio/` e **volta a guardar o projeto**. A partir desse momento, a pasta `audio/` deixa de ser um arquivo de reserva ao lado do projeto e passa a ser a fonte de onde a sessão lê realmente o áudio.

### O resultado: pode eliminar os originais

Como o projeto passa a apontar para as cópias em `audio/`, **os ficheiros de áudio na sua posição original deixam de ser necessários** e pode eliminá-los em segurança: o show continua a funcionar lendo a partir do arquivo. É a diferença face às versões anteriores, em que a pasta `audio/` ficava como um duplicado órfão e eliminar os originais partia as clips.

A pasta do projeto torna-se assim autocontida: `.lmp` mais a subpasta `audio/`, tudo o que é necessário para executar o show, pronto a arquivar, copiar ou levar para outro computador com o RLMP instalado.

Alguns detalhes úteis:

- A operação é **repetível**: se acrescentar novas clips e reexportar, o RLMP copia apenas os ficheiros novos e realinha o projeto, sem duplicar os já arquivados.
- O reengate ao arquivo **não entra no histórico Anular/Repetir**: um *Anular* levaria as clips de volta aos originais, que pode já ter eliminado.
- A referência ao arquivo é um **caminho absoluto**. Enquanto a pasta do projeto permanecer onde está, tudo funciona; se a mover para outro lado, os caminhos têm de ser regenerados com uma nova exportação a partir da nova posição.

> **Boa prática.** Use *Exportar projeto com áudio* no final da preparação de cada show para consolidar o áudio no projeto. Terá um «master» compacto e portátil, e poderá libertar espaço eliminando os ficheiros dispersos a partir dos quais tinha importado.

### Verificação de integridade ao abrir

Sempre que abre um ficheiro `.lmp`, o RLMP executa uma **verificação de integridade** automática, confirmando que cada ficheiro de áudio referenciado está acessível. Os ficheiros em falta ficam assinalados com o contorno vermelho e a etiqueta FICHEIRO EM FALTA na card correspondente, enquanto o resto do projeto, ou seja, todas as clips com ficheiros acessíveis, mantém-se plenamente funcional.
