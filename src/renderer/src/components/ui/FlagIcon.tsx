import gbFlag from '../../assets/flags/gb.svg';
import itFlag from '../../assets/flags/it.svg';

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
    switch (code) {
        case 'en':
            return <img src={gbFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
        case 'it':
            return <img src={itFlag} className={className} alt={code} style={{ width: 24, height: 16, objectFit: 'cover' }} />;
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
