// backend/services/pdfGenerator.js
import puppeteer from "puppeteer-core";
import fs from "fs";

const getChromePath = () => {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe",
    process.env.CHROME_PATH,
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      console.log(`✅ Chrome found at: ${p}`);
      return p;
    }
  }

  throw new Error("Chrome not found. Please install Google Chrome.");
};

export const generatePDF = async (html, options = {}) => {
  const {
    format = "A4",
    landscape = false,
    margin = {
      top: "20mm",
      bottom: "20mm",
      left: "20mm",
      right: "20mm",
    },
    baseUrl = null,
  } = options;

  // Add cover page styles to the HTML
  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">

      <style>

        /* =====================================================
           PAGE SETUP
           ===================================================== */

        @page {
          size: A4 portrait;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          min-height: 100%;
          font-family: Arial, Helvetica, sans-serif;
        }


        /* =====================================================
           COVER PAGE
           SAME LAYOUT AS cover.html
           ===================================================== */

        .page {
          position: relative;

          width: 210mm !important;
          height: 297mm !important;

          max-width: none !important;

          overflow: hidden;

          background: #ffffff;

          margin: 0 !important;
          padding: 0 !important;

          page-break-after: always;
          break-after: page;
        }


        /* =====================================================
           COVER BACKGROUND IMAGE
           ===================================================== */

        .cover-bg {
          position: absolute;

          left: 0;
          top: 0;

          width: 100% !important;
          height: 100% !important;

          max-width: none !important;
          max-height: none !important;

          object-fit: fill;

          display: block;

          z-index: 0;
        }


        /* =====================================================
           ALL COVER CONTENT ABOVE BACKGROUND
           ===================================================== */

        .university,
        .curriculum,
        .scheme,
        .semester,
        .btech,
        .in,
        .course,
        .logo,
        .school,
        .year {
          z-index: 2;
          position: absolute;
        }


        /* =====================================================
           TEXT WRAPPING
           ===================================================== */

        .university,
        .curriculum,
        .scheme,
        .semester,
        .btech,
        .in,
        .course,
        .logo,
        .school,
        .year {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 80%;
        }


        /* =====================================================
           GM UNIVERSITY
           SAME AS cover.html
           ===================================================== */

        .university {
          top: 8%;
          left: 69%;

          transform: translateX(-50%);

          width: 100%;
          max-width: 70%;

          text-align: center;

          color: #5a1719;

          font-size: clamp(32px, 5vw, 52px);

          font-weight: 700;

          letter-spacing: 3px;
        }


        /* =====================================================
           CURRICULUM DOCUMENT
           ===================================================== */

        .curriculum {
          top: 16%;
          left: 69%;

          transform: translateX(-50%);

          width: 100%;
          max-width: 70%;

          text-align: center;

          color: #5a1719;

          font-size: clamp(28px, 4.5vw, 44px);

          font-weight: 700;

          text-decoration: underline;
          text-decoration-thickness: 3px;
          text-underline-offset: 12px;
        }


        /* =====================================================
           2026 SCHEME
           ===================================================== */

        .scheme {
          top: 23%;
          left: 70%;

          transform: translateX(-50%);

          width: 100%;
          max-width: 70%;

          text-align: center;

          color: #5a1719;

          font-size: clamp(26px, 4vw, 42px);

          font-weight: 700;
        }


        /* =====================================================
           SEMESTER
           ===================================================== */

        .semester {
          top: 30%;
          left: 70%;

          transform: translateX(-50%);

          width: 100%;
          max-width: 70%;

          text-align: center;

          color: #5a1719;

          font-size: clamp(24px, 3.8vw, 38px);

          font-weight: 700;
        }


        /* =====================================================
           B.TECH
           ===================================================== */

        .btech {
          top: 39%;
          left: 55%;

          width: 180px;
          max-width: 25%;

          text-align: right;

          color: #5a1719;

          font-size: clamp(20px, 3.2vw, 34px);

          font-weight: 400;
        }


        /* =====================================================
           IN
           ===================================================== */

        .in {
          top: 44%;
          left: 72%;

          transform: translateX(-50%);

          width: auto;
          max-width: 20%;

          text-align: center;

          color: #5a1719;

          font-size: clamp(18px, 2.8vw, 28px);

          font-weight: 400;
        }


        /* =====================================================
           COURSE NAME
           ===================================================== */

        .course {
          top: 48%;
          right: -4%;

          width: 420px;
          max-width: 55%;

          text-align: left;

          color: #5a1719;

          font-size: clamp(22px, 3.5vw, 36px);

          font-weight: 700;

          line-height: 1.3;

          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }


        .course .indent {
          padding-left: 60px;

          display: inline-block;

          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }


        /* =====================================================
           GM UNIVERSITY LOGO
           ===================================================== */

        .logo {
          left: 4%;
          bottom: 40%;

          width: clamp(150px, 24vw, 250px);

          height: auto;

          object-fit: contain;

          display: block;
        }


        /* =====================================================
           SCHOOL / FACULTY
           ===================================================== */

        .school {
          left: 30%;

          transform: translateX(-50%);

          bottom: 30%;

          width: 700px;
          max-width: 70%;

          text-align: center;

          color: #e4a92b;

          font-size: clamp(18px, 2.6vw, 24px);

          line-height: 1.5;

          font-weight: 300;

          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }


        /* =====================================================
           YEAR - 2026
           ===================================================== */

        .year {
          right: 6%;
          bottom: 4%;

          color: #e4a92b;

          font-size: clamp(20px, 3vw, 30px);

          letter-spacing: 8px;

          font-weight: 400;

          white-space: nowrap;

          max-width: 40%;
        }


        .year::before,
        .year::after {
          content: "";

          display: inline-block;

          width: clamp(30px, 5vw, 50px);

          height: 2px;

          background: #e4a92b;

          vertical-align: middle;

          margin: 0 12px;
        }


        /* =====================================================
           PAGE BREAK
           ===================================================== */

        .page-break {
          page-break-after: always;
          break-after: page;
        }


        /* =====================================================
           OTHER IMAGES
           ===================================================== */

        img {
          max-width: 100%;
          height: auto;
        }

        /* IMPORTANT:
           Do not allow the cover image to be resized by
           the generic img rule above.
        */

        .cover-bg {
          max-width: none !important;
          max-height: none !important;
        }

      </style>
    </head>

    <body>
      ${html}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(styledHtml, {
      waitUntil: "networkidle0",
      ...(baseUrl && { baseUrl }),
    });

    const pdfBuffer = await page.pdf({
      format,
      landscape,

      /*
       * IMPORTANT:
       * The cover itself is A4 full-page.
       */
      margin: {
        top: "0mm",
        bottom: "0mm",
        left: "0mm",
        right: "0mm",
      },

      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);

  } finally {
    await browser.close();
  }
};


