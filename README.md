# SnapRAID Cockpit Plugin

> [!WARNING]
> This Cockpit Extension was Co-Authored by Claude Code and Codex. It has been tested in VM and is in use on my own system. Please perform your own review. Use at your own risk.

The initial SnapRAID Cockpit extension was the work of Sloraris, who is no
longer using Cockpit or maintaining the source repository. You can find it at
[Sloraris' SnapRAID Cockpit](https://github.com/sloraris/cockpit-snapraid).
Much thanks and gratitude is owed to Sloraris for their excellent work.

A native [Cockpit](https://cockpit-project.org/) page for [snapraid-daemon](https://github.com/amadvance/snapraid-daemon).

`snapraid-daemon`'s built-in web UI has no authentication and no TLS, so it's
not safe to expose on the network as-is. This plugin talks to the daemon's
REST API over `127.0.0.1` through `cockpit-bridge` instead, so it inherits
Cockpit's TLS, auth, and session handling for free, and looks like a native
part of Cockpit rather than an embedded third-party dashboard.

## CuratedCoding Role-Aware Edition

This fork is independently maintained and tested by CuratedCoding. It
preserves the original Cockpit SnapRAID dashboard while adding Cockpit-native
access levels for systems shared by more than one administrator.

Limited Cockpit sessions can view array status, disks, tasks, differences,
recovery history, and settings. Actions that change the array or its
configuration remain unavailable until the user enables Cockpit
**Administrative Access**. Every such request is also enforced through
Cockpit's privileged channel; unlocking a button is not the security boundary.

This is the standard CuratedCoding edition. It relies on Cockpit's normal
authentication and authorization model, which makes it suitable when
read-only dashboard access is useful.

For systems that must prevent other local Linux accounts from connecting
directly to SnapRAID-Daemon, use the separate
`curated/security-hardening` branch. That edition adds a root-only local
firewall guard, which intentionally prevents non-admin dashboard reads.

The original project and dashboard design are credited to Sloraris.
CuratedCoding changes are independently developed, reviewed, and tested.
Development includes AI-assisted work by OpenAI Codex GPT-5.6, curated by
CuratedCoding, the repository maintainer.

## Features

- **Dashboard** — array health, disk role counts, sync/scrub/diff timestamps, maintenance controls (diff/sync/scrub, with live progress)
- **Disks** — per-disk cards with storage usage and per-device SMART detail: temperature (with a 24h graph), power-on hours, failure probability, full SMART attribute list
- **Tasks** — queue/active/history of daemon-run commands, with expandable per-task logs
- **Differences** — files changed since the last sync, with per-file undelete
- **Recovery** — undelete by glob pattern, heal silent data errors, recovery history
- **Settings** — edit daemon configuration (schedule, thresholds, notifications, hooks), with field-only saves that preserve selections while the daemon confirms them

### Settings saves

This edition sends only the settings you changed, rather than echoing the
daemon's read-only status data back to it. Schedules such as `00:00`, numeric
zero values such as disabling scheduled scrub, and notification-level choices
save reliably. Cockpit keeps a successfully selected value visible while the
daemon confirms the change.

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

Grab the latest `.deb` from [CuratedCoding Releases](https://github.com/CuratedCoding/cockpit-snapraid/releases/latest)
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
