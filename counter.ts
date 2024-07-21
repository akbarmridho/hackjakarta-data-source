import fs from "fs/promises";

const getRestaurantCount = async () => {
  const raw = await fs.readFile("restaurants.json", { encoding: "utf-8" });
  return JSON.parse(raw).length;
};

const getMenuCount = async () => {
  const dirs = await fs.readdir("data/menu");
  let count = 0;

  for (const file of dirs) {
    // console.log(file);
    const raw = await fs.readFile(`data/menu/${file}`, { encoding: "utf-8" });

    count += JSON.parse(raw).length;
  }

  return count;
};

(async function main() {
  const restaurantCount = await getRestaurantCount();
  const menuCount = await getMenuCount();

  console.log(`restaurant ${restaurantCount} menu ${menuCount}`);
})();
