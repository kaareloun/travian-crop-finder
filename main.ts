import axios from 'axios';
import { Config } from './types';

const CONFIG: Config = {
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

          const response = await axios.post<{ html: string }>(
            'https://ts1.x1.europe.travian.com/api/v1/map/tile-details',
            { x, y },
            {
              headers: {
                'authority': 'ts1.x1.europe.travian.com',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'no-cache',
                'content-type': 'application/json; charset=UTF-8',
                'cookie': process.env.AUTH_TOKEN,
                'origin': 'https://ts1.x1.europe.travian.com',
                'pragma': 'no-cache',
                'referer': `https://ts1.x1.europe.travian.com/karte.php?zoom=1&x=${x}&y=${y}`,
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Linux"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent':
                  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
                'x-version': '2390.8',
              },
            }
          );

          const match = cropTilePattern.exec(response.data.html);
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
