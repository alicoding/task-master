// Symlink redirector file - do not edit directly
// This file allows imports from @/cli to be redirected to the actual CLI directory
import * as cli from '../../cli/index';
export * from '../../cli/index';
export default cli;