# Google Maps Scraper — Prospecting Interface

A web interface for searching businesses on Google Maps and turning the results into prospecting lists:
who has a phone number, who has WhatsApp, who has their own website and who only has Instagram.

Everything runs **on your own computer**, via Docker, at `http://localhost:8080`.

The interface itself is in Brazilian Portuguese; UI labels below are quoted as they appear, with an English translation.

![Map results with prospecting filters](assets/screenshots/03-resultados-filtros.jpg)

## Screens

**Suggestions as you type.** In "Onde?" (Where?), neighborhoods and cities with similar names, with Brazil first
and places near the map at the top. In "O que" (What), business types and your previous searches.

| Onde? (Where?) | O que você procura? (What are you looking for?) |
|---|---|
| ![Place suggestions while typing "aguas"](assets/screenshots/01-busca-sugestoes.jpg) | ![Business type suggestions while typing "clin"](assets/screenshots/02-sugestoes-o-que.jpg) |

**"Sem site próprio" (No own website) filter.** Businesses whose Google link is only Instagram, Linktree,
free Wix and so on are highlighted in yellow and counted as having no website, along with those that have no link at all.

![List filtered to businesses without their own website](assets/screenshots/04-sem-site-proprio.jpg)

**Favorite searches.** Mark a search with ☆ and run it again with ▶ to find new businesses.

![Favorite searches block](assets/screenshots/05-favoritas.jpg)

**Dashboard.** Summary, filters, table and map side by side, with export to Excel and Google Sheets.

![Dashboard mode with summary, filters and table](assets/screenshots/06-painel.jpg)

## Credits

This project does **not** implement the data collection. It is built on top of:

- **[gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper)**, by Georgios Komninos
  (MIT license): the engine that scrapes Google Maps and exposes the REST API used by the interface.
- **Google Maps Scraper Kit**, by Mahan ([mahanjafari-dev](https://github.com/mahanjafari-dev))
  (MIT license): the Docker/nginx setup, the scripts and the first version of the interface
  (Map and Dashboard modes), obtained from [vzbaggio/google-maps-scraper-kit](https://github.com/vzbaggio/google-maps-scraper-kit).

The original license notices are preserved in [LICENSE](LICENSE) and [CREDITS.md](CREDITS.md).
If this project is useful to you, leave a ⭐ on [gosom's repository](https://github.com/gosom/google-maps-scraper).

## What this version adds to the interface

**Search**
- **Suggestions as you type** in the "O que você procura?" (What are you looking for?) field: your previous searches
  and a list of ~200 business types in Portuguese, accent-insensitive (`acai` matches "açaiteria").
- **Place suggestions** in the "Onde?" (Where?) field (via [Photon](https://photon.komoot.io), OpenStreetMap):
  neighborhoods and cities with similar names, Brazil first and places near the map at the top
  (`aguas` → Águas Claras, DF). Navigate with ↑ ↓, Enter and Esc.
- **Favorite searches**: mark a search with ☆ and run it again with ▶ to find new businesses.

**Results** (Map and Dashboard tabs)
- **Own website vs. social media**: links to Instagram, Facebook, Linktree, iFood, free Wix,
  free Google sites and so on count as **no own website**, are highlighted in yellow
  and are exported in the "Tipo de site" (Website type) column.
- **Prospecting filters**: website (own / no own website / social media only), minimum rating,
  has WhatsApp and has phone.
- **More accurate de-duplication**: the same business is recognized by its Maps link, Google ID,
  phone number or name + address, which is common in searches with several terms.

## How to run

Prerequisite: [Docker Desktop](https://www.docker.com/products/docker-desktop) running.

```bash
docker compose up -d
```

Then open **http://localhost:8080**. To stop:

```bash
docker compose stop
```

The full walkthrough (command-line scripts, troubleshooting, using it with Claude Code)
is in [SETUP.md](SETUP.md).

## Structure

| Path | What it is |
|---|---|
| `frontend/` | The interface: `index.html` + `app.js` (Map mode) and `painel.html` + `painel.js` (Dashboard mode) |
| `docker-compose.yml`, `nginx.conf` | Starts the scraper and the nginx server that serves the interface at `localhost:8080` |
| `scripts/` | `scrape.py` / `scrape.sh` for searching from the command line |
| `.claude/` | Skill and commands for Claude Code to operate the scraper |

## Responsible use

- Use it in moderation: many searches in a row, large quantities or scheduled searches **without proxies**
  can get your **IP temporarily blocked** by Google. One search at a time is the safest.
- Scraping data from Google Maps goes against Google's Terms of Service.
- Business phone numbers and emails are often personal data: follow the **LGPD** (Brazil's data protection law)
  when using and storing these contacts.
- The scraper API has no authentication and is bound to `127.0.0.1`. Do not expose it to the internet.

## License

MIT. See [LICENSE](LICENSE) (kit) and [CREDITS.md](CREDITS.md) (scraping engine, gosom).
