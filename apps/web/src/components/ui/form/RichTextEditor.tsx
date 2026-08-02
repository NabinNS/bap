"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontSize from "@tiptap/extension-font-size";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Link as LinkIcon, Unlink, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Code,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Quote, Minus, Table as TableIcon, Image as ImageIcon,
  Code2, Highlighter,
} from "lucide-react";

type Props = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  value?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: number;
};

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

const TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff",
  "#fed7aa", "#cffafe", "#fce7f3", "#f1f5f9", "#ffffff",
];

// ── Sub-components ──────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-4 bg-slate-300 mx-0.5 shrink-0" />;
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 transition-colors shrink-0 ${
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function FontSizePicker({ value, onChange }: { value: string; onChange: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="h-7 px-2 text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 min-w-[58px] flex items-center justify-between gap-1"
      >
        <span>{value ? `${value}px` : "Size"}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-0.5 w-20 bg-white border border-slate-200 shadow-md">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(""); setOpen(false); }}
            className="w-full px-2 py-1 text-xs text-left text-slate-500 hover:bg-slate-50"
          >
            Default
          </button>
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
              className={`w-full px-2 py-1 text-xs text-left hover:bg-slate-50 ${value === s ? "font-semibold bg-slate-100" : ""}`}
            >
              {s}px
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  icon, title, colors, onSelect, currentColor,
}: {
  icon: React.ReactNode;
  title: string;
  colors: string[];
  onSelect: (color: string) => void;
  currentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex flex-col items-center gap-0.5"
      >
        {icon}
        <span
          className="w-3.5 h-0.5 rounded-sm"
          style={{ backgroundColor: currentColor ?? "transparent", border: currentColor ? "none" : "1px solid #cbd5e1" }}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-0.5 p-2 bg-white border border-slate-200 shadow-md grid grid-cols-5 gap-1 w-max">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
              className="w-5 h-5 rounded-sm border border-slate-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            title="Remove"
            onMouseDown={(e) => { e.preventDefault(); onSelect(""); setOpen(false); }}
            className="w-5 h-5 rounded-sm border border-slate-300 text-[8px] text-slate-500 flex items-center justify-center hover:bg-slate-50"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function RichTextEditor({
  label, required, hint, error,
  value, onChange, onBlur,
  placeholder = "Write something...",
  minHeight = 160,
}: Props) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState("");
  const [currentFontSize, setCurrentFontSize] = useState("");
  const [currentColor, setCurrentColor] = useState<string | undefined>(undefined);
  const [currentHighlight, setCurrentHighlight] = useState<string | undefined>(undefined);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  function syncToolbarState(editor: ReturnType<typeof useEditor>) {
    if (!editor) return;
    setCurrentFontSize(editor.getAttributes("textStyle").fontSize?.replace("px", "") ?? "");
    setCurrentColor(editor.getAttributes("textStyle").color ?? undefined);
    setCurrentHighlight(editor.getAttributes("highlight").color ?? undefined);
    setWordCount(editor.storage.characterCount?.words() ?? 0);
    setCharCount(editor.storage.characterCount?.characters() ?? 0);
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: {},
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false }),
      CharacterCount,
    ],
    content: value ?? "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      syncToolbarState(editor);
    },
    onSelectionUpdate: ({ editor }) => syncToolbarState(editor),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none px-3 py-2 min-h-[inherit] text-sm text-text-default",
      },
    },
  });

  const enterSource = useCallback(() => {
    setSourceValue(editor?.getHTML() ?? "");
    setSourceMode(true);
  }, [editor]);

  const exitSource = useCallback(() => {
    editor?.commands.setContent(sourceValue);
    onChange?.(sourceValue);
    setSourceMode(false);
  }, [editor, sourceValue, onChange]);

  function setLink() {
    const url = window.prompt("URL", editor?.getAttributes("link").href ?? "");
    if (url === null) return;
    if (url === "") { editor?.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertImage() {
    const url = window.prompt("Image URL");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }

  const borderClass = error ? "border-red-500" : "border-slate-400 focus-within:border-slate-600";

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-semibold text-text-default">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className={`mt-1 border transition-colors ${borderClass}`}>
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">

          <FontSizePicker
            value={currentFontSize}
            onChange={(size) => {
              if (!size) { editor?.chain().focus().unsetFontSize().run(); setCurrentFontSize(""); }
              else { editor?.chain().focus().setFontSize(`${size}px`).run(); setCurrentFontSize(size); }
            }}
          />

          <Divider />

          {/* Headings */}
          <ToolbarButton title="Heading 2 (Ctrl+Alt+2)" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3 (Ctrl+Alt+3)" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Inline formatting */}
          <ToolbarButton title="Bold (Ctrl+B)" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Italic (Ctrl+I)" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Subscript" active={editor?.isActive("subscript")} onClick={() => editor?.chain().focus().toggleSubscript().run()}>
            <SubscriptIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Superscript" active={editor?.isActive("superscript")} onClick={() => editor?.chain().focus().toggleSuperscript().run()}>
            <SuperscriptIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Inline Code" active={editor?.isActive("code")} onClick={() => editor?.chain().focus().toggleCode().run()}>
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Colors */}
          <ColorPicker
            icon={<span className="text-[11px] font-bold leading-none">A</span>}
            title="Text Color"
            colors={TEXT_COLORS}
            currentColor={currentColor}
            onSelect={(c) => {
              if (!c) { editor?.chain().focus().unsetColor().run(); setCurrentColor(undefined); }
              else { editor?.chain().focus().setColor(c).run(); setCurrentColor(c); }
            }}
          />
          <ColorPicker
            icon={<Highlighter className="h-3.5 w-3.5" />}
            title="Highlight Color"
            colors={HIGHLIGHT_COLORS}
            currentColor={currentHighlight}
            onSelect={(c) => {
              if (!c) { editor?.chain().focus().unsetHighlight().run(); setCurrentHighlight(undefined); }
              else { editor?.chain().focus().setHighlight({ color: c }).run(); setCurrentHighlight(c); }
            }}
          />

          <Divider />

          {/* Alignment */}
          <ToolbarButton title="Align Left" active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align Center" active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align Right" active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Justify" active={editor?.isActive({ textAlign: "justify" })} onClick={() => editor?.chain().focus().setTextAlign("justify").run()}>
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Lists & blocks */}
          <ToolbarButton title="Bullet List" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Numbered List" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Blockquote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Code Block" active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
            <Code2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Horizontal Rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Link */}
          <ToolbarButton title="Add Link (Ctrl+K)" active={editor?.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Remove Link" onClick={() => editor?.chain().focus().unsetLink().run()}>
            <Unlink className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Table */}
          <ToolbarButton
            title="Insert Table"
            active={editor?.isActive("table")}
            onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* Image */}
          <ToolbarButton title="Insert Image" onClick={insertImage}>
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Undo / Redo */}
          <ToolbarButton title="Undo (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Redo (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Source toggle */}
          <ToolbarButton title={sourceMode ? "Visual Editor" : "Source Code"} active={sourceMode} onClick={sourceMode ? exitSource : enterSource}>
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* ── Editor / Source area ── */}
        {sourceMode ? (
          <textarea
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
            style={{ minHeight }}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 text-green-400 focus:outline-none resize-y"
            spellCheck={false}
          />
        ) : (
          <div style={{ minHeight }} className="cursor-text" onClick={() => editor?.commands.focus()}>
            <EditorContent editor={editor} className="h-full" />
          </div>
        )}

        {/* ── Footer: word & char count ── */}
        <div className="flex items-center justify-end gap-3 px-3 py-1 border-t border-slate-100 bg-slate-50">
          <span className="text-[11px] text-slate-400">{wordCount} words</span>
          <span className="text-[11px] text-slate-400">{charCount} characters</span>
        </div>
      </div>

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
