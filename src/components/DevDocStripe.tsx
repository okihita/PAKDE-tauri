import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Code, ChevronDown, ChevronUp } from "lucide-react";

const DEV_STRIPE_LABEL = "[DEV MODE] FEATURE README & SCHEMA";

interface DevDocStripeProps {
  content: string;
}

export default function DevDocStripe({ content }: DevDocStripeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Render only in development mode
  if (!import.meta.env.DEV) return null;

  const parseInlineFormatting = (text: string) => {
    // Regex splits bold **text**, code `text` or markdown [label](href) links
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="font-mono text-xxxs bg-sidebar-ring px-1.5 py-0.5 rounded text-amber-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            {label}
          </a>
        );
      }
      return part;
    });
  };

  const parseMarkdownToJsx = (markdown: string) => {
    const lines = markdown.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-xxs font-bold text-amber-400 font-mono mt-3 mb-1 uppercase tracking-wider">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-xs font-bold text-foreground mt-3 mb-1.5">
            {trimmed.replace("## ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-sm font-black text-foreground border-b border-border pb-1 mt-4 mb-2">
            {trimmed.replace("# ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("- ")) {
        return (
          <ul key={idx} className="list-disc pl-4 space-y-0.5">
            <li className="text-xxs text-muted-foreground">{parseInlineFormatting(trimmed.replace("- ", ""))}</li>
          </ul>
        );
      }
      if (trimmed === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xxs text-muted-foreground leading-relaxed">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  return (
    <Card className="bg-amber-500/5 border-amber-500/20 text-foreground overflow-hidden mb-4 transition-all">
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer select-none bg-amber-500/10 hover:bg-amber-500/15"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xxs font-bold font-mono text-amber-400 flex items-center gap-1.5">
          <Code className="h-3.5 w-3.5" />
          {DEV_STRIPE_LABEL}
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
        )}
      </div>

      {isOpen && (
        <CardContent className="p-4 border-t border-amber-500/20 bg-card font-sans">
          <div className="space-y-1">{parseMarkdownToJsx(content)}</div>
        </CardContent>
      )}
    </Card>
  );
}
