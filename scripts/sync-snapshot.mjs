import fs from 'fs';
import path from 'path';

async function updateBouquetsFile() {
  const res = await fetch('https://sitesophiya.vercel.app/api/catalog');
  if (!res.ok) {
    throw new Error('Failed to fetch catalog: ' + res.status);
  }
  const bouquets = await res.json();
  if (!Array.isArray(bouquets) || bouquets.length === 0) {
    throw new Error('Invalid bouquets array from KV');
  }

  console.log(`Fetched ${bouquets.length} bouquets from KV.`);

  // Write backup first
  fs.writeFileSync(
    path.resolve(process.cwd(), 'backups/catalog_live_36_snapshot.json'),
    JSON.stringify(bouquets, null, 2),
    'utf8'
  );

  const fileContent = `import { Bouquet } from '../types/figma-app';

/**
 * Single source of truth snapshot of the salon's live bouquets.
 * Synchronized with Vercel KV database.
 * Total bouquets: ${bouquets.length}
 */
export const BOUQUETS_CATALOG: Bouquet[] = ${JSON.stringify(bouquets, null, 2)};
`;

  fs.writeFileSync(
    path.resolve(process.cwd(), 'src/data/bouquets.ts'),
    fileContent,
    'utf8'
  );

  console.log('Successfully updated src/data/bouquets.ts and saved backup!');
}

updateBouquetsFile().catch((err) => {
  console.error(err);
  process.exit(1);
});
