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

(async function main() {
  const raw = await fs.readFile("./restaurants-with-menu.json", {
    encoding: "utf-8",
  });

  const data = JSON.parse(raw) as RestaurantWithMenu[];

  const cuisines: Set<string> = new Set();
  const tags: Set<string> = new Set();

  for (const restaurant of data) {
    restaurant.cuisine.forEach((c) => cuisines.add(c));
    restaurant.tags.forEach((c) => tags.add(c));
  }

  const result = {
    cuisines: [...cuisines.values()],
    tags: [...tags.values()],
  };

  await fs.writeFile("unique.json", JSON.stringify(result), {
    encoding: "utf-8",
  });
})();
