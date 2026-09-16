import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createSupabaseStore } from '../supabase-store.mjs';

if (!process.argv.includes('--confirm')) {
  console.error('This command replaces the production Supabase snapshot with a local game.json file.');
  console.error('Run again with --confirm only when you intentionally want to import local data.');
  process.exit(1);
}

const source = process.argv.find(argument => argument.endsWith('.json')) || resolve('.data', 'game.json');
const snapshot = await readFile(source, 'utf8');
const parsed = JSON.parse(snapshot);
if (parsed?.version !== 1 || !Array.isArray(parsed.users) || !Array.isArray(parsed.follows) || !Array.isArray(parsed.blocks) || !Array.isArray(parsed.messages)) {
  throw new Error('The selected file is not a Kerala Play version 1 game snapshot.');
}

const store = createSupabaseStore();
await store.save(snapshot);
console.log(`Imported ${parsed.users.length} users, ${parsed.follows.length} follows, ${parsed.blocks.length} blocks and ${parsed.messages.length} messages from ${source}.`);
