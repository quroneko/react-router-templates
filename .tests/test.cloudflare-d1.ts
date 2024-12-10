import { expect, Page } from "@playwright/test";
import getPort from "get-port";

import { matchLine, testTemplate, urlRegex } from "./utils.js";

const test = testTemplate("cloudflare-d1");

test("typecheck", async ({ $ }) => {
  await $(`pnpm typecheck`);
});

test("dev", async ({ page, $ }) => {
  await $(`pnpm db:migrate`);

  const port = await getPort();
  const dev = $(`pnpm dev --port ${port}`);

  const url = await matchLine(dev.stdout, urlRegex.viteDev);
  await workflow({ page, url });
});

test("build + start", async ({ page, $ }) => {
  await $(`pnpm db:migrate`);

  await $(`pnpm build`);

  const port1 = await getPort();
  const port2 = await getPort();
  const start = $(`pnpm start --port ${port1} --inspector-port ${port2}`);

  const url = await matchLine(start.stdout, urlRegex.wrangler);
  await workflow({ page, url });
});

async function workflow({ page, url }: { page: Page; url: string }) {
  await page.goto(url);
  await expect(page).toHaveTitle(/New React Router App/);

  await page.getByRole("link", { name: "React Router Docs" }).waitFor();
  await page.getByRole("link", { name: "Join Discord" }).waitFor();

  const randomText = Math.random().toString(36).substring(7);
  await page.getByRole("textbox", { name: "Name" }).fill(randomText);
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(`email${randomText}@example.com`);
  await page.getByRole("button", { name: "Sign Guest Book" }).click();
  await page.getByText(randomText).waitFor();

  await page.goto(url);
  await page.getByText(randomText).waitFor();
}