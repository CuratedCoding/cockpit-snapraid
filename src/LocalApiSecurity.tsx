/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * The SnapRAID-Daemon API has no credentials of its own. Cockpit controls
 * access to requests made through this page, while the Debian package's
 * nftables service prevents ordinary local processes from bypassing Cockpit.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Checkbox } from "@patternfly/react-core/dist/esm/components/Checkbox/index.js";
import {
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
} from "@patternfly/react-core/dist/esm/components/DescriptionList/index.js";

import cockpit from 'cockpit';

const _ = cockpit.gettext;

const STATE_DIRECTORY = "/var/lib/cockpit-snapraid";
const ACKNOWLEDGEMENT_FILE = `${STATE_DIRECTORY}/local-api-warning-acknowledged`;

type ListenerScope = 'loopback' | 'network' | 'not-running' | 'unknown';

type SecurityState = {
    loading: boolean;
    guardActive: boolean;
    acknowledged: boolean;
    listener: ListenerScope;
};

const initialState: SecurityState = {
    loading: true,
    guardActive: false,
    acknowledged: false,
    listener: 'unknown',
};

const messageFromError = (error: unknown): string => {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    return _("Unknown error");
};

const isLoopbackListener = (address: string): boolean => (
    address === "127.0.0.1:7627" ||
    address === "[::1]:7627" ||
    address === "::1:7627"
);

const getListenerScope = async (): Promise<ListenerScope> => {
    try {
        const output = await cockpit.spawn(
            ["/usr/bin/ss", "-Hlnpt", "sport = :7627"],
            { superuser: "require", err: "ignore" }
        );
        const addresses = output.trim().split('\n')
                .filter(line => line.length > 0)
                .map(line => line.trim().split(/\s+/)[3]);

        if (addresses.length === 0)
            return 'not-running';
        if (addresses.some(address => address === undefined))
            return 'unknown';
        return addresses.every(address => isLoopbackListener(address ?? "")) ? 'loopback' : 'network';
    } catch {
        return 'unknown';
    }
};

const isGuardActive = async (): Promise<boolean> => {
    try {
        await cockpit.spawn(
            ["/usr/sbin/nft", "list", "table", "inet", "cockpit_snapraid"],
            { superuser: "require", err: "ignore" }
        );
        return true;
    } catch {
        return false;
    }
};

const isAcknowledged = async (): Promise<boolean> => {
    const file = cockpit.file(ACKNOWLEDGEMENT_FILE, { superuser: "require" });
    try {
        // cockpit.file().read() resolves with null, rather than rejecting,
        // when this optional marker does not exist.
        const content = await file.read() as string | null;
        return content !== null;
    } catch {
        return false;
    } finally {
        file.close();
    }
};

const readSecurityState = async (): Promise<Omit<SecurityState, 'loading'>> => {
    const [guardActive, acknowledged, listener] = await Promise.all([
        isGuardActive(),
        isAcknowledged(),
        getListenerScope(),
    ]);
    return { guardActive, acknowledged, listener };
};

const listenerLabel = (listener: ListenerScope): string => {
    switch (listener) {
    case 'loopback':
        return _("Loopback only");
    case 'network':
        return _("Network listener detected");
    case 'not-running':
        return _("Daemon is not listening");
    case 'unknown':
        return _("Could not verify");
    }
};

