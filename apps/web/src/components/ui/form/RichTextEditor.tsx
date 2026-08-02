"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontSize from "@tiptap/extension-font-size";
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Link as LinkIcon, Unlink, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Code,
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
        className="h-7 px-2 text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 min-w-[56px] text-left flex items-center justify-between gap-1"
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

function Divider() {
  return <div className="w-px h-4 bg-slate-300 mx-1 shrink-0" />;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
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
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  label,
  required,
  hint,
  error,
  value,
  onChange,
  onBlur,
  placeholder = "Write something...",
  minHeight = 160,
}: Props) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState("");
  const [currentFontSize, setCurrentFontSize] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontSize,
    ],
    content: value ?? "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      setCurrentFontSize(editor.getAttributes("textStyle").fontSize?.replace("px", "") ?? "");
    },
    onSelectionUpdate: ({ editor }) => {
      setCurrentFontSize(editor.getAttributes("textStyle").fontSize?.replace("px", "") ?? "");
    },
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
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
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
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">

          {/* Font size */}
          <FontSizePicker
            value={currentFontSize}
            onChange={(size) => {
              if (!size) {
                editor?.chain().focus().unsetFontSize().run();
                setCurrentFontSize("");
              } else {
                editor?.chain().focus().setFontSize(`${size}px`).run();
                setCurrentFontSize(size);
              }
            }}
          />

          <Divider />

          {/* Headings */}
          <ToolbarButton
            title="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Formatting */}
          <ToolbarButton
            title="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor?.isActive("strike")}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Alignment */}
          <ToolbarButton
            title="Align Left"
            active={editor?.isActive({ textAlign: "left" })}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Center"
            active={editor?.isActive({ textAlign: "center" })}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Right"
            active={editor?.isActive({ textAlign: "right" })}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Justify"
            active={editor?.isActive({ textAlign: "justify" })}
            onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Lists */}
          <ToolbarButton
            title="Bullet List"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered List"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Link */}
          <ToolbarButton title="Add Link" active={editor?.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Remove Link"
            onClick={() => editor?.chain().focus().unsetLink().run()}
          >
            <Unlink className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Undo / Redo */}
          <ToolbarButton title="Undo" onClick={() => editor?.chain().focus().undo().run()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor?.chain().focus().redo().run()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* Source toggle */}
          <ToolbarButton
            title={sourceMode ? "Visual Editor" : "Source Code"}
            active={sourceMode}
            onClick={sourceMode ? exitSource : enterSource}
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Editor / Source area */}
        {sourceMode ? (
          <textarea
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
            style={{ minHeight }}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 text-green-400 focus:outline-none resize-y"
            spellCheck={false}
          />
        ) : (
          <div
            style={{ minHeight }}
            className="cursor-text"
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} className="h-full" />
          </div>
        )}
      </div>

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
