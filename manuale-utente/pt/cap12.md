# Capítulo 12 — Atualizações

---

O Runtime Live Machine Pro atualiza-se sozinho, mas nunca em seu prejuízo. Duas regras sustentam tudo: nenhuma atualização deve interferir com um direto, e nenhum download começa sem o seu consentimento. Este capítulo explica como o software verifica a presença de novas versões, como as instala e porque é que às vezes se comporta de forma diferente consoante o sistema operativo.

---

## 12.1 A verificação no arranque

Pouco depois do arranque (cerca de três segundos), o RLMP verifica silenciosamente se existe uma versão mais recente. O resultado surge no ecrã de boas-vindas, junto ao número de versão:

- **«Versão mais recente»** (verde) — está a usar a última versão.
- **«Atualização disponível»** (âmbar) — está disponível uma versão mais recente. É um botão: clique nele para abrir a janela de atualização.
- **«OFFLINE»** — não foi possível contactar o serviço; tente mais tarde. O software funciona normalmente.

A verificação é opcional e não bloqueante: se estiver offline, o RLMP arranca e trabalha sem problemas.

---

## 12.2 A janela de atualização

Quando há uma atualização disponível, a janela dedicada mostra a versão atual, a nova versão e as notas de lançamento. A partir daqui decide:

- **Mais tarde** — fecha a janela sem fazer nada. Poderá reabri-la quando quiser.
- **Transferir** — inicia o download da nova versão. O download **nunca começa sozinho**: só começa quando prime este botão. Uma barra de progresso mostra o seu andamento.
- **Reiniciar e instalar** — surge quando o download está completo: reinicia a aplicação aplicando a atualização.

---

## 12.3 A regra «nunca durante a emissão»

A verificação automática pode encontrar uma atualização precisamente enquanto está no ar. Nesse caso, o RLMP **não o interrompe**: a janela de atualização fica em espera e abre-se por si só apenas quando o direto tiver terminado (quando pára tudo). A prioridade é sempre o show em curso.

Há uma única exceção, e é intencional: o botão **Verificar atualizações agora**, no painel *Info* (menu Ferramentas), é uma ação explícita sua e abre imediatamente a janela, mesmo em direto. Se o prime, é porque o quer.

---

## 12.4 Diferenças entre plataformas

A forma como a atualização é instalada depende do sistema operativo.

**Windows e Linux (AppImage).**
A atualização é completamente integrada: transfere a nova versão a partir da janela e o software instala-a no arranque seguinte, sem passos manuais.

**macOS e Linux (pacote .deb).**
Nestes sistemas o RLMP não consegue instalar a atualização de forma fiável. Em vez da instalação automática, a janela avisa-o e abre o browser na página de download da nova versão: a partir daí transfere o pacote e instala-o como faria para uma nova instalação (Capítulo 2). Os seus projetos e os ficheiros `.lmp` ficam intactos.

> **Nota.** Em todos os casos, atualizar o RLMP não implica a perda dos projetos: os ficheiros `.lmp` são compatíveis entre as versões e não exigem migração manual.
