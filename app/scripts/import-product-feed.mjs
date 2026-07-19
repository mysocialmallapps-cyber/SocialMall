import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedPath = path.join(
  appRoot,
  "lib/products/data/verified-products.generated.ts",
);

const supportedNetworks = new Set(["awin", "impact"]);
const supportedCurrencies = new Set(["EUR", "USD", "GBP"]);
const supportedShippingCountries = new Set(["IE", "US", "GB", "FR", "SE", "HU"]);

const defaultFeedLimit = 500;
const defaultMinimumImport = 100;

const aliases = {
  sourceId: [
    "id",
    "item_id",
    "itemid",
    "product_id",
    "productid",
    "aw_product_id",
    "awproductid",
    "catalog_item_id",
    "catalogitemid",
    "sku",
    "mpn",
    "ean",
    "upc",
  ],
  brand: [
    "brand",
    "brand_name",
    "brandname",
    "manufacturer",
    "designer",
    "merchant_name",
    "merchantname",
  ],
  name: [
    "name",
    "title",
    "product_name",
    "productname",
    "product_title",
    "producttitle",
    "item_name",
    "itemname",
  ],
  description: [
    "description",
    "product_description",
    "productdescription",
    "short_description",
    "shortdescription",
    "summary",
    "details",
  ],
  price: [
    "price",
    "current_price",
    "currentprice",
    "sale_price",
    "saleprice",
    "actual_price",
    "actualprice",
    "product_price",
    "productprice",
    "display_price",
    "displayprice",
  ],
  compareAtPrice: [
    "compare_at_price",
    "compareatprice",
    "was_price",
    "wasprice",
    "old_price",
    "oldprice",
    "original_price",
    "originalprice",
    "retail_price",
    "retailprice",
    "rrp",
    "msrp",
  ],
  currency: [
    "currency",
    "currency_code",
    "currencycode",
    "price_currency",
    "pricecurrency",
  ],
  image: [
    "image",
    "image_url",
    "imageurl",
    "large_image",
    "largeimage",
    "large_image_url",
    "largeimageurl",
    "merchant_image_url",
    "merchantimageurl",
    "product_image",
    "productimage",
    "picture",
    "thumbnail",
  ],
  productUrl: [
    "product_url",
    "producturl",
    "url",
    "link",
    "product_link",
    "productlink",
    "landing_page_url",
    "landingpageurl",
    "deep_link",
    "deeplink",
    "aw_deep_link",
    "awdeeplink",
    "tracking_url",
    "trackingurl",
    "click_url",
    "clickurl",
  ],
  affiliateUrl: [
    "affiliate_url",
    "affiliateurl",
    "tracking_url",
    "trackingurl",
    "click_url",
    "clickurl",
    "deep_link",
    "deeplink",
    "aw_deep_link",
    "awdeeplink",
  ],
  category: [
    "category",
    "category_name",
    "categoryname",
    "merchant_category",
    "merchantcategory",
    "product_type",
    "producttype",
    "google_product_category",
    "googleproductcategory",
  ],
  subcategory: [
    "subcategory",
    "sub_category",
    "subcategory_name",
    "department",
    "type",
  ],
  gender: ["gender", "audience", "target_gender", "targetgender"],
  colors: ["color", "colour", "colors", "colours"],
  materials: ["material", "materials", "fabric", "composition"],
  vibe: ["vibe", "aesthetic", "trend"],
  style: ["style", "styles"],
  occasion: ["occasion", "occasions"],
  season: ["season", "seasons"],
  fit: ["fit", "size_fit", "sizefit"],
  retailer: [
    "retailer",
    "merchant",
    "merchant_name",
    "merchantname",
    "advertiser",
    "advertiser_name",
    "advertisername",
    "program",
    "program_name",
    "programname",
    "store",
  ],
  availability: [
    "availability",
    "stock",
    "stock_status",
    "stockstatus",
    "in_stock",
    "instock",
    "is_available",
    "isavailable",
  ],
  country: ["country", "shipping_country", "shippingcountry", "market"],
  rating: ["rating", "average_rating", "averagerating"],
  reviewCount: ["review_count", "reviewcount", "reviews"],
};

const colorWords = [
  "black",
  "white",
  "blue",
  "navy",
  "green",
  "red",
  "pink",
  "purple",
  "yellow",
  "orange",
  "brown",
  "grey",
  "gray",
  "cream",
  "beige",
  "ivory",
  "silver",
  "gold",
  "denim",
];

