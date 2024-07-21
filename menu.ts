import fs from "fs/promises";
import { Builder, Browser, By, Key, until } from "selenium-webdriver";

const getLinks = async () => {
  const raw = await fs.readFile("restaurants_links.json", {
    encoding: "utf-8",
  });

  return JSON.parse(raw) as string[];
};

interface Menu {
  name: string;
  description: string;
  price: string;
  section: string;
}

(async function main() {
  const links = await getLinks();

  for (const link of links) {
    const linkSplitted = link.split("/");
    const idRaw = linkSplitted[linkSplitted.length - 1];
    const id = idRaw.substring(0, idRaw.length - 1);
    const driver = await new Builder().forBrowser(Browser.CHROME).build();
    const menu: Menu[] = [];

    console.log(`handling ${link}`);

    await driver.get(link);

    // wait to load
    await driver.manage().setTimeouts({ implicit: 2000 });

    const categoryElements = await driver.findElements(
      By.className("category___3C8lX"),
    );

    // console.log("got category elements");

    for (const categoryElement of categoryElements) {
      const categoryNameElement = await categoryElement.findElement(
        By.css("h2"),
      );

      const categoryName = (await categoryNameElement.getText()).toLowerCase();
      // console.log(`for category ${categoryName}`);

      const menuElements = await categoryElement.findElements(
        By.className("menuItemInfo___PyfMY"),
      );

      for (const menuElement of menuElements) {
        // console.time("title");
        const titleElement = await menuElement.findElement(
          By.className("itemNameTitle___1sFBq"),
        );

        const titleText = await titleElement.getText();
        // console.log(`for menu ${titleText}`);
        // console.timeEnd("title");

        // console.time("description");
        let descriptionText: string;

        try {
          await driver.manage().setTimeouts({ implicit: 0 });
          const descriptionElement = await menuElement.findElement(
            By.css("p.itemDescription___2cIzt"),
          );

          descriptionText = await descriptionElement.getText();
          // console.log("desc found");
        } catch {
          descriptionText = "";
          // console.log("desc not found");
        } finally {
          await driver.manage().setTimeouts({ implicit: 2000 });
        }
        // console.timeEnd("description");

        // console.time("price");

        const priceElement = await menuElement.findElement(
          By.className("discountedPrice___3MBVA"),
        );

        const priceText = await priceElement.getText();
        const price = priceText.replace(".", "");

        // console.timeEnd("price");

        menu.push({
          price,
          name: titleText,
          description: descriptionText,
          section: categoryName,
        });
      }
    }

    await fs.writeFile(`data/menu/${id}.json`, JSON.stringify(menu), {
      encoding: "utf-8",
    });

    await driver.quit();
  }
})();
