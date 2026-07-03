# Capítulo 14 — Resolução de problemas e FAQ

---

Este capítulo reúne os problemas mais comuns na utilização diária do Runtime Live Machine Pro, com as respetivas soluções. Cada secção descreve o sintoma, a causa mais provável e o procedimento de resolução.

---

## 14.1 Problemas de áudio

### O timer avança e os VU meter mexem-se, mas não se ouve nada

O software está a reproduzir corretamente (o sinal está presente no bus interno), mas não chega ao dispositivo de escuta.

**Verifique por ordem:**

1. **Master Volume.** O slider no cabeçalho está a zero? Leve-o a 100%.
2. **Dispositivo de saída.** Abra as Definições → *Áudio & Mix* e verifique qual o dispositivo selecionado. O Windows e o macOS podem mudar o identificador dos dispositivos USB quando são desligados e voltados a ligar. Se o nome não corresponder ao que está fisicamente ligado, selecione-o de novo.
3. **Mixer externo.** Se o sinal chega a um mixer de hardware, verifique se o fader do canal não está baixado ou em mute, e se a saída do mixer está ligada aos monitores ou à cadeia de transmissão.

### O áudio salta, chia ou tem interrupções

Em condições normais o motor de áudio é robusto perante estes artefactos. Se ocorrerem, a causa é quase sempre externa ao software.

- **CPU sob carga extrema.** Feche as aplicações pesadas em simultâneo (montagem de vídeo, rendering, backups intensivos).
- **Buffer de áudio demasiado baixo.** Com uma placa de som profissional, verifique o valor de buffer no painel de controlo do driver. Um valor de 256 ou 512 amostras é o equilíbrio correto; abaixo das 128 amostras podem surgir dropouts.
- **Disco lento ou sob stress.** O RLMP faz streaming do áudio a partir do disco. Um disco mecânico lento, ou um SSD quase cheio, pode causar interrupções em ficheiros de grandes dimensões.

### O nível de áudio está demasiado baixo ou demasiado alto

- **Gain por clip.** Ajuste o Gain nas propriedades da clip (clique direito → secção Volume).
- **Master Volume.** Se o nível global está incorreto, atue no slider do cabeçalho.
- **Homologação e Master Chain.** A homologação do volume aproxima os níveis das clips de uma referência comum; o glue da Master Chain pode tornar o som mais compacto. Se um resultado não o convencer, pode ajustar ou desativar estes andares nas Definições → Master Chain.

---

## 14.2 Clips vermelhas e ficheiros em falta

### Uma card ficou vermelha («FICHEIRO EM FALTA») e não responde ao clique

O contorno vermelho indica que o ficheiro de áudio não está acessível no caminho guardado no projeto.

**Causas possíveis:**

- O ficheiro foi movido ou renomeado no disco.
- O ficheiro estava num disco externo ou numa pen USB agora desligada.
- O projeto foi aberto num computador diferente, onde os caminhos não correspondem.

**Soluções:**

1. **Volte a ligar o disco.** Se o ficheiro estava numa unidade externa, ligue-a de novo.
2. **Reponha o ficheiro na posição original.** Se foi movido, coloque-o de volta no caminho original.
3. **Substitua a clip.** Arraste de novo o ficheiro correto para a grelha e elimine a card vermelha.
4. **Use Exportar Arquivo no futuro.** A prevenção mais eficaz é criar um arquivo antes de mover ou transferir o projeto (Capítulo 10).

---

## 14.3 Problemas de MIDI

### O controlador não é detetado

1. **Ligação.** Verifique se o controlador está ligado e reconhecido pelo sistema operativo. O RLMP deteta a ligação e a desconexão dos dispositivos em tempo real; se não aparecer, desligue e volte a ligar o cabo USB.
2. **Driver.** A maioria dos controladores USB-MIDI é *class-compliant* e não exige drivers. Para superfícies profissionais com drivers proprietários, verifique se o driver está instalado.
3. **Verifique em modo Learn.** Ative o MIDI Learn e prima uma tecla no controlador: se a card recebe o mapeamento, o controlador está a ser detetado.

