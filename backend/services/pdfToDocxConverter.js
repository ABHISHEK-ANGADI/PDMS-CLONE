// backend/services/pdfToDocxConverter.js
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF to DOCX Converter Service using Python pdf2docx
 */

export class PdfToDocxConverter {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, "pdf_to_docx_converter.py");
  }

  /**
   * Convert PDF to DOCX using Python pdf2docx
   */
  async convert(pdfPath, docxPath) {
    // Validate input
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    if (!fs.existsSync(this.pythonScriptPath)) {
      throw new Error(`Python converter script not found: ${this.pythonScriptPath}`);
    }

    console.log(`Converting PDF to DOCX using Python pdf2docx...`);
    console.log(`   PDF: ${pdfPath}`);
    console.log(`   DOCX: ${docxPath}`);

    try {
      // Build command
      const command = `python "${this.pythonScriptPath}" "${pdfPath}" "${docxPath}"`;
      
      console.log(`   Command: ${command}`);

      // Execute Python script with environment
      const { stdout, stderr } = await execPromise(command, {
        timeout: 120000,
        maxBuffer: 50 * 1024 * 1024,
        encoding: 'utf8',
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1'
        }
      });

      // Log output
      if (stdout) {
        console.log(`   Python output: ${stdout.trim()}`);
      }
      if (stderr) {
        console.warn(`   Python stderr: ${stderr.trim()}`);
      }

      // Check if output file was created
      if (!fs.existsSync(docxPath)) {
        throw new Error(`DOCX file was not created at: ${docxPath}`);
      }

      // Check file size
      const stats = fs.statSync(docxPath);
      if (stats.size < 50000) {
        throw new Error(`DOCX file too small: ${stats.size} bytes (expected > 50KB)`);
      }

      console.log(`PDF to DOCX conversion successful!`);
      console.log(`   Output size: ${stats.size} bytes`);
      return docxPath;

    } catch (error) {
      console.error(`PDF to DOCX conversion failed:`, error.message);
      throw new Error(`PDF to DOCX conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF buffer to DOCX buffer
   */
  async convertFromBuffer(pdfBuffer, outputPath) {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    const docxPath = outputPath || path.join(tempDir, `output_${Date.now()}.docx`);

    try {
      await fs.promises.writeFile(tempPdfPath, pdfBuffer);
      console.log(`Temp PDF saved: ${tempPdfPath}`);

      await this.convert(tempPdfPath, docxPath);

      const docxBuffer = await fs.promises.readFile(docxPath);

      try {
        await fs.promises.unlink(tempPdfPath);
        if (outputPath) {
          await fs.promises.unlink(docxPath);
        }
      } catch (cleanupError) {
        console.warn("Could not clean up temp files:", cleanupError.message);
      }

      return docxBuffer;

    } catch (error) {
      try {
        if (fs.existsSync(tempPdfPath)) {
          await fs.promises.unlink(tempPdfPath);
        }
      } catch (e) {}
      
      throw error;
    }
  }

  /**
   * Check if Python and pdf2docx are available
   */
  async checkDependencies() {
    try {
      const { stdout } = await execPromise("python --version");
      console.log(`Python found: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.error("Python not found. Please install Python.");
      return false;
    }
  }
}

// Singleton instance
let converterInstance = null;

export const getPdfToDocxConverter = () => {
  if (!converterInstance) {
    converterInstance = new PdfToDocxConverter();
  }
  return converterInstance;
};

export default {
  PdfToDocxConverter,
  getPdfToDocxConverter,
};