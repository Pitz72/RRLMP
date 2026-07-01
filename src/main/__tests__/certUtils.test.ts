import { describe, it, expect } from 'vitest';
import { certCoversAddresses } from '../certUtils';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const selfsigned = require('selfsigned');

function makeCert(ips: string[]): string {
    const pems = selfsigned.generate([{ name: 'commonName', value: 'rrlmp.local' }], {
        days: 1,
        keySize: 1024, // veloce nei test, non serve sicurezza reale
        algorithm: 'sha256',
        extensions: [
            { name: 'basicConstraints', cA: true },
            { name: 'subjectAltName', altNames: ips.map((ip) => ({ type: 7, ip })) }
        ]
    });
    return pems.cert;
}

describe('certCoversAddresses', () => {
    it('true quando il certificato include tutti gli indirizzi richiesti', () => {
        const cert = makeCert(['192.168.1.2', '10.0.0.5']);
        expect(certCoversAddresses(cert, ['192.168.1.2'])).toBe(true);
        expect(certCoversAddresses(cert, ['192.168.1.2', '10.0.0.5'])).toBe(true);
    });

    it('false quando manca anche un solo indirizzo richiesto', () => {
        const cert = makeCert(['192.168.1.2']);
        expect(certCoversAddresses(cert, ['192.168.1.2', '10.0.0.9'])).toBe(false);
    });

    it('true su lista di indirizzi vuota (nulla da coprire)', () => {
        const cert = makeCert(['192.168.1.2']);
        expect(certCoversAddresses(cert, [])).toBe(true);
    });

    it('false su PEM non valido', () => {
        expect(certCoversAddresses('non un certificato', ['192.168.1.2'])).toBe(false);
    });
});