### As clips mapeadas não respondem às teclas do controlador

- **O modo MIDI Learn ainda está ativo.** Em MIDI Learn, as teclas do controlador registam novos mapeamentos em vez de executarem as clips. Desative o modo a partir do menu Ferramentas.
- **O mapeamento perdeu-se.** Os mapeamentos das clips estão no ficheiro `.lmp`; verifique se o projeto foi guardado depois da sessão de MIDI Learn. Os mapeamentos das funções globais estão, por sua vez, ligados a cada computador.

---

## 14.4 Problemas de arranque

### A aplicação não arranca no macOS (aviso do Gatekeeper)

Ver a secção 2.3: desbloqueio através de *Definições do Sistema → Privacidade e Segurança*.

### A aplicação não arranca no Windows (aviso do SmartScreen)

Ver a secção 2.2. Clique em *Mais informações* e depois em *Executar mesmo assim*.

### Comportamentos anómalos no arranque

Se o software se comportar de forma inesperada na abertura, feche e reabra o RLMP. Se o problema persistir, verifique se o caminho de instalação não contém carateres especiais que possam interferir com o carregamento dos componentes FFmpeg.

---

## 14.5 Perguntas frequentes

**O RLMP pode automatizar uma rádio 24 horas sem operador?**
Não. O RLMP foi concebido para a regia live: shows conduzidos por um operador. Não dispõe de programação horária nem de rotação automática da playlist. A vista Automix oferece uma automação limitada e voluntária apenas do fluxo musical, ativa enquanto a vista está aberta (Capítulo 7). Para a automação 24 horas existem softwares dedicados (Zara Radio, PlayIt Live, Rivendell): respondem a necessidades diferentes.

**Qual é a diferença entre Guardar e Guardar Como?**
*Guardar Projeto* sobrepõe o ficheiro `.lmp` aberto, em silêncio. *Guardar Como…* abre sempre a caixa de diálogo e cria um ficheiro novo, sem tocar no atual.

**Posso usar o RLMP em iPad ou em dispositivos móveis?**
Não como aplicação principal: o RLMP é um software desktop para Windows, macOS e Linux. Um tablet ou um telemóvel podem, no entanto, funcionar como **comando à distância** via browser, através do Controlo Remoto (Capítulo 11).

**Os ficheiros `.lmp` das versões anteriores são compatíveis com a 1.11.5?**
Sim. Ao abrir um projeto criado com uma versão anterior, o RLMP atualiza automaticamente a sua estrutura, incluindo as colunas acrescentadas entretanto, sem modificar o ficheiro até executar uma gravação.

**Como atualizo o RLMP para uma nova versão?**
O software verifica as atualizações no arranque e avisa-o. No Windows e Linux AppImage a instalação é automática a partir da janela de atualização; no macOS e Linux `.deb` é aberto o browser na página de download. Todos os detalhes no Capítulo 12.

**Onde são guardados os backups automáticos?**
Na pasta `autosaves` dentro da diretoria de dados da aplicação (`%APPDATA%\runtime-live-machine-pro\autosaves\` no Windows; caminhos equivalentes no macOS e Linux, Capítulo 10). São conservados os dez instantâneos mais recentes.

**O software funciona offline?**
Sim, por completo. O RLMP não exige ligação à internet para funcionar. A rede é usada apenas para a verificação das atualizações (opcional) e para o Controlo Remoto em rede local (opcional).

**O Controlo Remoto não se liga. Porquê?**
Verifique se o dispositivo remoto está na **mesma rede** do computador, se introduziu o **PIN correto** (muda a cada arranque) e se usa o endereço mostrado nas Definições. Lembre-se de que o Controlo Remoto arranca desligado a cada arranque da aplicação (Capítulo 11).