const materialWords = [
  "cotton",
  "linen",
  "silk",
  "wool",
  "cashmere",
  "leather",
  "suede",
  "denim",
  "polyester",
  "viscose",
  "satin",
  "gold",
  "silver",
];

const normalizeKey = (value) =>
  String(value ?? "")
    .replace(/^\ufeff/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const normalizeText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const toSlug = (value) =>
  normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const unique = (values) =>
  Array.from(new Set(values.map(normalizeText).filter(Boolean)));

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const feedLimit = Math.min(
  500,
  Math.max(1, parsePositiveInt(process.env.PRODUCT_FEED_LIMIT, defaultFeedLimit)),
);
const minimumImport = Math.min(
  feedLimit,
  Math.max(
    1,
    parsePositiveInt(process.env.PRODUCT_FEED_MINIMUM, defaultMinimumImport),
  ),
);

const resolveNetwork = () => {
  const rawNetwork = normalizeText(process.env.PRODUCT_FEED_NETWORK || "awin")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "");

  if (supportedNetworks.has(rawNetwork)) {
    return rawNetwork;
  }

  console.warn(
    `Unsupported PRODUCT_FEED_NETWORK "${rawNetwork}". Falling back to "awin".`,
  );
  return "awin";
};

const feedNetwork = resolveNetwork();

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidUrl = (value) => {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname) && ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const normalizeUrl = (value) => {
  const candidate = normalizeText(value);
  if (!candidate || !isValidUrl(candidate)) {
    return "";
  }

  const parsed = new URL(candidate);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  return parsed.toString();
};

const getDomainOrigin = (value) => {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return "";
  }
};

const getHostnameLabel = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const parsePrice = (value) => {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const normalized = text
    .replace(/[^\d,.-]/g, "")
    .replace(/,(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : null;
};

const parseCurrency = (row, priceValue) => {
  const raw = normalizeText(getField(row, "currency")).toUpperCase();
  if (supportedCurrencies.has(raw)) {
    return raw;
  }

  const priceText = normalizeText(priceValue).toUpperCase();
  if (priceText.includes("GBP") || priceText.includes("£")) {
    return "GBP";
  }
  if (priceText.includes("USD") || priceText.includes("$")) {
    return "USD";
  }
  if (priceText.includes("EUR") || priceText.includes("€")) {
    return "EUR";
  }

  const fallback = normalizeText(process.env.PRODUCT_FEED_CURRENCY).toUpperCase();
  return supportedCurrencies.has(fallback) ? fallback : "EUR";
};

const normalizeRow = (row) => {
  const normalized = {};
  Object.entries(row ?? {}).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = normalizeText(value);
  });
  return normalized;
};

const getField = (row, key) => {
  const normalizedRow = row.__normalized ?? normalizeRow(row);
  const keys = aliases[key] ?? [key];
  for (const alias of keys) {
    const value = normalizedRow[normalizeKey(alias)];
    if (value) {
      return value;
    }
  }
  return "";
};

const splitValues = (value) =>
  unique(
    normalizeText(value)
      .split(/[|,;/]+/)
      .map((entry) => entry.trim().toLowerCase()),
  );

const inferWords = (source, words) => {
  const normalizedSource = ` ${normalizeText(source).toLowerCase()} `;
  return words.filter((word) => normalizedSource.includes(` ${word} `));
};

const inferCategory = (row) => {
  const source = [
    getField(row, "category"),
    getField(row, "subcategory"),
    getField(row, "name"),
    getField(row, "description"),
  ]
    .join(" ")
    .toLowerCase();

  if (/shoe|sneaker|trainer|boot|loafer|heel|sandal|footwear/.test(source)) {
    return "footwear";
  }
  if (/bag|tote|backpack|clutch|purse|crossbody|satchel/.test(source)) {
    return "bag";
  }
  if (/jewel|necklace|bracelet|earring|ring|watch/.test(source)) {
    return "jewellery";
  }
  if (/dress|gown/.test(source)) {
    return "dress";
  }
  if (/blazer|jacket|suit|coat/.test(source)) {
    return "blazer";
  }
  if (/jean|denim/.test(source)) {
    return "jeans";
  }
  if (/trouser|pant|chino|short/.test(source)) {
    return "trousers";
  }
  if (/hoodie|sweatshirt|sweater|jumper|knit/.test(source)) {
    return "hoodie";
  }
  if (/shirt|blouse|polo/.test(source)) {
    return "shirt";
  }
  return "tshirt";
};

