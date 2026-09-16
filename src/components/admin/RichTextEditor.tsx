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
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { isSafeLinkUrl, isSafeImageUrl } from '../../lib/sanitizer';
import { uploadImageFile, validateImageFile } from '../../services/imageService';

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

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table modal state
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

  const executeCommand = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
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
    setLinkError(null);
    setShowLinkModal(true);
  };

  const handleInsertLink = () => {
    setLinkError(null);
    if (!linkUrl.trim()) return;

    let targetUrl = linkUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('/') && !targetUrl.startsWith('#')) {
      targetUrl = `https://${targetUrl}`;
    }

    if (!isSafeLinkUrl(targetUrl)) {
      setLinkError('Unsafe link URL detected. Only secure http/https links or site anchors are allowed.');
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (linkText && !window.getSelection()?.toString()) {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-900 underline font-medium">${linkText}</a>`
      );
    } else {
      document.execCommand('createLink', false, targetUrl);
    }
    handleInput();
    setShowLinkModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setUploadSuccess(false);

    // 1. Validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadImageFile(file, { folder: 'articles' });
      setImageUrl(res.url);
      setUploadSuccess(true);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setImageError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertImage = () => {
    setImageError(null);
    if (!imageUrl.trim()) return;

    if (!isSafeImageUrl(imageUrl)) {
      setImageError('Invalid image URL format or unsafe protocol.');
      return;
    }

    const figureHtml = `
      <figure class="my-6 block clear-both text-center">
        <img src="${imageUrl}" alt="${imageAlt || 'Article clinical image'}" class="w-full max-h-96 object-cover rounded-xl border border-stone-200 mx-auto" />
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
    setUploadSuccess(false);
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
      {/* Sticky formatting toolbar */}
      <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar touch-pan-x">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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
            className="px-2.5 py-1.5 min-h-[44px] text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
            title="Body Paragraph"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Body</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatHeading('h2')}
            className="px-2.5 py-1.5 min-h-[44px] text-xs font-bold text-stone-800 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4 text-emerald-900" />
            <span>H2</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatHeading('h3')}
            className="px-2.5 py-1.5 min-h-[44px] text-xs font-bold text-stone-800 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4 text-emerald-900" />
            <span>H3</span>
          </button>
        </div>

        {/* Inline Formatting: Bold & Italic */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-2 min-h-[44px] min-w-[44px] font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-2 min-h-[44px] min-w-[44px] italic text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Blockquote */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Bullet List"
            aria-label="Bullet list"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Numbered List"
            aria-label="Numbered list"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Insert Link (Safe & Validated)"
            aria-label="Insert link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setImageError(null);
              setUploadSuccess(false);
              setShowImageModal(true);
            }}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Insert Clinical Image"
            aria-label="Insert image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-emerald-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Insert Table"
            aria-label="Insert table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertDivider}
            className="p-2 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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
              <h4 className="font-serif font-bold text-stone-900 text-base">Insert Validated Hyperlink</h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {linkError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{linkError}</span>
              </div>
            )}

            <div className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Target Web URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/veterinary-study"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    setLinkError(null);
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                  autoFocus
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Only secure http and https links are permitted. Script or data links are rejected.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Descriptive link text"
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
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] shadow-xs cursor-pointer"
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

            {/* Upload or URL Mode Toggle */}
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl gap-1 mt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  imageMode === 'upload' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  imageMode === 'url' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Direct Image URL</span>
              </button>
            </div>

            {imageError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{imageError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Image validated and ready to insert!</span>
              </div>
            )}

            <div className="space-y-3.5 mt-4">
              {imageMode === 'upload' ? (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select File (JPG, PNG, WEBP, GIF up to 10MB)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-6 border-2 border-dashed border-stone-300 hover:border-emerald-800 rounded-2xl flex flex-col items-center justify-center gap-2 bg-stone-50 hover:bg-emerald-50/40 transition-colors cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-stone-500" />
                    <span className="text-xs font-medium text-stone-700">
                      {isUploading ? 'Optimizing & Uploading...' : 'Click to choose or drag an image'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Auto-resized & compressed for web performance
                    </span>
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageError(null);
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 outline-hidden min-h-[44px]"
                    autoFocus
                  />
                </div>
              )}

              {/* Preview of selected/uploaded image */}
              {imageUrl && (
                <div className="p-2 border border-stone-200 rounded-xl bg-stone-50">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

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
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl || isUploading}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 rounded-xl min-h-[44px] shadow-xs cursor-pointer"
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
              <h4 className="font-serif font-bold text-stone-900 text-base">Insert Clinical Table</h4>
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={tableRows}
                  onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:border-emerald-800 outline-hidden min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={tableCols}
                  onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
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
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
