import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.RG_DATA_DIR=mkdtempSync(join(tmpdir(),'imt-smart-teens-e2e-'));process.env.PORT='4175';
await import('../server/development.mjs');
