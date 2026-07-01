// Controllo Remoto (2026-07-01) — utility pure per il certificato HTTPS
// auto-firmato. Logica di verifica isolata da RemoteControlServer.ts per
// essere testabile senza dover generare certificati reali in ogni test.
import { X509Certificate } from 'crypto';

/**
 * True se il certificato copre (via Subject Alternative Name) TUTTI gli
 * indirizzi IP forniti. Usata per decidere se rigenerare il certificato
 * quando l'IP della macchina cambia (es. DHCP) — un certificato che non
 * elenca l'IP corrente farebbe fallire la validazione anche se installato
 * come attendibile sul dispositivo.
 */
export function certCoversAddresses(certPem: string, addresses: string[]): boolean {
    if (addresses.length === 0) return true; // nessun indirizzo da coprire
    try {
        const cert = new X509Certificate(certPem);
        const san = cert.subjectAltName ?? '';
        return addresses.every((addr) => san.includes(`IP Address:${addr}`));
    } catch {
        return false; // certificato illeggibile/corrotto: forza la rigenerazione
    }
}
