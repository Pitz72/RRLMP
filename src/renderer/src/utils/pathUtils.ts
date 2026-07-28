export const toFileUrl = (filePath: string): string => {
    // G6 Fix: Usa il protocollo media:// invece di file:///
    // media:// è gestito dal main process (src/main/index.ts) con supporto
    // Range Request, streaming 64KB e decoding corretto di URI (spazi, accenti).
    const normalized = filePath.replace(/\\/g, '/');

    // v1.15.20 (G4): percorsi di rete UNC (`\\SERVER\share\file.mp3`).
    // Prima finivano in `media://///SERVER/share/file.mp3` e il main, che tagliava
    // via tutti gli slash iniziali, si ritrovava un path RELATIVO → 403, con la clip
    // che in griglia appariva sana (il file esiste davvero) e semplicemente non
    // partiva. Il nome del server va dove gli compete, nell'authority dell'URL:
    // `media://SERVER/share/file.mp3`. Lo schema `media` non è "speciale" per la
    // specifica URL, quindi l'host resta intatto (maiuscole comprese).
    // Il riconoscimento guarda il path ORIGINALE (`\\`), non quello con i separatori
    // già convertiti: su Linux e macOS un path può legittimamente iniziare con `//`
    // e non è affatto una share di rete — verrebbe spedito come host e non si
    // riprodurrebbe più. Un UNC vero esiste solo su Windows e usa i backslash.
    if (filePath.startsWith('\\\\')) {
        const parts = normalized.slice(2).split('/').filter(s => s.length > 0);
        if (parts.length > 0) {
            const [server, ...rest] = parts;
            return `media://${encodeURIComponent(server)}/${rest.map(encodeURIComponent).join('/')}`;
        }
    }

    // Encode solo i caratteri speciali mantenendo il drive letter (C:/)
    const encoded = normalized.split('/').map((segment, i) =>
        // Non encodare il drive letter (es. "C:") né stringhe vuote
        (i === 0 && segment.includes(':')) ? segment : encodeURIComponent(segment)
    ).join('/');
    // IMPORTANTE: triplo slash (media:///) per avere authority vuota.
    // media://K:/path tratterebbe "K:" come hostname (URL invalido su Windows).
    // media:///K:/path → authority="" path="/K:/path" → identico a file:///C:/path
    //
    // v1.15.20: gli slash iniziali del path vengono assorbiti dal prefisso. Un path
    // POSIX (`/home/u/x.mp3`) produceva `media:////home/...` — QUATTRO slash: il main
    // li tagliava tutti e poi ne rimetteva uno davanti, quindi il risultato tornava
    // giusto per compensazione. Un equilibrio fragile, emerso montando i test sulla
    // catena completa. Ora la forma è una sola: `media:///home/u/x.mp3`.
    return `media:///${encoded.replace(/^\/+/, '')}`;
};
