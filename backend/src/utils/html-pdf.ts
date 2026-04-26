import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import createLogger from './logger';
import { executablePath } from 'puppeteer';
import { appConfig } from '../constants/appConfig';
const log = createLogger('htmltoPdf');
/**
 * Converts HTML content to a styles PDF using puppeteer
 */
export async function convertHtmlToPdf(
    htmlContent: string,
    outputPath: string,
    isWorkSheet: boolean = false,
    title = 'Unique questions'
): Promise<string> {
    log.highlight('Converting HTML to pdf...');
    const startTime = Date.now();
    const outputDir = join(outputPath, '..');

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath:
            'C:\\Users\\User\\.cache\\puppeteer\\chrome\\win64-147.0.7727.57\\chrome-win64\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    });
    try {
        const page = await browser.newPage();
        //set viewport for consistent rendering
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2,
        });
        //inject MathJax-ready html if not already present
        const processedHtml = ensureProperHtml(htmlContent, title, isWorkSheet);
        //write HTML to temp file for debugging (optional)
        const htmlDebugPath = outputPath.replace('.pdf', '.html');
        writeFileSync(htmlDebugPath, processedHtml, 'utf-8');
        log.debug(
            `Check to see if the processed html has content ${processedHtml.length}`
        );
        log.info(`Debug html saved to ${htmlDebugPath}`);

        //load html content
        await page.setContent(processedHtml, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: appConfig.puppeteerTimeout,
        });
        // 2. Wait for your container to exist
        await page.waitForSelector('.extracted-content', { timeout: 5000 });
        // FORCE a wait for a specific element that SHOULD be there
        // This ensures we don't print a blank page
        try {
            await page.waitForSelector('.extracted-content', { timeout: 5000 });
        } catch (e) {
            log.warn(
                'Warning: .extracted-content class not found before printing.'
            );
        }
        //wait for mathjax to render if present
        const hasMathJax =
            processedHtml.includes('mathjax') ||
            processedHtml.includes('MathJax');

        // 2. Check for actual LaTeX delimiters (e.g., \( \), \[ \], or $)
        // This regex looks for common math patterns
        const hasMathContent = /\\\(|\\\[|\$|\\begin\{/.test(processedHtml);

        if (hasMathJax && hasMathContent) {
            log.info('Waiting for math jax to render formulas...');
            try {
                //wait for MathJax to finish type setting
                /*await page.waitForFunction(
                    () => {
                       
                        const win = globalThis as any;
                        return (
                            win.MathJax &&
                            (win.MathJax as Record<string, unknown>)
                                .typesetPromise
                        );
                    },
                    { timeout: 30000 }
                );
                //trigger type setting if needed
                await page.evaluate(async () => {
                    const win = globalThis as any;
                    const mathJax = win.MathJax as Record<
                        string,
                        (...args: unknown[]) => Promise<unknown>
                    >;
                    if (mathJax && mathJax.typesetPromise) {
                        await mathJax.typesetPromise();
                    }
                });
                //give extra time for rendering
                await new Promise((render) => setTimeout(render, 3000));
                log.highlight('Math Jax render complete');*/
                await page.evaluate(async () => {
                    const win = globalThis as any;

                    // Safety check: if MathJax failed to load, don't hang the loop
                    const startTime = Date.now();
                    while (!win.MathJax?.typesetPromise) {
                        if (Date.now() - startTime > 5000)
                            throw new Error('MathJax Load Timeout');
                        await new Promise((r) => setTimeout(r, 100));
                    }

                    await win.MathJax.typesetPromise();
                });

                await new Promise((r) => setTimeout(r, 1000));
                log.highlight('MathJax render complete');
            } catch (error) {
                log.error(
                    'Math jax render timeout continuing with the raw LaTex'
                );
            }
        }
        //generate PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm',
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 9px; width: 100%; text-align: center; color: #666; padding: 5px 20px;">
                ${title}
                </div>
            `,
            footerTemplate: `
                <div style="font-family: 'Georgia', serif; font-size: 8px; width: 100%; text-align: center; color: #95a5a6; padding: 10px 20px; border-top: 1px solid #eee;">
                    <div style="margin-bottom: 3px;">
                        Generated by <strong>Tidy Up</strong> | Contact: +254 113868425 | phinjugushdev@gmail.com
                    </div>
                    <div>
                        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                    </div>
                </div>
            `,
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        log.highlight(`PDF generated: ${outputPath} (${duration}s)`);
        return outputPath;
    } catch (error) {
        log.error('Error in generating pdf', { data: { error } });
        return '';
    } finally {
        await browser.close();
    }
}
function ensureProperHtml(
    htmlContent: string,
    title: string,
    isWorkSheet: boolean = false
): string {
    const worksheetStyles = `
        .question {
            margin-bottom: 150px !important; /* Space for student to write */
            border-bottom: 1px dashed #bdc3c7 !important;
            background: #ffffff !important; /* Clean for printing */
            page-break-inside: avoid;
        }
        .question::after {
            content: "Answer:";
            display: block;
            margin-top: 15px;
            font-weight: bold;
            color: #7f8c8d;
        }
    `;
    // If already a complete HTML document, return as-is
    if (
        htmlContent.includes('<!DOCTYPE html>') ||
        htmlContent.includes('<html')
    ) {
        let processed = htmlContent;
        if (appConfig.enableMathRendering && !htmlContent.includes('mathjax')) {
            processed = injectMathJax(processed, title);
        }

        // Inject worksheet styles if requested
        if (isWorkSheet) {
            processed = processed.replace(
                '</head>',
                `<style>${worksheetStyles}</style>\n</head>`
            );
        }
        return processed;
    }
    // Wrap in a complete HTML document
    /**
     * might add 
     * @media print {
    .question-block {
        page-break-inside: avoid;
    }
    }
     */
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)']],
        displayMath: [['\\\\[', '\\\\]']],
        processEscapes: true,
      },
      startup: {
        pageReady: () => {
          return MathJax.startup.defaultPageReady();
        }
      }
    };
  </script>
  <style>
    @page {
      margin: 20mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', 'Cambria', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 18pt;
      text-align: center;
      border-bottom: 2px solid #2c3e50;
      padding-bottom: 12px;
      margin-bottom: 30px;
      color: #2c3e50;
    }
    h2 {
      font-size: 14pt;
      color: #34495e;
      margin-top: 25px;
      margin-bottom: 12px;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 6px;
    }
    h3 {
      font-size: 12pt;
      color: #445566;
      margin-top: 20px;
    }
    .question {
      margin: 18px 0;
      padding: 15px 18px;
      border-left: 4px solid #3498db;
      background: #f8f9fa;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
    }
      /* AREA: Conditional Worksheet Overrides */
    ${isWorkSheet ? worksheetStyles : ''}
    .question-number {
      font-weight: bold;
      color: #2c3e50;
      font-size: 12pt;
      margin-bottom: 8px;
    }
    .question-text {
      margin-left: 0;
    }
    .question-text p {
      margin: 8px 0;
    }
    .sub-parts {
      margin-left: 20px;
      margin-top: 10px;
    }
    .sub-part {
      margin: 6px 0;
      padding: 4px 0;
    }
    .marks {
      float: right;
      color: #7f8c8d;
      font-style: italic;
    }
    .options {
      margin: 10px 0 10px 25px;
    }
    .option {
      margin: 4px 0;
      padding: 3px 0;
    }
    .diagram-placeholder {
      text-align: center;
      margin: 15px 0;
      padding: 20px;
      border: 1px dashed #95a5a6;
      background: #ecf0f1;
      color: #7f8c8d;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      margin: 15px 0;
      width: 100%;
    }
    th, td {
      border: 1px solid #bdc3c7;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #ecf0f1;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }
    pre {
      background: #f0f0f0;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 10pt;
    }
    blockquote {
      border-left: 3px solid #bdc3c7;
      margin: 10px 0;
      padding-left: 15px;
      color: #555;
      font-style: italic;
    }
    .section {
      margin-bottom: 30px;
    }
    mjx-container {
      font-size: 105% !important;
    }
    .header-info {
      text-align: center;
      margin-bottom: 20px;
      color: #555;
      font-size: 10pt;
    }
      /* This makes the numbering look professional and bold */
        .extracted-content ol {
            list-style-type: decimal;
            padding-left: 25px;
        }

        .extracted-content ol li {
            margin-bottom: 20px;
            font-weight: 500;
        }

        /* For sub-questions (a, b, c) */
        .extracted-content ol li ol {
            list-style-type: lower-alpha;
            margin-top: 10px;
        }
  </style>
</head>
<body>
 ${
     isWorkSheet
         ? `
    <div style="text-align: right; margin-bottom: 20px; font-size: 10pt; color: #666;">
        Name: ___________________________________ Date: _______________
    </div>`
         : ''
 }
  <h1>${title}</h1>
  <div class="extracted-content">
    ${htmlContent}
  </div>
</body>
</html>`;
}
function injectMathJax(html: string, title: string): string {
    // Insert MathJax script before closing </head>
    const mathJaxScripts = `
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)']],
        displayMath: [['\\\\[', '\\\\]']],
        processEscapes: true,
      },
      startup: {
        pageReady: () => MathJax.startup.defaultPageReady()
      }
    };
  </script>`;

    if (html.includes('</head>')) {
        return html.replace('</head>', `${mathJaxScripts}\n</head>`);
    }

    // If no </head>, just return as-is
    return html;
}
export function saveHtml(htmlContent: string, outputPath: string): string {
    const htmlPath = outputPath.endsWith('.html')
        ? outputPath
        : outputPath.replace('.pdf', '.html');
    const dir = join(htmlPath, '..');
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    writeFileSync(htmlPath, htmlContent, 'utf-8');
    log.highlight(`HTML saved: ${htmlPath}`);
    return htmlPath;
}
