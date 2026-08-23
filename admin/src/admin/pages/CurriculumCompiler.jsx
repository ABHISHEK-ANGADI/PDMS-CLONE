// admin/pages/CurriculumCompiler.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Layers,
  Search,
  FileWarning,
  Download,
  FileText,
  Loader2,
  BarChart3,
  ChevronRight,
  Settings,
  Eye,
  Edit,
  X,
  Save,
  FileCode,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Eraser,
  Type,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import Preview from "../components/Preview";

const STATUS_CONFIG = {
  Approved: {
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  Pending: {
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400 animate-pulse",
  },
  Missing: {
    badge: "bg-red-50 text-red-500",
    dot: "bg-red-300",
  },
};

const ProgressBar = ({ pct }) => (
  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full transition-all duration-700 ${
        pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"
      }`}
      style={{ width: `${pct}%` }}
    />
  </div>
);

/* ============================================================
   SELECTION FORMAT TOOLBAR
============================================================ */

const SelectionToolbar = ({
  position,
  onFormat,
  onFontSize,
  onFontFamily,
  onColor,
  onClose,
}) => {
  const [showColors, setShowColors] = useState(false);

  const colors = [
    "#000000",
    "#444444",
    "#666666",
    "#8B0000",
    "#B45309",
    "#047857",
    "#1D4ED8",
    "#7C3AED",
  ];

  return (
    <div
      className="fixed z-[100] flex flex-wrap items-center gap-1 bg-stone-900 text-white rounded-xl shadow-2xl px-1 py-2 w-[350px]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-20%)",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Bold */}
      <button
        type="button"
        title="Bold"
        onClick={() => onFormat("bold")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <Bold size={16} />
      </button>

      {/* Italic */}
      <button
        type="button"
        title="Italic"
        onClick={() => onFormat("italic")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <Italic size={16} />
      </button>

      {/* Underline */}
      <button
        type="button"
        title="Underline"
        onClick={() => onFormat("underline")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <Underline size={16} />
      </button>

      <div className="w-px h-5 bg-white/20 mx-1" />

      {/* Font family */}
      <select
        defaultValue=""
        title="Font Family"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          const value = e.target.value;

          if (value) {
            onFontFamily(value);
          }

          e.target.value = "";
        }}
        className="h-8 bg-stone-800 text-white text-xs rounded-lg px-2 outline-none border border-white/10 cursor-pointer"
      >
        <option value="">Font</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Courier New">Courier New</option>
      </select>

      {/* Font size */}
      <select
        defaultValue=""
        title="Font Size"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          const value = e.target.value;

          if (value) {
            onFontSize(value);
          }

          e.target.value = "";
        }}
        className="h-8 bg-stone-800 text-white text-xs rounded-lg px-2 outline-none border border-white/10 cursor-pointer"
      >
        <option value="">Size</option>
        <option value="1">10px</option>
        <option value="2">12px</option>
        <option value="3">14px</option>
        <option value="4">16px</option>
        <option value="5">18px</option>
        <option value="6">24px</option>
        <option value="7">32px</option>
      </select>

      <div className="w-px h-5 bg-white/20 mx-1" />

      {/* Alignment */}
      <button
        type="button"
        title="Align Left"
        onClick={() => onFormat("justifyLeft")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <AlignLeft size={16} />
      </button>

      <button
        type="button"
        title="Align Center"
        onClick={() => onFormat("justifyCenter")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <AlignCenter size={16} />
      </button>

      <button
        type="button"
        title="Align Right"
        onClick={() => onFormat("justifyRight")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <AlignRight size={16} />
      </button>

      <div className="relative">
        <button
          type="button"
          title="Text Color"
          onClick={() => setShowColors((prev) => !prev)}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
        >
          <Palette size={16} />
        </button>

        {showColors && (
          <div
            className="absolute top-10 left-1/2 -translate-x-1/2 bg-stone-900 border border-white/10 rounded-xl shadow-xl p-2 flex gap-1.5"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => {
                  onColor(color);
                  setShowColors(false);
                }}
                className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                style={{
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        title="Clear Formatting"
        onClick={() => onFormat("removeFormat")}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <Eraser size={16} />
      </button>

      <div className="w-px h-5 bg-white/20 mx-1" />

      <button
        type="button"
        title="Close formatting toolbar"
        onClick={onClose}
        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"
      >
        <X size={15} />
      </button>
    </div>
  );
};

/* ============================================================
   CLEAN EDITOR MODAL
============================================================ */

const CleanEditorModal = ({
  isOpen,
  onClose,
  pageName,
  htmlContent,
  onSave,
  isSaving,
  frontMatterPages,
  getDisplayName,
  onPageSelect,
}) => {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const selectedImageRef = useRef(null);

  const savedRangeRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [pendingImageChanges, setPendingImageChanges] = useState([]);
  const [selectionToolbar, setSelectionToolbar] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPageName, setCurrentPageName] = useState(pageName);

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

  /* ============================================================
     IMAGE HELPERS
  ============================================================ */

  const getImageFilename = (src) => {
    if (!src) return "";

    try {
      const cleanSrc = src.split("?")[0].split("#")[0];

      if (cleanSrc.startsWith("data:") || cleanSrc.startsWith("blob:")) {
        return "";
      }

      return cleanSrc.substring(cleanSrc.lastIndexOf("/") + 1);
    } catch {
      return "";
    }
  };

  const getExtension = (filename) => {
    const cleanName = filename || "";
    const index = cleanName.lastIndexOf(".");

    if (index === -1) {
      return "jpg";
    }

    return cleanName.substring(index + 1).toLowerCase();
  };

  /* ============================================================
     PREPARE HTML FOR EDITOR
  ============================================================ */

  const prepareHTMLForEditor = (html) => {
    if (!html) return "";

    const tempDiv = document.createElement("div");

    tempDiv.innerHTML = html;

    const images = tempDiv.querySelectorAll("img");

    images.forEach((img) => {
      const src = img.getAttribute("src");

      if (!src) return;

      if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:") ||
        src.startsWith("blob:")
      ) {
        return;
      }

      let filename = "";

      if (src.startsWith("./images/")) {
        filename = src.replace("./images/", "");
      } else if (src.startsWith("images/")) {
        filename = src.replace("images/", "");
      } else if (src.startsWith("/images/")) {
        filename = src.replace("/images/", "");
      } else if (src.includes("/images/")) {
        filename = src.substring(src.lastIndexOf("/images/") + 8);
      }

      if (filename) {
        img.setAttribute(
          "src",
          `${BASE_URL}/templates/front_matter/images/${filename}`,
        );

        img.setAttribute("data-original-image-filename", filename);
      }
    });

    return tempDiv.innerHTML;
  };

  /* ============================================================
     PREPARE HTML FOR SAVE
  ============================================================ */

  const prepareHTMLForSave = (html) => {
    if (!html) return "";

    const tempDiv = document.createElement("div");

    tempDiv.innerHTML = html;

    const imagePrefix = `${BASE_URL}/templates/front_matter/images/`;

    const images = tempDiv.querySelectorAll("img");

    images.forEach((img) => {
      const src = img.getAttribute("src");

      if (!src) return;

      const pendingFilename = img.getAttribute("data-backend-image-filename");

      if (pendingFilename) {
        img.setAttribute("src", `./images/${pendingFilename}`);

        img.removeAttribute("data-backend-image-filename");
        img.removeAttribute("data-original-image-filename");
        img.classList.remove("front-matter-image-selected");

        return;
      }

      if (src.startsWith(imagePrefix)) {
        const filename = src.substring(imagePrefix.length);

        img.setAttribute("src", `./images/${filename}`);
      }

      img.removeAttribute("data-backend-image-filename");
      img.removeAttribute("data-original-image-filename");
      img.classList.remove("front-matter-image-selected");
    });

    tempDiv
      .querySelectorAll(".front-matter-image-selected")
      .forEach((element) => {
        element.classList.remove("front-matter-image-selected");
      });

    return tempDiv.innerHTML;
  };

  /* ============================================================
     STATS
  ============================================================ */

  const updateStats = useCallback(() => {
    if (!editorRef.current) return;

    const paragraphs = editorRef.current.querySelectorAll("p");

    setParagraphCount(paragraphs.length);

    const text = editorRef.current.innerText || "";

    const words = text.trim().split(/\s+/).filter(Boolean);

    setWordCount(words.length);
  }, []);

  /* ============================================================
     RESTORE SAVED SELECTION
  ============================================================ */

  const restoreSelection = useCallback(() => {
    const savedRange = savedRangeRef.current;

    if (!savedRange) return false;

    const selection = window.getSelection();

    if (!selection) return false;

    selection.removeAllRanges();

    try {
      selection.addRange(savedRange);
      return true;
    } catch {
      return false;
    }
  }, []);

  /* ============================================================
     SAVE CURRENT SELECTION
  ============================================================ */

  const saveCurrentSelection = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (selection.isCollapsed) {
      return;
    }

    if (!editorRef.current) return;

    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    savedRangeRef.current = range.cloneRange();
  }, []);

  /* ============================================================
     SHOW SELECTION TOOLBAR
  ============================================================ */

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (selection.isCollapsed) {
      setSelectionToolbar((prev) => ({
        ...prev,
        visible: false,
      }));

      return;
    }

    if (!editorRef.current) return;

    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setSelectionToolbar((prev) => ({
        ...prev,
        visible: false,
      }));

      return;
    }

    const rect = range.getBoundingClientRect();

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      return;
    }

    saveCurrentSelection();

    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 10;

    const toolbarHalfWidth = 260;

    if (x < toolbarHalfWidth) {
      x = toolbarHalfWidth;
    }

    if (x > window.innerWidth - toolbarHalfWidth) {
      x = window.innerWidth - toolbarHalfWidth;
    }

    if (y + 55 > window.innerHeight) {
      y = rect.top - 55;
    }

    setSelectionToolbar({
      visible: true,
      x,
      y,
    });
  }, [saveCurrentSelection]);

  /* ============================================================
     OPEN HTML CONTENT
  ============================================================ */

  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = prepareHTMLForEditor(htmlContent);
      setPendingImageChanges([]);
      selectedImageRef.current = null;
      setSelectedImage(null);
      savedRangeRef.current = null;
      setCurrentPageName(pageName);

      setSelectionToolbar({
        visible: false,
        x: 0,
        y: 0,
      });

      setTimeout(() => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        updateStats();
      }, 100);
    }
  }, [isOpen, htmlContent, pageName, updateStats]);

  /* ============================================================
     GLOBAL SELECTION LISTENER
  ============================================================ */

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isOpen, handleSelectionChange]);

  /* ============================================================
     CLEAN OBJECT URLS
  ============================================================ */

  useEffect(() => {
    if (!isOpen) {
      pendingImageChanges.forEach((item) => {
        if (item.objectUrl) {
          URL.revokeObjectURL(item.objectUrl);
        }
      });
    }
  }, [isOpen, pendingImageChanges]);

  /* ============================================================
     FORMAT COMMAND
  ============================================================ */

  const applyFormat = (command, value = null) => {
    if (!editorRef.current) return;

    const restored = restoreSelection();

    if (!restored) {
      toast.error("Please select some text first.");
      return;
    }

    editorRef.current.focus();

    try {
      document.execCommand(command, false, value);
    } catch (error) {
      console.error("Formatting error:", error);
    }

    updateStats();

    saveCurrentSelection();

    setTimeout(() => {
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);

        const rect = range.getBoundingClientRect();

        if (rect) {
          setSelectionToolbar((prev) => ({
            ...prev,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 10,
          }));
        }
      }
    }, 0);
  };

  /* ============================================================
     FONT SIZE
  ============================================================ */

  const applyFontSize = (size) => {
    if (!editorRef.current) return;

    const restored = restoreSelection();

    if (!restored) {
      toast.error("Please select some text first.");
      return;
    }

    editorRef.current.focus();

    try {
      document.execCommand("fontSize", false, size);

      const sizeMap = {
        1: "10px",
        2: "12px",
        3: "14px",
        4: "16px",
        5: "18px",
        6: "24px",
        7: "32px",
      };

      const fonts = editorRef.current.querySelectorAll(`font[size="${size}"]`);

      fonts.forEach((font) => {
        const span = document.createElement("span");

        span.style.fontSize = sizeMap[size];

        while (font.firstChild) {
          span.appendChild(font.firstChild);
        }

        font.replaceWith(span);
      });

      updateStats();

      saveCurrentSelection();
    } catch (error) {
      console.error("Font size error:", error);
    }
  };

  /* ============================================================
     FONT FAMILY
  ============================================================ */

  const applyFontFamily = (fontFamily) => {
    if (!editorRef.current) return;

    const restored = restoreSelection();

    if (!restored) {
      toast.error("Please select some text first.");
      return;
    }

    editorRef.current.focus();

    try {
      document.execCommand("fontName", false, fontFamily);

      const fonts = editorRef.current.querySelectorAll("font[face]");

      fonts.forEach((font) => {
        const face = font.getAttribute("face");

        if (!face) return;

        const span = document.createElement("span");

        span.style.fontFamily = `"${face}"`;

        while (font.firstChild) {
          span.appendChild(font.firstChild);
        }

        font.replaceWith(span);
      });

      updateStats();

      saveCurrentSelection();
    } catch (error) {
      console.error("Font family error:", error);
    }
  };

  /* ============================================================
     TEXT COLOR
  ============================================================ */

  const applyColor = (color) => {
    applyFormat("foreColor", color);
  };

  /* ============================================================
     EDITOR CLICK
  ============================================================ */

  const handleEditorClick = (e) => {
    const target = e.target;

    if (target && target.tagName && target.tagName.toLowerCase() === "img") {
      e.preventDefault();
      e.stopPropagation();

      setSelectionToolbar({
        visible: false,
        x: 0,
        y: 0,
      });

      if (selectedImageRef.current && selectedImageRef.current !== target) {
        selectedImageRef.current.classList.remove(
          "front-matter-image-selected",
        );
      }

      selectedImageRef.current = target;
      setSelectedImage(target);
      target.classList.add("front-matter-image-selected");

      imageInputRef.current?.click();

      return;
    }
  };

  /* ============================================================
     IMAGE SELECTED
  ============================================================ */

  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    const imageElement = selectedImageRef.current;

    if (!imageElement) {
      toast.error("Please click an image before replacing it.");
      e.target.value = "";
      return;
    }

    const oldSrc = imageElement.getAttribute("src") || "";
    const oldFilename =
      imageElement.getAttribute("data-original-image-filename") ||
      getImageFilename(oldSrc);

    const extension = getExtension(file.name);

    let newFilename = oldFilename;

    if (!newFilename) {
      const originalName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      newFilename = `${originalName || "front_matter_image"}.${extension}`;
    } else {
      const oldExtension = getExtension(oldFilename);

      if (oldExtension !== extension) {
        const oldBaseName = oldFilename.replace(/\.[^/.]+$/, "");

        newFilename = `${oldBaseName}.${extension}`;
      }
    }

    const objectUrl = URL.createObjectURL(file);

    setPendingImageChanges((prev) => {
      const filtered = prev.filter(
        (item) => item.imageElement !== imageElement,
      );

      return [
        ...filtered,
        {
          imageElement,
          file,
          oldFilename,
          filename: newFilename,
          objectUrl,
        },
      ];
    });

    imageElement.setAttribute("src", objectUrl);
    imageElement.setAttribute("data-backend-image-filename", newFilename);
    imageElement.setAttribute("data-original-image-filename", oldFilename || "");
    imageElement.style.maxWidth = "100%";
    imageElement.style.height = "auto";

    selectedImageRef.current = imageElement;
    setSelectedImage(imageElement);
    imageElement.classList.add("front-matter-image-selected");

    e.target.value = "";

    updateStats();

    toast.success("Image changed. Click Save Changes to update the backend.");
  };

  /* ============================================================
     KEY DOWN
  ============================================================ */

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
      return;
    }

    if (e.key === "Escape") {
      setSelectionToolbar({
        visible: false,
        x: 0,
        y: 0,
      });
    }
  };

  /* ============================================================
     INPUT
  ============================================================ */

  const handleEditorInput = () => {
    updateStats();
    saveCurrentSelection();
  };

  /* ============================================================
     SAVE
  ============================================================ */

  const handleSave = () => {
    if (!editorRef.current) return;

    setSelectionToolbar({
      visible: false,
      x: 0,
      y: 0,
    });

    const updatedHTML = prepareHTMLForSave(editorRef.current.innerHTML);

    onSave(
      currentPageName,
      updatedHTML,
      pendingImageChanges.map((item) => ({
        file: item.file,
        filename: item.filename,
        oldFilename: item.oldFilename,
      })),
    );
  };

  /* ============================================================
     HANDLE PAGE SELECT
  ============================================================ */

  const handlePageSelect = (page) => {
    const displayName = getDisplayName(page.name);
    setCurrentPageName(displayName);
    onPageSelect(page);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Edit size={18} />
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-lg">
                Edit Front Matter Pages
              </h3>

              <p className="text-xs text-stone-500">
                Select a page from sidebar · Select text to format · Click image to replace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu size={20} className="text-stone-500" />
            </button>

            <span className="text-xs text-stone-400 hidden sm:block">
              Ctrl+S to save
            </span>

            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-stone-500" />
            </button>
          </div>
        </div>

        {/* ======================================================
            MAIN CONTENT WITH SIDEBAR
        ====================================================== */}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`
              ${sidebarOpen ? 'w-72' : 'w-0'}
              border-r border-stone-200 bg-stone-50/50 overflow-y-auto flex-shrink-0
              transition-all duration-300 ease-in-out
              ${!sidebarOpen && 'overflow-hidden'}
            `}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                  Pages
                </h4>
                <span className="text-xs text-stone-400 bg-stone-200 px-2 py-0.5 rounded-full">
                  {frontMatterPages.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {frontMatterPages.map((page) => {
                  const displayName = getDisplayName(page.name);
                  const isActive = displayName === currentPageName;

                  return (
                    <button
                      key={page.name}
                      onClick={() => handlePageSelect(page)}
                      className={`
                        w-full text-left p-3 rounded-xl transition-all
                        ${isActive
                          ? "bg-amber-100/80 border-2 border-amber-500 shadow-sm"
                          : "hover:bg-stone-100 border-2 border-transparent"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isActive
                            ? "bg-amber-600 text-white"
                            : "bg-stone-200 text-stone-600"
                          }
                        `}>
                          <FileText size={14} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`
                            text-sm font-medium truncate
                            ${isActive ? "text-amber-900" : "text-stone-700"}
                          `}>
                            {displayName}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono truncate">
                            {page.name}.html
                          </p>
                        </div>

                        {page.updatedAt && (
                          <span className="text-[9px] text-stone-400 flex-shrink-0">
                            {new Date(page.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page name indicator */}
            <div className="p-3 border-b border-stone-100 bg-stone-50/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors lg:hidden"
                  >
                    <ChevronLeft size={18} className="text-stone-500" />
                  </button>
                  <span className="text-sm font-bold text-stone-800">
                    {currentPageName}
                  </span>
                </div>
                <span className="text-xs text-stone-400">
                  {paragraphCount} paragraphs · {wordCount} words
                </span>
              </div>
            </div>

            {/* Hidden image picker */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelected}
            />

            {/* Editor */}
            <div className="flex-1 overflow-y-auto bg-stone-100 p-6">
              <div
                className="mx-auto bg-white shadow-sm border border-stone-200"
                style={{
                  maxWidth: "850px",
                  minHeight: "700px",
                }}
              >
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onClick={handleEditorClick}
                  onKeyDown={handleKeyDown}
                  onMouseUp={handleSelectionChange}
                  spellCheck={true}
                  className="w-full min-h-[65vh] outline-none overflow-visible bg-white rounded-lg p-8"
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-400 flex-wrap">
                <span>✏️ Select text to format</span>
                <span>·</span>
                <span>🖼️ Click image to replace</span>
                <span>·</span>
                <span>⏎ Enter for new line</span>
                <span>·</span>
                <span>Ctrl+S to save</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-stone-200 bg-stone-50/50 flex-shrink-0">
              <div className="text-xs text-stone-400">
                {paragraphCount} paragraphs · {wordCount} words
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-700 text-white font-bold text-sm rounded-lg hover:bg-amber-800 transition-all shadow-lg shadow-amber-700/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          EDITOR IMAGE SELECTION STYLE
      ======================================================== */}

      <style>
        {`
          .front-matter-image-selected {
            outline: 3px solid #d97706 !important;
            outline-offset: 3px;
            box-shadow:
              0 0 0 5px rgba(217, 119, 6, 0.12) !important;
          }

          [contenteditable="true"] img {
            cursor: pointer;
          }

          [contenteditable="true"] img:hover {
            outline: 2px dashed rgba(217, 119, 6, 0.45);
            outline-offset: 2px;
          }

          [contenteditable="true"] p {
            min-height: 1em;
          }

          [contenteditable="true"] {
            caret-color: #92400e;
          }
        `}
      </style>
    </div>
  );
};

/* ================================================================
   CURRICULUM COMPILER
================================================================ */

const CurriculumCompiler = () => {
  const { axios, adminToken } = useAppContext();

  const [programs, setPrograms] = useState([]);
  const [selectedPd, setSelectedPd] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewBookData, setPreviewBookData] = useState(null);
  const [searchTerm, setSearch] = useState("");

  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageContent, setPageContent] = useState("");
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [frontMatterPages, setFrontMatterPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const [curriculumConfig, setCurriculumConfig] = useState({
    title: "Bachelor of Technology",
    subtitle: "Computer Science and Engineering",
    scheme: "2026 Scheme",
  });

  /* ============================================================
     FETCH APPROVED PROGRAMS
  ============================================================ */

  const fetchApprovedPrograms = async () => {
    setLoadingList(true);

    try {
      const { data } = await axios.get("/api/admin/approved/pds", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (data.success) {
        setPrograms(data.pds);
      }
    } catch (err) {
      toast.error("Failed to load approved programs");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchApprovedPrograms();
    }
  }, [adminToken]);

  /* ============================================================
     FRONT MATTER
  ============================================================ */

  useEffect(() => {
    if (selectedPd && adminToken) {
      fetchFrontMatterPages();
    }
  }, [selectedPd, adminToken]);

  const fetchFrontMatterPages = async () => {
    setLoadingPages(true);

    try {
      const { data } = await axios.get(
        "/api/admin/compiler/frontmatter/pages",
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      if (data.success) {
        setFrontMatterPages(data.pages);
      }
    } catch (err) {
      console.error("Failed to fetch front matter pages:", err);
    } finally {
      setLoadingPages(false);
    }
  };

  /* ============================================================
     DISPLAY NAME
  ============================================================ */

  const getDisplayName = (name) => {
    const map = {
      cover: "Cover Page",
      chancellor: "Chancellor's Message",
      vc: "Vice Chancellor's Message",
      registrar: "Registrar's Message",
      director: "Director's Message",
      hod: "Head of Department Message",
      bos: "Board of Studies",
      academic_council: "Academic Council",
      acknowledgement: "Acknowledgements",
      back_cover: "Back Cover",
      pvc: "Pro-Vice Chancellor's Message",
    };

    return map[name] || name;
  };

  /* ============================================================
     EDIT PAGE
  ============================================================ */

  const handleEditPage = async (page) => {
    setSelectedPage(page);
    setPageContent(page.content || "");
    setPageEditorOpen(true);
  };

  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setPageContent(page.content || "");
  };

  /* ============================================================
     SAVE PAGE
  ============================================================ */

  const handleSavePage = async (
    pageName,
    updatedContent,
    imageChanges = [],
  ) => {
    setIsSavingPage(true);

    try {
      const originalPage = frontMatterPages.find(
        (p) => getDisplayName(p.name) === pageName,
      );

      if (!originalPage) {
        toast.error("Page not found");
        setIsSavingPage(false);
        return;
      }

      const actualFileName = originalPage.name;

      /* ======================================================
         STEP 1: UPLOAD CHANGED IMAGES
      ====================================================== */

      if (imageChanges.length > 0) {
        for (const imageChange of imageChanges) {
          if (!imageChange.file) {
            continue;
          }

          const formData = new FormData();

          formData.append("pageName", actualFileName);
          formData.append("filename", imageChange.filename);

          if (imageChange.oldFilename) {
            formData.append("oldFilename", imageChange.oldFilename);
          }

          formData.append("image", imageChange.file);

          const imageResponse = await axios.post(
            "/api/admin/compiler/frontmatter/image",
            formData,
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );

          if (!imageResponse.data || !imageResponse.data.success) {
            throw new Error(
              imageResponse.data?.message ||
                `Failed to upload ${imageChange.filename}`,
            );
          }
        }
      }

      /* ======================================================
         STEP 2: SAVE HTML
      ====================================================== */

      const { data } = await axios.post(
        "/api/admin/compiler/frontmatter/save",
        {
          pageName: actualFileName,
          content: updatedContent,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      if (data.success) {
        setFrontMatterPages((prev) =>
          prev.map((p) =>
            p.name === actualFileName
              ? {
                  ...p,
                  content: updatedContent,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );

        toast.success(`"${pageName}" saved successfully!`);

        // Update the selected page content
        setPageContent(updatedContent);

        // Update the selected page in state
        setSelectedPage((prev) => {
          if (prev && prev.name === actualFileName) {
            return {
              ...prev,
              content: updatedContent,
              updatedAt: new Date().toISOString(),
            };
          }
          return prev;
        });
      } else {
        toast.error(data.message || "Failed to save page");
      }
    } catch (error) {
      console.error("Save error:", error);

      toast.error(
        error.response?.data?.message || error.message || "Failed to save page",
      );
    } finally {
      setIsSavingPage(false);
    }
  };

  /* ============================================================
     CHECK READINESS
  ============================================================ */

  const checkReadiness = async (pd) => {
    setSelectedPd(pd);
    setReadiness(null);
    setChecking(true);

    try {
      const { data } = await axios.get(
        `/api/admin/compiler/readiness/${pd._id}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      if (data.success) {
        setReadiness(data.analysis);

        setCurriculumConfig((prev) => ({
          ...prev,
          subtitle: data.analysis.programName || prev.subtitle,
          scheme: `${pd.scheme_year} Scheme` || prev.scheme,
        }));
      }
    } catch (err) {
      toast.error("Error analyzing curriculum");
    } finally {
      setChecking(false);
    }
  };

  /* ============================================================
     PREVIEW
  ============================================================ */

  const handlePreview = async () => {
    if (pct < 100) {
      return toast.error("Curriculum is not 100% complete!");
    }

    setIsPreviewLoading(true);

    const toastId = toast.loading("Preparing curriculum book preview...");

    try {
      const { data } = await axios.get(
        `/api/admin/compiler/preview/${selectedPd._id}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      if (data.success) {
        setPreviewBookData({
          html: data.html,
          tocItems: data.tocItems,
          bookData: data.bookData,
          programId: selectedPd._id,
        });

        toast.success("Preview ready!", {
          id: toastId,
        });
      } else {
        toast.error(data.message || "Failed to load preview", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Preview error:", error);

      toast.error("Failed to load preview", {
        id: toastId,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /* ============================================================
     DOWNLOAD
  ============================================================ */

  const handleDownload = async () => {
    if (pct < 100) {
      return toast.error("Curriculum is not 100% complete!");
    }

    setIsDownloading(true);

    const toastId = toast.loading("Generating Curriculum Book...");

    try {
      const response = await axios.get(
        `/api/admin/compiler/download/${selectedPd._id}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        `${selectedPd.program_id}_Curriculum_Book.pdf`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Curriculum Book downloaded successfully!", {
        id: toastId,
      });
    } catch (error) {
      console.error("Download error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate curriculum book.";

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  /* ============================================================
     FILTER
  ============================================================ */

  const filtered = programs.filter(
    (pd) =>
      pd.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.program_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pct = readiness?.completionPercentage || 0;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl pb-10">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Layers size={26} />
          </div>

          <div>
            <h1 className="text-3xl font-black text-stone-900">
              Curriculum Compiler
            </h1>

            <p className="text-stone-500 text-sm mt-1">
              Assemble approved course documents into a publication-ready PDF.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ====================================================
              PROGRAM LIST
          ==================================================== */}

          <div className="space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-stone-200 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-amber-600" size={28} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <FileWarning size={36} className="mx-auto mb-2 opacity-40" />

                <p className="text-sm font-medium">
                  No approved programs found
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map((pd) => {
                  const isSelected = selectedPd?._id === pd._id;

                  return (
                    <button
                      key={pd._id}
                      onClick={() => checkReadiness(pd)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/70 shadow-sm"
                          : "border-stone-200 hover:border-amber-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-800 text-sm">
                            {pd.program_name}
                          </p>

                          <p className="text-xs text-stone-400 font-mono">
                            {pd.program_id}
                          </p>
                        </div>

                        <ChevronRight
                          size={16}
                          className={`text-stone-400 transition ${
                            isSelected ? "rotate-90 text-amber-600" : ""
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ====================================================
              RIGHT SIDE
          ==================================================== */}

          <div className="lg:col-span-2 space-y-6">
            {/* LOADING */}

            {selectedPd && checking && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm min-h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 size={42} className="animate-spin text-amber-600" />

                  <div className="text-center">
                    <p className="font-bold text-stone-800">
                      Loading curriculum...
                    </p>

                    <p className="text-sm text-stone-400 mt-1">
                      Analyzing {selectedPd.program_name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================
                DOCUMENT CONFIG
            ================================================== */}

            {selectedPd && readiness && !checking && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={18} className="text-stone-400" />

                  <h3 className="font-bold text-stone-700">
                    Document Configuration
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Degree Title
                    </label>

                    <input
                      type="text"
                      value={curriculumConfig.title}
                      onChange={(e) =>
                        setCurriculumConfig({
                          ...curriculumConfig,
                          title: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Program Name
                    </label>

                    <input
                      type="text"
                      value={curriculumConfig.subtitle}
                      onChange={(e) =>
                        setCurriculumConfig({
                          ...curriculumConfig,
                          subtitle: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Scheme / Year
                    </label>

                    <input
                      type="text"
                      value={curriculumConfig.scheme}
                      onChange={(e) =>
                        setCurriculumConfig({
                          ...curriculumConfig,
                          scheme: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================
                FRONT MATTER - ONLY EDIT BUTTON
            ================================================== */}

            {selectedPd && readiness && !checking && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode size={18} className="text-stone-400" />
                    <h3 className="font-bold text-stone-700">
                      Front Matter Pages
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      if (frontMatterPages.length > 0) {
                        handleEditPage(frontMatterPages[0]);
                      } else {
                        toast.error("No front matter pages available");
                      }
                    }}
                    disabled={frontMatterPages.length === 0 || loadingPages}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit size={16} />
                    Edit Cover Pages
                  </button>
                </div>

                {loadingPages && (
                  <div className="flex justify-center py-4 mt-2">
                    <Loader2 size={20} className="animate-spin text-amber-600" />
                  </div>
                )}

                {!loadingPages && frontMatterPages.length === 0 && (
                  <div className="text-center py-4 mt-2 text-stone-400">
                    <p className="text-sm font-medium">
                      No front matter pages found
                    </p>
                    <p className="text-xs">
                      Make sure the templates exist in the backend
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================
                READINESS
            ================================================== */}

            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden animate-in fade-in duration-400 flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
                <div className="p-7 border-b border-stone-100 bg-stone-50/50 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={15} className="text-amber-700" />

                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                          Readiness Report
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-stone-900">
                        {readiness.programName || readiness.programCode}
                      </h3>

                      <p className="text-stone-400 text-sm font-medium mt-0.5">
                        {readiness.programCode}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-4xl font-black tabular-nums tracking-tighter ${
                          pct === 100
                            ? "text-green-600"
                            : pct >= 60
                              ? "text-amber-700"
                              : "text-red-500"
                        }`}
                      >
                        {pct}%
                      </p>

                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Ready
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ProgressBar pct={pct} />

                    <div className="flex justify-between text-[11px] text-stone-400 font-medium mt-1.5">
                      <span className="text-green-600 font-bold">
                        {readiness.totalApproved} approved
                      </span>

                      <span>
                        {readiness.totalRequired} total courses required
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-7 space-y-7 overflow-y-auto flex-1 bg-stone-50/30">
                  {readiness.semesters?.map((sem) => (
                    <div key={sem.number}>
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-black text-stone-800 uppercase tracking-wide">
                          Semester {sem.number}
                        </h4>

                        <div className="flex-1 h-px bg-stone-200" />

                        <span className="text-[10px] font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
                          {sem.courses?.length} courses
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {sem.courses?.map((course) => {
                          const S =
                            STATUS_CONFIG[course.status] ||
                            STATUS_CONFIG.Missing;

                          return (
                            <div
                              key={course.code}
                              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${S.dot}`}
                                />

                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-800 truncate group-hover:text-amber-900">
                                    {course.code}
                                  </p>

                                  <p className="text-[10px] text-stone-500 truncate w-32">
                                    {course.title}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/50 ${S.badge}`}
                                >
                                  {course.status}
                                </span>

                                {course.version && (
                                  <span className="text-[9px] font-bold text-stone-400 font-mono">
                                    v{course.version}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2.5 text-stone-600 text-sm bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                    <FileText size={16} className="text-amber-600" />
                    Book contains <strong>1 PD</strong> and{" "}
                    <strong>{readiness.totalApproved} CDs</strong>.
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePreview}
                      disabled={pct < 100 || isDownloading || isPreviewLoading}
                      className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all text-sm w-full sm:w-auto ${
                        pct === 100
                          ? "bg-amber-800 text-white hover:bg-amber-900 shadow-xl shadow-amber-900/20 active:scale-95"
                          : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                      }`}
                    >
                      {isPreviewLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Eye size={16} />
                      )}

                      {isPreviewLoading
                        ? "Loading Preview..."
                        : "Preview & Download"}
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={pct < 100 || isDownloading || isPreviewLoading}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                        pct === 100
                          ? "bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/30 active:scale-95"
                          : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                      }`}
                      title="Download directly without preview"
                    >
                      {isDownloading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          PREVIEW
      ======================================================== */}

      {previewBookData && (
        <Preview
          isModal={true}
          onClose={() => setPreviewBookData(null)}
          bookData={previewBookData.bookData}
          bookHtml={previewBookData.html}
          tocItemsForBook={previewBookData.tocItems}
        />
      )}

      {/* ========================================================
          EDITOR MODAL
      ======================================================== */}

      <CleanEditorModal
        isOpen={pageEditorOpen}
        onClose={() => {
          setPageEditorOpen(false);
          setSelectedPage(null);
          setPageContent("");
        }}
        pageName={selectedPage ? getDisplayName(selectedPage.name) : ""}
        htmlContent={pageContent}
        onSave={handleSavePage}
        isSaving={isSavingPage}
        frontMatterPages={frontMatterPages}
        getDisplayName={getDisplayName}
        onPageSelect={handlePageSelect}
      />
    </AdminLayout>
  );
};

export default CurriculumCompiler;