const inferGender = (row) => {
  const source = [
    getField(row, "gender"),
    getField(row, "category"),
    getField(row, "name"),
    getField(row, "description"),
  ]
    .join(" ")
    .toLowerCase();

  const genders = [];
  if (/women|woman|female|ladies|womens|women's/.test(source)) {
    genders.push("women");
  }
  if (/men|man|male|mens|men's/.test(source)) {
    genders.push("men");
  }
  if (/unisex|gender neutral|gender-neutral/.test(source)) {
    genders.push("unisex");
  }
  return unique(genders).length ? unique(genders) : ["unisex"];
};

const inferSeason = (row) => {
  const explicit = splitValues(getField(row, "season"));
  if (explicit.length) {
    return explicit;
  }

  const source = [getField(row, "name"), getField(row, "description")]
    .join(" ")
    .toLowerCase();

  if (/summer|holiday|vacation|linen|sandal/.test(source)) {
    return ["summer"];
  }
  if (/winter|wool|cashmere|coat|boot|knit/.test(source)) {
    return ["winter"];
  }
  return ["all season"];
};

const inferAvailability = (row) => {
  const value = getField(row, "availability").toLowerCase();
  if (!value) {
    return true;
  }
  if (/out|unavailable|sold|false|0|no/.test(value)) {
    return false;
  }
  return true;
};

const inferShippingCountry = (row) => {
  const raw = getField(row, "country").toUpperCase();
  return supportedShippingCountries.has(raw) ? raw : undefined;
};

const inferTagArray = ({ row, key, fallback, source }) => {
  const explicit = splitValues(getField(row, key));
  if (explicit.length) {
    return explicit;
  }
  return unique(fallback(source));
};

const buildImages = (image) => [image];

