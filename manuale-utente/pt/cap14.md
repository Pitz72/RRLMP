# Capítulo 14 — Resolução de problemas e FAQ

---

Este capítulo reúne os problemas mais comuns na utilização diária do Runtime Live Machine Pro, com as respetivas soluções. Cada secção descreve o sintoma, a causa mais provável e o procedimento de resolução.

---

## 14.1 Problemas de áudio

### O timer avança e os VU meter mexem-se, mas não se ouve nada

Isto costuma significar que o software está a reproduzir corretamente, com o sinal presente no bus interno, mas que esse sinal não chega ao dispositivo de escuta.

**Verifique por ordem:**

1. **Master Volume.** O slider no cabeçalho está a zero? Leve-o a 100%.
2. **Dispositivo de saída.** Abra as Definições → *Áudio & Mix* e confirme qual o dispositivo selecionado. O Windows e o macOS por vezes mudam o identificador dos dispositivos USB quando estes são desligados e voltados a ligar; se o nome não corresponder ao aparelho fisicamente ligado, selecione-o de novo.
3. **Mixer externo.** Se o sinal passa por um mixer de hardware, verifique se o fader do canal não está baixado ou em mute, e se a saída do mixer está ligada aos monitores ou à cadeia de transmissão.

### O áudio salta, chia ou tem interrupções

Em condições normais o motor de áudio é robusto perante este tipo de artefacto, pelo que, quando surge, a causa costuma ser externa ao software.

- **CPU sob carga extrema.** Feche aplicações pesadas a correr em simultâneo, como montagem de vídeo, rendering ou backups intensivos.
- **Buffer de áudio demasiado baixo.** Numa placa de som profissional, verifique o valor de buffer no painel de controlo do driver: 256 ou 512 amostras é o equilíbrio correto, e abaixo das 128 podem surgir dropouts.
- **Disco lento ou sob stress.** O RLMP faz streaming do áudio a partir do disco, por isso um disco mecânico lento ou um SSD quase cheio pode causar interrupções em ficheiros de grandes dimensões.

### O nível de áudio está demasiado baixo ou demasiado alto

- **Gain por clip.** Ajuste o Gain nas propriedades da clip (clique direito → secção Volume).
- **Master Volume.** Se o nível global estiver incorreto, atue no slider do cabeçalho.
- **Homologação e Master Chain.** A homologação do volume aproxima os níveis das clips de uma referência comum, e o glue da Master Chain pode tornar o som mais compacto. Se o resultado não convencer, estes andares podem ser ajustados ou desativados nas Definições → Master Chain.

---

## 14.2 Clips vermelhas e ficheiros em falta

### Uma card ficou vermelha («FICHEIRO EM FALTA») e não responde ao clique

O contorno vermelho indica que o ficheiro de áudio já não está acessível no caminho guardado no projeto.

**Causas possíveis:**

- O ficheiro foi movido ou renomeado no disco.
- Estava num disco externo ou numa pen USB entretanto desligada.
- O projeto foi aberto noutro computador, onde os caminhos não correspondem.

**Soluções:**

1. **Volte a ligar o disco.** Se o ficheiro estava numa unidade externa, ligue-a novamente.
2. **Reponha o ficheiro na posição original.** Caso tenha sido movido, coloque-o de volta no caminho original.
3. **Substitua a clip.** Arraste de novo o ficheiro correto para a grelha e elimine a card vermelha.
4. **Use Exportar Arquivo no futuro.** A forma mais eficaz de prevenir este problema é criar um arquivo antes de mover ou transferir o projeto (Capítulo 10).

---

## 14.3 Problemas de MIDI

### O controlador não é detetado

1. **Ligação.** Verifique se o controlador está ligado e reconhecido pelo sistema operativo. O RLMP deteta em tempo real a ligação e a desconexão dos dispositivos; se nada aparecer, desligue e volte a ligar o cabo USB.
2. **Driver.** A maioria dos controladores USB-MIDI é *class-compliant* e dispensa drivers. Já para superfícies profissionais com drivers proprietários, confirme se o driver está instalado.
3. **Verifique em modo Learn.** Ative o MIDI Learn e prima uma tecla no controlador: se a card recebe o mapeamento, é sinal de que o controlador está a ser detetado.

