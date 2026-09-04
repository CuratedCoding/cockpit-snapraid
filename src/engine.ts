/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

export const MINIMUM_ENGINE_MAJOR = 14;

export function isSupportedEngineVersion(version?: string): boolean {
    if (!version)
        return false;
    const match = /^(\d+)(?:\.|$)/.exec(version);
    return !!match && Number(match[1]) >= MINIMUM_ENGINE_MAJOR;
}

export function isUnsupportedEngineVersion(version?: string): boolean {
    return !!version && !isSupportedEngineVersion(version);
}
