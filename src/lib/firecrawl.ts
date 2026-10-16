import { Firecrawl } from "firecrawl";
import { ValidationError } from "../types/app-error.js";
import { getEncoding } from "js-tiktoken";
import { WebsitePage } from "../validators/source.validator.js";

const encoding = getEncoding("cl100k_base");

const VIRTUAL_PAGE_TOKENS = 2000;

const client = new Firecrawl({
    apiKey: process.env.FIRECRAWL_API_KEY
});

export async function scrapeWebsite(url: string) {
    const scrapeData = await client.scrape(url, {
        formats: ["markdown"]
    });
    const markdown = scrapeData.markdown?.trim();
    if (!markdown) throw new ValidationError("Website didn't scraped");

    return {
        markdown,
        title: scrapeData.metadata?.title,
        sourceUrl: scrapeData.metadata?.sourceURL
    }
}

export function paginateWebsiteMarkdown(
    markdown: string,
): WebsitePage[] {
    const content = markdown.trim();

    if (!content) {
        return [];
    }

    const pages: WebsitePage[] = [];
    let currentPage = "";
    let currentTokens = 0;

    // Preserve headings, paragraphs, lists, and code blocks
    // as much as possible.
    const blocks = content
        .split(/\n(?=#{1,6}\s)|\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);

    const addPage = () => {
        if (!currentPage.trim()) return;

        pages.push({
            pageNumber: pages.length + 1,
            text: currentPage.trim(),
        });

        currentPage = "";
        currentTokens = 0;
    };

    for (const block of blocks) {
        const blockTokens = encoding.encode(block).length;

        // Keep unusually large blocks from exceeding the page target.
        if (blockTokens > VIRTUAL_PAGE_TOKENS) {
            addPage();

            const tokenIds = encoding.encode(block);

            for (
                let start = 0;
                start < tokenIds.length;
                start += VIRTUAL_PAGE_TOKENS
            ) {
                const piece = encoding.decode(
                    tokenIds.slice(start, start + VIRTUAL_PAGE_TOKENS),
                );

                pages.push({
                    pageNumber: pages.length + 1,
                    text: piece,
                });
            }

            continue;
        }

        if (
            currentTokens + blockTokens > VIRTUAL_PAGE_TOKENS
        ) {
            addPage();
        }

        currentPage += `${currentPage ? "\n\n" : ""}${block}`;
        currentTokens += blockTokens;
    }

    addPage();

    return pages;
}