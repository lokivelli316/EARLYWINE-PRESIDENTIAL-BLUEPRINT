# RC3 additive integration staging

This directory is intentionally additive. The live root `index.html` is left untouched.

- RC3 is staged under `rc3-overlay/` on branch `rc3-additive-integration`.
- The current public landing page remains on `main` unchanged.
- The RC3 overlay is preserved as a separate inspectable lane before any production merge.
- Gate Closing, Voting Rights, restored Explorer navigation, assigned hero/profile imagery, and the interactive spreadsheet-derived additions stay separate rather than being flattened.
- The exact RC3 ZIP artifact remains the byte-for-byte release source; repository transport may use browser-safe payload packaging where needed for large embedded media.

Merge rule: **preserve → reconcile → connect → audit → QA → merge. Never flatten.**
