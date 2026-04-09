# Stato Migrazione CI/CD su GitLab (07-04-2026)

## Sommario
Il progetto RRLMP è stato parzialmente migrato da GitHub Actions a GitLab CI/CD per gestire le build automatizzate di Linux e macOS.

## Stato Attuale
- **Repository Remote:** Configurato con successo su `https://gitlab.com/pizzisimone1972/RRLMP.git`.
- **Autenticazione:** Utilizzo di Personal Access Token (PAT) via HTTPS.
- **Linux Build:** **FUNZIONANTE**. La correzione del campo `homepage` in `package.json` ha permesso la generazione dei pacchetti `.AppImage` e `.deb`.
- **macOS Build:** **BLOCCATA**. Il job rimane in stato "Stuck" con errore "No matching runner available".

## Dettagli Tecnici
- **File di configurazione:** `.gitlab-ci.yml`
- **Tentativi di Tag macOS:**
  1. `saas-macos-medium-m1` (Ufficiale GitLab SaaS)
  2. `macos-15-xcode-16` (Tag specifico per immagine)
- **Errori riscontrati:** "This job is stuck because... no runners that match all of the job's tags".

## Prossimi Passi
- Identificare il tag esatto supportato dall'istanza GitLab per gli account free verificati.
- Verificare se è necessaria l'abilitazione manuale dei "Shared Runners" per macOS nelle impostazioni del progetto (sebbene Linux funzioni).
- Testare il tag generico `macos`.