### As clips mapeadas não respondem às teclas do controlador

- **O modo MIDI Learn ainda está ativo.** Enquanto este modo está ligado, as teclas do controlador registam novos mapeamentos em vez de executarem as clips; desative-o a partir do menu Ferramentas.
- **O mapeamento perdeu-se.** Os mapeamentos das clips ficam guardados no ficheiro `.lmp`, por isso convém confirmar se o projeto foi guardado depois da sessão de MIDI Learn. Já os mapeamentos das funções globais estão associados a cada computador.

---

## 14.4 Problemas de arranque

### A aplicação não arranca no macOS (aviso do Gatekeeper)

Ver a secção 2.3: desbloqueio através de *Definições do Sistema → Privacidade e Segurança*.

### A aplicação não arranca no Windows (aviso do SmartScreen)

Ver a secção 2.2. Clique em *Mais informações* e depois em *Executar mesmo assim*.

### Comportamentos anómalos no arranque

Caso o software se comporte de forma inesperada ao abrir, feche e reabra o RLMP. Se o problema persistir, confirme se o caminho de instalação não contém carateres especiais suscetíveis de interferir com o carregamento dos componentes FFmpeg.

---

## 14.5 Perguntas frequentes

**O RLMP pode automatizar uma rádio 24 horas sem operador?**
Não. O RLMP foi concebido para a regia live, ou seja, para shows conduzidos por um operador, e não dispõe de programação horária nem de rotação automática da playlist. A vista Automix oferece apenas uma automação limitada e voluntária do fluxo musical, ativa enquanto a vista permanece aberta (Capítulo 7). Para a automação 24 horas existem softwares dedicados, como Zara Radio, PlayIt Live ou Rivendell, que respondem a necessidades diferentes.

**Qual é a diferença entre Guardar e Guardar Como?**
*Guardar Projeto* sobrepõe em silêncio o ficheiro `.lmp` já aberto. *Guardar Como…*, por sua vez, abre sempre a caixa de diálogo e cria um ficheiro novo, sem tocar no atual.

**Posso usar o RLMP em iPad ou em dispositivos móveis?**
Não como aplicação principal, já que o RLMP é um software desktop para Windows, macOS e Linux. Ainda assim, um tablet ou um telemóvel pode funcionar como **comando à distância** via browser, através do Controlo Remoto (Capítulo 11).

**Os ficheiros `.lmp` das versões anteriores são compatíveis com a 1.11.5?**
Sim: ao abrir um projeto criado numa versão anterior, o RLMP atualiza automaticamente a sua estrutura, incluindo as colunas entretanto acrescentadas, sem modificar o ficheiro até que seja executada uma gravação.

**Como atualizo o RLMP para uma nova versão?**
O software verifica as atualizações no arranque e avisa o utilizador. No Windows e no Linux AppImage a instalação é automática a partir da janela de atualização; no macOS e no Linux `.deb`, abre-se o browser na página de download. Todos os detalhes constam do Capítulo 12.

**Onde são guardados os backups automáticos?**
Na pasta `autosaves`, dentro da diretoria de dados da aplicação (`%APPDATA%\runtime-live-machine-pro\autosaves\` no Windows, com caminhos equivalentes no macOS e no Linux, Capítulo 10). São conservados os dez instantâneos mais recentes.

**O software funciona offline?**
Sim, por completo: o RLMP não exige ligação à internet para funcionar. A rede só é usada para a verificação das atualizações (opcional) e para o Controlo Remoto em rede local (opcional).

**O Controlo Remoto não se liga. Porquê?**
Verifique se o dispositivo remoto está na **mesma rede** do computador, se o **PIN introduzido está correto** (muda a cada arranque) e se está a usar o endereço mostrado nas Definições. Vale lembrar que o Controlo Remoto arranca sempre desligado a cada início da aplicação (Capítulo 11).
