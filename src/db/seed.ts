import { readFile } from "node:fs/promises";
import path from "node:path";
import { replaceCmsContent } from "./repository.js";
import { cmsContentSchema } from "../validators.js";

const seedPath = process.argv[2] ?? path.join(process.cwd(), "database", "seed.json");
const raw = await readFile(seedPath, "utf8");
const content = cmsContentSchema.parse(JSON.parse(raw));

await replaceCmsContent(content);

console.log(`Seeded CMS content from ${seedPath}.`);
