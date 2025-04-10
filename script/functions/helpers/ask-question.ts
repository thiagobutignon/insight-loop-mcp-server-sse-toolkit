import { createInterface } from "readline";

export const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

export function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    readline.question(query, (answer) => {
      resolve(answer);
    });
  });
}
