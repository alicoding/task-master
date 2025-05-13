import { ChalkColor } from '@/cli/utils/chalk-utils';

#!/usr/bin/env tsx
/**
 * Script to fix ChalkColor type errors in the codebase
 *
 * This script automatically fixes errors like:
 * "Argument of type 'string' is not assignable to parameter of type 'ChalkColor'"
 *
 * It adds type assertions to string literals used as colors in chalk and colorize functions.
 */
export {};
