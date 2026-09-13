"use client";

import { mathToStaticHtml } from "./mathRender";

export default function MathText({ text, as: Tag = "span", className }) {
  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: mathToStaticHtml(text) }} />
  );
}
