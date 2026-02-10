const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

/**
 * ==============================
 * CONFIGURACIÓN
 * ==============================
 */
const ROOT = process.cwd();

const CATALOG_XLSX = path.join(ROOT, 'catalog.xlsx');
const PRICES_XLSX = path.join(ROOT, 'prices.xlsx');

const OUTPUT_CATALOG = path.join(ROOT, 'src/data/catalog.json');
const OUTPUT_PRICES = path.join(ROOT, 'src/data/prices.json');

/**
 * ==============================
 * HELPERS
 * ==============================
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`No se encuentra el archivo: ${path.basename(filePath)}`);
  }
}

/**
 * ==============================
 * VALIDACIONES BÁSICAS
 * ==============================
 */
assertFileExists(CATALOG_XLSX);
assertFileExists(PRICES_XLSX);

/**
 * ==============================
 * LEER CATALOG.XLSX
 * ==============================
 */
const catalogWorkbook = xlsx.readFile(CATALOG_XLSX);
const catalogSheet = catalogWorkbook.Sheets[catalogWorkbook.SheetNames[0]];
const catalogRows = xlsx.utils.sheet_to_json(catalogSheet, { defval: '' });

if (catalogRows.length === 0) {
  fail('catalog.xlsx está vacío');
}

/**
 * ==============================
 * CONSTRUIR CATÁLOGO
 * ==============================
 */
const catalog = {};
const itemIdMap = {}; // ITEM_ID → item

catalogRows.forEach((row, index) => {
  const family = row['FAMILIA'];
  const material = row['MATERIAL'];
  const item = row['ITEM'];
  const unit = row['UNIDAD'];

  if (!family || !material || !item || !unit) {
    fail(`Fila ${index + 2} en catalog.xlsx tiene celdas vacías`);
  }

  const familyKey = slugify(family);
  const itemId = slugify(`${family}_${material}_${item}`);

  if (!catalog[familyKey]) {
    catalog[familyKey] = [];
  }

  if (itemIdMap[itemId]) {
    fail(`ITEM duplicado detectado: ${itemId}`);
  }

  const entry = {
    id: itemId,
    family,
    material,
    item,
    unit,
  };

  catalog[familyKey].push(entry);
  itemIdMap[itemId] = entry;
});

const catalogItemCount = Object.keys(itemIdMap).length;

/**
 * ==============================
 * LEER PRICES.XLSX
 * ==============================
 */
const pricesWorkbook = xlsx.readFile(PRICES_XLSX);
const pricesSheet = pricesWorkbook.Sheets[pricesWorkbook.SheetNames[0]];
const pricesRows = xlsx.utils.sheet_to_json(pricesSheet, { defval: '' });

if (pricesRows.length === 0) {
  fail('prices.xlsx está vacío');
}

/**
 * ==============================
 * CONSTRUIR PRECIOS
 * ==============================
 */
const prices = {};
let linkedPrices = 0;

pricesRows.forEach((row, index) => {
  const itemId = row['ITEM_ID'];
  const price = Number(row['PRECIO_BASE_EUR']);

  if (!itemId || !Number.isFinite(price)) {
    fail(`Fila ${index + 2} en prices.xlsx es inválida`);
  }

  if (!itemIdMap[itemId]) {
    fail(`ITEM_ID en prices.xlsx no existe en catalog.xlsx: ${itemId}`);
  }

  prices[itemId] = {
    default: price,
  };

  linkedPrices++;
});

/**
 * ==============================
 * VALIDACIÓN FINAL (ANTI-BORRADO)
 * ==============================
 */
if (catalogItemCount === 0) {
  fail('No se ha generado ningún item de catálogo');
}

if (linkedPrices === 0) {
  fail('No se ha enlazado ningún precio');
}

/**
 * ==============================
 * ESCRIBIR JSON (SEGURO)
 * ==============================
 */
fs.mkdirSync(path.dirname(OUTPUT_CATALOG), { recursive: true });

fs.writeFileSync(OUTPUT_CATALOG, JSON.stringify(catalog, null, 2), 'utf-8');
fs.writeFileSync(OUTPUT_PRICES, JSON.stringify(prices, null, 2), 'utf-8');

/**
 * ==============================
 * RESUMEN
 * ==============================
 */
console.log('✅ Importación completada correctamente');
console.log(`• Familias: ${Object.keys(catalog).length}`);
console.log(`• Ítems de catálogo: ${catalogItemCount}`);
console.log(`• Precios enlazados: ${linkedPrices}`);
