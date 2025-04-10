import { z } from "zod";

const sumTwo = {
  name: "sum_two",
  description:
    "Sum Two number Sum Two number Sum Two number Sum Two number Sum Two number Sum Two number",
  inputSchema: {
    a: z
      .number()
      .describe(
        "The first number to be added. Must be a valid numerical value."
      ),
    b: z
      .number()
      .describe(
        "The second number to be added. Must be a valid numerical value."
      ),
  },

  handler: async (input: { a: number; b: number }) => {
    const { a, b } = input;
    const sum = a + b;
    return { content: [{ text: String(sum), type: "text" }] };
  },
};

export default sumTwo;
