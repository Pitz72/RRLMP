import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClipCard } from './ClipCard';
import { AudioClip } from '../../types';

interface SortableClipProps {
    clip: AudioClip;
    onEdit: (clip: AudioClip) => void;
}

export const SortableClip: React.FC<SortableClipProps> = ({ clip, onEdit }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: clip.id, data: { clip } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none' // Prevent scroll on mobile/touch while dragging
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-clip-id={clip.id}>
            <ClipCard clip={clip} onEdit={onEdit} />
        </div>
    );
};
