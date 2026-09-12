/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Cockpit's permission object reflects the current header-level elevation
 * state. It improves the interaction, but daemon mutations still require the
 * privileged channel in daemon.ts.
 */

import { useEffect, useState } from 'react';

import cockpit from 'cockpit';

// This helper exists in Cockpit's runtime API, but is absent from the type
// declarations bundled by the Cockpit revision pinned in this project.
type CockpitPermission = {
    allowed: boolean | null;
    addEventListener: (type: "changed", listener: () => void) => void;
    removeEventListener: (type: "changed", listener: () => void) => void;
    close: () => void;
};

type CockpitWithPermission = typeof cockpit & {
    permission: (options: { admin: boolean }) => CockpitPermission;
};

export const useCockpitAdmin = (): boolean => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const permission = (cockpit as CockpitWithPermission).permission({ admin: true });
        const update = () => setIsAdmin(permission.allowed === true);

        update();
        permission.addEventListener("changed", update);
        return () => {
            permission.removeEventListener("changed", update);
            permission.close();
        };
    }, []);

    return isAdmin;
};
