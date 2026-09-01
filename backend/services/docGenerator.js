// backend/services/docGenerator.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { generatePDF } from "./pdfGenerator.js";
import { getPdfToDocxConverter } from "./pdfToDocxConverter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Document Generator Service
 * Generates DOCX with Native Word Headers, Footers, and TOC
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN EXPORT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const generateDocument = async (html, options = {}) => {
  const {
    format = "docx",
    title = "Curriculum Document",
    programName = "Program Document",
    mode = "pd",
    returnMarkers = false,
    headerText = null,
    footerText = null,
    tocItems = null,
    pageNumbers = true,
  } = options;

  console.log(`📄 Generating ${format.toUpperCase()} document...`);

  if (!html) {
    throw new Error("HTML content is required");
  }

  try {
    let buffer;

    switch (format.toLowerCase()) {
      case "docx":
        buffer = await generateDocxWithNativeHeaders(html, { 
          title, 
          programName, 
          mode,
          headerText,
          footerText,
          tocItems,
          pageNumbers,
        });
        break;
      case "doc":
        buffer = await generateWordDoc(html, { 
          title, 
          programName, 
          mode,
          headerText,
          footerText,
          tocItems,
          pageNumbers,
        });
        break;
      case "html":
        buffer = await generateHtmlDocument(html, { title, programName, mode });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log(`✅ ${format.toUpperCase()} generated (${buffer.length} bytes)`);

    if (returnMarkers) {
      const markerMap = await extractMarkersFromHtml(html);
      return { buffer, markerMap };
    }

    return buffer;
  } catch (error) {
    console.error(`❌ Failed to generate ${format}:`, error.message);
    throw new Error(`Document generation failed: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GENERATE DOCX WITH NATIVE WORD HEADERS & FOOTERS
// ─────────────────────────────────────────────────────────────────────────────

const generateDocxWithNativeHeaders = async (html, options = {}) => {
  const { 
    title, 
    programName, 
    mode,
    headerText,
    footerText,
    tocItems,
    pageNumbers,
  } = options;

  console.log("📄 Generating DOCX with Native Word Headers & Footers...");

  try {
    // Step 1: Generate PDF
    const pdfBuffer = await generatePDF(html, {
      format: "A4",
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "15mm",
        right: "15mm",
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log(`✅ PDF generated (${pdfBuffer.length} bytes)`);

    // Step 2: Create temp directory
    const tempDir = path.join(os.tmpdir(), "pdf-conversion");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPdfPath = path.join(tempDir, `curriculum-${Date.now()}.pdf`);
    const tempDocxPath = path.join(tempDir, `curriculum-${Date.now()}.docx`);

    // Step 3: Write PDF to temp file
    await fs.promises.writeFile(tempPdfPath, pdfBuffer);
    console.log(`📄 PDF saved to: ${tempPdfPath}`);

    // Step 4: Convert PDF to DOCX using Python pdf2docx
    console.log("🔄 Step 2: Converting PDF to DOCX using Python pdf2docx...");
    
    const converter = getPdfToDocxConverter();
    
    const isAvailable = await converter.checkDependencies();
    if (!isAvailable) {
      throw new Error("Python or pdf2docx not available");
    }

    await converter.convert(tempPdfPath, tempDocxPath);

    // Step 5: Read the converted DOCX
    let docxBuffer = await fs.promises.readFile(tempDocxPath);

    // Clean up temp files
    try {
      await fs.promises.unlink(tempPdfPath);
      await fs.promises.unlink(tempDocxPath);
      console.log(`🧹 Cleaned up temp files`);
    } catch (cleanupError) {
      console.warn("Could not clean up temp files:", cleanupError.message);
    }

    console.log(`✅ DOCX generated (${docxBuffer.length} bytes)`);
    return docxBuffer;

  } catch (error) {
    console.error("PDF/DOCX generation failed:", error.message);
    // Fallback: Use Word HTML with native headers
    console.log("🔄 Falling back to Word HTML with Native Headers...");
    return generateWordDocWithNativeHeaders(html, options);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. WORD DOC WITH NATIVE HEADERS & FOOTERS
// ─────────────────────────────────────────────────────────────────────────────

const generateWordDocWithNativeHeaders = async (html, options = {}) => {
  const { 
    title, 
    programName, 
    mode,
    headerText,
    footerText,
    tocItems,
    pageNumbers,
  } = options;

  let cleanHtml = html
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\*\*/g, '')
    .replace(/#/g, '');

  // Build TOC HTML
  let tocHtml = '';
  if (tocItems && tocItems.length > 0) {
    tocHtml = `
      <div style="page-break-after: always;">
        <h1 style="text-align: center; font-size: 18pt; font-family: 'Times New Roman', Times, serif; margin-bottom: 30px;">
          Table of Contents
        </h1>
        ${tocItems.map((item, index) => `
          <div style="
            display: flex; 
            justify-content: space-between; 
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            ${item.level > 0 ? 'padding-left: 20px;' : ''}
          ">
            <span>${item.title}</span>
            <span>${item.page || '—'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Default header text
  const defaultHeader = headerText || `${programName || 'Curriculum'} Document ${options.schemeYear || '2026'}`;
  const defaultFooter = footerText || `GM University, Davanagere`;

  const wordHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  
  <title>${title}</title>
  
  <style>
    /* =====================================================
       PAGE SETUP
       ===================================================== */
    
    @page {
      size: A4 portrait;
      margin: 2.54cm 3.17cm 2.54cm 3.17cm;
      mso-page-orientation: portrait;
      mso-header-margin: 1.5cm;
      mso-footer-margin: 1.5cm;
    }
    
    /* =====================================================
       HEADER & FOOTER - Word Native Elements
       ===================================================== */
    
    div.Header {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #5a1719;
      text-align: center;
      border-bottom: 1px solid #5a1719;
      padding-bottom: 4px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    div.Footer {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #5a1719;
      text-align: center;
      border-top: 1px solid #5a1719;
      padding-top: 4px;
      margin-top: 10px;
    }
    
    /* =====================================================
       BODY STYLES
       ===================================================== */
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      margin: 0;
      padding: 0;
    }
    
    /* =====================================================
       COVER PAGE
       ===================================================== */
    
    .pd-cover {
      text-align: center;
      padding: 40px;
      border: 3px double #000;
      max-width: 100%;
      box-sizing: border-box;
      font-family: 'Times New Roman', Times, serif;
      page-break-after: always;
    }
    
    .pd-cover-uni {
      font-size: 26pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      color: #5a1719;
    }
    
    .pd-cover-type {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 20px;
      letter-spacing: 2px;
    }
    
    .pd-cover-scheme {
      font-size: 12pt;
      text-transform: uppercase;
      color: #333;
      margin-top: 5px;
    }
    
    .pd-cover-program {
      font-size: 22pt;
      font-weight: bold;
      margin: 40px 0;
      padding: 20px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    
    .pd-cover-school {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 40px;
    }
    
    /* =====================================================
       HEADINGS
       ===================================================== */
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14pt;
      font-weight: bold;
      line-height: 1.5;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .pd-int-hdr {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    
    .pd-int-hdr-prog {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #000;
    }
    
    .pd-int-hdr-meta {
      font-size: 10pt;
      color: #555;
    }
    
    .pd-sec-major {
      font-size: 14pt;
      font-weight: bold;
      background: #000000;
      color: #ffffff;
      padding: 6px 12px;
      margin: 30px 0 15px;
      text-transform: uppercase;
      page-break-after: avoid;
    }
    
    .pd-sec-minor {
      font-size: 14pt;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin: 20px 0 10px;
      color: #000;
      page-break-after: avoid;
    }
    
    /* =====================================================
       PARAGRAPHS
       ===================================================== */
    
    p, .pd-rich p, .pd-rich li {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 0 0 8px 0;
      text-align: justify;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .pd-rich ul, .pd-rich ol {
      margin: 4px 0 10px 0;
      padding-left: 24px;
    }
    
    /* =====================================================
       TABLES
       ===================================================== */
    
    table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
    }
    
    th, td {
      border: 1px solid #000000;
      padding: 8px 10px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      max-width: 100%;
      vertical-align: top;
    }
    
    th {
      background: #e0e0e0;
      font-weight: bold;
      text-align: center;
    }
    
    tfoot td {
      background: #f5f5f5;
      font-weight: bold;
      text-align: center;
    }
    
    .w-serial { width: 50px; text-align: center; }
    .w-code { width: 120px; font-weight: bold; }
    .w-cr { width: 60px; text-align: center; }
    .w-label { width: 250px; font-weight: bold; background: #f9f9f9; }
    .pd-tc { text-align: center; }
    .pd-tj { text-align: justify; }
    .pd-fb { font-weight: bold; }
    
    .pd-credit-box {
      border: 1px solid #000;
      background: #f9f9f9;
      padding: 10px 15px;
      margin-bottom: 15px;
      font-weight: bold;
      text-align: center;
      font-size: 12pt;
      line-height: 1.5;
    }
    
    .pd-sem-hdr {
      font-size: 14pt;
      font-weight: bold;
      text-align: left;
      margin: 25px 0 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      text-transform: uppercase;
    }
    
    .pd-cat-hdr {
      font-size: 14pt;
      font-weight: bold;
      text-align: left;
      margin: 15px 0 8px;
      color: #333;
    }
    
    .pd-sig {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    
    .pd-sig-box {
      width: 40%;
      text-align: center;
      border-top: 1px solid #000;
      padding-top: 8px;
      font-weight: bold;
    }
    
    .pd-page-break {
      page-break-after: always;
    }
    
    .pd-mb-2 {
      margin-bottom: 8px;
    }
    
    img {
      max-width: 100% !important;
      height: auto !important;
    }
  </style>
</head>
<body>

  <!-- =====================================================
       WORD HEADER (Native)
       ===================================================== -->
  <div style="mso-element:header" id="hdr">
    <div class="Header">
      ${defaultHeader}
    </div>
  </div>

  <!-- =====================================================
       WORD FOOTER (Native) 
       ===================================================== -->
  <div style="mso-element:footer" id="ftr">
    <div class="Footer">
      ${defaultFooter}
      ${pageNumbers ? ' | Page ' : ''}
      <span style="mso-field-code: PAGE"></span>
    </div>
  </div>

  <!-- =====================================================
       CONTENT
       ===================================================== -->
  ${cleanHtml}
  
  <!-- =====================================================
       TOC
       ===================================================== -->
  ${tocHtml}

</body>
</html>`;

  return Buffer.from(wordHtml, "utf-8");
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GENERATE WORD DOC (Standard)
// ─────────────────────────────────────────────────────────────────────────────

const generateWordDoc = async (html, options = {}) => {
  const { 
    title, 
    programName, 
    mode,
    headerText,
    footerText,
    tocItems,
    pageNumbers,
  } = options;

  return generateWordDocWithNativeHeaders(html, options);
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GENERATE HTML
// ─────────────────────────────────────────────────────────────────────────────

const generateHtmlDocument = async (html, options = {}) => {
  const { title, programName, mode } = options;

  const cleanHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
      box-sizing: border-box;
    }
    
    .pd-cover {
      text-align: center;
      padding: 40px;
      border: 3px double #000;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .pd-cover-uni {
      font-size: 26pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    
    .pd-cover-type {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 20px;
      letter-spacing: 2px;
    }
    
    .pd-cover-scheme {
      font-size: 12pt;
      text-transform: uppercase;
      color: #333;
      margin-top: 5px;
    }
    
    .pd-cover-program {
      font-size: 22pt;
      font-weight: bold;
      margin: 40px 0;
      padding: 20px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    
    .pd-cover-school {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 40px;
    }
    
    table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 8px 10px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      max-width: 100%;
    }
    
    th {
      background: #e0e0e0;
      font-weight: bold;
      text-align: center;
    }
    
    .pd-sec-major {
      font-size: 14pt;
      font-weight: bold;
      background: #000;
      color: #fff;
      padding: 6px 12px;
      margin: 30px 0 15px;
      text-transform: uppercase;
    }
    
    .pd-sec-minor {
      font-size: 14pt;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin: 20px 0 10px;
    }
    
    .w-serial { width: 50px; text-align: center; }
    .w-code { width: 120px; font-weight: bold; }
    .w-cr { width: 60px; text-align: center; }
    .pd-tc { text-align: center; }
    .pd-tj { text-align: justify; }
    .pd-fb { font-weight: bold; }
    
    .pd-rich p {
      margin: 0 0 8px;
      text-align: justify;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
    }
    
    .pd-page-break {
      page-break-after: always;
    }
    
    img {
      max-width: 100% !important;
      height: auto !important;
    }
  </style>
</head>
<body>
  ${cleanHtml}
</body>
</html>`;

  return Buffer.from(cleanHtml, "utf-8");
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. MARKER EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

export const extractMarkersFromHtml = async (html) => {
  const markerMap = new Map();

  const markerRegex = /\[MARKER:([^\]]+)\]/g;
  let match;
  let foundMarkers = false;

  while ((match = markerRegex.exec(html)) !== null) {
    foundMarkers = true;
    if (!markerMap.has(match[1])) {
      markerMap.set(match[1], 0);
    }
  }

  if (!foundMarkers) {
    console.warn("⚠️ No markers found. Using text-based detection.");

    const courseRegex = /UE24CS\d{4}/g;
    const semRegex = /Semester (\d+)/g;
    const overviewRegex = /Program Overview/i;
    const structureRegex = /Program Structure/i;

    if (overviewRegex.test(html) && !markerMap.has("overview")) {
      markerMap.set("overview", 0);
    }

    if (structureRegex.test(html) && !markerMap.has("structure")) {
      markerMap.set("structure", 0);
    }

    let semMatch;
    while ((semMatch = semRegex.exec(html)) !== null) {
      const num = semMatch[0].match(/\d+/);
      if (num && !markerMap.has(`semester-${num[0]}`)) {
        markerMap.set(`semester-${num[0]}`, 0);
      }
    }

    let courseMatch;
    while ((courseMatch = courseRegex.exec(html)) !== null) {
      const code = courseMatch[0];
      if (!markerMap.has(`course-${code}`)) {
        markerMap.set(`course-${code}`, 0);
      }
    }
  }

  console.log(`📊 Extracted ${markerMap.size} markers from HTML.`);
  return markerMap;
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getSupportedFormats = () => {
  return {
    docx: {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: ".docx",
      description: "Word Document (DOCX)",
    },
    doc: {
      mimeType: "application/msword",
      extension: ".doc",
      description: "Word Document (DOC)",
    },
    html: {
      mimeType: "text/html",
      extension: ".html",
      description: "HTML Document",
    },
  };
};

export const getDocumentInfo = (format) => {
  const formats = getSupportedFormats();
  return formats[format] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. EXPORT DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

export default {
  generateDocument,
  generateDocxWithNativeHeaders,
  generateWordDocWithNativeHeaders,
  generateWordDoc,
  generateHtmlDocument,
  extractMarkersFromHtml,
  getSupportedFormats,
  getDocumentInfo,
};