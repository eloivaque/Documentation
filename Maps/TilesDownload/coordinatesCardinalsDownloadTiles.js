const axios = require('axios');
const fs = require('fs');
const path = require('path');

const baseTilesUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const saveDirectory = './coordinatestiles/andorra';

// Funció per comprovar si existeix un fitxer
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

// Funció per descarregar un tile i guardar-lo localment
async function downloadTile(zoom, x, y) {
  const url = baseTilesUrl
    .replace('{s}', 'a')
    .replace('{z}', zoom)
    .replace('{x}', x)
    .replace('{y}', y);

  const filePath = path.join(saveDirectory, zoom.toString(), x.toString(), y.toString() + '.png');
  const directoryPath = path.dirname(filePath);

  // Comprovar si el fitxer ja existeix
  if (await fileExists(filePath)) {
    console.log(`El fitxer ${filePath} ja existeix. Saltant descàrrega.`);
    return;
  }

  // Crear directori si no existeix
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  // Descarregar el tile i guardar-lo localment
  console.log(`Descarregant ${filePath}...`);
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream(filePath));
    console.log(`Fitxer ${filePath} descarregat amb èxit.`);
  } catch (error) {
    console.error(`Error en descarregar ${filePath}: ${error.message}`);
  }
}

// Funció per convertir coordenades geogràfiques a coordenades de tiles
function latLonToTileXY(lat, lon, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}

// Funció principal per descarregar una àrea de tiles
async function downloadTilesForArea(minZoom, maxZoom, minLat, maxLat, minLon, maxLon) {
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const minTile = latLonToTileXY(maxLat, minLon, zoom); // maxLat i minLon per obtenir l'esquerra superior
    const maxTile = latLonToTileXY(minLat, maxLon, zoom); // minLat i maxLon per obtenir la dreta inferior

    const startX = Math.max(minTile.x, 0);
    const endX = Math.min(maxTile.x, Math.pow(2, zoom) - 1);
    const startY = Math.max(minTile.y, 0);
    const endY = Math.min(maxTile.y, Math.pow(2, zoom) - 1);

    console.log(`Descarregant tiles per zoom ${zoom} de (${startX},${startY}) a (${endX},${endY})`);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        await downloadTile(zoom, x, y);
      }
    }
  }
}

// Coordenades aproximades per Espanya
//const minLat = 36.0;
//const maxLat = 43.8;
//const minLon = -9.3;
//const maxLon = 3.3;

// Andorra
const minLat = 42.4289;
const maxLat = 42.6559;
const minLon = 1.4136;
const maxLon = 1.7865;

// Exemple de crida per descarregar tiles d'Espanya
const minZoom = 0;
const maxZoom = 20; // pots ajustar aquest valor segons el teu requisit

downloadTilesForArea(minZoom, maxZoom, minLat, maxLat, minLon, maxLon);
