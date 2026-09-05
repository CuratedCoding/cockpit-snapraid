# Security model for the CuratedCoding fork

This fork builds on the good work of sloraris, whose Cockpit page keeps the
SnapRAID-Daemon dashboard out of the browser's network-facing path. CuratedCoding
adds a second layer for a practical concern: a service that listens only on the
same machine still needs protection from other accounts and programs on that
machine.

The goal is straightforward. An administrator should use Cockpit to manage the
array, and an ordinary local process should not be able to skip Cockpit and send
commands directly to SnapRAID-Daemon. This document describes exactly how far
that protection goes and where it stops.

> [!NOTE]
> **CuratedCoding document:** This document is written and maintained by
> CuratedCoding. It describes protections added by this fork and does not claim
> they are part of the upstream project, SnapRAID, or SnapRAID-Daemon.

## The security boundary

SnapRAID-Daemon exposes an HTTP API on port 7627. The API does not have its own
username, password, token, or TLS layer. Its safety depends on keeping it local
and controlling which local processes may connect.

The intended path is:

1. An administrator signs in to Cockpit.
2. Cockpit authorizes a privileged request for this page.
3. Cockpit's privileged bridge connects to SnapRAID-Daemon on loopback.
4. SnapRAID-Daemon runs or reports the requested SnapRAID operation.

The extension requests Cockpit's `superuser: "require"` mode for its daemon API
client. A user who cannot obtain administrative access cannot use the extension
to read or operate the array.

## Network exposure

SnapRAID-Daemon must listen only on loopback. The recommended settings are:

```ini
net_enabled = 1
net_port = 127.0.0.1:7627
net_acl = +127.0.0.1
net_allowed_origin = none
net_config_full_access = 0
```

Use `::1:7627` when IPv6 loopback is preferred. Do not bind this API to a LAN
address, publish it through a reverse proxy, or expose it to the internet. The
package guard described below intentionally does not protect a network listener;
the extension warns when it detects one.

## Local API guard

On Debian systemd hosts, this package installs and enables
`cockpit-snapraid-api-guard.service`. The service creates an `nftables` rule
that rejects outgoing TCP connections to `127.0.0.1:7627` and `::1:7627` unless
the connecting process has UID 0, which is root.

This allows Cockpit's authorized privileged bridge to reach the daemon while
preventing an ordinary local account from calling the daemon API directly. The
extension checks for the rule and displays a warning if it is absent. An
administrator can acknowledge that warning, which hides the notice but does not
turn the guard back on or make the system safer.

The guard requires `nftables` and systemd. If your distribution or operating
model does not provide those pieces, the extension remains usable but shows the
warning unless it is acknowledged. That is an intentionally visible tradeoff,
not a claim of equivalent protection.

## What this does not protect

- **Root-level compromise**: root can connect to the daemon, alter firewall
  rules, change the daemon configuration, or run `snapraid` directly. This is
  expected because root is the operating system's administrative authority.
- **A network listener**: the guard covers only loopback destinations. Correct
  `snapraidd.conf` network settings are still required.
- **Cockpit compromise or a permitted administrator**: Cockpit authorization
  protects against unprivileged access, not against an administrator acting
  through Cockpit.
- **Data-management decisions**: a valid SnapRAID sync, scrub, recovery, or
  configuration change can still be the wrong decision. Review differences,
  parity status, and backups before running state-changing operations.
- **Other storage layers**: the guard does not configure or protect MergerFS,
  filesystems, disks, shares, parity layout, or backup copies.

## Operational safeguards

The UI uses confirmation and warning states around operations that deserve an
extra decision: full maintenance, a standalone sync that bypasses configured
thresholds, and recovery actions. It also shows the current local API protection
state in Settings. These controls slow down accidental commands; they are not a
substitute for understanding the operation being requested.

Commands are disabled when the reported SnapRAID version is older than 14.1.
That boundary follows the supported command and log protocol expected by the
current SnapRAID-Daemon Debian package.

## Reporting a security concern

Please do not include array layouts, host addresses, logs with personal paths,
or proof-of-concept exploit details in a public issue. Use GitHub private
vulnerability reporting when it is enabled for this repository. If that option
is not available, open a minimal issue requesting a private reporting channel;
the maintainer will provide one before technical details are shared.

## Related documents

- [CuratedCoding project notes](CURATEDCODING.md)
- [README and installation notes](../README.md)
