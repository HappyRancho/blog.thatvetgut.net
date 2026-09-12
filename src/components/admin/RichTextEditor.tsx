import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Type,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your veterinary clinical article here...',
  minHeight = '360px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  // Modals for link and image insertion
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(2);

  // Sync incoming value to contentEditable when not triggered internally
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChangeRef.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleFormatHeading = (tag: 'h2' | 'h3' | 'p') => {
    executeCommand('formatBlock', `<${tag}>`);
  };

  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection) {
      setLinkText(selection.toString());
    }
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const url = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') ? linkUrl : `https://${linkUrl}`;
    
    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (linkText && (!window.getSelection()?.toString())) {
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-900 underline font-medium">${linkText}</a>`);
    } else {
      document.execCommand('createLink', false, url);
    }
    handleInput();
    setShowLinkModal(false);
  };

  const handleInsertImage = () => {
    if (!imageUrl) return;
    const figureHtml = `
      <figure class="my-6 block clear-both text-center">
        <img src="${imageUrl}" alt="${imageAlt || 'Article image'}" class="w-full max-h-96 object-cover rounded-xl border border-stone-200 mx-auto" />
        ${imageCaption ? `<figcaption class="text-xs text-stone-600 mt-2 italic font-serif">${imageCaption}</figcaption>` : ''}
      </figure>
      <p><br></p>
    `;

    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertHTML', false, figureHtml);
    handleInput();
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setShowImageModal(false);
  };

  const handleInsertTable = () => {
    let tableHtml = `<table class="w-full my-6 text-sm border-collapse border border-stone-300 rounded-lg overflow-hidden"><thead><tr class="bg-stone-100">`;
    for (let c = 1; c <= tableCols; c++) {
      tableHtml += `<th class="border border-stone-300 px-3 py-2 text-left font-bold text-stone-800">Header ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= tableRows; r++) {
      tableHtml += `<tr class="${r % 2 === 0 ? 'bg-stone-50' : 'bg-white'}">`;
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `<td class="border border-stone-300 px-3 py-2 text-stone-700">Cell ${r}-${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;

    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertHTML', false, tableHtml);
    handleInput();
    setShowTableModal(false);
  };

  const handleInsertDivider = () => {
    executeCommand('insertHorizontalRule');
    executeCommand('insertHTML', '<p><br></p>');
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Sticky mobile-first formatting toolbar */}
      <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar touch-pan-x">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings & Text */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => handleFormatHeading('p')}
            className="px-2.5 py-1.5 min-h-[44px] text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap"
            title="Paragraph Text"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Body</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatHeading('h2')}
            className="px-2.5 py-1.5 min-h-[44px] text-xs font-bold text-stone-800 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center gap-1 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4 text-emerald-900" />
            <span>H2</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatHeading('h3')}
            className="px-2.5 py-1.5 min-h-[44px] text-xs font-bold text-stone-800 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center gap-1 transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4 text-emerald-900" />
            <span>H3</span>
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-2 min-h-[44px] min-w-[44px] font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-2 min-h-[44px] min-w-[44px] italic text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Bullet List"
            aria-label="Bullet list"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Numbered List"
            aria-label="Numbered list"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatHeading('p')} // Fallback blockquote command
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('formatBlock', '<blockquote>');
            }}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Blockquote"
            aria-label="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Inserts: Links, Media, Tables, Dividers */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={openLinkModal}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Insert Link"
            aria-label="Insert link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Insert Image"
            aria-label="Insert image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Insert Table"
            aria-label="Insert table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertDivider}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors"
            title="Divider Line"
            aria-label="Horizontal divider"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ContentEditable Document Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="p-4 sm:p-6 text-stone-900 focus:outline-hidden focus:ring-0 leading-relaxed font-sans prose max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 empty:before:pointer-events-none"
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-serif font-bold text-stone-900 text-base">Insert Web Link</h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Target URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/research-study"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Link description text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] shadow-xs"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-serif font-bold text-stone-900 text-base">Insert Clinical Image</h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descriptive Alt Text (for accessibility)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Canine thoracic radiograph showing pulmonary patterns"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Figure 1: Lateral thoracic radiographic projection"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 rounded-xl min-h-[44px] shadow-xs"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-serif font-bold text-stone-900 text-base">Insert Table</h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Columns</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={tableCols}
                  onChange={(e) => setTableCols(Number(e.target.value) || 2)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 outline-hidden min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Rows</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={tableRows}
                  onChange={(e) => setTableRows(Number(e.target.value) || 3)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 outline-hidden min-h-[44px]"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] shadow-xs"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
