import { BodySection } from "@/types";
import { AlertTriangle, Info } from "lucide-react";

function CodeBlock({ code }: { code: NonNullable<BodySection["code"]> }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[var(--border)]">
      {code.caption && (
        <div className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
          {code.caption}
        </div>
      )}
      <pre className="overflow-x-auto bg-[#0d1117] p-4 text-sm leading-relaxed">
        <code className="font-mono text-[#e6edf3] whitespace-pre">{code.snippet}</code>
      </pre>
    </div>
  );
}

function Section({ section }: { section: BodySection }) {
  return (
    <div className="mb-8">
      {section.heading && (
        <h2 className="mb-3 text-xl font-semibold text-[var(--foreground)]">
          {section.heading}
        </h2>
      )}

      {section.type === "text" && section.content && (
        <p className="leading-7 text-[var(--foreground)] opacity-90">{section.content}</p>
      )}

      {section.type === "code" && section.code && (
        <CodeBlock code={section.code} />
      )}

      {section.type === "list" && section.items && (
        <ul className="space-y-2">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-6 text-[var(--foreground)] opacity-90">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {section.type === "note" && section.content && (
        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-sm leading-6 text-blue-800 dark:text-blue-300">{section.content}</p>
        </div>
      )}

      {section.type === "warning" && section.content && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm leading-6 text-amber-800 dark:text-amber-300">{section.content}</p>
        </div>
      )}

      {/* Render code block after text/list sections if both are present */}
      {section.type !== "code" && section.code && (
        <CodeBlock code={section.code} />
      )}
    </div>
  );
}

export function TopicBody({ sections }: { sections: BodySection[] }) {
  if (!sections?.length) {
    return (
      <p className="text-[var(--muted-foreground)]">No content available for this topic yet.</p>
    );
  }

  return (
    <div>
      {sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}
    </div>
  );
}
