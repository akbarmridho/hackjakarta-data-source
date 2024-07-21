import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import fs from "fs/promises";

const baseGrabUrl = "https://food.grab.com/";

const getCategories = async () => {
  const f = await fs.readFile("data/categories.txt", "utf-8");

  const result = f.split("\r\n");

  return result;
};

interface Restaurant {
  link: string;
  tags: string[];
  name: string;
}

(async function main() {
  const categories = await getCategories();

  for (const category of categories) {
    const restaurants: Restaurant[] = [];

    const split = category.split("/");
    const cuisineSplit = split[split.length - 2].split("-");
    const cuisine = cuisineSplit.slice(0, cuisineSplit.length - 1).join(" ");
    console.log(cuisine);

    const catdir = `data/category_data/${cuisine}`;

    await fs.mkdir(catdir);

    const driver = await new Builder().forBrowser(Browser.CHROME).build();

    await driver.get(category);

    // wait to load
    await driver.manage().setTimeouts({ implicit: 8000 });

    const elements = await driver.findElements(
      By.className("RestaurantListCol___1FZ8V")
    );

    for (const element of elements) {
      const linkElement = await element.findElement(By.css("a"));
      const relativeLink = await linkElement.getAttribute("href");
      const absoluteLink = `${baseGrabUrl}${relativeLink}`;

      const restaurantNameElement = await element.findElement(
        By.className("name___2epcT")
      );

      const restaurantName = await restaurantNameElement.getText();

      const restaurantTagElemment = await element.findElement(
        By.className("cuisine___T2tCh")
      );

      const restaurantTags = await restaurantTagElemment.getText();

      const tags = restaurantTags.split(",").map((e) => e.trim());

      restaurants.push({
        name: restaurantName,
        tags: tags,
        link: absoluteLink,
      });
    }

    await fs.writeFile(
      `${catdir}/restaurants.json`,
      JSON.stringify(restaurants),
      "utf-8"
    );

    await driver.quit();
  }

  //
})();
