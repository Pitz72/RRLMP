# Capítulo 11 — Controlo Remoto

---

Nem sempre quem conduz está sentado à frente do computador. Às vezes o apresentador está do outro lado do estúdio, atrás de um vidro, ou movimenta-se com um convidado. O **Controlo Remoto** do Runtime Live Machine Pro permite comandar os passos essenciais do show a partir de um segundo dispositivo (um tablet, um telemóvel, um portátil) ligado à mesma rede local, usando simplesmente o browser. Não é preciso instalar nada no dispositivo remoto.

A função está de momento assinalada como **Beta**.

---

## 11.1 Como funciona

Quando o ativa, o RLMP arranca internamente um pequeno **servidor web local**. O dispositivo remoto liga-se a este servidor abrindo um endereço no browser: a partir daí surge uma página de controlo que reflete o estado da coluna Música e permite agir sobre ela.

Tudo acontece **dentro da rede local**: o servidor está acessível aos aparelhos ligados à mesma rede Wi-Fi ou LAN do estúdio, e não passa pela internet.

---

## 11.2 Ativação

1. Abra as **Definições** a partir do menu Ferramentas e vá ao separador *Gerais*.
2. Ative o toggle **Controlo Remoto (Beta)**.
3. Surgem um **PIN de seis dígitos**, a **porta** do servidor e os **endereços de rede** a que o dispositivo remoto se pode ligar.
4. O botão **Copiar ligação** copia para a área de transferência o endereço pronto a usar (na forma `http://<endereço-do-computador>:8787`).

O servidor escuta na porta **8787**. O PIN é **regenerado a cada arranque** da aplicação e não fica memorizado: fechar e reabrir o RLMP produz um novo PIN. O próprio Controlo Remoto também arranca sempre desligado, a reativar quando for preciso.

---

## 11.3 Ligar a partir do dispositivo remoto

1. No tablet ou no telemóvel, abra o browser e escreva o endereço mostrado nas Definições (ou cole-o a partir da ligação copiada).
2. Surge uma página com um teclado numérico: introduza o **PIN de seis dígitos**.
3. Com o PIN correto, a página mostra a lista das clips da coluna **Música**, com os comandos de reprodução, e um botão **Stop All**. Um botão dedicado leva a página a ecrã inteiro, cómodo em tablet.

A partir daqui pode fazer arrancar e parar as faixas da coluna Música e, se for preciso, parar tudo. O estado atualiza-se em tempo real: o que arranca ou pára no computador principal reflete-se na página remota, e vice-versa.

---

## 11.4 O que se controla remotamente

O Controlo Remoto é deliberadamente essencial. Remotamente pode:

- **Iniciar** uma clip da coluna Música.
- **Parar** uma clip da coluna Música.
- Executar um **Stop All**.

São as únicas ações permitidas. O resto da regia (as outras colunas, o pad FX, o editor, as definições) fica no computador principal. É uma opção de segurança: o comando à distância serve para gerir o fluxo musical, não para substituir a posição de regia.

---

## 11.5 Segurança e limites

- **PIN obrigatório.** Nenhum dispositivo pode enviar comandos sem ter passado a verificação do PIN de seis dígitos.
- **Proteção contra tentativas.** As tentativas de introdução do PIN são limitadas no tempo: após algumas tentativas falhadas seguidas, o acesso a partir desse aparelho é temporariamente bloqueado.
- **Comandos em lista branca.** O servidor só aceita os três comandos previstos (iniciar, parar, Stop All): qualquer outro pedido é ignorado.
- **Apenas rede local.** O servidor foi pensado para a rede do estúdio. Se a sua rede Wi-Fi for aberta ou partilhada, avalie com atenção quem lhe pode aceder.
- **Sem persistência.** PIN e estado de ativação não são guardados: a cada reinício parte de uma configuração limpa.

> **Nota.** Por se tratar de uma função em Beta, o conjunto de comandos disponíveis poderá alargar-se nas versões futuras. Por agora está calibrado para o caso de uso mais frequente: gerir a música à distância durante a condução.
