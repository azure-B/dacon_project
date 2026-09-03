const fs = require("fs");
const path = require("path");
const dummyCatalog = require("./financialProducts.json");
const {
  CATEGORY,
  resolveCategory,
} = require("../schema/financialProduct.schema");

const PRODUCT_JSON_PATH = path.join(
  __dirname,
  "..",
  "..",
  "python",
  "api",
  "product.json"
);

const SOURCE = String(
  process.env.FINANCIAL_PRODUCTS_SOURCE || "dummy"
).toLowerCase();

function parseAmount(text) {
  if (text === undefined || text === null || text === "") return null;
  const raw = String(text).replace(/,/g, "").replace(/\s/g, "");

  const eok = raw.match(/(\d+(?:\.\d+)?)\s*억/);
  if (eok) return Math.round(Number(eok[1]) * 100000000);

  const cheonMan = raw.match(/(\d+(?:\.\d+)?)\s*천만/);
  if (cheonMan) return Math.round(Number(cheonMan[1]) * 10000000);

  const man = raw.match(/(\d+(?:\.\d+)?)\s*만/);
  if (man) return Math.round(Number(man[1]) * 10000);

  const won = raw.match(/(\d+(?:\.\d+)?)\s*원/);
  if (won) return Math.round(Number(won[1]));

  return null;
}

function mapRawProduct(raw, productId) {
  const productType = raw.상품_유형;
  const category = resolveCategory(productType);
  const descriptionParts = [raw.조건_및_특징, raw.우대_조건, raw.신청자_자격]
    .filter(Boolean)
    .join(" ");

  return {
    productId,
    productName: raw.상품명,
    bankName: raw.은행명,
    sector: raw.금융권_구분,
    category,
    productType,
    interestRate: raw.이자율_최저,
    interestRateMax: raw.이자율_최고,
    maxLimit: parseAmount(raw.한도),
    maxLimitText: raw.한도 || null,
    minAmount: parseAmount(raw.최소_금액),
    term: raw.대출_기간 || raw.만기 || null,
    description: descriptionParts,
  };
}

function loadFromDummy() {
  return {
    source: "dummy",
    disclaimer: dummyCatalog.disclaimer,
    products: dummyCatalog.products.slice(),
  };
}

function loadFromProductJson() {
  const raw = JSON.parse(fs.readFileSync(PRODUCT_JSON_PATH, "utf-8"));
  return {
    source: "product.json",
    disclaimer: dummyCatalog.disclaimer,
    metadata: raw.metadata,
    products: raw.products.map((item, index) => mapRawProduct(item, index)),
  };
}

/**
 * Supabase 연동 지점.
 * FINANCIAL_PRODUCTS_SOURCE=supabase 일 때 호출한다.
 * 테이블/컬럼이 준비되면 이 함수만 교체하면 된다.
 */
async function loadFromSupabase() {
  // TODO: const { data } = await supabase.from("financial_products").select("*");
  throw new Error(
    "FINANCIAL_PRODUCTS_SOURCE=supabase 는 아직 연결되지 않았습니다."
  );
}

function loadCatalogSync() {
  if (SOURCE === "supabase") {
    throw new Error(
      "supabase 소스는 비동기입니다. loadFinancialProducts()를 사용하세요."
    );
  }
  if (SOURCE === "product.json") {
    return loadFromProductJson();
  }
  return loadFromDummy();
}

async function loadFinancialProducts() {
  if (SOURCE === "supabase") {
    return loadFromSupabase();
  }
  return loadCatalogSync();
}

function getFinancialProducts() {
  return loadCatalogSync().products;
}

function getFinancialProductById(productId) {
  const id = Number(productId);
  return (
    getFinancialProducts().find((item) => item.productId === id) || null
  );
}

function getFinancialProductsByCategory(category) {
  return getFinancialProducts().filter((item) => item.category === category);
}

function toPromptProduct(item) {
  return {
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    interestRate: item.interestRate,
    maxLimit: item.maxLimit,
    description: item.description,
    bankName: item.bankName,
    productType: item.productType,
    interestRateMax: item.interestRateMax,
    maxLimitText: item.maxLimitText,
  };
}

function getPromptCatalog() {
  const catalog = loadCatalogSync();
  const products = catalog.products.map(toPromptProduct);
  return {
    source: catalog.source,
    disclaimer: catalog.disclaimer,
    products,
    byCategory: {
      [CATEGORY.LOAN]: products.filter((item) => item.category === CATEGORY.LOAN),
      [CATEGORY.DEPOSIT]: products.filter(
        (item) => item.category === CATEGORY.DEPOSIT
      ),
    },
  };
}

function getPromptDict() {
  const dict = {};
  for (const item of getPromptCatalog().products) {
    dict[item.productId] = item;
  }
  return dict;
}

module.exports = {
  CATEGORY,
  SOURCE,
  parseAmount,
  mapRawProduct,
  loadFinancialProducts,
  getFinancialProducts,
  getFinancialProductById,
  getFinancialProductsByCategory,
  getPromptCatalog,
  getPromptDict,
};
