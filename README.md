# SnapRAID Cockpit Plugin

> [!WARNING]
> This plugin is primarily developed as a personal project. It is currently in beta (as beta as my homelab prod gets, that is). Use at your own risk.
> [!INFO]AI Disclaimer
> This project is co-authored by Claude. Code is manually reviewed and functionally checked by me.

A native [Cockpit](https://cockpit-project.org/) page for [snapraid-daemon](https://github.com/amadvance/snapraid-daemon).

`snapraid-daemon`'s built-in web UI has no authentication and no TLS, so it's
not safe to expose on the network as-is. This plugin talks to the daemon's
REST API over `127.0.0.1` through a privileged `cockpit-bridge` channel. Cockpit
therefore authenticates the user and requires administrative access before the
plugin can reach the daemon. The daemon must remain bound to loopback; do not
expose its unauthenticated API directly to the LAN.

Loopback binding is not authentication against other local processes. The
Debian package installs a root-only `nftables` rule for port 7627 and enables
it on systemd hosts, so the privileged Cockpit bridge can reach the daemon but
ordinary local accounts cannot. The page warns when this rule is missing and
records an explicit, root-owned acknowledgement if an administrator chooses to
suppress that warning. The rule cannot protect a daemon bound to a LAN address:
keep the daemon bound to loopback.

## Features

- **Dashboard** — array health, disk role counts, sync/scrub/diff timestamps, maintenance controls (diff/sync/scrub, with live progress)
- **Disks** — per-disk cards with storage usage and per-device SMART detail: temperature (with a 24h graph), power-on hours, failure probability, full SMART attribute list
- **Tasks** — queue/active/history of daemon-run commands, with expandable per-task logs
- **Differences** — files changed since the last sync, with per-file undelete
- **Recovery** — undelete by glob pattern, heal silent data errors, recovery history
- **Settings** — edit daemon configuration (schedule, thresholds, notifications, hooks)

## Screenshots

### Dashboard
<img width="1871" height="1103" alt="image" src="https://github.com/user-attachments/assets/f79242c3-f78a-425e-8a07-8e1cfd4147a4" />

### Disks
<img width="1866" height="1665" alt="image" src="https://github.com/user-attachments/assets/35da1e20-fe81-4f6e-b0ca-02623e4ef2a1" />


### Tasks
<img width="1866" height="1665" alt="image" src="https://github.com/user-attachments/assets/05b08af5-375d-449f-998a-dd77f52b6ae6" />


### Differences
<img width="1866" height="1665" alt="image" src="https://github.com/user-attachments/assets/3915d5ff-0ab6-4b1a-8955-2b1a5318dd5d" />


### Recovery
<img width="1866" height="1665" alt="image" src="https://github.com/user-attachments/assets/d6e5dde6-806c-495b-9ac6-2524d470ad12" />


### Settings
<img width="1873" height="1768" alt="image" src="https://github.com/user-attachments/assets/a1d1a0c7-b54f-4846-b9a3-37868113aac5" />


## Requirements

- `snapraid-daemon` running locally with its REST API enabled, bound to
  `127.0.0.1:7627` (see `snapraidd.conf`'s `net_port` / `net_acl`) — not
  exposed on the LAN, since the plugin reaches it locally through the bridge
- SnapRAID 14.1 or newer (the official SnapRAID-Daemon Debian package requires
  this minimum; the daemon's command and log protocols are not
  compatible with SnapRAID 12.x)
- Cockpit (`cockpit-bridge` ≥ 137)

Recommended daemon network settings:

```ini
net_enabled = 1
net_port = 127.0.0.1:7627
net_acl = +127.0.0.1
net_allowed_origin = none
net_config_full_access = 0
```

## Install

Grab the latest `.deb` from [Releases](https://github.com/sloraris/cockpit-snapraid/releases/latest)
and install it:

```
sudo apt install ./cockpit-snapraid_*_all.deb
```

Reload Cockpit in your browser afterward. A new `.deb` is published automatically
whenever a change lands on `main`.

On systemd hosts, the package enables `cockpit-snapraid-api-guard.service`
immediately and at boot. Administrators who deliberately need another local
process to call the daemon can disable it with `sudo systemctl disable --now
cockpit-snapraid-api-guard.service`; Cockpit will show the local API warning
unless it is acknowledged in the page.

## Development

The rest of this section is for working on the plugin itself, not just using it.

```
sudo apt install gettext nodejs npm make   # or dnf/zypper equivalents
make                                        # build into dist/
make devel-install                          # symlink into ~/.local/share/cockpit
```

Reload the Cockpit page after rebuilding. For continuous rebuilds on save:

```
make watch
```

`npm run eslint` / `npm run eslint:fix` and `npm run stylelint` / `npm run stylelint:fix`
check and fix code style.

## License

LGPL-2.1-or-later (see [LICENSE](./LICENSE)), scaffolded from
[cockpit-project/starter-kit](https://github.com/cockpit-project/starter-kit).
