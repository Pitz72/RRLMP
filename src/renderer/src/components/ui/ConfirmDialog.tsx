import React from 'react';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AlertTriangle } from 'lucide-react';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

export const ConfirmDialog: React.FC = () => {
    const { request, respond, threeWayRequest, respondThree } = useConfirmStore();

    // v1.4.13 (ESC-01): ESC = Annulla, invece di innescare lo STOP ALL globale.
    useEscapeToClose(!!(request || threeWayRequest), () => {
        if (threeWayRequest) respondThree('cancel');
        else if (request) respond(false);
    });

    if (!request && !threeWayRequest) return null;

    // — Dialog a 3 pulsanti (es. chiusura con modifiche non salvate) —
    if (threeWayRequest) {
        return (
            <div className="ov" style={{ zIndex: 300 }}>
                <div className="ov-panel anim-in p-6 max-w-sm w-full mx-4">
                    <div className="flex items-start gap-3 mb-5">
                        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-white/90 leading-relaxed">{threeWayRequest.message}</p>
                    </div>
                    <div className="flex justify-between gap-2">
                        {/* Annulla — sinistra */}
                        <button onClick={() => respondThree('cancel')} className="btn btn-ghost">
                            {threeWayRequest.cancelLabel}
                        </button>
                        <div className="flex gap-2">
                            {/* Non Salvare — rosso */}
                            <button
                                onClick={() => respondThree('third')}
                                className="btn text-white bg-red-700 hover:bg-red-600"
                            >
                                {threeWayRequest.thirdLabel}
                            </button>
                            {/* Salva — verde, autofocus */}
                            <button onClick={() => respondThree('confirm')} className="btn btn-green" autoFocus>
                                {threeWayRequest.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // — Dialog a 2 pulsanti standard —
    return (
        <div className="ov" style={{ zIndex: 300 }}>
            <div className="ov-panel anim-in p-6 max-w-sm w-full mx-4">
                <div className="flex items-start gap-3 mb-5">
                    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-white/90 leading-relaxed">{request!.message}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={() => respond(false)} className="btn btn-ghost">
                        {request!.cancelLabel}
                    </button>
                    <button
                        onClick={() => respond(true)}
                        className="btn text-white bg-red-600 hover:bg-red-500"
                        autoFocus
                    >
                        {request!.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
