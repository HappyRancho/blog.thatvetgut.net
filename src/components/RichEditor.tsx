import { useEffect, useState } from "react";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Node, mergeAttributes } from "@tiptap/core";
import { sanitize } from "../lib/sanitize";
import { safeUrl } from "../lib/domain";
import { ImageField } from "./ImageField";
import { MediaImage } from "./MediaImage";
const callouts = [
  "clinical-alert",
  "pro-tip",
  "dosage-warning",
  "key-takeaways",
];
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      class: {
        default: "pro-tip",
        parseHTML: (el) =>
          callouts.includes(el.className) ? el.className : "pro-tip",
      },
    };
  },
  parseHTML() {
    return [{ tag: "aside" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes), 0];
  },
});
const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "image figcaption?",
  parseHTML() {
    return [{ tag: "figure" }];
  },
  renderHTML() {
    return ["figure", 0];
  },
});
const Caption = Node.create({
  name: "figcaption",
  content: "inline*",
  parseHTML() {
    return [{ tag: "figcaption" }];
  },
  renderHTML() {
    return ["figcaption", 0];
  },
});
function ImageView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper as="span" className="editor-image">
      <MediaImage src={node.attrs.src} alt={node.attrs.alt || ""} />
    </NodeViewWrapper>
  );
}
const SafeImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
export function RichEditor({
  value,
  onChange,
  ownerId,
  onUploadStart,
}: {
  value: string;
  onChange: (v: string) => void;
  ownerId: string;
  onUploadStart: () => void;
}) {
  const [insert, setInsert] = useState(false),
    [image, setImage] = useState(""),
    [alt, setAlt] = useState(""),
    [error, setError] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: ["https", "http"],
        validate: (url) => !!safeUrl(url),
      }),
      SafeImage,
      Placeholder.configure({
        placeholder:
          "Start with the reader’s question. Add the context, evidence and next steps.",
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      Figure,
      Caption,
    ],
    content: sanitize(value),
    editorProps: {
      attributes: {
        class: "prose editor-body",
        role: "textbox",
        "aria-label": "Article body",
        "aria-multiline": "true",
      },
      transformPastedHTML: sanitize,
    },
    onUpdate: ({ editor }) => onChange(sanitize(editor.getHTML())),
  });
  useEffect(() => {
    if (
      editor &&
      sanitize(editor.getHTML()) !== sanitize(value) &&
      !editor.isFocused
    )
      editor.commands.setContent(sanitize(value), false);
  }, [editor, value]);
  if (!editor) return <p role="status">Opening the editor…</p>;
  const action = (
    label: string,
    fn: () => void,
    active = false,
    disabled = false,
  ) => (
    <button
      type="button"
      key={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={fn}
    >
      {label}
    </button>
  );
  return (
    <div className="rich-editor">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Article formatting"
      >
        {action(
          "Paragraph",
          () => {
            editor.chain().focus().setParagraph().run();
          },
          editor.isActive("paragraph"),
        )}
        {([2, 3] as const).map((level) =>
          action(
            `H${level}`,
            () => {
              editor.chain().focus().toggleHeading({ level }).run();
            },
            editor.isActive("heading", { level }),
          ),
        )}
        {action(
          "Bold",
          () => {
            editor.chain().focus().toggleBold().run();
          },
          editor.isActive("bold"),
        )}
        {action(
          "Italic",
          () => {
            editor.chain().focus().toggleItalic().run();
          },
          editor.isActive("italic"),
        )}
        {action(
          "Bullets",
          () => {
            editor.chain().focus().toggleBulletList().run();
          },
          editor.isActive("bulletList"),
        )}
        {action(
          "Numbered",
          () => {
            editor.chain().focus().toggleOrderedList().run();
          },
          editor.isActive("orderedList"),
        )}
        {action(
          "Quote",
          () => {
            editor.chain().focus().toggleBlockquote().run();
          },
          editor.isActive("blockquote"),
        )}
        {action(
          "Link",
          () => {
            const url = window.prompt(
              "Link URL (https://…). Leave empty to remove the link.",
              editor.getAttributes("link").href || "",
            );
            if (url === null) return;
            if (!url) editor.chain().focus().unsetLink().run();
            else if (safeUrl(url))
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: safeUrl(url) })
                .run();
            else setError("Use a valid HTTPS or HTTP link.");
          },
          editor.isActive("link"),
        )}
        {action("Image", () => setInsert(!insert))}
        {action("Table", () => {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        })}
        {editor.isActive("table") && (
          <>
            {action("Add row", () => {
              editor.chain().focus().addRowAfter().run();
            })}
            {action("Add column", () => {
              editor.chain().focus().addColumnAfter().run();
            })}
            {action("Remove table", () => {
              editor.chain().focus().deleteTable().run();
            })}
          </>
        )}
        {action(
          "Undo",
          () => {
            editor.chain().focus().undo().run();
          },
          false,
          !editor.can().undo(),
        )}
        {action(
          "Redo",
          () => {
            editor.chain().focus().redo().run();
          },
          false,
          !editor.can().redo(),
        )}
        <label className="toolbar-select">
          <span className="sr-only">Insert clinical callout</span>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value)
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "callout",
                    attrs: { class: e.target.value },
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Add reviewed guidance." },
                        ],
                      },
                    ],
                  })
                  .run();
              e.target.value = "";
            }}
          >
            <option value="">Clinical callout…</option>
            {callouts.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      {insert && (
        <div className="inline-image-form">
          <ImageField
            value={image}
            alt={alt}
            ownerType="article"
            ownerId={ownerId}
            onChange={setImage}
            onUploadStart={onUploadStart}
          />
          <label>
            Image description
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              maxLength={300}
            />
          </label>
          <button
            type="button"
            disabled={!safeUrl(image, true) || !alt.trim()}
            onClick={() => {
              editor
                .chain()
                .focus()
                .setImage({ src: safeUrl(image, true), alt })
                .run();
              setInsert(false);
              setImage("");
              setAlt("");
            }}
          >
            Insert image
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setInsert(false)}
          >
            Cancel
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p className="editor-hint">
        Formatting is saved with your draft. Ctrl/⌘ + Z undoes your last change.
      </p>
    </div>
  );
}
