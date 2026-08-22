// admin/components/DocumentExporter.jsx

import { toast } from "react-hot-toast";

/**
 * DocumentExporter Component - Separate page for document export
 */
const DocumentExporter = () => {};

/**
 * Export document to Word format
 */
export const exportToWord = async ({
  documentHtml,
  documentStyles,
  filename,
  programName = "Curriculum",
  mode = "pd",
}) => {
  try {
    const wordHtml = generateWordHtml({
      documentHtml,
      documentStyles,
      programName,
      mode,
    });

    const blob = new Blob([wordHtml], {
      type: "application/msword;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success("Word document exported successfully!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error(error?.message || "Failed to export Word document");
    throw error;
  }
};

/**
 * Normalize HTML for Word export with proper message layout
 */
export const normalizeForWord = (root, mode = "pd") => {
  if (!root) return;

  // ================================================================
  // FIX: Handle Cover Page Images
  // ================================================================
  const allImages = root.querySelectorAll("img");
  allImages.forEach((img) => {
    const src = img.getAttribute("src");
    if (src) {
      if (src.startsWith("/") || src.startsWith("./") || src.startsWith("../")) {
        try {
          const baseUrl = window.location.origin;
          const fullUrl = new URL(src, baseUrl).href;
          img.setAttribute("src", fullUrl);
        } catch (e) {}
      }
    }
  });

  // Remove browser-only content
  root.querySelectorAll(
    ".no-print, script, button, iframe, video, audio, canvas"
  ).forEach((node) => node.remove());

  const all = root.querySelectorAll("*");
  all.forEach((node) => {
    const className = typeof node.className === "string" ? node.className : "";
    const isExplicitBreak =
      node.classList?.contains("pd-page-break") ||
      node.classList?.contains("page-break") ||
      node.classList?.contains("pagebreak") ||
      className.includes("page-break");
    const isCover =
      node.classList?.contains("pd-cover") ||
      /cover/i.test(className);

    if (node.style) {
      node.style.removeProperty("transform");
      node.style.removeProperty("transform-origin");

      if (!isExplicitBreak && !isCover) {
        node.style.removeProperty("height");
        node.style.removeProperty("min-height");
        node.style.removeProperty("max-height");
        node.style.removeProperty("page-break-before");
        node.style.removeProperty("page-break-after");
        node.style.removeProperty("break-before");
        node.style.removeProperty("break-after");
        node.style.removeProperty("page-break-inside");
        node.style.removeProperty("break-inside");
      }
    }

    if (isCover) {
      node.style.setProperty("page-break-after", "always", "important");
      node.style.setProperty("break-after", "page", "important");
      node.style.setProperty("page-break-inside", "avoid", "important");
      node.style.setProperty("break-inside", "avoid", "important");
    }

    if (!isExplicitBreak && !isCover) {
      node.removeAttribute("height");
      node.removeAttribute("min-height");
      node.removeAttribute("max-height");
    }
  });

  const explicitBreaks = root.querySelectorAll(
    ".pd-page-break, .page-break, .pagebreak"
  );

  if (mode === "book") {
    // Handle explicit page breaks
    explicitBreaks.forEach((node) => {
      let nextElement = node.nextElementSibling;
      let parent = node.parentElement;
      while (!nextElement && parent) {
        nextElement = parent.nextElementSibling;
        parent = parent.parentElement;
      }

      if (nextElement) {
        nextElement.classList.add("word-section-start");
        nextElement.style.setProperty("page-break-before", "always", "important");
        nextElement.style.setProperty("break-before", "page", "important");
        nextElement.style.setProperty("mso-page-break-before", "always", "important");
      }
      node.remove();
    });

    // ================================================================
    // MESSAGE PAGE LAYOUT - SIMPLIFIED AND FIXED
    // ================================================================
    
    // Message titles to detect
    const messageTitles = [
      "chancellor's message",
      "vice chancellor's message",
      "vice-chancellor's message",
      "pro vice chancellor's message",
      "pro-vice chancellor's message",
      "registrar's message",
      "director's message",
      "hod's message",
      "hod’s message",
      "vc's message",
      "chairman's message",
      "principal's message",
      "dean's message",
      "chancellor message",
      "vice chancellor message",
      "registrar message",
      "director message",
      "hod message",
    ];

    const isMessageHeading = (node) => {
      if (!node || !node.textContent) return false;
      const text = node.textContent.trim().toLowerCase();
      return messageTitles.some(title => text === title || text.includes(title));
    };

    // Find all heading nodes
    const headingNodes = Array.from(root.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, div, p, strong, b"
    )).filter(isMessageHeading);

    // Process each message
    headingNodes.forEach((heading, index) => {
      // Find the message container
      let container = heading.parentElement;
      let messageRoot = null;
      let depth = 0;
      
      while (container && container !== root && depth < 10) {
        const hasImage = container.querySelectorAll("img").length > 0;
        const hasParagraphs = container.querySelectorAll("p").length > 1;
        const headingCount = Array.from(
          container.querySelectorAll("h1,h2,h3,h4,h5,h6,div,p,strong,b")
        ).filter(isMessageHeading).length;
        
        if (hasImage && hasParagraphs && headingCount >= 1) {
          messageRoot = container;
          break;
        }
        if (!messageRoot && hasParagraphs && headingCount >= 1) {
          messageRoot = container;
        }
        container = container.parentElement;
        depth++;
      }

      if (!messageRoot) {
        messageRoot = heading.closest("div") || heading.parentElement;
      }

      if (!messageRoot || messageRoot === root) {
        messageRoot = heading.parentElement;
      }

      // Check if already has a wrapper
      let existingWrapper = messageRoot.closest(".word-message-section");
      
      if (!existingWrapper) {
        const wrapper = document.createElement("div");
        wrapper.className = "word-message-section";
        wrapper.style.setProperty("page-break-before", "always", "important");
        wrapper.style.setProperty("break-before", "page", "important");
        wrapper.style.setProperty("mso-page-break-before", "always", "important");
        wrapper.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
        wrapper.style.setProperty("font-size", "12pt", "important");
        wrapper.style.setProperty("line-height", "1.5", "important");
        wrapper.style.setProperty("color", "#000", "important");
        wrapper.style.setProperty("padding", "20px 0", "important");
        wrapper.style.setProperty("width", "100%", "important");
        wrapper.style.setProperty("overflow", "hidden", "important");
        wrapper.style.setProperty("text-align", "justify", "important");

        const parent = messageRoot.parentElement;
        let currentElement = heading;
        const elementsToMove = [];
        
        while (currentElement && currentElement.parentElement === parent) {
          elementsToMove.push(currentElement);
          currentElement = currentElement.nextElementSibling;
        }

        if (parent && heading.parentElement === parent) {
          parent.insertBefore(wrapper, heading);
          elementsToMove.forEach(el => {
            wrapper.appendChild(el);
          });
          messageRoot = wrapper;
        } else {
          messageRoot.classList.add("word-message-section");
          messageRoot.style.setProperty("overflow", "hidden", "important");
          messageRoot.style.setProperty("text-align", "justify", "important");
        }
      } else {
        messageRoot = existingWrapper;
      }

      // ================================================================
      // HEADING - 14pt Bold Centered
      // ================================================================
      heading.classList.add("word-message-heading");
      heading.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
      heading.style.setProperty("font-size", "14pt", "important");
      heading.style.setProperty("font-weight", "700", "important");
      heading.style.setProperty("text-align", "center", "important");
      heading.style.setProperty("margin", "0 0 25px 0", "important");
      heading.style.setProperty("padding", "0", "important");
      heading.style.setProperty("line-height", "1.3", "important");
      heading.style.setProperty("text-transform", "capitalize", "important");
      heading.style.setProperty("color", "#000", "important");
      heading.style.setProperty("display", "block", "important");
      heading.style.setProperty("width", "100%", "important");

      // ================================================================
      // IMAGE / PORTRAIT - Float Right
      // ================================================================
      const image = messageRoot.querySelector("img");
      if (image) {
        let portrait = image.parentElement;
        let found = false;
        let d = 0;
        
        while (portrait && portrait !== messageRoot && d < 8) {
          const textLen = (portrait.textContent || "").trim().length;
          const children = portrait.children?.length || 0;
          if (children >= 1 && textLen <= 500) {
            found = true;
            break;
          }
          portrait = portrait.parentElement;
          d++;
        }

        if (!found || !portrait || portrait === messageRoot) {
          const wrapper = document.createElement("div");
          wrapper.className = "word-message-portrait";
          image.parentElement.insertBefore(wrapper, image);
          wrapper.appendChild(image);
          portrait = wrapper;
        }

        portrait.classList.add("word-message-portrait");
        portrait.style.setProperty("float", "right", "important");
        portrait.style.setProperty("clear", "right", "important");
        portrait.style.setProperty("width", "140px", "important");
        portrait.style.setProperty("max-width", "140px", "important");
        portrait.style.setProperty("margin", "0 0 15px 25px", "important");
        portrait.style.setProperty("padding", "10px", "important");
        portrait.style.setProperty("text-align", "center", "important");
        portrait.style.setProperty("page-break-inside", "avoid", "important");
        portrait.style.setProperty("break-inside", "avoid", "important");
        portrait.style.setProperty("box-sizing", "border-box", "important");
        portrait.style.setProperty("border", "1px solid #e0e0e0", "important");
        portrait.style.setProperty("border-radius", "4px", "important");
        portrait.style.setProperty("background", "#f9f9f9", "important");
        portrait.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");

        image.style.setProperty("display", "block", "important");
        image.style.setProperty("width", "100%", "important");
        image.style.setProperty("max-width", "120px", "important");
        image.style.setProperty("height", "auto", "important");
        image.style.setProperty("margin", "0 auto 8px auto", "important");
        image.style.setProperty("border-radius", "4px", "important");
        image.style.setProperty("border", "1px solid #eee", "important");

        // Name in portrait
        const portraitTexts = portrait.querySelectorAll("p, span, div, strong, b");
        portraitTexts.forEach((el) => {
          if (el === image || el.closest("img")) return;
          const text = (el.textContent || "").trim();
          if (text.match(/(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|Chancellor|Vice|Registrar|Director|HOD|Dean|Principal)/i) || text.length < 100) {
            el.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
            el.style.setProperty("font-size", "12pt", "important");
            el.style.setProperty("font-weight", "600", "important");
            el.style.setProperty("color", "#000", "important");
            el.style.setProperty("text-align", "center", "important");
            el.style.setProperty("margin", "2px 0", "important");
            el.style.setProperty("padding", "0", "important");
            el.style.setProperty("line-height", "1.3", "important");
          }
        });

        // Designation - smaller
        const designations = portrait.querySelectorAll(".designation, .title, .position, em, i, small");
        designations.forEach((el) => {
          el.style.setProperty("font-size", "11pt", "important");
          el.style.setProperty("font-weight", "400", "important");
          el.style.setProperty("color", "#555", "important");
          el.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
        });
      }

      // ================================================================
      // MESSAGE TEXT - 12pt Justified 1.5 spacing
      // ================================================================
      const allElements = messageRoot.querySelectorAll("*");
      allElements.forEach((el) => {
        // Skip heading and portrait
        if (el.closest(".word-message-heading") || el.closest(".word-message-portrait")) {
          return;
        }
        
        // Skip if it's the container itself
        if (el === messageRoot) return;
        
        // Skip images
        if (el.tagName === "IMG") return;
        
        // Get text content
        const text = (el.textContent || "").trim();
        if (!text) return;
        
        // Apply styles
        el.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
        el.style.setProperty("font-size", "12pt", "important");
        el.style.setProperty("line-height", "1.5", "important");
        el.style.setProperty("text-align", "justify", "important");
        el.style.setProperty("text-justify", "inter-ideograph", "important");
        el.style.setProperty("color", "#000", "important");
        el.style.setProperty("margin", "0 0 8px 0", "important");
        el.style.setProperty("padding", "0", "important");
        el.style.setProperty("display", "block", "important");
        el.style.setProperty("page-break-inside", "auto", "important");
        el.style.setProperty("break-inside", "auto", "important");
        el.style.setProperty("orphans", "3", "important");
        el.style.setProperty("widows", "3", "important");
        el.style.setProperty("text-indent", "0", "important");
        el.style.setProperty("hyphens", "auto", "important");
      });

      // ================================================================
      // SIGNATURE - Right aligned
      // ================================================================
      const allParagraphs = messageRoot.querySelectorAll("p");
      allParagraphs.forEach((el) => {
        const text = (el.textContent || "").trim();
        // Check if it looks like a signature
        if (text.match(/(Vice-Chancellor|Chancellor|Registrar|Director|HOD|Dean|Principal|Professor|Dr\.|Mr\.|Mrs\.|Ms\.)/i) &&
            text.length < 150 && 
            !el.closest(".word-message-portrait") && 
            !el.closest(".word-message-heading")) {
          // Check if it's near the end of the message
          const siblings = el.parentElement?.querySelectorAll("p") || [];
          const isLast = siblings.length > 0 && siblings[siblings.length - 1] === el;
          
          if (isLast || text.match(/(Vice-Chancellor|Chancellor|Registrar|Director|HOD|Dean)/i)) {
            el.style.setProperty("text-align", "right", "important");
            el.style.setProperty("font-weight", "600", "important");
            el.style.setProperty("margin-top", "20px", "important");
            el.style.setProperty("padding-top", "10px", "important");
            el.style.setProperty("border-top", "1px solid #ccc", "important");
            el.style.setProperty("clear", "both", "important");
            el.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
            el.style.setProperty("font-size", "12pt", "important");
            el.style.setProperty("color", "#000", "important");
          }
        }
      });

      // Remove horizontal rules inside messages
      messageRoot.querySelectorAll("hr, .separator, .divider").forEach((el) => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("height", "0", "important");
        el.style.setProperty("margin", "0", "important");
        el.style.setProperty("padding", "0", "important");
        el.style.setProperty("border", "0", "important");
      });
    });

    root.classList.add("book-export-root");

  } else {
    // PD mode
    explicitBreaks.forEach((node) => {
      node.removeAttribute("height");
      node.style.setProperty("page-break-after", "always", "important");
      node.style.setProperty("break-after", "page", "important");
      node.style.setProperty("height", "0", "important");
      node.style.setProperty("margin", "0", "important");
      node.style.setProperty("padding", "0", "important");
      node.style.setProperty("border", "0", "important");
      node.style.setProperty("display", "block", "important");
      node.classList.add("word-explicit-page-break");
    });
    root.classList.add("book-export-root");
  }

  // ================================================================
  // COVER PAGE
  // ================================================================
  const cover = root.querySelector(
    ".pd-cover, .cover-page, .cover, [class*='cover']"
  );
  if (cover) {
    const coverImages = cover.querySelectorAll("img");
    coverImages.forEach((img) => {
      img.style.setProperty("display", "block", "important");
      img.style.setProperty("max-width", "180px", "important");
      img.style.setProperty("height", "auto", "important");
      img.style.setProperty("margin", "0 auto 20px auto", "important");
      img.style.setProperty("border", "none", "important");
      img.style.setProperty("visibility", "visible", "important");
      img.style.setProperty("opacity", "1", "important");
    });

    cover.classList.add("word-export-cover");
    cover.style.setProperty("page-break-after", "always", "important");
    cover.style.setProperty("break-after", "page", "important");
    cover.style.setProperty("page-break-inside", "avoid", "important");
    cover.style.setProperty("break-inside", "avoid", "important");
    cover.style.setProperty("min-height", "0", "important");
    cover.style.setProperty("height", "auto", "important");
    cover.style.setProperty("display", "flex", "important");
    cover.style.setProperty("flex-direction", "column", "important");
    cover.style.setProperty("align-items", "center", "important");
    cover.style.setProperty("justify-content", "center", "important");
    cover.style.setProperty("text-align", "center", "important");
    cover.style.setProperty("border", "3px double #000", "important");
    cover.style.setProperty("padding", "30mm 20mm", "important");
    cover.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
  }

  // ================================================================
  // TABLES
  // ================================================================
  root.querySelectorAll("table").forEach((table) => {
    table.removeAttribute("height");
    table.style.removeProperty("height");
    table.style.removeProperty("min-height");
    table.style.setProperty("width", "100%", "important");
    table.style.setProperty("border-collapse", "collapse", "important");
    table.style.setProperty("table-layout", "auto", "important");
    table.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
    table.style.setProperty("font-size", "12pt", "important");
  });

  root.querySelectorAll("th, td").forEach((cell) => {
    cell.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
    cell.style.setProperty("font-size", "12pt", "important");
    cell.style.setProperty("line-height", "1.5", "important");
  });

  // ================================================================
  // IMAGES - Ensure they display
  // ================================================================
  root.querySelectorAll("img").forEach((img) => {
    img.removeAttribute("height");
    img.style.removeProperty("height");
    img.style.setProperty("max-width", "100%", "important");
    img.style.setProperty("height", "auto", "important");
    img.style.setProperty("display", "block", "important");
    img.style.setProperty("visibility", "visible", "important");
    img.style.setProperty("opacity", "1", "important");
    img.style.setProperty("margin", "0 auto", "important");
  });

  // Remove screen-only decorations
  root.querySelectorAll(".word-explicit-page-break").forEach((node) => {
    node.innerHTML = "";
    node.style.setProperty("border", "0", "important");
    node.style.setProperty("border-bottom", "0", "important");
    node.style.setProperty("margin", "0", "important");
    node.style.setProperty("padding", "0", "important");
  });

  // ================================================================
  // APPLY STYLES TO ALL CONTENT
  // ================================================================
  root.querySelectorAll("p, div, span, li, .text, .content, .message, .body, .description").forEach((el) => {
    // Skip cover, message heading, message portrait
    if (el.closest(".word-message-portrait") || 
        el.closest(".word-message-heading") ||
        el.closest(".pd-cover") ||
        el.closest(".pd-cover *")) return;
    
    if (el.tagName.match(/^H[1-6]$/)) {
      el.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
      return;
    }
    
    // Apply styles
    el.style.setProperty("font-family", '"Times New Roman", Times, Georgia, serif', "important");
    el.style.setProperty("line-height", "1.5", "important");
    el.style.setProperty("font-size", "12pt", "important");
    el.style.setProperty("text-align", "justify", "important");
    el.style.setProperty("text-justify", "inter-ideograph", "important");
  });

  // Remove all horizontal rules
  root.querySelectorAll("hr").forEach((el) => {
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("height", "0", "important");
    el.style.setProperty("margin", "0", "important");
    el.style.setProperty("padding", "0", "important");
    el.style.setProperty("border", "0", "important");
  });
};

