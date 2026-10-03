import DOMPurify from 'dompurify';
export const sanitize = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p','br','h2','h3','strong','em','ul','ol','li','blockquote','a','table','thead','tbody','tr','th','td','figure','img','figcaption','aside','div'], ALLOWED_ATTR: ['href','src','alt','class','scope','colspan','rowspan'], ALLOW_DATA_ATTR: false, FORBID_TAGS: ['style','script','iframe','form'], FORBID_ATTR: ['style','id'] });
export const plain = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
