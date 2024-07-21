import fs from "fs/promises";

const getCategories = async () => {
  const f = await fs.readFile("data/categories.txt", "utf-8");

  const result = f.split("\r\n");

  return result;
};

(async function main() {
  const categories = await getCategories();
  const cuisines: string[] = [];

  for (const category of categories) {
    const split = category.split("/");
    const cuisineSplit = split[split.length - 2].split("-");
    const cuisine = cuisineSplit.slice(0, cuisineSplit.length - 1).join(" ");
    console.log(cuisine);
    cuisines.push(cuisine);
  }

  await fs.writeFile(`data/cuisines.txt`, cuisines.join("\n"), "utf-8");
})();
