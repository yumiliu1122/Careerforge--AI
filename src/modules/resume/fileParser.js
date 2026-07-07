import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { config } from "../../platform/config.js";
import { normalizeText, summarize } from "../../platform/util.js";

const supportedResumeExtensions = new Set([".pdf", ".doc", ".docx", ".txt"]);
const supportedArchiveExtensions = new Set([".zip", ".rar"]);
const ignoredExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".mp4", ".mov", ".mp3", ".ds_store"]);

export async function extractResumesFromUploads(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw userError("请至少上传一个文件。", "NO_FILE", 400);
  }

  const documents = [];
  const failures = [];

  for (const file of files) {
    try {
      const decoded = decodeUpload(file);
      const extracted = await extractFile({
        name: file.name || "unknown",
        buffer: decoded,
        sourceName: file.name || "unknown",
        pathChain: [file.name || "unknown"],
        depth: 0
      });
      documents.push(...extracted);
    } catch (error) {
      failures.push({
        fileName: file.name || "unknown",
        code: error.code || "PARSE_FAILED",
        message: error.publicMessage || error.message || "文件解析失败。"
      });
    }
  }

  const readableDocuments = documents.filter((doc) => doc.text && doc.text.length >= 40);
  const shortDocuments = documents
    .filter((doc) => !doc.text || doc.text.length < 40)
    .map((doc) => ({
      fileName: doc.name,
      code: "TEXT_TOO_SHORT",
      message: "文件可读取文本过少，可能是扫描件、图片简历或内容为空。"
    }));

  return {
    documents: readableDocuments,
    failures: [...failures, ...shortDocuments]
  };
}

async function extractFile({ name, buffer, sourceName, pathChain, depth }) {
  validateFileSize(name, buffer);
  const extension = path.extname(name).toLowerCase();

  if (shouldIgnore(name)) {
    return [];
  }

  if (supportedArchiveExtensions.has(extension)) {
    if (depth >= 3) {
      throw userError("压缩包嵌套层级过深，已停止解析。", "ARCHIVE_TOO_DEEP", 400);
    }
    return extension === ".zip"
      ? extractZip({ name, buffer, sourceName, pathChain, depth })
      : extractRar({ name, buffer, sourceName, pathChain, depth });
  }

  if (!supportedResumeExtensions.has(extension)) {
    throw userError(`暂不支持 ${extension || "未知"} 格式，请上传 PDF、Word、TXT、ZIP 或 RAR。`, "UNSUPPORTED_FORMAT", 400);
  }

  const text = await extractTextByType(extension, buffer, name);
  return [
    {
      name: path.basename(name),
      sourceName,
      path: pathChain.join(" / "),
      extension,
      text: normalizeText(text),
      preview: summarize(text, 240)
    }
  ];
}

async function extractTextByType(extension, buffer, name) {
  if (extension === ".txt") {
    return decodeText(buffer);
  }
  if (extension === ".pdf") {
    return extractPdf(buffer, name);
  }
  if (extension === ".docx") {
    return extractDocx(buffer, name);
  }
  if (extension === ".doc") {
    return extractDoc(buffer, name);
  }
  throw userError("文件格式不支持。", "UNSUPPORTED_FORMAT", 400);
}

async function extractPdf(buffer, name) {
  try {
    const module = await importOptional("pdf-parse", "PDF 解析依赖未安装，请先运行 npm install。");
    const pdfParse = module.default || module;
    const result = await pdfParse(buffer);
    if (result?.text) {
      return result.text.replace(/\n{3,}/g, "\n\n");
    }
    throw userError("PDF 未提取到文本，可能是扫描件或加密文件。", "PDF_TEXT_EMPTY", 400);
  } catch (error) {
    if (error.isPublic) throw error;
    throw userError(`PDF 文件 ${name} 解析失败，可能已损坏或被加密。`, "PDF_PARSE_FAILED", 400);
  }
}

async function extractDocx(buffer, name) {
  try {
    const module = await importOptional("mammoth", "Word 解析依赖未安装，请先运行 npm install。");
    const mammoth = module.default || module;
    const result = await mammoth.extractRawText({ buffer });
    if (result?.value) {
      return result.value.replace(/\n{3,}/g, "\n\n");
    }
    throw userError("Word 文件未提取到文本。", "WORD_TEXT_EMPTY", 400);
  } catch (error) {
    if (error.isPublic) throw error;
    throw userError(`Word 文件 ${name} 解析失败，可能已损坏或加密。`, "WORD_PARSE_FAILED", 400);
  }
}

async function extractDoc(buffer, name) {
  let tempDir;
  try {
    const module = await importOptional("word-extractor", "DOC 解析依赖未安装，请先运行 npm install。");
    const WordExtractor = module.default || module;
    const extractor = new WordExtractor();

    if (typeof extractor.extractDocument === "function") {
      const document = await extractor.extractDocument(buffer);
      return document.getBody();
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "careerforge-doc-"));
    const tempFile = path.join(tempDir, path.basename(name));
    await fs.writeFile(tempFile, buffer);
    const document = await extractor.extract(tempFile);
    return document.getBody();
  } catch (error) {
    if (error.isPublic) throw error;
    throw userError(`DOC 文件 ${name} 解析失败，可能已损坏、加密或不是标准 Word 文档。`, "DOC_PARSE_FAILED", 400);
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}

