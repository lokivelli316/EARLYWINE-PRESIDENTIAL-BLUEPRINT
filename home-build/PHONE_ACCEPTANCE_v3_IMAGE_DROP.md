# Phone acceptance v3 — image drop

Committed 2026-09-01 to `lokivelli316/EARLYWINE-PRESIDENTIAL-BLUEPRINT` on `main`.

This is an acceptance preview. It is **not** a promotion of live `index.html`.

## Page

- `EARLYWINE_HOME_PHONE_ACCEPTANCE_v3.html` at repo root
- Embedded `data:image/jpeg;base64` payloads were stripped so GitHub would accept the commit.
- Image `src` paths now point at `home-build/assets/`.

## Upload these four JPEGs

Use GitHub web upload into `home-build/assets/` (do not replace the existing `.webp` placeholders unless you intend to):

| File | Bytes | SHA-256 |
|---|---:|---|
| `home-build/assets/upper-rally-hero.jpg` | 572035 | `5ffd176c7eda8d538f14a7d06ebafa4b678e4ac165d49fd3180797dd98cdac23` |
| `home-build/assets/weld-banner.jpg` | 339440 | `49f3df527e8c3a8f480aac80dbd740a461c8b476537c00deeadbe9f460c0eb34` |
| `home-build/assets/candidate-profile.jpg` | 331784 | `efcf261c03fd9ed653aa5c03a06ced95e5184ad2819aae741d6bec191585f0ce` |
| `home-build/assets/trademark-emblem.jpg` | 749139 | `79b6758e6a83a8f815c17c8def8e85f588ffadaf7818250334f87083c1693b1a` |

Direct upload folder:

https://github.com/lokivelli316/EARLYWINE-PRESIDENTIAL-BLUEPRINT/upload/main/home-build/assets

After the four files land, the acceptance page should render the rally hero, weld banner, candidate profile, and trademark emblem without another HTML commit.

## Preserved on purpose

- Live front door: `index.html`
- Existing home freeze: `home-build/HOME_TAB_STATUS.md` and `home-build/home-preview.html`
- Existing placeholders: `home-build/assets/candidate-profile.webp`, `home-build/assets/forge-council-hero.webp`
