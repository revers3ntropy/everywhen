import { createRequire } from 'node:module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

global.require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__filename = __filename;
global.__dirname = __dirname;