export const generateCurriculumPDF = async (html, options = {}) => {
  const { returnMarkers = false } = options;

  const buffer = await generatePDF(html, {
    format: "A4",

    /*
     * Cover must have no PDF margin so that the
     * cover.html design reaches the A4 edges.
     */
    margin: {
      top: "0mm",
      bottom: "0mm",
      left: "0mm",
      right: "0mm",
    },

    baseUrl: `file://${process.cwd()}/public/templates/front_matter/`,
  });

  if (returnMarkers) {
    try {
      const pdfParseModule = await import("pdf-parse");

      const exportKeys = Object.keys(pdfParseModule);

      console.log("pdf-parse exports:", exportKeys);

      const PDFParseClass =
        pdfParseModule.PDFParse ||
        pdfParseModule.default?.PDFParse;

      console.log(
        "using PDFParseClass type:",
        typeof PDFParseClass
      );

      let data;

      if (typeof PDFParseClass === "function") {
        const parser = new PDFParseClass({ data: buffer });

        data = await parser.getText();

      } else if (typeof pdfParseModule === "function") {

        data = await pdfParseModule(buffer);

      } else {

        throw new Error(
          `pdfParse is not a function; exports: ${exportKeys.join(", ")}`
        );
      }

      const pages = Array.isArray(data.pages)
        ? data.pages.map((page) => page.text || "")
        : String(data.text || "").split(/\f/);

      const markerMap = new Map();


      // =====================================================
      // 1. Try explicit markers
      // =====================================================

      const markerRegex = /\[MARKER:([^\]]+)\]/g;

      pages.forEach((text, idx) => {

        let m;

        while ((m = markerRegex.exec(text)) !== null) {

          if (!markerMap.has(m[1])) {
            markerMap.set(m[1], idx);
          }

        }

      });


      // =====================================================
      // 2. Fallback: text detection
      // =====================================================

      if (markerMap.size === 0) {

        console.warn(
          "⚠️ No markers found. Using text-based detection."
        );

        const courseRegex = /UE24CS\d{4}/g;
        const semRegex = /Semester (\d+)/g;

        const overviewRegex = /Program Overview/i;
        const structureRegex = /Program Structure/i;


        pages.forEach((text, idx) => {

          if (!text || text.trim().length < 10) {
            return;
          }


          if (
            overviewRegex.test(text) &&
            !markerMap.has("overview")
          ) {

            markerMap.set("overview", idx);

          }


          if (
            structureRegex.test(text) &&
            !markerMap.has("structure")
          ) {

            markerMap.set("structure", idx);

          }


          const semMatch = text.match(semRegex);

          if (semMatch && semMatch.length > 0) {

            const num = semMatch[0].match(/\d+/);

            if (
              num &&
              !markerMap.has(`semester-${num[0]}`)
            ) {

              markerMap.set(
                `semester-${num[0]}`,
                idx
              );

            }

          }


          const codes = text.match(courseRegex);

          if (codes && codes.length > 0) {

            const code = codes[0];

            if (!markerMap.has(`course-${code}`)) {

              markerMap.set(
                `course-${code}`,
                idx
              );

            }

          }

        });
      }


      console.log(
        `📊 Extracted ${markerMap.size} markers/detections from ${pages.length} pages.`
      );

      return {
        buffer,
        markerMap,
      };


    } catch (err) {

      console.error(
        "Failed to extract markers:",
        err
      );

      return {
        buffer,
        markerMap: new Map(),
      };
    }
  }

  return buffer;
};