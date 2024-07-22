import fs from "fs/promises";

interface MenuTransformed {
  name: string;
  description: string;
  price: number;
  section: string[];
}

interface RestaurantTransformedJSON {
  id: string;
  cuisine: string[];
  link: string;
  tags: string[];
  name: string;
}

interface RestaurantWithMenu extends RestaurantTransformedJSON {
  menu: MenuTransformed[];
}

interface CsvData {
  restaurantId: string;
  restaurantName: string;
  restaurantCuisine: string;
  restaurantLink: string;
  restaurantTags: string;
  menuName: string;
  menuDescription: string;
  menuPrice: string;
  menuSections: string;
  menuId: string;
}

function buildString(data: CsvData[]): string {
  let resultString: string = "";

  resultString =
    "restaurantId;restaurantName;restaurantCuisine;restaurantLink;restaurantTags;menuName;menuDescription;menuPrice;menuSections;menuId\n";

  for (const each of data) {
    resultString += `${each.restaurantId};${each.restaurantName};${each.restaurantCuisine};${each.restaurantLink};${each.restaurantTags};${each.menuName};${each.menuDescription};${each.menuPrice};${each.menuSections};${each.menuId}\n`;
  }

  return resultString;
}

(async function main() {
  const raw = await fs.readFile("./restaurants-with-menu.json", {
    encoding: "utf-8",
  });

  const data = JSON.parse(raw) as RestaurantWithMenu[];

  const result: CsvData[] = [];

  for (const restaurant of data) {
    for (const [i, menu] of restaurant.menu.entries()) {
      result.push({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantCuisine: restaurant.cuisine.join(","),
        restaurantLink: restaurant.link,
        restaurantTags: restaurant.tags.join(","),
        menuName: menu.name,
        menuDescription: menu.description,
        menuPrice: menu.price.toString(),
        menuSections: menu.section.join(","),
        menuId: `${restaurant.id}-${i}`,
      });
    }
  }

  await fs.writeFile("data.csv", buildString(result), { encoding: "utf-8" });

  const batchSize = 50;

  for (let i = 0; i < result.length / batchSize; i++) {
    const startIdx = i * 50;
    const endIdx = Math.min((i + 1) * 50, result.length);
    await fs.writeFile(
      `batch/batch_${i}.csv`,
      buildString(result.slice(startIdx, endIdx)),
      { encoding: "utf-8" }
    );
  }
})();
