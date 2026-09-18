# Source recovery record

The upload transport corrupted one compressed byte, causing a gzip CRC error. The byte was repaired by comparison with the original user-uploaded ZIP, not by bypassing archive validation. All 76 source-file SHA256 hashes matched the original ZIP before any files were restored.

Original ZIP SHA256: e6c3ff18225698a56deb88e056d445754b6af5e1d854db6e058b683443b35e29

Corrected gzip SHA256: 4f62672599126f8bbc2a717395413eb086a9ff1a58ed7ada72efd38dab388c50

Original source manifest SHA256: 3b92613c13b27c0a236941fb55a6a61837c9f54cea70f13a709fb0b7882df24d

The existing GitHub commit history is retained without force-push. The earlier local development commits remain in civiclens-ai-history.bundle inside the original user ZIP; those commits have not been imported into this repository graph. No recreated commits are presented as originals.

The source manifest describes the recovered baseline. Subsequent bug fixes are normal Git commits and are intentionally separate from that baseline.
