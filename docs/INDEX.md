# RRLMP — Centro Documentazione

Benvenuto nel centro documentazione di **Runtime Radio Live Machine Pro**. Questo documento funge da indice e punto di ingresso unico per tutte le risorse del progetto.

---

## 🛠️ Area Tecnica (Sviluppo & Architettura)

In questa sezione sono raccolti i documenti necessari per comprendere il funzionamento interno del software e la sua evoluzione.

- **[Architettura di Progetto](./ARCHITECTURE.md)**: Linee guida, modello dei processi (Main/Renderer), strategia audio, IPC API, tipi e standard di sviluppo. *(Aggiornato a v0.13.2)*
- **[Roadmap & Issue Backlog](./ROADMAP.md)**: Stato attuale dello sviluppo, criticità aperte e funzionalità pianificate. *(Aggiornato a v0.13.2)*
- **[Visione Tecnica & Analisi Gap](./VISION.md)**: Analisi completa doc vs codice, debito tecnico, funzionalità da migliorare e funzionalità essenziali mancanti per il perfezionamento broadcast. *(Nuovo — v0.13.2)*
- **Changelog (Storico Versioni)**:
  - **[Release Correnti (v0.10.x+)](./changelogs/current/)**: Dettagli sulle ultime versioni e hotfix.
  - **[Archivio Storico](./changelogs/archive/)**: Tutti i cambiamenti dalle versioni 0.0.1 in poi.
- **Analisi Tecniche**:
  - **[Analisi Forensi e Crash Report](./technical/analysis/)**: Studi approfonditi su crash critici (es: Access Violation).
  - **[Report di Build e Debug](./technical/reports/)**: Note tecniche sulle build e script di utilità.

---

## 📖 Area Utente (Manuale d'Uso)

Il manuale utente è una risorsa specifica non tecnica, progettata per la consultazione operativa e la produzione di documentazione ufficiale.

### Manuale in Italiano (IT)

- [Capitolo 1: Introduzione e Setup](../manuale-utente/it/cap1.md)
- [Capitolo 2: Interfaccia Utente](../manuale-utente/it/cap2.md)
- [Capitolo 3: Gestione Clip](../manuale-utente/it/cap3.md)
- ... *Vedere cartella [manuale-utente/it/](../manuale-utente/it/) per i capitoli completi.*

### Lingue Supportate

- [English (EN)](../manuale-utente/en/)
- [Français (FR)](../manuale-utente/fr/)
- [Español (ES)](../manuale-utente/es/)
- [Deutsch (DE)](../manuale-utente/de/)
- [Português (PT)](../manuale-utente/pt/)
- [Русский (RU)](../manuale-utente/ru/)
- [中文 (ZH-CN)](../manuale-utente/zh-cn/)

---

## 🚀 Guida Rapida per Sviluppatori

1. `npm install`
2. `npm run dev`
3. Consulta l'**[Architettura](./ARCHITECTURE.md)** prima di modificare il motore audio.

---

*Ultimo aggiornamento indice: 2026-04-06*
