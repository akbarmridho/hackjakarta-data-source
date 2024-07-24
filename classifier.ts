import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import fs from "fs/promises";
import fss from "fs";

process.env["LANGCHAIN_TRACING_V2"] = "true";
process.env["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com";
process.env["LANGCHAIN_API_KEY"] = "";

const basePrompt = `
I attached a CSV file that is separated by semicolon with the following columns.
- menuId -> menu id.
- menuName -> menu name.
- menuDescription -> menu description. could be empty.
- restaurantTags -> restaurant tags.
- restaurantCuisine -> restaurant cuisine.

Do not change any value for the data and do not delete any row.

Your task is to return these columns.
- menuId
- menuName
- menuTag -> tag associated with this menu
- dishType -> types separated with comma. Could be drink or food
- menuType -> appetizer, dessert, main course, etc
- cuisine -> indonesian, chinese, indian, etc. Try to return approximate cuisine type, do not write international.
- associatedKeywords -> unique association with this menu
- flavor -> spicy, sweet, sour, etc
- portion -> estimate menu portion for x person based on menuName. Write only the number.
- mealTime -> usual mealtime, whether breakfast, lunch, dinner, or anytime
- occasion -> food occasion, whether casual, event, formmal, etc


You must return the csv data, do not add additional comment. Return result in csv with the same format as I mentioned before.
`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const APIKEY = "";
(async function main() {
  //
  const model = new ChatAnthropic({
    apiKey: APIKEY,
    model: "claude-3-5-sonnet-20240620",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are an expert data scientist"],
    ["human", basePrompt],
    ["human", "{data}"],
  ]);

  const chain = prompt.pipe(model);

  const batches = await fs.readdir("batch");

  for (const batch of batches) {
    const exist = fss.existsSync(`batch_classified/${batch}`);

    if (exist) {
      continue;
    }

    console.log(`generating for ${batch}`);

    const data = await fs.readFile(`batch/${batch}`, {
      encoding: "utf-8",
    });

    const result = await chain.invoke({ data: data });

    await fs.writeFile(`batch_classified/${batch}`, result.content as string, {
      encoding: "utf8",
    });

    await sleep(5000);
  }
})();
