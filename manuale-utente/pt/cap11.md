# Capítulo 11 — Controlo Remoto

---

Quem conduz um show nem sempre está sentado à frente do computador. Por vezes o apresentador encontra-se do outro lado do estúdio, atrás de um vidro, ou anda pelo espaço com um convidado. É para isso que serve o **Controlo Remoto** do Runtime Live Machine Pro: permite comandar os passos essenciais do show a partir de um segundo dispositivo — tablet, telemóvel ou portátil — ligado à mesma rede local, usando apenas o browser. Não é preciso instalar nada no dispositivo remoto.

Esta função está, por agora, assinalada como **Beta**.

---

## 11.1 Como funciona

Ao ativá-lo, o RLMP arranca internamente um pequeno **servidor web local**. O dispositivo remoto liga-se a esse servidor através de um endereço aberto no browser, e daí surge uma página de controlo que reflete o estado da coluna Música e permite agir sobre ela.

Tudo isto acontece **dentro da rede local**: o servidor fica acessível apenas aos aparelhos ligados à mesma rede Wi-Fi ou LAN do estúdio, sem passar pela internet.

---

## 11.2 Ativação

1. Abra as **Definições** a partir do menu Ferramentas e vá ao separador *Gerais*.
2. Ative o interruptor **Controlo Remoto (Beta)**.
3. Aparecem um **PIN de seis dígitos**, a **porta** do servidor e os **endereços de rede** a que o dispositivo remoto se pode ligar.
4. O botão **Copiar ligação** copia para a área de transferência o endereço já pronto a usar (no formato `http://<endereço-do-computador>:8787`).

O servidor escuta na porta **8787**. O PIN é **regenerado a cada arranque** da aplicação e nunca fica memorizado, pelo que fechar e reabrir o RLMP gera sempre um PIN novo. Também o próprio Controlo Remoto arranca desligado de cada vez, e só volta a ficar ativo quando for preciso.

---

## 11.3 Ligar a partir do dispositivo remoto

1. No tablet ou no telemóvel, abra o browser e escreva o endereço mostrado nas Definições, ou cole-o a partir da ligação copiada.
2. Aparece uma página com um teclado numérico, onde introduz o **PIN de seis dígitos**.
3. Uma vez validado o PIN, a página mostra a lista das clips da coluna **Música**, com os respetivos comandos de reprodução e um botão **Stop All**. Há ainda um botão dedicado para levar a página a ecrã inteiro, prático em tablet.

A partir daqui já pode iniciar e parar as faixas da coluna Música e, se for necessário, parar tudo de uma vez. O estado atualiza-se em tempo real nos dois sentidos: o que arranca ou para no computador principal reflete-se na página remota, e vice-versa.

---

## 11.4 O que se controla remotamente

O Controlo Remoto foi pensado para ser essencial, nada mais do que isso. À distância, pode:

- **Iniciar** uma clip da coluna Música.
- **Parar** uma clip da coluna Música.
- Executar um **Stop All**.

Não há outras ações possíveis. O resto da regia, as demais colunas, o pad FX, o editor, as definições, permanece no computador principal. Trata-se de uma opção de segurança: o comando à distância serve para gerir o fluxo musical, não para substituir a posição de regia.

---

## 11.5 Segurança e limites

- **PIN obrigatório.** Nenhum dispositivo consegue enviar comandos sem primeiro passar pela verificação do PIN de seis dígitos.
- **Proteção contra tentativas.** As tentativas de introdução do PIN estão limitadas no tempo: depois de algumas falhas seguidas, o acesso a partir daquele aparelho fica temporariamente bloqueado.
- **Comandos em lista branca.** O servidor só aceita os três comandos previstos, iniciar, parar e Stop All; qualquer outro pedido é simplesmente ignorado.
- **Apenas rede local.** Este servidor foi pensado para a rede do estúdio. Se a sua rede Wi-Fi for aberta ou partilhada, vale a pena avaliar com atenção quem lhe pode aceder.
- **Sem persistência.** Nem o PIN nem o estado de ativação ficam guardados: a cada reinício, tudo recomeça de uma configuração limpa.

> **Nota.** Por se tratar de uma função em Beta, o conjunto de comandos disponíveis poderá alargar-se em versões futuras. Para já, está calibrado para o caso de uso mais frequente: gerir a música à distância durante a condução do show.
