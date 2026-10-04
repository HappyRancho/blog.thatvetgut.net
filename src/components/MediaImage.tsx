import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { mediaId, resolveMedia } from "../lib/media";
export function MediaImage({
  src = "",
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [url, setUrl] = useState(mediaId(src) ? "" : src),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setUrl(mediaId(src) ? "" : src);
    if (mediaId(src))
      void resolveMedia(src)
        .then((v) => {
          if (active) setUrl(v);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    return () => {
      active = false;
    };
  }, [src]);
  return failed ? (
    <span
      className="image-unavailable"
      role="img"
      aria-label={alt || "Image unavailable"}
    >
      Image unavailable
    </span>
  ) : url ? (
    <img {...props} src={url} alt={alt} onError={() => setFailed(true)} />
  ) : (
    <span className="image-loading" role="status">
      Loading image…
    </span>
  );
}
export function useInlineMedia(html: string) {
  const [resolved, setResolved] = useState(html);
  useEffect(() => {
    let active = true;
    setResolved(html);
    const d = new DOMParser().parseFromString(html, "text/html");
    const images = [...d.querySelectorAll("img")].filter((i) =>
      mediaId(i.getAttribute("src") || ""),
    );
    if (images.length)
      void Promise.all(
        images.map(async (i) => {
          try {
            i.src = await resolveMedia(i.getAttribute("src")!);
          } catch {
            i.removeAttribute("src");
            i.alt = i.alt || "Image unavailable";
          }
        }),
      ).then(() => {
        if (active) setResolved(d.body.innerHTML);
      });
    return () => {
      active = false;
    };
  }, [html]);
  return resolved;
}
