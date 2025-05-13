#!/usr/bin/env node
export declare function registerConnection(connection: {
    close: () => void;
}): void;
export declare function closeAllConnections(): void;