const truncateText = (value, limit) => {
  const text = normalizeText(value);
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 1).trim()}...`;
};

const hashNumber = (value) => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 800000000;
};

const buildProductId = ({ row, productUrl, index, usedIds }) => {
  const stableKey =
    getField(row, "sourceId") ||
    `${feedNetwork}:${getField(row, "brand")}:${getField(row, "name")}:${productUrl}`;
  let candidate = 100000 + hashNumber(stableKey || `${feedNetwork}:${index}`);

  while (usedIds.has(candidate)) {
    candidate += 1;
  }

  usedIds.add(candidate);
  return candidate;
};

const networkLabel = (network) => (network === "impact" ? "Impact" : "Awin");

const normalizeProduct = ({ row, index, usedIds, importedAt }) => {
  const normalizedRow = { ...row, __normalized: normalizeRow(row) };
  const rawPrice = getField(normalizedRow, "price");
  const price = parsePrice(rawPrice);
  const productUrl =
    normalizeUrl(getField(normalizedRow, "productUrl")) ||
    normalizeUrl(getField(normalizedRow, "affiliateUrl"));
  const affiliateUrl =
    normalizeUrl(getField(normalizedRow, "affiliateUrl")) || productUrl || null;
  const image = normalizeUrl(getField(normalizedRow, "image"));
  const fallbackRetailer =
    normalizeText(process.env.PRODUCT_FEED_RETAILER) ||
    getHostnameLabel(productUrl) ||
    networkLabel(feedNetwork);
  const retailer = normalizeText(getField(normalizedRow, "retailer")) || fallbackRetailer;
  const brand = normalizeText(getField(normalizedRow, "brand")) || retailer;
  const name = normalizeText(getField(normalizedRow, "name"));

  if (!name || !brand || !price || !image || !productUrl) {
    return null;
  }

  const description =
    truncateText(getField(normalizedRow, "description"), 260) ||
    `${brand} ${name} imported from a verified ${networkLabel(feedNetwork)} product feed.`;
  const category = inferCategory(normalizedRow);
  const sourceText = [
    name,
    description,
    getField(normalizedRow, "category"),
    getField(normalizedRow, "subcategory"),
  ].join(" ");
  const colors = inferTagArray({
    row: normalizedRow,
    key: "colors",
    source: sourceText,
    fallback: (source) => inferWords(source, colorWords),
  });
  const materials = inferTagArray({
    row: normalizedRow,
    key: "materials",
    source: sourceText,
    fallback: (source) => inferWords(source, materialWords),
  });
  const compareAtPrice = parsePrice(getField(normalizedRow, "compareAtPrice"));
  const productId = buildProductId({
    row: normalizedRow,
    productUrl,
    index,
    usedIds,
  });

  return {
    id: productId,
    brand,
    name,
    description,
    price,
    currency: parseCurrency(normalizedRow, rawPrice),
    image,
    images: buildImages(image),
    imageVerificationStatus: "verified-product-image",
    category,
    subcategory:
      normalizeText(getField(normalizedRow, "subcategory")) ||
      normalizeText(getField(normalizedRow, "category")) ||
      category,
    colors: colors.length ? colors : ["neutral"],
    materials: materials.length ? materials : ["mixed material"],
    vibe: splitValues(getField(normalizedRow, "vibe")).length
      ? splitValues(getField(normalizedRow, "vibe"))
      : ["contemporary"],
    style: splitValues(getField(normalizedRow, "style")).length
      ? splitValues(getField(normalizedRow, "style"))
      : ["everyday"],
    occasion: splitValues(getField(normalizedRow, "occasion")).length
      ? splitValues(getField(normalizedRow, "occasion"))
      : ["everyday"],
    season: inferSeason(normalizedRow),
    gender: inferGender(normalizedRow),
    fit: splitValues(getField(normalizedRow, "fit")).length
      ? splitValues(getField(normalizedRow, "fit"))
      : ["regular"],
    productUrl,
    productUrlVerificationStatus: "verified-product-page",
    brandUrl: getDomainOrigin(productUrl) || productUrl,
    catalogSource: "verified-retailer",
    priceStatus: "verified",
    sourceLabel: `${networkLabel(feedNetwork)} product feed`,
    sourceNote: `Imported from a ${networkLabel(feedNetwork)} retailer product feed on ${importedAt}. Product URL and image are feed-supplied.`,
    verifiedAt: importedAt,
    affiliateUrl,
    affiliateNetwork: feedNetwork,
    affiliateCommissionRate: feedNetwork === "impact" ? 0.1 : 0.12,
    affiliateCommissionModel: "cps",
    retailer,
    inStock: inferAvailability(normalizedRow),
    featured: index < 24,
    popularityScore: Math.max(70, 99 - (index % 30)),
    compareAtPrice:
      compareAtPrice && compareAtPrice > price ? Number(compareAtPrice.toFixed(2)) : undefined,
    shippingCountry: inferShippingCountry(normalizedRow),
    brandSlug: toSlug(brand),
    productSlug: toSlug(`${brand}-${name}-${productId}`),
    rating: parsePrice(getField(normalizedRow, "rating")) ?? undefined,
    reviewCount: parsePositiveInt(getField(normalizedRow, "reviewCount"), 0) || undefined,
  };
};

const parseDelimitedRows = (input, delimiter) => {
  const rows = [];
  let current = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === delimiter && !inQuotes) {
      currentRow.push(current);
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      currentRow.push(current);
      if (currentRow.some((entry) => normalizeText(entry))) {
        rows.push(currentRow);
      }
      current = "";
      currentRow = [];
      continue;
    }

    current += character;
  }

  currentRow.push(current);
  if (currentRow.some((entry) => normalizeText(entry))) {
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeText);
  return rows.slice(1).map((row) =>
    headers.reduce((record, header, index) => {
      record[header || `field_${index}`] = normalizeText(row[index] ?? "");
      return record;
    }, {}),
  );
};

const detectDelimiter = (input) => {
  const firstLine = input.split(/\r?\n/).find((line) => normalizeText(line)) ?? "";
  const counts = {
    "\t": (firstLine.match(/\t/g) ?? []).length,
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const findArrayInJson = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || typeof value !== "object") {
    return [];
  }

  const candidateKeys = [
    "products",
    "items",
    "data",
    "catalogItems",
    "CatalogItems",
    "Product",
    "product",
  ];
  for (const key of candidateKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }
  return [];
};

const decodeXmlValue = (value) =>
  normalizeText(value)
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const parseSimpleXmlRows = (input) => {
  const rows = [];
  const itemPattern = /<(product|item|Product|Item)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let itemMatch = itemPattern.exec(input);

  while (itemMatch) {
    const body = itemMatch[2];
    const row = {};
    const fieldPattern = /<([A-Za-z0-9_:-]+)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let fieldMatch = fieldPattern.exec(body);

    while (fieldMatch) {
      const key = fieldMatch[1].split(":").pop();
      if (key) {
        row[key] = decodeXmlValue(fieldMatch[2]);
      }
      fieldMatch = fieldPattern.exec(body);
    }

    if (Object.keys(row).length) {
      rows.push(row);
    }
    itemMatch = itemPattern.exec(input);
  }

  return rows;
};

const parseRows = ({ input, sourceHint, contentType }) => {
  const trimmed = input.trim();
  const hint = `${sourceHint} ${contentType}`.toLowerCase();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return findArrayInJson(JSON.parse(trimmed));
  }

  if (trimmed.startsWith("<") || hint.includes("xml")) {
    return parseSimpleXmlRows(trimmed);
  }

  return parseDelimitedRows(trimmed, detectDelimiter(trimmed));
};

const readFeedSource = async (source) => {
  if (isHttpUrl(source)) {
    const response = await fetch(source, {
      headers: {
        accept: "text/csv, text/tab-separated-values, application/json, application/xml, text/xml, */*",
        "user-agent": "SocialMallProductFeedSync/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      buffer,
      sourceHint: source,
      contentType: response.headers.get("content-type") ?? "",
    };
  }

  const localPath = path.isAbsolute(source)
    ? source
    : path.resolve(process.cwd(), source);
  return {
    buffer: await fs.readFile(localPath),
    sourceHint: localPath,
    contentType: "",
  };
};

const maybeUnzip = (buffer, sourceHint, contentType) => {
  const isGzip =
    sourceHint.toLowerCase().endsWith(".gz") ||
    contentType.toLowerCase().includes("gzip") ||
    (buffer[0] === 0x1f && buffer[1] === 0x8b);

  return isGzip ? gunzipSync(buffer) : buffer;
};

const buildGeneratedFile = ({ products, sync }) => `// Generated by scripts/import-product-feed.mjs. Do not edit manually.
import type { Product } from "../types";

