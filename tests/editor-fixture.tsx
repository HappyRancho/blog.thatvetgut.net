// Development-only test entry. This HTML is not a Vite production entry and is not included in dist.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { RichEditor } from "../src/components/RichEditor";
import { sanitize } from "../src/lib/sanitize";
import "../src/styles.css";
function Fixture() {
  const [html, setHtml] = useState(
    '<h2>Existing heading</h2><p>Existing paragraph.</p><aside class="pro-tip"><p>Clinical pearl</p></aside><table><tbody><tr><th>Heading</th><td>Cell</td></tr></tbody></table><figure><img src="https://example.com/photo.webp" alt="Example photo"><figcaption>Original caption</figcaption></figure>',
  );
  return (
    <main className="container section">
      <h1>Writing verification</h1>
      <RichEditor
        value={html}
        onChange={setHtml}
        ownerId="verification-article"
        onUploadStart={() => {}}
      />
      <pre
        data-testid="stored"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {sanitize(html)}
      </pre>
      <button
        onClick={() =>
          setHtml(
            sanitize(
              '<p>Safe text<script>window.__unsafe=1</script><a href="javascript:alert(1)">Unsafe link</a><img src="data:image/svg+xml,unsafe" onerror="alert(1)"><iframe src="https://evil.test"></iframe></p>',
            ),
          )
        }
      >
        Paste unsafe fixture
      </button>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
