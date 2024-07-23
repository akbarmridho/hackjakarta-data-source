process.env["LANGCHAIN_TRACING_V2"] = "true";
process.env["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com";
process.env["LANGCHAIN_API_KEY"] =
  "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";

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessageChunk } from "@langchain/core/messages";
import fs from "fs/promises";

`
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
LANGCHAIN_API_KEY="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"
`;

const basePrompt = `
You are a helpful data scientist.

I attached a CSV file that is separated by semicolon with the following columns.
- restaurantId -> primary key of the restaurant.
- restaurantName -> the name of the restaurant
- restaurantCuisine -> cuisines that is served by this restaurant.
- restaurantLink -> the url of the restaurant.
- restaurantTags -> tags of the food that is served by this restaurant.
- menuName -> the name of the nemu.
- menuDescription -> the description of the nemu. could be empty
- menuPrice -> the price of the menu
- menuId -> the id of the menu

Do not change any value for the data and do not delete any row.

Create a new column named class. This only have two value, such as drink and food.

For each data, your job is to classify whether the data refer to a food or drink and set the value for class for the data.

You must return the csv data, do not add additional comment. Return result in csv with the same format as I mentioned before.
`;

const APIKEY =
  "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";
(async function main() {
  //
  const model = new ChatAnthropic({
    apiKey: APIKEY,
    model: "claude-3-5-sonnet-20240620",
  });

  const data = await fs.readFile("batch/batch_0.csv", { encoding: "utf-8" });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are an expert data scientist"],
    ["human", basePrompt],
    ["human", "{data}"],
  ]);

  const prom = await prompt.format({ data });

  const chain = prompt.pipe(model);

  const result = await chain.invoke({ data: data });

  await fs.writeFile("prompt.txt", prom as string, {
    encoding: "utf8",
  });

  await fs.writeFile("result.txt", result.content as string, {
    encoding: "utf8",
  });
})();
