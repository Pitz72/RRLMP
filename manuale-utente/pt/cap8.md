# CAPÍTULO 8: RESOLUÇÃO DE PROBLEMAS E FAQ

Mesmo no software mais estável, podem ocorrer imprevistos devido ao hardware ou ao sistema operativo. Aqui encontrará as soluções para os problemas mais comuns.

---

## 8.1 Problemas de Áudio

### O Temporizador corre e os Medidores VU movem-se, mas não ouço nada.
O software está a reproduzir o áudio corretamente (vê-o pelas barras coloridas em cima), mas o sinal não chega às suas colunas/auscultadores.
1.  **Verifique o Volume Mestre**: Certifique-se de que o cursor de volume em cima não está a zero.
2.  **Verifique a Saída (Routing)**:
    *   Clique no ícone **Engrenagem** (Definições).
    *   Verifique que dispositivo está selecionado em "Audio Output Device".
    *   Por vezes o Windows muda o ID dos dispositivos USB se forem desligados e ligados novamente. Tente voltar a selecionar a sua placa de áudio (ex. *Rødecaster Pro* ou *Auscultadores*) da lista.
3.  **Misturador Externo**: Se sai para uma mesa de mistura USB, verifique se o fader físico desse canal não está em baixo ou em "Mute".

### O áudio "crepita" ou salta.
Isto acontece raramente graças ao motor nativo, mas pode acontecer se o CPU do computador estiver sob stress extremo.
*   Feche outras aplicações pesadas (edição de vídeo, jogos).
*   Se usa uma placa de áudio profissional, verifique se o *Tamanho do Buffer (Buffer Size)* nos drivers da placa não é demasiado baixo (recomendado: 256 ou 512 amostras).

---

## 8.2 Gestão de Ficheiros e Clips Vermelhos

### Um Clip tornou-se Vermelho e já não toca.
Um **Cartão Vermelho** indica que o software já não consegue encontrar o ficheiro de áudio no disco.
*   **Causa**: Moveu, renomeou ou apagou o ficheiro MP3/WAV original. Ou o ficheiro estava numa pen USB/Disco Externo que agora está desligado.
*   **Solução**:
    1.  Volte a ligar o disco externo.
    2.  Mova o ficheiro de volta para a sua localização original.
    3.  Ou, arraste o ficheiro novamente para a grelha (criando um novo cartão) e apague o antigo vermelho.

> **Prevenção**: Para evitar este problema, use a função **Export Package** (Cap. 7) que copia todos os ficheiros para uma pasta segura juntamente com o projeto.

---

## 8.3 Problemas MIDI

### O meu controlador MIDI não funciona / não é detetado.
1.  **Regra de Ouro do MIDI**: O controlador deve estar ligado ao computador **ANTES** de iniciar o Runtime Live Machine.
    *   Se o ligar com o software aberto, o navegador interno poderá não o ver. Feche e volte a abrir o RLM.
2.  **Learn Mode**: Verifique se não deixou o modo "MIDI Learn" ativo (Ícone Ciano). Neste modo, premir as teclas serve apenas para mapear, não para tocar.
3.  **Drivers**: Alguns controladores avançados requerem drivers específicos. Verifique se o Windows o reconhece corretamente.

---

## 8.4 Perguntas Frequentes (FAQ)

**P: Posso usar o RLM para automatizar a rádio 24h por dia?**
R: Não. O RLM foi concebido para a realização *Live* (programas assegurados por uma pessoa). Não tem funções de agendamento horário ou rotação musical automática infinita.

**P: Que formatos de áudio são suportados?**
R: Suporta nativamente **MP3, WAV, AAC, OGG, FLAC**. Recomendamos o uso de WAV para máxima qualidade ou MP3 320kbps para poupar espaço.

**P: O software funciona no iPad ou Android?**
R: Não, o Runtime Live Machine é um software de Desktop profissional para **Windows** e **macOS**. Requer a potência de gestão de ficheiros de um computador real.

**P: Como atualizo o software?**
R: No arranque, o Welcome Screen notificá-lo-á se houver uma nova versão disponível (indicador Amarelo/Laranja). Visite o site oficial para descarregar o instalador atualizado. Os seus projetos .lmp guardados serão compatíveis com as novas versões.

**P: Onde encontro os ficheiros de salvamento automático?**
R: Se estiver a trabalhar num ficheiro guardado, o backup .bak está na mesma pasta que o projeto. Se estava a trabalhar num projeto "Sem Título" e o PC se desligou, verifique na pasta de dados de aplicação do sistema (no Windows: %APPDATA%\runtime-live-machine\).
