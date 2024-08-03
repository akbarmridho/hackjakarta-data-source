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
  menuId: string;
  restaurantCuisine: string;
  restaurantTags: string;
  menuName: string;
  menuDescription: string;
  menuSections: string;
}

function buildString(data: CsvData[]): string {
  let resultString: string = "";

  resultString =
    "menuId;restaurantCuisine;restaurantTags;menuName;menuDescription;menuSections\n";

  for (const each of data) {
    resultString += `${each.menuId};${each.restaurantCuisine};${each.restaurantTags};${each.menuName};${each.menuDescription};${each.menuSections}\n`;
  }

  return resultString;
}

(async function main() {
  const raw = await fs.readFile("./restaurants-with-menu.json", {
    encoding: "utf-8",
  });

  const data = JSON.parse(raw) as RestaurantWithMenu[];

  const result: CsvData[] = [];

  const inclusion: string[] = [
    "kfc",
    "mcd",
    "gacoan",
    "butaki",
    "martabak pizza orins",
    "the atjeh connection",
    "taco bell",
    "king's cafe",
    "istanbul kebab",
  ];

  for (const restaurant of data) {
    let pass = false;
    const restName = restaurant.name.toLowerCase();

    for (const crit of inclusion) {
      if (restName.includes(crit)) {
        pass = true;
        break;
      }
    }

    if (!pass) {
      continue;
    }

    for (const [i, menu] of restaurant.menu.entries()) {
      result.push({
        // restaurantId: restaurant.id,
        // restaurantName: restaurant.name,
        restaurantCuisine: restaurant.cuisine.join(","),
        // restaurantLink: restaurant.link,
        restaurantTags: restaurant.tags.join(","),
        menuName: menu.name,
        menuDescription: menu.description,
        // menuPrice: menu.price.toString(),
        menuSections: menu.section.join(","),
        menuId: `${restaurant.id}-${i}`,
      });
    }
  }

  //   await fs.writeFile("data.csv", buildString(result), { encoding: "utf-8" });

  const batchSize = 25;

  for (let i = 0; i < result.length / batchSize; i++) {
    const startIdx = i * batchSize;
    const endIdx = Math.min((i + 1) * batchSize, result.length);
    await fs.writeFile(
      `batch_new/batch_${i}.csv`,
      buildString(result.slice(startIdx, endIdx)),
      { encoding: "utf-8" }
    );
  }
})();
