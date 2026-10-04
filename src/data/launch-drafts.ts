import type { Article } from "../lib/domain";
import chirag from "../../content/chirag-patidar.json";
import amaan from "../../content/amaan-ahmed.json";
import shivam from "../../content/shivam-singh-thakur.json";
import ritesh from "../../content/ritesh-verma.json";
import mathur from "../../content/deepesh-mathur.json";
import chaware from "../../content/deepesh-chaware.json";
// Prepared content, never a substitute for a live published Firestore record.
// Interleave the six founders so the preview shows the breadth of the blog.
const groups = [chirag, shivam, amaan, chaware, ritesh, mathur];
export const launchDrafts: Article[] = Array.from({ length: 5 }, (_, i) =>
  groups.map((group) => ({ ...group[i], audience: "Pet parents" as const })),
).flat();
