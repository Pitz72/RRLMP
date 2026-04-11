# CAPÍTULO 1: INTRODUÇÃO E CONFIGURAÇÃO

Bem-vindo ao **Runtime Live Machine Pro (RRLMP)**.
Este capítulo irá guiá-lo através dos primeiros passos: desde a compreensão da filosofia do software até ao primeiro arranque.

## 1.1 O que é o Runtime Live Machine Pro (RRLMP)

**Runtime Live Machine Pro** é uma arquitetura de áudio profissional de classe "Pro" concebida para a direção de **espetáculos ao vivo individuais**, podcasts, eventos e rádios web.

Ao contrário do complexo software de automação de rádio 24/7 (que reproduz música em rotação durante dias), o RRLMP é uma ferramenta de **Performance**. Foi concebido para ser "tocado" em tempo real por um realizador ou locutor, oferecendo um controlo cirúrgico sobre cada transição.

### Porquê escolher o RRLMP?
*   **Filosofia "Single Show"**: Cada projeto é um contentor isolado que guarda tudo o que é necessário para esse episódio ou evento específico.
*   **Arquitetura Main-Side-Heavy**: Utiliza um proxy Node.js para a descodificação de áudio pesada (FFmpeg), garantindo que a interface (Renderer) permaneça fluida e sem falhas mesmo com ficheiros WAV de grandes dimensões.
*   **Segurança Total**: Inclui sistemas de Auto-Backup, verificação de integridade de ficheiros .lmp e avisos visuais para os pontos de inserção Intro/Outro.
*   **Controlo Físico**: Suporta nativamente controladores MIDI (com MIDI Learn) e teclados para uma direção tátil e reativa.

---

## 1.2 Instalação

### Requisitos do Sistema
*   **Windows**: Windows 10 ou Windows 11 (64-bit).
*   **macOS**: macOS 11 (Big Sur) ou posteriores (Suporte nativo Apple Silicon & Intel).
*   **Linux**: Suporte para AppImage e pacotes .deb (Ubuntu/Debian/Mint).
*   **RAM**: Mínimo 4GB (8GB Recomendados).
*   **Espaço em Disco**: 200MB para a aplicação + espaço para os seus ficheiros de áudio.

### Instalação no Windows
1.  Descarregue o ficheiro `Runtime Live Machine Pro Setup 1.0.0.exe` do site oficial ou do repositório.
2.  Faça duplo clique no executável.
3.  O instalador automático copiará os ficheiros e criará um atalho no Ambiente de Trabalho.
4.  Ao terminar, a aplicação iniciará automaticamente.

> **Nota de Segurança**: Como o software é atualizado frequentemente, o Windows SmartScreen pode mostrar um aviso "PC protegido pelo Windows". Clique em **"Mais informações"** e depois em **"Executar mesmo assim"**. O software é seguro, está assinado e livre de malware.

### Instalação no macOS
1.  Descarregue o ficheiro `.dmg`.
2.  Abra o ficheiro de imagem e arraste o ícone do **Runtime Live Machine Pro** para a pasta **Aplicações**.
3.  No primeiro arranque, poderá ter de autorizar a aplicação em *Definições do Sistema > Segurança e Privacidade*.

---

## 1.3 O Ecrã de Boas-vindas (Welcome Screen)

No primeiro arranque, será recebido pelo novo **Welcome Screen** em layout horizontal. Este é o seu painel de início, concebido para permitir que comece a trabalhar em segundos.

### Elementos do Ecrã
1.  **Novo Logótipo**: O logótipo Pro (5 barras de vúmetro com um triângulo de reprodução) identifica a versão estável do software.
2.  **Estado da Versão**: Sob o logótipo, verá o número da versão atual (ex. `v1.0.0`).
    *   ✅ **Verde**: Tem a última versão disponível.
    *   ⬇️ **Amarelo/Laranja**: Está disponível uma atualização.
3.  **Seletor de Idioma**: No canto superior direito encontrará bandeiras (8 idiomas suportados) para alterar instantaneamente a interface.
    *   *Idiomas*: IT, EN, FR, DE, ES, PT, RU, ZH.
    *   A sua escolha será guardada no perfil de utilizador.

### Ações Disponíveis
*   **Novo Projeto (New Project)**: Cria uma sessão vazia. Todas as 5 colunas (Assets, Music, Voice, SFX, PRE-SHOW) estarão prontas para o carregamento de ficheiros.
*   **Carregar Projeto (Load Project)**: Abre um ficheiro `.lmp` existente. O RRLMP executará um controlo de integridade: se faltarem ficheiros de áudio, serão destacados a vermelho.
*   **Manual Online**: Abre a documentação atualizada no seu navegador.

> **Primeiro Arranque**: O RRLMP inicia-se preferencialmente em ecrã inteiro. Assim que carregar um projeto, notará o crachá **PRO** ciano no cabeçalho, confirmando a licença e a estabilità do motor de áudio.
