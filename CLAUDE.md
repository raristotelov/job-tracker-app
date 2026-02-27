# CLAUDE.md (Project)

## Troubleshooting

- **Turbopack panic / infinite refresh**: Clear the Next.js cache with `rm -rf .next` and restart `npm run dev`. If it persists, use `npm run dev -- --no-turbopack` to fall back to Webpack.
