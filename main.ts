import { Config } from './types';

const CONFIG: Config = {
  server: 'ts1.x1.europe.travian.com',
  village: {
    x: 150,
    y: 150,
  },
  searchRadius: 50,
  types: [9, 15],
};

if (!process.env.AUTH_TOKEN) {
  console.error('No auth token provided');
  process.exit(1);
}

try {
  const results: { x: number; y: number; distance: number }[] = [];
  const cropTilePattern = new RegExp(
    `title="Crop"><\/i><\/td>\\s*<td class="val">(${CONFIG.types.join('|')})<\/td>`
  );

  let promises: Promise<any>[] = [];
  for (let r = 1; r <= CONFIG.searchRadius; r++) {
    process.stdout.write(`${r}`);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) {
          continue;
        }

        const promise = new Promise(async (resolve) => {
          const x = CONFIG.village.x + dx;
          const y = CONFIG.village.y + dy;
          const response = await fetch(`https://${CONFIG.server}/api/v1/map/tile-details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': process.env.AUTH_TOKEN || '',
            },
            body: JSON.stringify({ x, y }),
          });

          const responseData = await response.json();
          const match = cropTilePattern.exec(responseData.html);
          if (match) {
            process.stdout.write('\n');
            console.log(`${match[1]}-cropper found at [${x}, ${y}]. Distance ${r}`);
            results.push({ x, y, distance: r });
          } else {
            process.stdout.write('.');
          }

          resolve(null);
        });

        promises.push(promise);
        if (promises.length >= 10) {
          await Promise.all(promises);
          promises = [];
        }
      }
    }
  }

  await Promise.all(promises);

  console.log('Done.');
  console.log(results);
} catch (error) {
  console.error('Error fetching tile details:', error);
}
