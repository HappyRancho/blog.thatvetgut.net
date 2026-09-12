import React, { useEffect } from 'react';
import { Article } from '../../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  article?: Article;
  authorName?: string;
  canonicalUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  article,
  authorName,
  canonicalUrl,
}) => {
  useEffect(() => {
    const fullTitle = title
      ? `${title} — ThatVetGuy`
      : 'ThatVetGuy — Veterinary Medicine • Animal Health • Pet Education';
    document.title = fullTitle;

    const desc =
      description ||
      article?.seoDescription ||
      article?.excerpt ||
      'Veterinary Medicine • Animal Health • Pet Education. A collaborative veterinary publication created and operated by a team of veterinary professionals.';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    // Schema.org Article Structured Data
    if (article) {
      const scriptId = 'article-json-ld';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        headline: article.title,
        description: article.excerpt,
        image: [article.featuredImage],
        datePublished: article.publishedDate,
        dateModified: article.updatedDate,
        author: {
          '@type': 'Person',
          name: authorName || 'ThatVetGuy Co-Founders',
          jobTitle: 'Veterinary Professional & Co-Founder',
        },
        publisher: {
          '@type': 'Organization',
          name: 'ThatVetGuy',
          url: 'https://blog.thatvetguy.net',
          logo: {
            '@type': 'ImageObject',
            url: 'https://blog.thatvetguy.net/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl || `https://blog.thatvetguy.net/article/${article.slug}`,
        },
      };

      script.textContent = JSON.stringify(structuredData);
    } else {
      const existingScript = document.getElementById('article-json-ld');
      if (existingScript) {
        existingScript.remove();
      }
    }
  }, [title, description, article, authorName, canonicalUrl]);

  return null;
};
