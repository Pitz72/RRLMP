# Capítulo 9 — Gravação da sessão

---

A gravação da sessão transforma o Runtime Live Machine Pro, de ferramenta de playout, em ferramenta de produção completa. Em vez de exigir um software de gravação separado ou uma cadeia de encaminhamento virtual, o RLMP capta diretamente o **master mix pós-processado**: tudo o que sai da aplicação, incluindo os efeitos da Master Chain, é gravado num ficheiro de áudio no disco.

---

## 9.1 Iniciar a gravação

O controlo da gravação encontra-se no cabeçalho, identificado pelo ícone de gravação.

**Início.**
Clique no botão de gravação: um indicador vermelho e um contador mostram que a captura está em curso. A gravação começa de imediato, e tudo o que sai da saída do software a partir desse momento fica captado.

Não é preciso ter clips em reprodução para iniciar a gravação. Pode arrancar a captura com antecedência em relação ao início do show, para não perder os primeiros segundos caso o arranque seja antecipado.

**O que é gravado.**
O sinal captado é o **master depois do limiter**: inclui a mistura de todas as clips em reprodução e o processamento de toda a Master Chain (HPF, multiband glue, limiter). É exatamente o sinal que chega ao dispositivo de áudio de saída.

**O formato interno.**
Durante a captura, o RLMP escreve um fluxo comprimido Opus (em container WebM) a 320 kbps, muito leve no disco e transparente à escuta. A gravação contínua tem um limite de segurança de cerca de **quatro horas**; a partir daí, a captura pára automaticamente para não saturar a memória.

**Overhead de sistema.**
A captura acontece a jusante do motor de áudio, sem sobrecarregar o Renderer, pelo que pode gravar sessões de horas sem se preocupar com o consumo de recursos.

---

## 9.2 Parar a gravação e escolher o formato

Ao clicar de novo no botão para parar a gravação, abre-se a **janela de exportação**: é aqui que escolhe em que formato guardar o ficheiro, ficando a conversão do fluxo interno para o formato final a cargo do FFmpeg.

### Formatos disponíveis

| Formato | Extensão | Caraterísticas |
|---|---|---|
| **WAV** | `.wav` | Lossless não comprimido. Máxima qualidade, ficheiros grandes. Ideal para arquivo e pós-produção. |
| **FLAC** | `.flac` | Lossless comprimido. Mesma qualidade do WAV, dimensões reduzidas. Ideal para arquivo. |
| **MP3** | `.mp3` | Lossy. Bitrate selecionável. Ideal para distribuição e podcast. |
| **OGG** | `.ogg` | Lossy open-source. Boa relação qualidade/dimensão. |
| **WEBM** | `.webm` | Lossy, otimizado para a web. Corresponde ao formato interno de captura. |

### Opções de qualidade

Nos formatos lossless (WAV e FLAC) pode escolher a **profundidade de bit**: 16 bit (standard CD), 24 bit (standard profissional broadcast, valor predefinido) ou 32 bit float, para máxima precisão caso a gravação venha a ser masterizada mais tarde.

Nos formatos lossy (MP3, OGG, WEBM), o **bitrate** vai de 128 a 320 kbps, em quatro passos (128, 192, 256, 320). Para um podcast destinado à distribuição online, 192 kbps estéreo é o mínimo recomendado; 256 kbps é hoje o standard para a qualidade «transparente».

### Seleção do caminho de gravação

Na janela de exportação escolhe-se a pasta de destino e o nome do ficheiro. Se não indicar um nome, o RLMP gera um a partir da data e hora da sessão. No final da conversão, um toast de confirmação mostra o caminho onde o ficheiro ficou guardado.

---

## 9.3 Considerações práticas

### Sincronização com o show

A gravação capta todo o tempo decorrido entre Start e Stop, silêncios incluídos. Se a captura foi iniciada 30 segundos antes do início efetivo do show, o ficheiro resultante inclui esses 30 segundos iniciais. Para obter um resultado pronto a distribuir sem pós-edição, o melhor é iniciar a gravação exatamente quando o show começa.

### Gravação e backup em simultâneo

O sistema de autosave do projeto (ver Capítulo 10) e a gravação da sessão funcionam de forma independente: pode gravar um show enquanto o autosave guarda silenciosamente o estado do projeto, sem que as duas operações interfiram entre si.

### Formato recomendado para contextos diferentes

**Podcast** — MP3 256 kbps estéreo ou FLAC 16 bit: o primeiro se o ficheiro for distribuído diretamente, o segundo se ainda tiver de passar por um editor.

**Arquivo histórico** — WAV 24 bit ou FLAC 24 bit, com dimensões generosas e máxima flexibilidade para eventuais remasterizações futuras.

**Rádio / Streaming** — convém verificar os requisitos da plataforma em causa. A maioria aceita MP3 128–192 kbps, mas algumas exigem WAV não comprimido; o RLMP exporta nos formatos mais difundidos para cobrir todos os cenários.
