## TypeScript Error Prevention Guide

Before writing any code, review these essential TypeScript patterns:

### Critical Type Files
- Database Types: `@/db/schema`, `@/types/drizzle-orm.d`
- Core Types: `@/core/types`, `@/types/core-types.d`
- Terminal Session: `@/core/terminal/terminal-session-types`
- UI Components: `@/types/chalk-utils.d`

### Common Error Patterns & Solutions
1. **Database Access**
   - Use type assertions: `(db as any).query.*`, `(this._db as any).connection`
   - Import schemas from `schema-extensions` not directly from `schema`
   - For terminal sessions, explicitly check session properties

2. **String Literal Types**
   - Chalk colors require proper typing: `colorize(text, 'red' as ChalkColor)`
   - TimeWindow types need assertions: `type: 'manual' as TimeWindowType`
   - Status enums should use defined constants, not string literals

3. **Module Import/Export**
   - Import/export names must match exactly between modules
   - All imports should use path aliases without file extensions:
     ```typescript
     // CORRECT - Using path aliases without extensions
     import { createFunction } from '@/utils/module';
     import { DB } from '@/db/schema';
     import { Task } from '@/core/types';
     
     // CORRECT - For internal relative imports within a module
     import { helper } from './helper';
     
     // INCORRECT - Don't use .ts or .js extensions with path aliases
     import { createFunction } from '@/utils/module.ts';
     import { createFunction } from '@/utils/module.js';
     ```
   - When importing from index files, check if the export is re-exported

### Self-Check Before Submitting
1. Verify all imports use path aliases without extensions when appropriate
2. Check database access for proper type assertions
3. Ensure string literals have appropriate type assertions
4. Validate import/export names match exactly
5. Run `npm run typecheck` on your changes
6. Test with `npm run dev -- [command]`