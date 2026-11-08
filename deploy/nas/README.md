# Test server on the NAS

A develop build served by nginx in a container on a Synology NAS. `npm run deploy:nas` builds the working tree on this computer and copies it over SSH, so nothing has to be pushed first.

## On the NAS, once

1. Control Panel → Terminal & SNMP: enable SSH.
2. Control Panel → File Services → rsync: enable the rsync service.
3. Control Panel → User & Group → Advanced: enable the user home service, so an SSH key can be kept there.
4. Install Container Manager, then create the folder `/volume1/docker/sudoku` in File Station.

## On this computer, once

Copy your SSH key over with `ssh-copy-id <user>@<NAS address>`, then create `.env.nas.local` (git ignores it):

```bash
NAS_HOST=<user>@<NAS address>
NAS_DIR=/volume1/docker/sudoku
# NAS_PORT=22
NAS_TUNNEL_TOKEN=<the tunnel's token, from Cloudflare; see below>
```

## Deploying

```bash
npm run deploy:nas                  # tests, build, copy
npm run deploy:nas -- --skip-tests  # build, copy
```

After the first deploy, create a project in Container Manager from `/volume1/docker/sudoku`, which holds `compose.yaml`. It serves the site on port 8088. Later deploys only replace the files, so the container needs no restart.

## HTTPS through a Cloudflare Tunnel

Over plain HTTP on a LAN address the pages open but New Game does nothing, because `crypto.randomUUID()` exists only in a secure context, and there is no service worker. So the site is served at https://sudoku-test.blazer030.dev through a Cloudflare Tunnel: the `tunnel` container in `compose.yaml` dials out to Cloudflare, which holds the certificate, so no port is opened on the router, and it works away from home too. The service worker registers there, so the PWA's offline and update behaviour can be tested.

The address is public but unlisted. nginx sends `X-Robots-Tag: noindex, nofollow`, so search engines leave it out.

To set it up, once:

1. Cloudflare dashboard → Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared. Name it `sudoku-test`. Under "Install and run a connector", copy the token: it is the long string after `--token`.
2. Put it in `.env.nas.local` as `NAS_TUNNEL_TOKEN`, then `npm run deploy:nas -- --skip-tests`. The deploy writes it to `.env` beside `compose.yaml` on the NAS, readable by your user only.
3. In Container Manager, open the `sudoku` project → Action → Build, so it picks up the new container.
4. Back in the tunnel, Public Hostname → Add: subdomain `sudoku-test`, domain `blazer030.dev`, service `HTTP` `sudoku-test:80`. That is the nginx container by its compose name; Cloudflare adds the DNS record itself.

A changed `nginx.conf` or `compose.yaml` takes effect after the project is restarted (nginx.conf) or built again (compose.yaml): the deploy replaces the files, and the container keeps the one it started with.

The old address on port 8088 still works on the LAN, without HTTPS; its progress and saved games are its own.
