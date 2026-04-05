import gbFlag from '../../assets/flags/gb.svg';
import itFlag from '../../assets/flags/it.svg';
import frFlag from '../../assets/flags/fr.svg';
import deFlag from '../../assets/flags/de.svg';
import esFlag from '../../assets/flags/es.svg';
import ptFlag from '../../assets/flags/pt.svg';
import ruFlag from '../../assets/flags/ru.svg';
import cnFlag from '../../assets/flags/cn.svg';

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
    switch (code) {
        case 'en':
            return <img src={gbFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'it':
            return <img src={itFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'fr':
            return <img src={frFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'de':
            return <img src={deFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'es':
            return <img src={esFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'pt':
            return <img src={ptFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'ru':
            return <img src={ruFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'zh':
            return <img src={cnFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        default:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="24" height="16">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            );
    }
};
