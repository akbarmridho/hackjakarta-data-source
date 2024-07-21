import fs from "fs/promises";

interface Restaurant {
  link: string;
  tags: string[];
  name: string;
}

(async function main() {
  const dirs = await fs.readdir("data/category_data");

  for (const dir of dirs) {
    const path = `data/category_data/${dir}/restaurants.json`;

    const raw = await fs.readFile(path, { encoding: "utf-8" });

    const data = JSON.parse(raw) as Restaurant[];

    const result = data.map((each) => {
      each.link = each.link.slice(22);
      return each;
    });

    await fs.writeFile(path, JSON.stringify(result), { encoding: "utf-8" });
  }
})();
