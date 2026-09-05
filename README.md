# SnapRAID Cockpit Plugin: CuratedCoding fork

This project starts with the thoughtful work of [sloraris](https://github.com/sloraris),
who made SnapRAID-Daemon's capabilities available as a native Cockpit page instead
of an unauthenticated web dashboard. That is a strong foundation for people who
want to understand and manage a SnapRAID array without turning routine storage
administration into a programming exercise.

CuratedCoding is building on that foundation with carefully scoped safeguards for
systems where the array matters. The fork keeps the original interface and daemon,
then adds Cockpit administrator authorization, protection for the daemon's local
API, clearer operational warnings, and a supported SnapRAID version boundary. It
does not change how SnapRAID protects data, and it is not a replacement for a
backup plan.

> [!NOTE]
> **Authorship and scope:** Everything from this introduction through **Project
> status** is CuratedCoding documentation about this fork. The section marked
> **Original upstream README material** is reproduced from the upstream project
> for reference; CuratedCoding does not claim authorship of it.
>
> All CuratedCoding coding work in this branch was performed by OpenAI Codex CLI
> GPT-5.6 and curated and reviewed by the repository maintainer.

## What this fork adds

- **Administrator-gated access**: the page asks Cockpit for privileged access
  before it reads from or sends commands to SnapRAID-Daemon. A regular Cockpit
  account cannot use the page to operate an array.
- **Protection from ordinary local accounts**: the Debian package installs a
  root-only `nftables` rule around SnapRAID-Daemon's loopback API. Cockpit's
  authorized privileged bridge can reach the daemon; unprivileged local processes
  cannot bypass Cockpit and call that API directly.
- **More deliberate operations**: maintenance, standalone sync, and recovery
  flows explain their consequences before they queue work. Array refresh remains
  a separate, non-maintenance command.
- **A defined compatibility floor**: commands are disabled when the detected
  SnapRAID engine is older than 14.1, because the supported daemon protocol does
  not work reliably with SnapRAID 12.x.

## CuratedCoding requirements

This fork requires SnapRAID 14.1 or newer and a locally running
SnapRAID-Daemon. For the local API protection to apply, the daemon must be bound
to loopback and the Debian package must be installed on a systemd system with
`nftables`. The exact network configuration and security boundaries are in
[SECURITY.md](docs/SECURITY.md).

## Security and support boundaries

These protections are useful boundaries, not magic. Keep SnapRAID-Daemon bound
to `127.0.0.1` or `::1`; do not expose its API to a LAN, reverse proxy, or the
internet. A process that already has root access can act as root and is outside
the local API guard's scope. Direct use of the `snapraid` command, SnapRAID's
configuration, MergerFS, disks, parity, and backups remain the administrator's
responsibility.

Read [our security model](docs/SECURITY.md) for the precise boundary and
[CuratedCoding's project notes](docs/CURATEDCODING.md) for design choices,
validation, tradeoffs, and the relationship with upstream.

## Project status

The CuratedCoding changes currently live on the
[`curated/security-hardening`](https://github.com/CuratedCoding/cockpit-snapraid/tree/curated/security-hardening) branch and
are under maintainer review. They have not been proposed to upstream and
CuratedCoding has not published a release. Treat a branch build as review or
testing material, not as a broadly supported distribution package.

## Install this CuratedCoding branch

This fork has not published a release yet. The steps below are for an
administrator who deliberately wants to build the current evaluation branch on
a Debian or Ubuntu system. A future CuratedCoding release will provide a
versioned package, checksum, and shorter installation steps.

Before continuing, install and configure these separately:

- Cockpit, including `cockpit-bridge`
- SnapRAID 14.1 or newer
- SnapRAID-Daemon, running only on loopback at port 7627

Confirm the engine version and daemon status before building the extension:

```bash
snapraid --version
systemctl status snapraidd --no-pager
```

The SnapRAID version must be 14.1 or newer, and the `snapraidd` service should
be active. This extension does not install or configure SnapRAID, the daemon,
MergerFS, disks, parity, shares, or backups.

Install the build tools, download this branch, build the Debian package, and
install it:

```bash
sudo apt update
sudo apt install --yes git gettext nodejs npm make
git clone --branch curated/security-hardening --single-branch https://github.com/CuratedCoding/cockpit-snapraid.git
cd cockpit-snapraid
make deb
sudo apt install ./cockpit-snapraid_*.deb
```

The package installs `nftables` if needed and enables
`cockpit-snapraid-api-guard.service`. Confirm that the protection is loaded:

```bash
sudo systemctl status cockpit-snapraid-api-guard.service --no-pager
```

It should report `active (exited)`. Sign in to Cockpit as an administrator,
reload the browser page, and open **SnapRAID** from Cockpit's menu. The Settings
tab reports whether the local API guard and loopback-only daemon listener are
detected.

> [!CAUTION]
> Building a branch gives you its current development state, not a supported
> release. Read the change history, make backups, and do not run a state-changing
> SnapRAID operation until you have reviewed the array's differences and status.

## Original upstream README material

The material below was written by sloraris and copied from the upstream `main`
branch at the fork's starting point. It is included so the original project
description, feature list, screenshots, installation instructions, and
development notes remain available alongside CuratedCoding's fork notes above.

> [!WARNING]
> This plugin is primarily developed as a personal project. It is currently in beta (as beta as my homelab prod gets, that is). Use at your own risk.
> [!INFO]AI Disclaimer
> This project is co-authored by Claude. Code is manually reviewed and functionally checked by me.

A native [Cockpit](https://cockpit-project.org/) page for [snapraid-daemon](https://github.com/amadvance/snapraid-daemon).

`snapraid-daemon`'s built-in web UI has no authentication and no TLS, so it's
not safe to expose on the network as-is. This plugin talks to the daemon's
REST API over `127.0.0.1` through `cockpit-bridge` instead, so it inherits
Cockpit's TLS, auth, and session handling for free, and looks like a native
part of Cockpit rather than an embedded third-party dashboard.

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
- Cockpit (`cockpit-bridge` ≥ 137)

## Install

Grab the latest `.deb` from [Releases](https://github.com/sloraris/cockpit-snapraid/releases/latest)
and install it:

```
sudo apt install ./cockpit-snapraid_*_all.deb
```

Reload Cockpit in your browser afterward. A new `.deb` is published automatically
whenever a change lands on `main`.

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
