# Runtime Live Machine Pro — Guia Rápido

**Versão 1.15.6 · Português**

Bem-vindo ao Runtime Live Machine Pro (RLMP), o software de playout áudio para rádio, transmissões ao vivo e eventos. Este guia leva-o da instalação à primeira reprodução em poucos minutos. Para a documentação completa, consulte o Manual do Utilizador (disponível para download a partir do software através do botão "Manual").

---

## 1. Requisitos do sistema

| | Mínimo | Recomendado |
|---|---|---|
| Windows | 10 64-bit | 11 64-bit |
| macOS | 11 Big Sur | 13 Ventura ou posterior |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB ou mais |
| Disco | 300 MB | 1 GB + espaço para os ficheiros áudio |

Não é necessária uma placa de som dedicada: o RLMP funciona com qualquer dispositivo reconhecido pelo sistema, desde a saída integrada até mesas de mistura USB profissionais (Rødecaster Pro, Rødecaster Duo, etc.). Otimizado nativamente para Apple Silicon (M1/M2/M3).

---

## 2. Instalação

**Windows**
1. Abra o ficheiro `.exe` transferido.
2. Se aparecer o aviso *"O Windows protegeu o seu PC"*, clique em **Mais informações** → **Executar mesmo assim**. É normal em software atualizado com frequência: não há qualquer malware, o código é publicamente verificável.
3. Siga o assistente de instalação. No final é criado um atalho no Ambiente de Trabalho e no menu Iniciar.

**macOS**
1. Abra o ficheiro `.dmg` transferido.
2. Arraste o ícone do Runtime Live Machine Pro para a pasta **Aplicações**.
3. No primeiro arranque, se o macOS mostrar o aviso do Gatekeeper, vá a **Definições do Sistema → Privacidade e Segurança** e clique em **Abrir mesmo assim** junto ao nome da aplicação.

**Linux**
- **AppImage** (portátil, sem instalação): torne o ficheiro executável com `chmod +x` e execute-o.
- **.deb** (Debian/Ubuntu/Mint): instale com `sudo dpkg -i nomedoficheiro.deb` ou através do gestor de pacotes gráfico.
- Se a aplicação não arrancar, verifique se tem o pacote `libasound2` instalado para suporte ALSA.

---

## 3. Primeiro arranque

Ao abrir, verá o **Welcome Screen**: a partir daqui pode criar um novo projeto, carregar um já existente (`.lmp`), transferir o Manual do Utilizador ou abrir este Guia Rápido. No canto superior direito pode escolher o idioma da interface entre os oito disponíveis.

Depois de abrir um projeto, o badge **PRO** ciano no cabeçalho confirma que o motor de áudio está ativo. Prima `F11` (Windows/Linux) ou `Ctrl+Cmd+F` (macOS) para passar a ecrã inteiro — o modo de trabalho recomendado em regência ao vivo.

---

## 4. As seis colunas

O RLMP organiza tudo em seis colunas fixas, cada uma com um comportamento dedicado:

| Coluna | Cor | Comportamento |
|---|---|---|
| **Show Assets** | Verde | Indicativos, bases musicais, cortes institucionais |
| **Jingle** | Âmbar | Jingles identificativos |
| **Promo** | Ciano | Promoções e autopromoções |
| **Músicas** | Vermelho | Playlist musical, sujeita a ducking, deteção de BPM |
| **Vozes** | Laranja | Prioridade máxima: baixa tudo o resto |
| **Pre-Show** | Roxo | Música de espera antes da transmissão ao vivo, com rotação opcional |

Cada coluna tem um indicador de cor no cabeçalho: clique nele para escolher uma cor diferente entre as 30 tonalidades disponíveis.

---

## 5. Pad FX e Automix

Além das seis colunas, o cabeçalho oferece duas ferramentas rápidas:

- **FX** — abre o pad de efeitos sonoros: reprodução com sobreposição livre, ideal para stingers, aplausos, transições sonoras.
- **MIX** — abre a vista Automix, o painel dedicado à coluna Músicas: compatibilidade de BPM, transições beat-matched e modo automático.

---

## 6. Carregue e reproduza o primeiro ficheiro

1. Arraste um ficheiro áudio (MP3, WAV, AAC/M4A, OGG, FLAC) do Explorador de Ficheiros / Finder diretamente para uma coluna.
2. **Clique com o botão esquerdo** no cartão para iniciar a reprodução.
3. **Clique novamente** no cartão ativo para o parar com fade out, ou prima `Esc` para uma paragem de emergência imediata de todos os clips.

Na maioria das colunas vale a regra "um clip de cada vez": iniciar um novo para automaticamente o que está a decorrer na mesma coluna. O pad FX e os clips em modo Stacco (Interrupção) são a exceção e sobrepõem-se livremente.

---

## 7. Onde encontrar ajuda

- **Manual do Utilizador completo** — disponível para download diretamente a partir do software (botão "Manual" no ecrã Informações), cobre cada funcionalidade em detalhe (editor de waveform, ducking, MIDI, gravação, gestão de projetos, controlo remoto).
- **Site oficial e atualizações** — a cor junto ao número de versão no Welcome Screen indica se há uma atualização disponível (verde = atualizado, amarelo/laranja = nova versão disponível).

Boa transmissão.

*Runtime Live Machine Pro é um projeto Ecosystem.Runtime — © Simone Pizzi.*
