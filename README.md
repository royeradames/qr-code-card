# QR Code Card

The [Frontend Mentor QR code component](https://www.frontendmentor.io/challenges/qr-code-component-iux_sIO_H), built with Next.js 16.3.6, React 19.2.8, TypeScript 5.9.3 and Tailwind 4.2.1 on Node 24.

Live: https://qr-code-card.royeradames.com/

- The card follows the 1440 and 375 design frames: a 320 px card, 288 px QR image, 22 px heading and the design's colours. The official designs are in `reference/design/`.
- Body text is 16 px instead of the design's 15 px, to keep the family text floor.
- Scanning the QR code opens Frontend Mentor; the same destination is a text link in the card copy, so the card works without a second device.
- `og:site_name` and WebSite JSON-LD name the site "QR Code Card"; a 1200 x 630 Open Graph image is generated at build time.

## Development

```bash
npm ci
npm run lint && npm run typecheck && npm run build
npm test   # Playwright: design frames, 320-1600 px sweep, keyboard, no-JS
```
