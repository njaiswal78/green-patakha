# Sound credits

Every recorded sound in this folder is a short clip cut from a CC0 or public-domain field recording on Wikimedia Commons. `scripts/cut-sounds.py` finds isolated bangs and makes the clips.

| Clips | Source recording | Author | License |
| --- | --- | --- | --- |
| `boom-1` to `boom-3`, `bang-1`, `bang-3`, `bang-4` | [Fire crackers - New Year 2023 - 2022-12-31T23-53-56.ogg](https://commons.wikimedia.org/wiki/File:Fire_crackers_-_New_Year_2023_-_2022-12-31T23-53-56.ogg) | Almanta | CC0 |
| (analysed, not used) | [Firecracker sounds 2022-12-31T23-13-02.ogg](https://commons.wikimedia.org/wiki/File:Firecracker_sounds_2022-12-31T23-13-02.ogg), [Firecracker sounds 2022-12-31T23-25-40.ogg](https://commons.wikimedia.org/wiki/File:Firecracker_sounds_2022-12-31T23-25-40.ogg) | Almanta | CC0 |
| `boom-4`, `bang-2`, `bang-5`, `bang-6` | [Silvester fireworks from the street 01.ogg](https://commons.wikimedia.org/wiki/File:Silvester_fireworks_from_the_street_01.ogg) | stephan | Public domain |
| `sky-1`, `sky-2` | [Fireworks piece.ogg](https://commons.wikimedia.org/wiki/File:Fireworks_piece.ogg) | stephan | Public domain |
| `sky-3`, `sky-4` | [Silvester fireworks from the street 02 cool stuff.ogg](https://commons.wikimedia.org/wiki/File:Silvester_fireworks_from_the_street_02_cool_stuff.ogg) | stephan | Public domain |

Hiss, fuse sizzle, crackle, whoosh and the low thump under big bombs are generated in the browser with the Web Audio API (`public/js/audio.js`).

To add your own recordings, drop the originals in `sound-src/` and edit the lists at the bottom of `scripts/cut-sounds.py`. Only use recordings you have the right to publish.
