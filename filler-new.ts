import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { json2csv } from "json-2-csv";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import fss from "fs";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// interface EmptyDesc {
//   menuId: string;
//   menuName: string;
//   restaurantName: string;
//   description: string;
// }

const finalConvert = async (data: FinalData[]) => {
  const convert: FinalDataCsv[] = data.map((ea) => {
    // console.log(ea);
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

  await fs.writeFile("additonal_banget.csv", csv, { encoding: "utf-8" });
};

process.env["LANGCHAIN_TRACING_V2"] = "true";
process.env["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com";
process.env["LANGCHAIN_API_KEY"] = "";

const basePrompt = `
I attached a CSV file that is separated by semicolon with the following columns.
- menuId -> menu id.
- menuName -> menu name.
- restaurantName -> menu description. could be empty.

Do not change any value for the data and do not delete any row.

Your task is to return these columns.
- menuId
- menuDescription -> populate this column based on menuName and restaurantName. Each description MUST between 1 and 3 sentences.

Some description example are:
- Perpaduan kopi espresso dengan susu creamy dan gula aren premium yang kaya akan rasa
- Minuman non-Coffee unik khas Dari Pada, campuran susu creamy dan gula aren premium yang kaya akan rasa


You must return the csv data, do not add additional comment. Return result in csv with the same format as I mentioned before.
`;

const APIKEY =
  "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";

(async function main() {
  const raw = await fs.readFile("./additional.json", {
    encoding: "utf-8",
  });

  const data = JSON.parse(raw) as FinalData[];

  const dataMap = new Map<string, FinalData>();

  data.forEach((data) => {
    dataMap.set(data.menuId, data);
  });

  const emptyDescription: string[] = [];

  const dirs = await fs.readdir("temp_new");

  for (const dir of dirs) {
    const raw = await fs.readFile(`temp_new/${dir}`, { encoding: "utf-8" });
    const parsed = parse(raw as string, {
      delimiter: ";",
      relaxQuotes: true,
      columns: ["menuId", "menuDescription"],
    }) as { menuId: string; menuDescription: string }[];

    parsed.shift();

    for (const conv of parsed) {
      const old = dataMap.get(conv.menuId)!;

      old.menuDescription = conv.menuDescription;

      dataMap.set(conv.menuId, old);
    }
  }

  for (const each of data) {
    if (each.menuDescription.trim() === "") {
      // interface EmptyDesc {
      //   menuId: string;
      //   menuName: string;
      //   restaurantName: string;
      //   description: string;
      // }
      emptyDescription.push(
        `${each.menuId};${each.menuName};${each.restaurantName}`
      );
    }
  }

  const batchSize = 25;

  const batchCount = Math.ceil(emptyDescription.length / batchSize);
  //   const batchCount = 0;

  console.log(`got batch count ${batchCount}`);

  for (let i = 0; i < batchCount; i++) {
    const model = new ChatAnthropic({
      apiKey: APIKEY,
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.7,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are an expert data scientist"],
      ["human", basePrompt],
      ["human", "{data}"],
    ]);

    const chain = prompt.pipe(model);

    const slicing = emptyDescription.slice(
      i * batchSize,
      Math.min((i + 1) * batchSize, emptyDescription.length)
    );

    const data = `menuId;menuName;restaurantName;\n` + slicing.join("\n");

    const result = await chain.invoke({ data });
    // console.log(result.content);

    const parsed = parse(result.content as string, {
      delimiter: ";",
      relaxQuotes: true,
      columns: ["menuId", "menuDescription"],
    }) as { menuId: string; menuDescription: string }[];

    // console.log(parsed);

    parsed.shift();

    for (const conv of parsed) {
      const old = dataMap.get(conv.menuId)!;

      old.menuDescription = conv.menuDescription;

      dataMap.set(conv.menuId, old);
    }

    // break;

    sleep(5000);
  }

  const final = [...dataMap.values()];

  //   console.log(final);

  await finalConvert(final);
})();
