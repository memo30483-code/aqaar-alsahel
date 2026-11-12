import { expect, test } from "@playwright/test";

/**
 * شبكة أمان ضد عودة التمرير الأفقي.
 *
 * القائمة العلوية تحتوي 12 عنصرًا في صف واحد، وكانت تحتاج ~1540px، فكانت
 * تتمدد خارج الشاشة بين 1280px و1650px (وأيضًا حول 1920px) وتصنع مسطرة
 * تمرير أفقية أسفل الصفحة.
 *
 * نقيس حدود العناصر نفسها (getBoundingClientRect) لا `scrollWidth` فقط،
 * لأن `overflow-x: clip` على <html> يخفي الأثر ولا يلغي التجاوز.
 */

const PATHS = [
  "/",
  "/projects",
  "/property/dm-1",
  "/wanted-properties",
  "/request-property",
];

const WIDTHS = [1280, 1366, 1536, 1920];

interface Overflowing {
  tag: string;
  className: string;
  overLeft: number;
  overRight: number;
}

const settle = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

test.describe("لا يوجد تمرير أفقي على سطح المكتب", () => {
  test("كل الصفحات تبقى داخل عرض الشاشة", async ({ page }) => {
    const problems: string[] = [];

    for (const path of PATHS) {
      await page.goto(path);
      await page.waitForLoadState("load");

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(settle);

        const overflowing = await page.evaluate(() => {
          const doc = document.documentElement;
          const viewport = doc.clientWidth;
          const clipped = (element: Element) => {
            let parent = element.parentElement;
            while (parent && parent !== doc) {
              const style = getComputedStyle(parent);
              if (style.position === "fixed") return true;
              if (style.overflowX !== "visible" || style.overflowY !== "visible") {
                return true;
              }
              parent = parent.parentElement;
            }
            return false;
          };
          const found: Overflowing[] = [];
          document.querySelectorAll("body *").forEach((element) => {
            if (getComputedStyle(element).position === "fixed") return;
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return;
            const overRight = Math.round(rect.right - viewport);
            const overLeft = Math.round(-rect.left);
            if (overRight <= 1 && overLeft <= 1) return;
            if (clipped(element)) return;
            found.push({
              tag: element.tagName.toLowerCase(),
              className: (element.getAttribute("class") ?? "").slice(0, 80),
              overLeft,
              overRight,
            });
          });
          return found.slice(0, 5);
        });

        if (overflowing.length > 0) {
          problems.push(`${path} @ ${width}px → ${JSON.stringify(overflowing)}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  test("عناصر الهيدر الثانوية تُطوى عندما لا يكفي العرض وتظهر عندما يكفي", async ({
    page,
  }) => {
    const header = page.locator("header");

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    // الروابط الأساسية ظاهرة دائمًا على سطح المكتب
    await expect(
      header.getByRole("link", { name: "المشاريع", exact: true })
    ).toBeVisible();
    // العناصر الثانوية (اطلب عقارك) تُطوى داخل زر القائمة
    await expect(
      header.getByRole("button", { name: "القائمة" })
    ).toBeVisible();
    await expect(
      header.getByRole("link", { name: "اطلب عقارك" })
    ).toBeHidden();

    await page.setViewportSize({ width: 1700, height: 900 });
    await page.evaluate(settle);

    await expect(
      header.getByRole("button", { name: "القائمة" })
    ).toBeHidden();
    await expect(
      header.getByRole("link", { name: "اطلب عقارك" })
    ).toBeVisible();
  });
});
