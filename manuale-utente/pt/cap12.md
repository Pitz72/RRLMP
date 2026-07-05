# Capítulo 12 — Atualizações

---

O Runtime Live Machine Pro atualiza-se sozinho, mas nunca em prejuízo do utilizador. Duas regras governam todo o processo: nenhuma atualização interfere com um direto, e nenhum download arranca sem o seu consentimento. Este capítulo explica como o software verifica a existência de novas versões, como as instala e por que motivo o comportamento muda consoante o sistema operativo.

---

## 12.1 A verificação no arranque

Pouco depois de o software arrancar (cerca de três segundos), o RLMP verifica silenciosamente se há uma versão mais recente. O resultado aparece no ecrã de boas-vindas, junto ao número de versão:

- **«Versão mais recente»** (verde): já está a usar a última versão.
- **«Atualização disponível»** (âmbar): existe uma versão mais recente. É também um botão, e ao clicar nele abre-se a janela de atualização.
- **«OFFLINE»**: não foi possível contactar o serviço; tente mais tarde. Entretanto, o software continua a funcionar normalmente.

Esta verificação é opcional e não bloqueia nada: mesmo offline, o RLMP arranca e trabalha sem problemas.

---

## 12.2 A janela de atualização

Quando há uma atualização disponível, a janela dedicada mostra a versão atual, a nova versão e as **notas de lançamento**: a lista real das novidades dessa versão (o mesmo changelog deste software), formatada e legível, e não uma simples lista de ficheiros. As notas permanecem visíveis mesmo depois de o download terminar, mesmo antes de instalar, para que saiba sempre o que está prestes a aplicar. A partir daqui, decide o utilizador:

- **Mais tarde**: fecha a janela sem fazer nada, e pode reabri-la quando quiser.
- **Transferir**: inicia o download da nova versão. Note que o download **nunca começa sozinho**, só arranca quando prime este botão, e uma barra de progresso acompanha o andamento.
- **Reiniciar e instalar**: aparece assim que o download termina: fecha a aplicação e aplica a atualização. O fecho é limpo e imediato: tendo já confirmado o reinício, o software não volta a apresentar o pedido de gravação e não fica aberto por trás do instalador.

---

## 12.3 A regra «nunca durante a emissão»

Pode acontecer que a verificação automática encontre uma atualização precisamente enquanto está no ar. Nesse caso o RLMP não interrompe nada: a janela de atualização fica em espera e só se abre sozinha depois de o direto terminar, ou seja, quando tudo for parado. A prioridade é sempre o show em curso.

Há, no entanto, uma exceção intencional: o botão **Verificar atualizações agora**, no painel *Info* do menu Ferramentas, é uma ação explícita do utilizador e abre a janela de imediato, mesmo em direto. Ao premi-lo, presume-se que é essa a intenção.

---

## 12.4 Diferenças entre plataformas

O modo como a atualização é instalada depende do sistema operativo.

**Windows e Linux (AppImage).**
Aqui a atualização é totalmente integrada: a nova versão é transferida a partir da janela e o software instala-a no arranque seguinte, sem qualquer passo manual.

**macOS e Linux (pacote .deb).**
Nestes sistemas, o RLMP não consegue instalar a atualização de forma fiável, pelo que a janela avisa o utilizador e abre o browser na página de download da nova versão. A partir daí, transfere-se o pacote e instala-se como numa instalação nova (Capítulo 2), com os projetos e os ficheiros `.lmp` a permanecerem intactos.

> **Nota.** Seja qual for o caso, atualizar o RLMP nunca implica perder projetos: os ficheiros `.lmp` são compatíveis entre versões e não exigem migração manual.
