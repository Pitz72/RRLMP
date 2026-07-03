# Capítulo 10 — Gestão de projetos e segurança dos dados

---

Preparar um show exige tempo: selecionar os ficheiros, organizá-los nas colunas, configurar os volumes, definir os fades, atribuir as teclas. Este trabalho é um património operacional que tem de sobreviver a qualquer imprevisto: um crash do sistema, uma mudança de computador, o regresso a um episódio arquivado meses antes.

O RLMP aborda a segurança dos dados a vários níveis, cada um concebido para cobrir um risco específico.

---

## 10.1 O ficheiro de projeto (.lmp)

Todo o estado de um show (a disposição das clips nas colunas, os nomes personalizados, os volumes e os fades, os cue points do editor, as notas da NoteBoard, os mapeamentos MIDI e de teclado, a cor das colunas) é guardado num ficheiro com extensão **`.lmp`** (Live Machine Project).

O formato é JSON: um ficheiro de texto estruturado, legível por qualquer editor, não proprietário. Se um dia o RLMP não estivesse disponível, os dados do projeto continuariam acessíveis.

**O que contém o ficheiro `.lmp`:** todas as definições acima enumeradas, incluindo os caminhos absolutos para os ficheiros de áudio referenciados.

**O que não contém:** os próprios ficheiros de áudio. O `.lmp` guarda onde estão os ficheiros no disco, não copia o seu conteúdo. Um ficheiro de projeto tem tipicamente a ordem de grandeza dos kilobytes, independentemente de quantos ou de quão grandes sejam os ficheiros de áudio que referencia.

Ao abrir, o RLMP valida o ficheiro: reconstrói eventuais identificadores duplicados, repõe os valores fora de escala dentro de limites sãos e, se abrir um projeto criado com uma versão anterior, acrescenta automaticamente as colunas introduzidas entretanto (Jingle, Promo), sem tocar nos dados existentes.

---

## 10.2 Gravação

### Guardar rápido

A opção *Guardar Projeto* no menu FICHEIRO executa uma gravação imediata no ficheiro `.lmp` aberto. A gravação é silenciosa: nenhuma caixa de diálogo. A opção fica realçada a amarelo quando há alterações não guardadas, um lembrete visual num relance. Use-a com frequência durante a preparação do show.

A gravação é **atómica**: o ficheiro é escrito primeiro numa cópia temporária e depois renomeado em tempo real. Se o computador se desligar durante a escrita, o `.lmp` original nunca fica a meio.

### Guardar Como

A opção *Guardar Como…* abre sempre a caixa de diálogo, mesmo que o projeto já tenha nome. Use-a para:

- Criar versões progressivas do mesmo show (`Ep47_rascunho.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Guardar uma variante com configurações diferentes.
- Criar um ficheiro novo sem sobrepor o atual.

### Proteção ao fechar

O RLMP monitoriza continuamente o estado das alterações. Se tentar fechar o software (ou abrir um novo projeto) com alterações não guardadas, a operação é suspensa e surge um pedido de confirmação com três opções: guardar, descartar as alterações ou cancelar. Não é possível perder trabalho por um clique acidental no fecho da janela.

---

## 10.3 Auto-Backup e autosave

Além das gravações que decide fazer, o software mantém uma rede de proteção automática.

**Cópia de segurança do projeto.** Sempre que um projeto já guardado é atualizado em segundo plano, o RLMP mantém junto ao `.lmp` uma cópia `.bak` com o último estado válido.

**Autosave em rotação.** Em paralelo, o RLMP escreve instantâneos do estado atual numa pasta dedicada da aplicação, `autosaves`, com um nome baseado na data e hora. São conservados os **dez instantâneos mais recentes**: os mais antigos são eliminados à medida. Esta rede capta também o trabalho num projeto «sem título» que nunca foi guardado no disco.

A pasta `autosaves` encontra-se na diretoria de dados da aplicação:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Como recuperar.** Se o ficheiro `.lmp` principal se corrompeu ou o computador se desligou de repente, abra a pasta `autosaves`, localize o instantâneo com a data e hora mais próximas do momento da interrupção e carregue-o no RLMP como um ficheiro de projeto normal. Em alternativa, renomeie o ficheiro `.bak` junto ao projeto para `.lmp` e abra-o.

---

## 10.4 Export Package: portabilidade completa

Como o ficheiro `.lmp` contém apenas os caminhos para os ficheiros de áudio, não os próprios ficheiros, levar o projeto para outro computador exige atenção: se a máquina de destino não tiver os ficheiros nos mesmos caminhos absolutos, as clips ficam vermelhas. A função **Exportar Arquivo** (Export Package), no menu FICHEIRO, resolve o problema pela raiz.

### Como funciona

O RLMP analisa todos os caminhos para os ficheiros de áudio do projeto, cria uma subpasta `audio/` e **copia fisicamente** cada ficheiro referenciado para dentro dela. Os ficheiros já presentes e idênticos não voltam a ser copiados; eventuais duplicados de nome são renomeados para não se sobreporem, e os ficheiros órfãos (já não referenciados) são removidos da pasta.

A operação tem dois modos:

- **Junto ao projeto** — se exportar para a pasta onde já reside o `.lmp`, o RLMP sincroniza a subpasta `audio/` ao lado dele.
- **Pasta livre** — se escolher uma pasta nova (uma pen USB, um NAS), o RLMP escreve nela um `project.lmp` com os caminhos já atualizados para apontar para a subpasta `audio/` local.

### O resultado

A pasta de destino torna-se autocontida: contém tudo o que é necessário para executar o show em qualquer computador com o RLMP instalado, independentemente da estrutura de pastas dessa máquina.

> **Boa prática.** Use Exportar Arquivo no final da preparação de cada show para criar um «master» a levar para o estúdio ou a arquivar. Em caso de problemas técnicos de última hora, terá sempre uma cópia completa e portátil à mão.

### Verificação de integridade ao abrir

Sempre que abre um ficheiro `.lmp`, o RLMP executa uma **verificação de integridade** automática: confirma que cada ficheiro de áudio referenciado está acessível. Os ficheiros em falta são assinalados com o contorno vermelho e a etiqueta FICHEIRO EM FALTA na card correspondente. O resto do projeto, todas as clips com ficheiros acessíveis, mantém-se plenamente funcional.
