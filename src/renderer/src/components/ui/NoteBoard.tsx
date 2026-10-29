import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';

export const NoteBoard: React.FC = () => {
    const { t } = useTranslation();
    const activeClips = useAudioStore((state) => state.activeClips);
    const columns = useProjectStore((state) => state.columns);

    // Trova la prima clip in play che ha note
    const activeNote = React.useMemo(() => {
        for (const col of columns) {
            for (const clip of col.clips) {
                if (activeClips[clip.id] && clip.notes?.trim()) {
                    return { clip, col };
                }
            }
        }
        return null;
    }, [activeClips, columns]);

    if (!activeNote) return null;

    const { clip, col } = activeNote;
    const color = clip.customColor || col.color;

    // v1.15.36 (tema Pad luminosi): pozzetto sotto la board, LED nel colore della
    // colonna, testo in carattere proporzionale e più grande (si legge in onda).
    return (
        <div className="notes">
            {/* Header strip */}
            <div className="notes-head">
                <span className="led pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="k" style={{ color: `color-mix(in srgb, ${color} 65%, #fff)` }}>
                    {t('nowPlaying.notesBoard', 'NOTE REGIA')}
                </span>
                <span className="n">— {clip.name}</span>
            </div>

            {/* Testo note */}
            <pre>{clip.notes}</pre>
        </div>
    );
};