export const verifiedProductFeedSync = ${JSON.stringify(sync, null, 2)} as const;

export const verifiedProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;

const writeGeneratedProducts = async ({ products, sync }) => {
  await fs.writeFile(generatedPath, buildGeneratedFile({ products, sync }));
};

const importFeed = async () => {
  const source = normalizeText(process.env.PRODUCT_FEED_URL) ||
    normalizeText(process.env.PRODUCT_FEED_FILE);

  if (!source) {
    await writeGeneratedProducts({
      products: [],
      sync: {
        sourceConfigured: false,
        network: feedNetwork,
        importedCount: 0,
        skippedCount: 0,
        generatedAt: null,
        message: "Set PRODUCT_FEED_URL or PRODUCT_FEED_FILE to import verified products.",
      },
    });
    console.log("No PRODUCT_FEED_URL or PRODUCT_FEED_FILE configured. Wrote empty verified feed.");
    return;
  }

  const importedAt = new Date().toISOString();
  const { buffer, sourceHint, contentType } = await readFeedSource(source);
  const input = maybeUnzip(buffer, sourceHint, contentType).toString("utf8");
  const rawRows = parseRows({ input, sourceHint, contentType });
  const usedIds = new Set();
  const skipped = [];
  const products = [];

  for (const [index, row] of rawRows.entries()) {
    if (products.length >= feedLimit) {
      break;
    }

    const product = normalizeProduct({
      row,
      index,
      usedIds,
      importedAt,
    });

    if (product) {
      products.push(product);
    } else if (skipped.length < 10) {
      skipped.push(index + 1);
    }
  }

  if (products.length < minimumImport) {
    throw new Error(
      `Imported ${products.length} verified products, below PRODUCT_FEED_MINIMUM=${minimumImport}. Check feed fields or lower the minimum for a small pilot export.`,
    );
  }

  await writeGeneratedProducts({
    products,
    sync: {
      sourceConfigured: true,
      sourceType: isHttpUrl(source) ? "url" : "file",
      network: feedNetwork,
      importedCount: products.length,
      skippedCount: rawRows.length - products.length,
      feedLimit,
      minimumImport,
      generatedAt: importedAt,
      skippedSampleRows: skipped,
    },
  });

  console.log(`Imported ${products.length} verified ${networkLabel(feedNetwork)} products.`);
};

importFeed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
