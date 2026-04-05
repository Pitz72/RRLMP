# CHAPTER 6: HARDWARE CONTROL AND ROUTING

A professional directing software does not live isolated in the computer. It must communicate with the studio mixer, headphones, and the director's fingers.
In this chapter, we will see how to configure the audio output and how to control the software without touching the mouse.

---

## 6.1 Audio Configuration (Routing)

By default, RLM outputs to the default Windows audio device. However, in a studio (or with advanced podcast setups like the *Rødecaster Pro*), you need to separate the flows.

### Selecting the Output
1.  Click the **Gear (Settings)** icon in the top command bar.
2.  The **General Settings** panel will open.
3.  In the "Audio Output Device" dropdown menu, you will see the list of all sound cards connected to your PC.
4.  Select the desired device (e.g., *Rødecaster Pro Stereo* or *Focusrite USB*).

### Live Switch
The change is instantaneous. If music is playing while you switch devices, the audio will "jump" to the new output without interruption.

> **Tip for Rødecaster/USB Mixers**: If your mixer has multiple USB channels (e.g., Main and Sounds/Chat), set RLM to a secondary channel (e.g., "Sounds") so you can control its volume with a dedicated fader on the physical mixer, separating it from Windows system sounds.

---

## 6.2 The Keyboard (Hotkeys)

The computer keyboard is the fastest controller you have. RLM includes preset global commands and customizable keys.

### Global Commands (F-Keys)
Function keys (F1-F5) are mapped to launch columns. They have "smart" logic: they look for the first free clip.
*   **F1**: Launches column 1 (Assets).
*   **F2**: Launches column 2 (Music).
*   **F3**: Launches column 3 (Voices).
*   **F4**: Launches column 4 (SFX).
*   **F5**: Launches column 5 (Pre-Show).
*   **ESC**: **PANIC BUTTON**. Stops everything immediately (Stop All).

### Custom Keys (Custom Binds)
Do you want to launch the intro by pressing the spacebar or the letter "Q"?
1.  Right-click on the clip -> **Edit**.
2.  Click in the **Trigger Keybind** field.
3.  Press the desired key on the keyboard.
4.  Save.
5.  A badge (e.g., **[Q]**) will appear on the card to remind you of the assignment.

> **Safety**: Keyboard commands are automatically disabled if you are typing text (e.g., renaming a clip), to avoid starting audio while typing.

---

## 6.3 MIDI Controller (Physical Power)

This is the quintessential "Pro" function. You can connect musical keyboards, pads (like *Novation Launchpad*) or fader controllers (like *Korg nanoKONTROL*) and use them to drive the software.

### Connection
1.  Connect your USB-MIDI controller to the computer **before** starting Runtime Live Machine.
2.  Start the software. The MIDI engine will automatically recognize the device.

### MIDI Learn Mode (Easy Mapping)
You don't need to know complicated codes. RLM learns by watching what you do.

1.  Click the **MIDI** icon (DIN Connector) in the top bar.
    *   The icon turns **Cyan (On)**.
    *   The clips take on a dashed appearance ("Waiting").
2.  **To map a Clip**:
    *   Click with the mouse on the desired Clip.
    *   Press the physical button/pad on your controller.
    *   A badge (e.g., **[M:60]**) will appear on the clip. Done.
3.  **To map Global Functions**:
    *   Click the red **STOP ALL** button on the screen -> Press a big button on the controller.
    *   Click the **MASTER VOL** slider on the screen -> Move a fader or knob on the controller.
4.  Click the **MIDI** icon again to exit Learn mode.

### Supported Command Types
*   **Note On/Off**: Perfect for buttons and pads (Clip Launch, Stop All).
*   **Control Change (CC)**: Perfect for faders and rotary knobs. Use it to control Master Volume in an analog and smooth way.

> **Portability**: Clip MIDI mappings are saved inside the .lmp project. If you take the project to another PC with the same controller, everything will work immediately.
