#import "../lib/manuale-template.typ": *

= Session recording

Session recording turns Runtime Live Machine Pro from a playout tool
into a complete production tool. You don't need separate recording
software or a virtual routing chain. RLMP captures the
#strong[post-processed master mix] directly, everything that leaves the
application (including the Master Chain effects), into an audio file on
disk.

== 9.1 Starting the recording
The recording control is in the header, identified by the record icon.

#strong[Start.] Click the record button. A red indicator and a counter
show that capture is under way. Recording starts immediately: everything
that leaves the software's output from that moment on is captured.

You don't need clips playing to start recording: you can begin capture
ahead of the show's start, so you don't lose the first few seconds in
case of an early start.

#strong[What gets recorded.] The captured signal is the #strong[master
after the limiter]: it includes the mix of all playing clips and the
processing of the entire Master Chain (HPF, multiband glue, limiter). It
is exactly the signal that reaches the audio output device.

#strong[The internal format.] During capture, RLMP writes a compressed
Opus stream (in a WebM container) at 320 kbps: very light on disk and
transparent to the ear. Continuous recording has a safety limit of about
#strong[four hours]\; beyond that duration the capture stops
automatically so as not to saturate memory.

#strong[System overhead.] Capture happens downstream of the audio
engine, without burdening the Renderer. You can record sessions hours
long without worrying about resource consumption.

== 9.2 Stopping the recording and choosing the format
When you click the button again to stop the recording, the
#strong[export window] opens. This is where you choose which format to
save the file in: converting from the internal stream to the final
format is handled by FFmpeg.

=== Available formats
#figure(
  align(center)[#table(
    columns: (33.33%, 33.33%, 33.33%),
    align: (auto,auto,auto,),
    table.header([Format], [Extension], [Characteristics],),
    table.hline(),
    [#strong[WAV]], [`.wav`], [Uncompressed lossless. Maximum quality,
    large files. Ideal for archiving and post-production.],
    [#strong[FLAC]], [`.flac`], [Compressed lossless. Same quality as
    WAV, smaller size. Ideal for archiving.],
    [#strong[MP3]], [`.mp3`], [Lossy. Selectable bitrate. Ideal for
    distribution and podcasts.],
    [#strong[OGG]], [`.ogg`], [Open-source lossy. Good quality-to-size
    ratio.],
    [#strong[WEBM]], [`.webm`], [Lossy, optimized for the web. Matches
    the internal capture format.],
  )]
  , kind: table
  )

=== Quality options
For the lossless formats (WAV and FLAC) you can select the #strong[bit
depth]: 16-bit (CD standard), 24-bit (professional broadcast standard,
the default) or 32-bit float (maximum precision, if the recording will
be mastered later).

For the lossy formats (MP3, OGG, WEBM) you can select the
#strong[bitrate] among 128, 192, 256 and 320 kbps. For a podcast
intended for online distribution, 192 kbps stereo is the recommended
minimum; 256 kbps is the current standard for "transparent" quality.

=== Choosing the save location
In the export window you choose the destination folder and the file
name. If you don't specify a name, RLMP generates one based on the
session's date and time. When the conversion finishes, a confirmation
toast shows the path of the saved file.

== 9.3 Practical considerations
=== Synchronizing with the show
The recording captures all the time elapsed between Start and Stop,
including the silences. If you started capture 30 seconds before the
show's actual start, the resulting file will include those first 30
seconds. For a distribution-ready result without post-editing, start the
recording exactly when the show begins.

=== Recording and backup at the same time
The project's autosave system (see Chapter 10) and session recording
operate independently. You can record a show while the autosave silently
saves the project state: the two operations don't interfere.

=== Recommended format for different contexts
#strong[Podcast] --- MP3 256 kbps stereo or FLAC 16-bit. The first if
you distribute the file directly, the second if it will pass through an
editor.

#strong[Long-term archive] --- WAV 24-bit or FLAC 24-bit. Generous
sizes, maximum flexibility for any future remasters.

#strong[Radio / Streaming] --- check your platform's requirements. Most
accept MP3 128--192 kbps; some require uncompressed WAV. RLMP exports in
the most common formats to cover every scenario.