async function extractZip({ name, buffer, sourceName, pathChain, depth }) {
  try {
    const module = await importOptional("jszip", "ZIP 解析依赖未安装，请先运行 npm install。");
    const JSZip = module.default || module;
    const archive = await JSZip.loadAsync(buffer);
    const results = [];

    for (const entryName of Object.keys(archive.files)) {
      const entry = archive.files[entryName];
      if (entry.dir || shouldIgnore(entryName)) {
        continue;
      }
      const extension = path.extname(entryName).toLowerCase();
      if (!supportedResumeExtensions.has(extension) && !supportedArchiveExtensions.has(extension)) {
        continue;
      }
      const entryBuffer = await entry.async("nodebuffer");
      const childResults = await extractFile({
        name: entryName,
        buffer: entryBuffer,
        sourceName,
        pathChain: [...pathChain, entryName],
        depth: depth + 1
      });
      results.push(...childResults);
    }

    if (!results.length) {
      throw userError(`压缩包 ${name} 中未发现可解析的简历文件。`, "ARCHIVE_EMPTY", 400);
    }
    return results;
  } catch (error) {
    if (error.isPublic) throw error;
    throw userError(`ZIP 压缩包 ${name} 解析失败，可能已损坏或加密。`, "ZIP_PARSE_FAILED", 400);
  }
}

async function extractRar({ name, buffer, sourceName, pathChain, depth }) {
  try {
    const module = await importOptional("node-unrar-js", "RAR 解析依赖未安装，请先运行 npm install。");
    const createExtractorFromData = module.createExtractorFromData || module.default?.createExtractorFromData;
    if (!createExtractorFromData) {
      throw new Error("node-unrar-js API is unavailable");
    }

    const extractor = await createExtractorFromData({ data: Uint8Array.from(buffer).buffer });
    const list = extractor.getFileList();
    const headers = [...(list.fileHeaders || [])].filter((header) => !header.flags?.directory && !shouldIgnore(header.name));
    const wanted = headers
      .map((header) => header.name)
      .filter((entryName) => supportedResumeExtensions.has(path.extname(entryName).toLowerCase()) || supportedArchiveExtensions.has(path.extname(entryName).toLowerCase()));

    if (!wanted.length) {
      throw userError(`压缩包 ${name} 中未发现可解析的简历文件。`, "ARCHIVE_EMPTY", 400);
    }

    const extracted = extractor.extract({ files: wanted });
    const results = [];
    for (const file of extracted.files || []) {
      if (!file.extraction) {
        continue;
      }
      const childResults = await extractFile({
        name: file.fileHeader?.name || file.name,
        buffer: Buffer.from(file.extraction),
        sourceName,
        pathChain: [...pathChain, file.fileHeader?.name || file.name],
        depth: depth + 1
      });
      results.push(...childResults);
    }

    if (!results.length) {
      throw userError(`RAR 压缩包 ${name} 中的文件无法解压，可能已加密。`, "RAR_ENCRYPTED_OR_EMPTY", 400);
    }
    return results;
  } catch (error) {
    if (error.isPublic) throw error;
    throw userError(`RAR 压缩包 ${name} 解析失败，可能已损坏、加密或格式不兼容。`, "RAR_PARSE_FAILED", 400);
  }
}

function decodeUpload(file) {
  const base64 = String(file.data || "").replace(/^data:.*?;base64,/, "");
  if (!base64) {
    throw userError("上传文件内容为空。", "EMPTY_UPLOAD", 400);
  }
  const buffer = Buffer.from(base64, "base64");
  validateFileSize(file.name || "unknown", buffer);
  return buffer;
}

function validateFileSize(name, buffer) {
  if (buffer.length > config.maxUploadBytes) {
    throw userError(`文件 ${name} 超出大小限制，单个文件最大 ${Math.round(config.maxUploadBytes / 1024 / 1024)}MB。`, "FILE_TOO_LARGE", 413);
  }
}

function decodeText(buffer) {
  const utf8 = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const replacementCount = (utf8.match(/\uFFFD/g) || []).length;
  if (replacementCount > Math.max(8, utf8.length * 0.03)) {
    return buffer.toString("latin1");
  }
  return utf8;
}

async function importOptional(packageName, missingMessage) {
  try {
    return await import(packageName);
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" || /Cannot find package/.test(error.message)) {
      throw userError(missingMessage, "PARSER_DEPENDENCY_MISSING", 500);
    }
    throw error;
  }
}

function shouldIgnore(fileName) {
  const normalized = fileName.replace(/\\/g, "/");
  const parts = normalized.split("/");
  if (parts.some((part) => part.startsWith(".") || part === "__MACOSX")) {
    return true;
  }
  return ignoredExtensions.has(path.extname(normalized).toLowerCase());
}

function userError(message, code, status) {
  const error = new Error(message);
  error.publicMessage = message;
  error.code = code;
  error.status = status;
  error.isPublic = true;
  return error;
}
