import { describe, it, expect } from 'vitest';
import { pickLocale, parseTabsConfig } from '@/components/page/TabsSection';
import { SECTION_TYPE_DEFS } from '@/components/admin/PageSectionEditor';
import { TEMPLATES } from '@/app/admin/pages/new/page';
import { RESERVED_SLUGS } from '@/lib/cms-validation';
import { deleteFromStorage } from '@/lib/storage';

describe('TabsSection Data Structures & Locale Resolution', () => {
  it('correctly picks locale with fallback', () => {
    expect(pickLocale(false, 'English Text', 'বাংলা পাঠ্য')).toBe('English Text');
    expect(pickLocale(true, 'English Text', 'বাংলা পাঠ্য')).toBe('বাংলা পাঠ্য');
    expect(pickLocale(true, 'English Only', undefined)).toBe('English Only');
    expect(pickLocale(false, undefined, 'বাংলা মাত্র')).toBeUndefined();
    expect(pickLocale(true, undefined, undefined)).toBeUndefined();
  });

  it('correctly parses tabs configuration from section content JSON', () => {
    const rawContent = {
      defaultTabId: 'tab-1',
      tabs: [
        {
          id: 'tab-1',
          label: 'Policy Analysis',
          labelBn: 'নীতি বিশ্লেষণ',
          description: 'Overview of policy research',
          innerTabs: [
            {
              id: 'inner-1',
              label: 'Youth Policy',
              labelBn: 'যুব নীতি',
              blocks: [
                {
                  id: 'b-1',
                  type: 'rich_text',
                  richText: '<p>Youth engagement is crucial.</p>',
                  richTextBn: '<p>যুব সম্পৃক্ততা অত্যন্ত জরুরি।</p>',
                },
                {
                  id: 'b-2',
                  type: 'cards',
                  cards: [
                    {
                      id: 'c-1',
                      title: 'Card 1',
                      titleBn: 'কার্ড ১',
                      description: 'Desc 1',
                    },
                  ],
                },
                {
                  id: 'b-3',
                  type: 'downloads',
                  downloads: [
                    {
                      id: 'd-1',
                      title: 'Policy Brief 2026',
                      url: 'https://lensbd.org/files/brief.pdf',
                      size: '1.2 MB',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = parseTabsConfig(rawContent);
    const firstTab = parsed.tabs[0]!;
    expect(firstTab.id).toBe('tab-1');
    expect(firstTab.label).toBe('Policy Analysis');
    expect(firstTab.labelBn).toBe('নীতি বিশ্লেষণ');
    expect(firstTab.innerTabs).toHaveLength(1);
    const firstInner = firstTab.innerTabs![0]!;
    const blocks = firstInner.blocks!;
    expect(blocks).toHaveLength(3);
    expect(blocks[0]!.type).toBe('rich_text');
    expect(blocks[1]!.type).toBe('cards');
    expect(blocks[2]!.type).toBe('downloads');
  });

  it('handles empty or legacy array structure gracefully in parseTabsConfig', () => {
    const emptyResult = parseTabsConfig(null);
    expect(emptyResult.tabs).toEqual([]);

    const arrayResult = parseTabsConfig([
      { id: 't1', label: 'Tab 1', innerTabs: [] },
    ]);
    expect(arrayResult.tabs).toHaveLength(1);
    expect(arrayResult.tabs[0].label).toBe('Tab 1');
  });
});

describe('Section Types & CMS Coverage Registry', () => {
  it('registers tabs in SECTION_TYPE_DEFS alongside standard section types', () => {
    const types = SECTION_TYPE_DEFS.map((s) => s.type);
    expect(types).toContain('tabs');
    expect(types).toContain('hero');
    expect(types).toContain('rich_text');
    expect(types).toContain('cards');
    expect(types).toContain('faq');
    expect(types).toContain('stats');
    expect(types).toContain('cta');
    expect(types).toContain('banner');
  });

  it('defines tabs section fields with configurable titles and guidance', () => {
    const tabsDef = SECTION_TYPE_DEFS.find((s) => s.type === 'tabs');
    expect(tabsDef).toBeDefined();
    expect(tabsDef?.label).toBe('Tabs & Nested Tabs');
    const fieldKeys = tabsDef?.fields.map((f) => f.key);
    expect(fieldKeys).toContain('eyebrow');
    expect(fieldKeys).toContain('subtitle');
  });
});

describe('Reusable Dynamic Page Templates & Slug Validation', () => {
  it('provides all required reusable templates for page creation', () => {
    const templateIds = TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain('default');
    expect(templateIds).toContain('tabs_showcase');
    expect(templateIds).toContain('research');
    expect(templateIds).toContain('resources');
    expect(templateIds).toContain('contact');
    expect(templateIds).toContain('custom');
  });

  it('ensures each template has valid initial bilingual sections', () => {
    for (const t of TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      for (const s of t.defaultSections) {
        expect(s.type).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.titleBn).toBeTruthy();
        expect(typeof s.content).toBe('object');
        expect(typeof s.contentBn).toBe('object');
      }
    }
  });

  it('protects core system routes in RESERVED_SLUGS from collision', () => {
    expect(RESERVED_SLUGS.has('home')).toBe(true);
    expect(RESERVED_SLUGS.has('admin')).toBe(true);
    expect(RESERVED_SLUGS.has('api')).toBe(true);
    expect(RESERVED_SLUGS.has('about')).toBe(true);
    expect(RESERVED_SLUGS.has('events')).toBe(true);
    expect(RESERVED_SLUGS.has('blog')).toBe(true);
    expect(RESERVED_SLUGS.has('resources')).toBe(true);
    expect(RESERVED_SLUGS.has('clubs')).toBe(true);
    expect(RESERVED_SLUGS.has('courses')).toBe(true);
    expect(RESERVED_SLUGS.has('theme')).toBe(true);
    expect(RESERVED_SLUGS.has('indexing')).toBe(true);
    expect(RESERVED_SLUGS.has('contact')).toBe(true);
    expect(RESERVED_SLUGS.has('donate')).toBe(true);
  });
});

describe('Cloudflare R2 & Safe Storage Deletion', () => {
  it('does not throw when deleting a non-existent local file fallback', async () => {
    await expect(deleteFromStorage('non-existent-test-file.png')).resolves.not.toThrow();
  });
});
