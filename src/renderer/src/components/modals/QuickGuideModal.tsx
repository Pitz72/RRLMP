import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { QUICK_GUIDES } from '../../assets/quick-guide';
import { MarkdownLite } from '../ui/MarkdownLite';

interface QuickGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickGuideModal = ({ isOpen, onClose }: QuickGuideModalProps) => {
    const { t, i18n } = useTranslation();

    useEscapeToClose(isOpen, onClose);

    if (!isOpen) return null;

    const lang = i18n.language?.slice(0, 2) || 'en';
    const content = QUICK_GUIDES[lang] || QUICK_GUIDES.en;

    return (
        <div className="ov" style={{ zIndex: 110 }} onClick={onClose}>
            <div className="ov-panel anim-in p-6 w-[640px] max-h-[85vh] relative overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-lg font-bold text-white mb-4 pr-8">{t('modal.quickGuide.title')}</h2>

                <MarkdownLite content={content} />
            </div>
        </div>
    );
};
