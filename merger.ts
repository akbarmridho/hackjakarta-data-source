import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { json2csv } from "json-2-csv";

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
  menuName: string;
  menuTag: string;
  dishType: string;
  menuType: string;
  cuisine: string;
  associatedKeywords: string;
  flavor: string;
  portion: string;
  mealTime: string;
  occasion: string;
}

interface FinalData {
  restaurantId: string;
  restaurantCuisine: string[];
  restaurantTags: string[];
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuSections: string[];
  menuPrice: number;
  menuTag: string[];
  dishType: string[];
  menuType: string;
  cuisine: string;
  associatedKeywords: string[];
  flavor: string[];
  mealTime: string[];
  occasion: string;
  portion: number;
}

interface FinalDataCsv {
  restaurantId: string;
  restaurantCuisine: string;
  restaurantTags: string;
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuSections: string;
  menuPrice: number;
  menuTag: string;
  dishType: string;
  menuType: string;
  cuisine: string;
  associatedKeywords: string;
  flavor: string;
  mealTime: string;
  occasion: string;
  portion: number;
}

const finalConvert = async (data: FinalData[]) => {
  const convert: FinalDataCsv[] = data.map((ea) => {
    return {
      ...ea,
      restaurantCuisine: ea.restaurantCuisine.join(","),
      restaurantTags: ea.restaurantTags.join(","),
      menuSections: ea.menuSections.join(","),
      menuTag: ea.menuTag.join(","),
      dishType: ea.dishType.join(","),
      associatedKeywords: ea.associatedKeywords.join(","),
      flavor: ea.flavor.join(","),
      mealTime: ea.mealTime.join(","),
    };
  });

  const csv = await json2csv(convert, {
    delimiter: {
      field: ";",
    },
  });

  await fs.writeFile("final.csv", csv, { encoding: "utf-8" });
};

(async function main() {
  const raw = await fs.readFile("./restaurants-with-menu.json", {
    encoding: "utf-8",
  });

  const originalData = JSON.parse(raw) as RestaurantWithMenu[];

  const originalMap = new Map<string, RestaurantWithMenu>();

  originalData.forEach((data) => {
    originalMap.set(data.id, data);
  });

  const dirs = await fs.readdir("batch_classified");

  const result: FinalData[] = [];

  for (const dir of dirs) {
    console.log(`reading dir ${dir}`);
    const batchRaw = await fs.readFile(`batch_classified/${dir}`, {
      encoding: "utf-8",
    });

    const parsed = parse(batchRaw, {
      delimiter: ";",
      relaxQuotes: true,
      columns: [
        "menuId",
        "menuName",
        "menuTag",
        "dishType",
        "menuType",
        "cuisine",
        "associatedKeywords",
        "flavor",
        "portion",
        "mealTime",
        "occasion",
      ],
    }) as CsvData[];

    parsed.shift();

    for (const row of parsed) {
      const [idx, ...other] = row.menuId.split("-").reverse();
      const restaurantId = other.reverse().join("-");
      const restaurant = originalMap.get(restaurantId)!;

      // console.log(row.menuId);
      // console.log(restaurantId);
      // console.log(idx);

      const menuOriginal = restaurant.menu[
        parseInt(idx) as number
      ] as MenuTransformed;

      result.push({
        restaurantId: restaurant.id,
        restaurantCuisine: restaurant.cuisine,
        restaurantTags: restaurant.tags,
        restaurantName: restaurant.name,
        menuId: row.menuId,
        menuName: menuOriginal.name,
        menuDescription: menuOriginal.description,
        menuSections: menuOriginal.section,
        menuPrice: menuOriginal.price,
        menuTag: row.menuTag.split(","),
        dishType: row.dishType.split(","),
        menuType: row.menuType,
        cuisine: row.cuisine,
        associatedKeywords: row.associatedKeywords.split(","),
        flavor: row.flavor.split(","),
        mealTime: row.mealTime.split(","),
        occasion: row.occasion,
        portion: parseInt(row.portion),
      });
    }

    await fs.writeFile("final.json", JSON.stringify(result), {
      encoding: "utf-8",
    });

    await finalConvert(result);
  }

  console.log(`menu count ${result.length}`);
})();
