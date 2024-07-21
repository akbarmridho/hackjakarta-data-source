import fs from "fs/promises";

interface Restaurant {
  link: string;
  tags: string[];
  name: string;
}

interface RestaurantTransformed {
  id: string;
  cuisine: Set<string>;
  link: string;
  tags: Set<string>;
  name: string;
}

interface RestaurantTransformedJSON {
  id: string;
  cuisine: string[];
  link: string;
  tags: string[];
  name: string;
}

const combine = (data: {
  [category: string]: Restaurant[];
}): RestaurantTransformedJSON[] => {
  const restaurants: Map<string, RestaurantTransformed> = new Map();

  for (const cuisine of Object.keys(data)) {
    const cuisineRestaurants = data[cuisine];

    for (const restaurant of cuisineRestaurants) {
      const linkSplitted = restaurant.link.split("/");
      const idRaw = linkSplitted[linkSplitted.length - 1];
      const id = idRaw.substring(0, idRaw.length - 1);

      if (restaurants.has(id)) {
        const current = restaurants.get(id)!;
        current.cuisine.add(cuisine);

        restaurant.tags.forEach((tag) => {
          current.tags.add(tag);
        });

        restaurants.set(id, current);
      } else {
        restaurants.set(id, {
          id,
          cuisine: new Set([cuisine]),
          link: restaurant.link,
          name: restaurant.name,
          tags: new Set(restaurant.tags),
        });
      }
    }
  }

  const result: RestaurantTransformedJSON[] = [];

  for (const restaurant of restaurants.values()) {
    result.push({
      id: restaurant.id,
      cuisine: [...restaurant.cuisine.values()],
      link: restaurant.link,
      name: restaurant.name,
      tags: [...restaurant.tags.values()],
    });
  }

  return result;
};

(async function main() {
  const data: { [category: string]: Restaurant[] } = {};

  const dirs = await fs.readdir("data/category_data");

  for (const dir of dirs) {
    const restaurantPath = `data/category_data/${dir}/restaurants.json`;

    const raw = await fs.readFile(restaurantPath, { encoding: "utf-8" });

    data[dir] = JSON.parse(raw) as Restaurant[];
  }

  const transformed = combine(data);

  const links = transformed.map((each) => each.link);

  await fs.writeFile("restaurants_links.json", JSON.stringify(links), {
    encoding: "utf-8",
  });

  await fs.writeFile("restaurants.json", JSON.stringify(transformed), {
    encoding: "utf-8",
  });
})();
