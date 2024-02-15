import axios from 'axios';

const CONFIG = {
  village: {
    x: 77,
    y: 81,
  },
  radius: 50,
};

if (!process.env.AUTH_TOKEN) {
  console.error('No auth token provided');
  process.exit(1);
}

const findCroppers = async (
  centerX: number,
  centerY: number,
  radius: number,
  authToken: string
) => {
  try {
    const cropTilePattern = /title=\"Crop\"><\/i><\/td>\s*<td class=\"val\">9<\/td>/;

    for (let r = 1; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) {
            continue;
          }
          const x = centerX + dx;
          const y = centerY + dy;

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
                'cookie': authToken,
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

          if (cropTilePattern.test(response.data.html)) {
            process.stdout.write('\n');
            console.log(`Cropper found at [${x}, ${y}]. Distance ${r}`);
          } else {
            process.stdout.write('.');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching tile details:', error);
  }
};

findCroppers(CONFIG.village.x, CONFIG.village.y, CONFIG.radius, process.env.AUTH_TOKEN || '');
