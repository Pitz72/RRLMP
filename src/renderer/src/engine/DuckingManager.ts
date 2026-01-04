import AudioContextManager from './AudioContextManager';

export class DuckingManager {
    private static instance: DuckingManager;
    private musicAttenuated: boolean = false;

    private constructor() { }

    public static getInstance(): DuckingManager {
        if (!DuckingManager.instance) {
            DuckingManager.instance = new DuckingManager();
        }
        return DuckingManager.instance;
    }

    /**
     * Chiamato quando una clip prioritaria (Voice, Asset) inizia o finisce.
     * @param activePrioritySources Numero di clip prioritarie attualmente in play
     */
    public updateDucking(activePrioritySources: number) {
        const mgr = AudioContextManager.getInstance();
        const musicBus = mgr.getMusicBus();
        const now = mgr.getContext().currentTime;

        if (activePrioritySources > 0) {
            // DUCK: Se c'è almeno una voce attiva, abbassa la musica
            if (!this.musicAttenuated) {
                // Ramp to 0.2 (-14dB approx) over 0.5s
                musicBus.gain.setTargetAtTime(0.2, now, 0.1); // Time constant 0.1 reaches target fast but smooth
                this.musicAttenuated = true;
                // console.log("Ducking ON");
            }
        } else {
            // RELEASE: Nessuna voce attiva, ripristina musica
            if (this.musicAttenuated) {
                // Ramp back to 1.0 over 1.0s (slower release)
                musicBus.gain.setTargetAtTime(1.0, now, 0.2);
                this.musicAttenuated = false;
                // console.log("Ducking OFF");
            }
        }
    }
}
