# What is this?

Public-facing resources for <https://violentbot.xyz> — the landing page
itself, and the artwork the bot puts in its Discord embeds.

Served by GitHub Pages. `violentbot.xyz/dashboard*` and `/status*` are
proxied to the bot instead; everything else comes from here.

## Layout

```
index.html              the landing page — one page, no build step
assets/
  css/  site.css        the page: tokens, layout, components
        discord.css     the mock Discord client
        dashboard.css   the mock respawn dashboard
  js/   demo.js         the Discord client and its channel demos
        dashboard.js    the respawn dashboard demo
  fonts/                Noto Sans, subset to Latin (SIL OFL)
  img/                  avatar, favicon, the Tibia mark
    demo/               fixtures for the demos only
      creatures/        creature sprites
      emoji/            the bot's own custom Discord emoji
      twemoji/          Twemoji, for the unicode ones (CC-BY 4.0)
discord/                artwork the bot links to from its embeds
  avatar.png            every embed's author icon
  effects/              death-notification thumbnails
  events/               guild join/leave/swap, world transfer, name change
```

Nothing under `assets/` is fetched by the bot, and nothing under
`discord/` is used by the page. The one shared file is
`assets/img/avatar.png`, which the bot names as the `og:image` for its own
pages (`web/LinkPreview.scala`).

## Changing anything under `discord/`

Those files are linked by URL from Discord embeds, so a path change breaks
the thumbnail on every message already posted, not just future ones. The
URLs live in the bot repo:

- `src/main/resources/discord.conf` — the avatar and the event thumbnails
- `src/main/scala/com/tibiabot/presentation/DeathEffect.scala` — the effects
- `src/main/scala/com/tibiabot/setup/ChannelService.scala` — the PVP roles embed

`discord.conf` is baked into the jar, so a move needs a rebuild and a
deploy. Add the new paths first, deploy, then remove the old ones.
