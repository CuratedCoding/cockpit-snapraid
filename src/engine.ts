/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

export const MINIMUM_ENGINE_VERSION = "14.1";

const MINIMUM_ENGINE_MAJOR = 14;
const MINIMUM_ENGINE_MINOR = 1;

export function isSupportedEngineVersion(version?: string): boolean {
    if (!version)
        return false;
    const match = /^(\d+)(?:\.(\d+))?(?:\.|$)/.exec(version);
    if (!match)
        return false;

    const major = Number(match[1]);
    const minor = Number(match[2] ?? 0);
    return major > MINIMUM_ENGINE_MAJOR ||
        (major === MINIMUM_ENGINE_MAJOR && minor >= MINIMUM_ENGINE_MINOR);
}

export function isUnsupportedEngineVersion(version?: string): boolean {
    return !!version && !isSupportedEngineVersion(version);
}
