// ============================================================
// Safe, idempotent CMS seeder:
// Seeds default site settings, homepage record & sections, and menu items.
// Does NOT delete or alter existing research, publications, or users.
// ============================================================

import { PrismaClient } from "@prisma/client";
import { DEFAULT_SITE_SETTINGS, DEFAULT_HOME_SECTIONS } from "../src/lib/cms-defaults";
import { getFallbackHeaderNav, getFallbackFooterColumns } from "../src/lib/site-navigation";

const db = new PrismaClient();

async function main() {
  console.log("Starting CMS database seeding...");

  // 1. Seed Site Settings (non-destructive: do NOT overwrite existing admin values)
  console.log("Seeding site settings...");
  for (const s of DEFAULT_SITE_SETTINGS) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      update: {
        // Leave existing value, valueBn, label, etc. intact to preserve admin customizations
      },
      create: {
        key: s.key,
        value: s.value,
        valueBn: s.valueBn,
        type: s.type,
        group: s.group,
        label: s.label,
        labelBn: s.labelBn,
        sortOrder: s.sortOrder,
      },
    });
  }
  console.log(`Seeded / verified ${DEFAULT_SITE_SETTINGS.length} site settings.`);

  // 2. Seed Home Page & Page Sections (non-destructive)
  console.log("Seeding Homepage and Sections...");
  const homePage = await db.page.upsert({
    where: { slug: "home" },
    update: {
      // Do not overwrite admin modifications to homepage
    },
    create: {
      slug: "home",
      title: "Home",
      titleBn: "হোম",
      description: "LENS Homepage — Lighthouse for Evolving Narrative Systems",
      descriptionBn: "লেন্স হোমপেজ — লাইটহাউস ফর ইভলভিং ন্যারেটিভ সিস্টেমস",
      status: "published",
      publishedAt: new Date(),
      template: "home",
      metaTitle: "LENS — Lighthouse for Evolving Narrative Systems",
      metaDescription: "Evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh.",
    },
  });

  for (const sec of DEFAULT_HOME_SECTIONS) {
    const existing = await db.pageSection.findFirst({
      where: { pageId: homePage.id, type: sec.type },
    });

    if (!existing) {
      const data = {
        pageId: homePage.id,
        type: sec.type,
        title: sec.title,
        titleBn: sec.titleBn,
        description: sec.description,
        descriptionBn: sec.descriptionBn,
        sortOrder: sec.sortOrder,
        visible: sec.visible,
        settings: JSON.stringify(sec.settings),
        content: JSON.stringify(sec.content),
        contentBn: JSON.stringify(sec.contentBn),
      };
      await db.pageSection.create({ data });
    }
  }
  console.log(`Verified / seeded home sections.`);

  // 3. Seed Menu Items
  console.log("Seeding Navigation Menu Items...");
  const currentMenus = await db.menuItem.count();
  if (currentMenus === 0) {
    const headerNav = getFallbackHeaderNav();
    let order = 0;
    for (const item of headerNav) {
      const parent = await db.menuItem.create({
        data: {
          location: "header",
          label: item.id.charAt(0).toUpperCase() + item.id.slice(1),
          labelBn: "",
          url: item.href || item.plannedHref || "/",
          sortOrder: order++,
          visible: true,
          target: "_self",
        },
      });

      if (item.children && item.children.length > 0) {
        let childOrder = 0;
        for (const child of item.children) {
          await db.menuItem.create({
            data: {
              location: "header",
              label: child.id.charAt(0).toUpperCase() + child.id.slice(1).replace("-", " "),
              labelBn: "",
              url: child.href || child.plannedHref || "#",
              sortOrder: childOrder++,
              visible: true,
              target: "_self",
              parentId: parent.id,
            },
          });
        }
      }
    }

    const footerCols = getFallbackFooterColumns();
    for (let colIdx = 0; colIdx < footerCols.length; colIdx++) {
      const col = footerCols[colIdx];
      const colParent = await db.menuItem.create({
        data: {
          location: "footer",
          label: col.id.charAt(0).toUpperCase() + col.id.slice(1),
          labelBn: "",
          url: "#",
          sortOrder: colIdx * 10,
          visible: true,
          target: "_self",
        },
      });

      let linkOrder = 0;
      for (const link of col.links) {
        await db.menuItem.create({
          data: {
            location: "footer",
            label: link.id.charAt(0).toUpperCase() + link.id.slice(1),
            labelBn: "",
            url: link.href || link.plannedHref || "#",
            sortOrder: linkOrder++,
            visible: true,
            target: "_self",
            parentId: colParent.id,
          },
        });
      }
    }
    console.log("Seeded default header and footer menu items.");
  } else {
    console.log(`Menu items already present (${currentMenus}), skipping menu seed.`);
  }

  console.log("CMS database seeding successfully completed.");
}

main()
  .catch((e) => {
    console.error("Error during CMS seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
