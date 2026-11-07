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
```

## Deploying

```bash
npm run deploy:nas                  # tests, build, copy
npm run deploy:nas -- --skip-tests  # build, copy
```

After the first deploy, create a project in Container Manager from `/volume1/docker/sudoku`, which holds `compose.yaml`. It serves the site on port 8088. Later deploys only replace the files, so the container needs no restart.

## It needs HTTPS

Over plain HTTP on a LAN address the pages open but New Game does nothing, because `crypto.randomUUID()` exists only in a secure context, and there is no service worker.
