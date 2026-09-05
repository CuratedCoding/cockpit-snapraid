# CuratedCoding project notes

This fork begins with sloraris's useful Cockpit interface and respects the work
already invested in making SnapRAID-Daemon understandable from a browser. The
CuratedCoding additions focus on the places where a storage administrator needs
more help: knowing who can reach the daemon, seeing a compatible engine before
commands are enabled, and receiving a clear pause before consequential work
starts.

The purpose is not to turn a personal project into a different product. It is to
make a narrow set of safety and operability improvements visible, testable, and
useful to people who manage their own systems.

> [!NOTE]
> **CuratedCoding document:** This document is written and maintained by
> CuratedCoding. It records the rationale and status of changes in this fork;
> it is not an upstream project statement or a SnapRAID-Daemon design document.

## Relationship with upstream

This is an independent fork of
[sloraris/cockpit-snapraid](https://github.com/sloraris/cockpit-snapraid), not
an official SnapRAID, SnapRAID-Daemon, Cockpit, or upstream cockpit-snapraid
release. SnapRAID-Daemon itself is not forked or modified here.

The original project remains the source of the core Cockpit interface. Where a
change is generally useful and can be reviewed independently, CuratedCoding
intends to propose it upstream as a focused pull request. Upstream maintainers
decide whether any proposal fits their project.

## Changes in this branch

### Cockpit administrator authorization

The extension's client for SnapRAID-Daemon now requires Cockpit's privileged
bridge. In plain terms, the same Cockpit administrative approval used for other
system-changing tasks is required before this page reaches the daemon. When
Cockpit refuses that approval, the page reports that administrative access is
required rather than presenting controls that cannot safely operate.

### Local API protection

The Debian package adds a small `nftables` systemd service. It allows root-owned
local processes to connect to the daemon's loopback API and rejects connections
from other local user accounts. This matters because loopback limits a service
to one machine but, by itself, does not decide which accounts on that machine
may use it.

The UI checks both the firewall guard and the daemon listener. It warns if the
guard is absent, if the listener is exposed to the network, or if the listener
cannot be verified. An acknowledgement suppresses only the missing-guard
warning and is stored root-only so ordinary users cannot hide it.

See [SECURITY.md](SECURITY.md) for the exact boundary and limitations.

### Safer operational controls

- Full maintenance presents its options before queuing a sequence.
- Standalone sync explains that it bypasses configured delete and update
  thresholds and requires explicit confirmation.
- Recovery warns that restored files need ownership and permissions reviewed.
- Refreshing array state is a separate action from maintenance, so an
  administrator can request current status without queueing sync or scrub.
- Controls are disabled while an operation is active and when the detected
  SnapRAID engine is outside the supported range.

### Defined SnapRAID compatibility

The extension requires SnapRAID 14.1 or newer. This is not an arbitrary
preference for a newer version: the current official SnapRAID-Daemon Debian
package expects a command and log protocol that is not compatible with SnapRAID
12.x. The UI makes that mismatch visible and disables operations rather than
sending uncertain requests to the daemon.

## Tradeoffs

These safeguards intentionally add requirements and visible warnings.

- A non-administrator can no longer use the page to inspect array state through
  the daemon API.
- The local API guard depends on `nftables` and systemd, so distributions without
  that combination need an equivalent local policy or an explicit warning
  acknowledgement.
- The guard trusts root. That is the normal Linux authority model, but it means
  this package cannot defend against a compromised administrator account or a
  root-level process.
- Requiring SnapRAID 14.1 or newer asks older installations to upgrade only
  after the administrator has reviewed compatibility and completed appropriate
  backup and validation steps.

## Validation approach

Changes are built as a Debian package and checked with the repository's smoke
test, ESLint, and Stylelint. The security changes are also exercised with a
disposable Debian test environment and a separately validated installation
before they are considered for a release or upstream proposal.

Validation reduces risk; it cannot prove that every hardware layout, daemon
configuration, operating system release, or recovery scenario is safe. A
release should state its tested scope and should never promise that it replaces
backups or normal SnapRAID review procedures.

## Current status and next steps

The current branch is review material. Before a formal upstream proposal, the
maintainers will review this documentation, keep the change set focused, rerun
the test suite from a clean environment, and prepare a pull request that clearly
separates broadly useful UI safeguards from the Debian-specific firewall policy.

If CuratedCoding later publishes an independent release, its release notes will
identify the exact commit, package checksum, supported scope, installation
requirements, and known limitations.

## Contributors

See [CONTRIBUTORS.md](../CONTRIBUTORS.md) for the recorded AI-assisted work and
maintainer review statement.
