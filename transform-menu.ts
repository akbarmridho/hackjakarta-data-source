import fs from "fs/promises";

interface RestaurantTransformedJSON {
  id: string;
  cuisine: string[];
  link: string;
  tags: string[];
  name: string;
}

interface Menu {
  name: string;
  description: string;
  price: string;
  section: string;
}

interface MenuTransformed {
  name: string;
  description: string;
  price: number;
  section: string[];
}

interface RestaurantWithMenu extends RestaurantTransformedJSON {
  menu: MenuTransformed[];
}

const getRestaurant = async () => {
  const raw = await fs.readFile("restaurants.json", { encoding: "utf-8" });
  return JSON.parse(raw) as RestaurantTransformedJSON[];
};

const transformRestaurant = async (restaurant: RestaurantTransformedJSON) => {
  const raw = await fs.readFile(`data/menu/${restaurant.id}.json`, {
    encoding: "utf-8",
  });
  const menu = JSON.parse(raw) as Menu[];

  const result: RestaurantWithMenu = {
    ...restaurant,
    menu: [],
  };

  const menuSet: Map<string, MenuTransformed> = new Map();

  for (const item of menu) {
    const price = parseInt(item.price);

    if (menuSet.has(item.name)) {
      menuSet.get(item.name)!.section.push(item.section.toLowerCase());
    } else {
      menuSet.set(item.name, {
        name: item.name,
        description: item.description,
        price,
        section: [item.section.toLowerCase()],
      });
    }
  }

  const menus: MenuTransformed[] = [...menuSet.values()].map((each) => {
    return {
      ...each,
      section: [...new Set(each.section)],
    };
  });

  result.menu = menus;

  return result;
};

(async function main() {
  const restaurants = await getRestaurant();
  const result: RestaurantWithMenu[] = [];

  for (const restaurant of restaurants) {
    const transformed = await transformRestaurant(restaurant);
    result.push(transformed);
  }

  await fs.writeFile("restaurants-with-menu.json", JSON.stringify(result), {
    encoding: "utf-8",
  });
})();