/**
 * Generate complete Word HTML document
 */
const generateWordHtml = ({
  documentHtml,
  documentStyles,
  programName,
  mode = "pd",
}) => {
  const wordStyles = getWordStyles(documentStyles, mode);

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <meta name="Originator" content="Microsoft Word">
  <title>${programName} - Document</title>

  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->

  <style type="text/css">
    ${wordStyles}
  </style>
</head>
<body>
  ${documentHtml}
</body>
</html>`;
};

/**
 * Get Word-specific styles
 */
const getWordStyles = (documentStyles, mode = "pd") => {
  return `
    /* Original document styles */
    ${documentStyles}

    /* ================================================================
       WORD EXPORT - GM University Style
       ================================================================ */

    @page {
      size: A4 portrait;
      margin: 15mm;
      mso-page-orientation: portrait;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      background: #fff !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      line-height: 1.5 !important;
      text-align: justify !important;
      mso-pagination: widow-orphan;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .pd-doc,
    .book-export-root {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      box-shadow: none !important;
      overflow: visible !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      line-height: 1.5 !important;
      text-align: justify !important;
    }

    .pd-doc * {
      box-sizing: border-box;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    /* ================================================================
       COVER PAGE
       ================================================================ */
    .pd-cover, .word-export-cover {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      padding: 30mm 20mm !important;
      box-sizing: border-box !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      border: 3px double #000 !important;
      background: #fff !important;
    }

    .pd-cover img, .word-export-cover img {
      display: block !important;
      max-width: 180px !important;
      height: auto !important;
      margin: 0 auto 20px auto !important;
      border: none !important;
      visibility: visible !important;
      opacity: 1 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .pd-cover-uni {
      font-size: 28pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      letter-spacing: 2px !important;
      margin-bottom: 10px !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-type {
      font-size: 16pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      margin-top: 5px !important;
      letter-spacing: 2px !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-scheme {
      font-size: 13pt !important;
      text-transform: uppercase !important;
      color: #333 !important;
      margin-top: 5px !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-semester {
      font-size: 13pt !important;
      text-transform: uppercase !important;
      color: #333 !important;
      margin-top: 2px !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-program {
      font-size: 22pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      margin: 30px 0 5px !important;
      padding: 0 !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-program-in {
      font-size: 18pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      margin: 5px 0 30px !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-tagline {
      font-size: 14pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      letter-spacing: 3px !important;
      margin: 10px 0 30px !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-school {
      font-size: 12pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-faculty {
      font-size: 12pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      color: #000 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-cover-message {
      margin-top: 40px !important;
      font-size: 11pt !important;
      color: #333 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      text-align: center !important;
      padding: 0 20px !important;
      line-height: 1.5 !important;
    }

    /* ================================================================
       MESSAGE PAGE LAYOUT
       ================================================================ */
    
    .word-message-section {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: hidden !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      line-height: 1.5 !important;
      color: #000 !important;
      padding: 20px 0 !important;
      text-align: justify !important;
    }

    .word-message-heading {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 14pt !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      text-align: center !important;
      color: #000 !important;
      margin: 0 0 25px 0 !important;
      padding: 0 !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      text-transform: capitalize !important;
      display: block !important;
      width: 100% !important;
    }

    .word-message-portrait {
      float: right !important;
      clear: right !important;
      width: 140px !important;
      max-width: 140px !important;
      margin: 0 0 15px 25px !important;
      padding: 10px !important;
      text-align: center !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 4px !important;
      background: #f9f9f9 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .word-message-portrait img {
      display: block !important;
      float: none !important;
      width: 100% !important;
      max-width: 120px !important;
      height: auto !important;
      margin: 0 auto 8px auto !important;
      border-radius: 4px !important;
      border: 1px solid #eee !important;
    }

    .word-message-portrait p,
    .word-message-portrait span,
    .word-message-portrait div,
    .word-message-portrait strong,
    .word-message-portrait b {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      font-weight: 600 !important;
      color: #000 !important;
      text-align: center !important;
      margin: 2px 0 !important;
      padding: 0 !important;
      line-height: 1.3 !important;
    }

    .word-message-portrait .designation,
    .word-message-portrait .title,
    .word-message-portrait .position,
    .word-message-portrait em,
    .word-message-portrait i,
    .word-message-portrait small {
      font-size: 11pt !important;
      font-weight: 400 !important;
      color: #555 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .word-message-section p,
    .word-message-section li,
    .word-message-section div:not(.word-message-heading):not(.word-message-portrait) {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      line-height: 1.5 !important;
      text-align: justify !important;
      text-justify: inter-ideograph !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      orphans: 3 !important;
      widows: 3 !important;
      margin: 0 0 8px 0 !important;
      padding: 0 !important;
      text-indent: 0 !important;
      hyphens: auto !important;
      color: #000 !important;
      display: block !important;
    }

    .word-message-section .signature {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      font-weight: 600 !important;
      color: #000 !important;
      text-align: right !important;
      margin-top: 25px !important;
      padding-top: 10px !important;
      border-top: 1px solid #ccc !important;
      clear: both !important;
    }

    /* ================================================================
       FORCE JUSTIFY ON ALL TEXT
       ================================================================ */
    p, div, span, li, .text, .content, .message, .body, .description {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      line-height: 1.5 !important;
      font-size: 12pt !important;
      text-align: justify !important;
      text-justify: inter-ideograph !important;
    }

    h1, h2, h3, h4, h5, h6, .word-message-heading {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      text-align: center !important;
    }

    .pd-cover, .word-export-cover, .pd-cover * {
      text-align: center !important;
    }

    .word-message-portrait, .word-message-portrait * {
      text-align: center !important;
    }

    .signature, .sign, .name, .author {
      text-align: right !important;
    }

    /* ================================================================
       SECTION HEADERS
       ================================================================ */
    .pd-sec-major {
      font-size: 12pt !important;
      font-weight: bold !important;
      background: #000 !important;
      color: #fff !important;
      padding: 6px 12px !important;
      margin: 30px 0 15px !important;
      text-transform: uppercase !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    .pd-sec-minor {
      font-size: 12pt !important;
      font-weight: bold !important;
      border-bottom: 1px solid #000 !important;
      padding-bottom: 4px !important;
      margin: 20px 0 10px !important;
      color: #000 !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    /* ================================================================
       TABLES
       ================================================================ */
    .pd-doc table,
    .book-export-root table {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      table-layout: auto !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      margin-top: 0 !important;
      margin-bottom: 20px !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
    }

    .pd-doc th,
    .pd-doc td,
    .book-export-root th,
    .book-export-root td {
      vertical-align: top !important;
      overflow: visible !important;
      line-height: 1.5 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
      text-align: justify !important;
    }

    .pd-doc th {
      background: #e0e0e0 !important;
      color: #000 !important;
      font-weight: bold !important;
      text-align: center !important;
      padding: 6px 10px !important;
      border: 1px solid #000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .pd-doc td {
      border: 1px solid #000 !important;
      padding: 6px 10px !important;
      vertical-align: top !important;
      color: #000 !important;
    }

    /* ================================================================
       PAGE BREAKS
       ================================================================ */
    .word-explicit-page-break {
      display: block !important;
      width: 100% !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      overflow: hidden !important;
      page-break-after: always !important;
      break-after: page !important;
      clear: both !important;
    }

    .word-section-start {
      page-break-before: always !important;
      break-before: page !important;
      mso-page-break-before: always !important;
    }

    /* ================================================================
       REMOVE HORIZONTAL RULES
       ================================================================ */
    hr, .separator, .divider {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }

    /* ================================================================
       RICH TEXT
       ================================================================ */
    .pd-rich p {
      margin: 0 0 8px !important;
      text-align: justify !important;
      text-justify: inter-ideograph !important;
      line-height: 1.5 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
    }

    .pd-rich ul,
    .pd-rich ol {
      margin: 4px 0 10px 0 !important;
      padding-left: 24px !important;
    }

    .pd-rich li {
      margin-bottom: 4px !important;
      text-align: justify !important;
      text-justify: inter-ideograph !important;
      line-height: 1.5 !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
    }

    .pd-credit-box {
      border: 1px solid #000 !important;
      background: #f9f9f9 !important;
      padding: 10px 15px !important;
      margin-bottom: 15px !important;
      font-weight: bold !important;
      text-align: center !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      font-size: 12pt !important;
    }

    .pd-sem-hdr {
      font-size: 12pt !important;
      font-weight: bold !important;
      text-align: left !important;
      margin: 25px 0 10px !important;
      border-bottom: 1px solid #ccc !important;
      padding-bottom: 4px !important;
      text-transform: uppercase !important;
      font-family: "Times New Roman", Times, Georgia, serif !important;
    }

    img {
      display: block !important;
      max-width: 100% !important;
      height: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `;
};

export default DocumentExporter;