export const useLocalApiSecurity = () => {
    const [state, setState] = useState<SecurityState>(initialState);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionPending, setActionPending] = useState(false);

    const refresh = useCallback(async () => {
        setState(previous => ({ ...previous, loading: true }));
        const next = await readSecurityState();
        setState({ ...next, loading: false });
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const acknowledge = async () => {
        setActionError(null);
        setActionPending(true);
        try {
            await cockpit.spawn(
                ["/usr/bin/install", "-d", "-m", "0700", STATE_DIRECTORY],
                { superuser: "require", err: "message" }
            );
            await cockpit.spawn(
                ["/usr/bin/install", "-m", "0600", "/dev/null", ACKNOWLEDGEMENT_FILE],
                { superuser: "require", err: "message" }
            );
            const file = cockpit.file(ACKNOWLEDGEMENT_FILE, { superuser: "require" });
            try {
                await file.replace("acknowledged\n");
            } finally {
                file.close();
            }
            await refresh();
        } catch (error) {
            setActionError(messageFromError(error));
        } finally {
            setActionPending(false);
        }
    };

    const restoreWarning = async () => {
        setActionError(null);
        setActionPending(true);
        try {
            const file = cockpit.file(ACKNOWLEDGEMENT_FILE, { superuser: "require" });
            try {
                await file.replace(null);
            } finally {
                file.close();
            }
            await refresh();
        } catch (error) {
            setActionError(messageFromError(error));
        } finally {
            setActionPending(false);
        }
    };

    return { ...state, acknowledge, actionError, actionPending, restoreWarning };
};

export type LocalApiSecurity = ReturnType<typeof useLocalApiSecurity>;

export const LocalApiSecurityNotice = ({ security }: { security: LocalApiSecurity }) => {
    const missingGuard = !security.loading && !security.guardActive && !security.acknowledged;
    const networkListener = !security.loading && security.listener === 'network';
    const unknownListener = !security.loading && security.guardActive && security.listener === 'unknown';

    if (!missingGuard && !networkListener && !unknownListener)
        return null;

    const title = networkListener
        ? _("SnapRAID-Daemon is reachable on the network")
        : unknownListener
            ? _("Could not verify SnapRAID-Daemon's listener")
            : _("Local SnapRAID-Daemon API protection is not active");

    return (
        <Alert variant="warning" isInline title={ title } className="snapraid-mb-md">
            { networkListener &&
                <p>{ _("The root-only local firewall rule does not protect a network listener. Bind snapraidd to 127.0.0.1:7627 or ::1:7627 before using this page.") }</p> }
            { unknownListener &&
                <p>{ _("The root-only local firewall rule is present, but Cockpit could not verify that snapraidd is bound only to loopback. Confirm its net_port setting before using this page.") }</p> }
            { missingGuard &&
                <>
                    <p>{ _("SnapRAID-Daemon accepts requests without its own credentials. Other local accounts may be able to bypass Cockpit and call its API until the package firewall guard is enabled.") }</p>
                    <Checkbox
                        id="snapraid-local-api-warning-acknowledgement"
                        label={ _("I understand the local API risk; do not show this warning again") }
                        isChecked={ false }
                        isDisabled={ security.actionPending }
                        onChange={ (_event, checked) => {
                            if (checked)
                                security.acknowledge();
                        } }
                    />
                </> }
            { security.actionError &&
                <p>{ security.actionError }</p> }
        </Alert>
    );
};

export const LocalApiSecurityCard = ({ security }: { security: LocalApiSecurity }) => {
    return (
        <Card>
            <CardTitle>{_("Local API access")}</CardTitle>
            <CardBody>
                <DescriptionList isCompact isHorizontal horizontalTermWidthModifier={ { default: '11em' } }>
                    <DescriptionListGroup>
                        <DescriptionListTerm>{_("Root-only firewall")}</DescriptionListTerm>
                        <DescriptionListDescription>
                            { security.loading ? _("Checking…") : security.guardActive ? _("Enabled") : _("Not detected") }
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>{_("Daemon listener")}</DescriptionListTerm>
                        <DescriptionListDescription>{ listenerLabel(security.listener) }</DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
                { security.acknowledged &&
                    <Button
                        variant="link"
                        isLoading={ security.actionPending }
                        onClick={ () => security.restoreWarning() }
                    >
                        {_("Show local API warning again")}
                    </Button> }
                { security.actionError &&
                    <Alert variant="danger" isInline title={ _("Security setting failed") } className="snapraid-mt-sm">
                        { security.actionError }
                    </Alert> }
            </CardBody>
        </Card>
    );
};
