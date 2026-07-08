/**
 * Local ESLint rules — loaded inline via flat config.
 */

// ── Shared helpers ───────────────────────────────────────────────

function isHardcodedLabel(text) {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  // Must contain at least one letter (not pure numbers, dots, or symbols)
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  return true;
}

export default {
  "max-lines-per-file": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Enforce a maximum number of lines per file",
        recommended: false,
      },
      schema: [
        {
          type: "object",
          properties: {
            max: { type: "number", default: 500 },
            skipBlankLines: { type: "boolean", default: false },
            skipComments: { type: "boolean", default: false },
            skip: { type: "array", items: { type: "string" }, default: [] },
          },
          additionalProperties: false,
        },
      ],
    },
    create(context) {
      const [options = {}] = context.options;
      const max = options.max ?? 500;
      const skipPaths = options.skip ?? [];

      return {
        "Program:exit"(node) {
          const filename = context.filename ?? context.getFilename();
          // Skip if filename matches any skip path
          for (const p of skipPaths) {
            if (filename.includes(p)) return;
          }

          const { start, end } = node.loc;
          if (!end) return;

          let lines = end.line - start.line + 1;

          if (options.skipBlankLines || options.skipComments) {
            const source = context.sourceCode.getText();
            const sourceLines = source.split("\n");
            for (let i = start.line - 1; i < end.line; i++) {
              const trimmed = sourceLines[i]?.trim() ?? "";
              if (options.skipBlankLines && trimmed === "") lines--;
              else if (options.skipComments && (trimmed.startsWith("//") || trimmed.startsWith("/*"))) lines--;
            }
          }

          if (lines > max) {
            context.report({
              node,
              message: `File has ${lines} lines (max ${max}). Split into smaller modules.`,
            });
          }
        },
      };
    },
  },

  // ── No hardcoded UI labels ─────────────────────────────────────
  "no-hardcoded-labels": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Disallow hardcoded user-facing text. Extract to constants for i18n.",
      },
    },
    create(context) {
      // ── 1. JSX text children ──
      function checkJSXText(node) {
        if (isHardcodedLabel(node.value)) {
          context.report({
            node,
            message: `Hardcoded label "${node.value.trim()}". Extract to a constant for i18n support.`,
          });
        }
      }

      // ── 2. Toast calls: toast.error("..."), toast.success("..."), toast.confirm("...") ──
      function checkCallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "toast" &&
          ["error", "success", "confirm"].includes(node.callee.property.name) &&
          node.arguments.length >= 1 &&
          node.arguments[0].type === "Literal" &&
          typeof node.arguments[0].value === "string" &&
          isHardcodedLabel(node.arguments[0].value)
        ) {
          context.report({
            node: node.arguments[0],
            message: `Hardcoded label in toast.${node.callee.property.name}(). Extract to a constant for i18n support.`,
          });
        }
      }

      // ── 3. JSX props: placeholder, title, aria-label, alt ──
      const LABEL_PROPS = new Set(["placeholder", "title", "aria-label", "alt"]);

      function checkJSXAttribute(node) {
        const name = node.name?.name;
        if (!name || !LABEL_PROPS.has(name)) return;
        if (!node.value || node.value.type !== "Literal") return;
        if (typeof node.value.value !== "string") return;
        if (!isHardcodedLabel(node.value.value)) return;

        context.report({
          node: node.value,
          message: `Hardcoded label in ${name} prop. Extract to a constant for i18n support.`,
        });
      }

      return {
        JSXText: checkJSXText,
        CallExpression: checkCallExpression,
        JSXAttribute: checkJSXAttribute,
      };
    },
  },

  // ── No arbitrary px font sizes ──────────────────────────────────
  "no-arbitrary-px-font-size": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Disallow `text-[Npx]` Tailwind classes. Use `text-xxxs`, `text-xxs`, `text-xs`, etc. (rem-based) instead so fonts scale with zoom.",
      },
    },
    create(context) {
      const PX_PATTERN = /text-\[\d+px\]/;

      function checkStringLiteral(node, value) {
        if (typeof value !== "string") return;
        if (!PX_PATTERN.test(value)) return;
        context.report({
          node,
          message: `Arbitrary px font-size "${value.match(PX_PATTERN)?.[0]}" won't scale with zoom. Use a rem-based class instead.`,
        });
      }

      return {
        Literal(node) {
          // Check className string literals
          const parent = node.parent;
          if (parent?.type === "JSXAttribute" && parent.name?.name === "className") {
            checkStringLiteral(node, node.value);
          }
          // Template literals with string value
          if (node.type === "Literal" && typeof node.value === "string" && node.value.includes("text-[")) {
            checkStringLiteral(node, node.value);
          }
        },
        TemplateLiteral(node) {
          // Check template literals in className (e.g. className={`...`})
          const parent = node.parent;
          if (parent?.type === "JSXAttribute" && parent.name?.name === "className") {
            for (const quasis of node.quasis) {
              if (PX_PATTERN.test(quasis.value.raw)) {
                context.report({
                  node: quasis,
                  message: `Arbitrary px font-size "${quasis.value.raw.match(PX_PATTERN)?.[0]}" won't scale with zoom. Use a rem-based class instead.`,
                });
              }
            }
          }
        },
      };
    },
  },

  // ── No deprecated Tailwind classes ──────────────────────────────
  "no-deprecated-tailwind": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Flag Tailwind classes that have been deprecated/renamed in newer versions.",
      },
    },
    create(context) {
      /** @type {{ old: RegExp; newName: string }[]} */
      const DEPRECATED = [
        { old: /\bflex-shrink-0\b/g, newName: "shrink-0" },
        { old: /\bflex-shrink\b(?!-0)/g, newName: "shrink" },
        { old: /\bflex-grow-0\b/g, newName: "grow-0" },
        { old: /\bflex-grow\b(?!-0)/g, newName: "grow" },
        { old: /\bbg-gradient-to-r\b/g, newName: "bg-linear-to-r" },
        { old: /\bbg-gradient-to-l\b/g, newName: "bg-linear-to-l" },
        { old: /\bbg-gradient-to-t\b/g, newName: "bg-linear-to-t" },
        { old: /\bbg-gradient-to-b\b/g, newName: "bg-linear-to-b" },
      ];

      function check(text, node) {
        if (typeof text !== "string") return;
        for (const { old, newName } of DEPRECATED) {
          const match = text.match(old);
          if (match) {
            context.report({
              node,
              message: `Deprecated class "${match[0]}" → use "${newName}" instead.`,
            });
            return; // one violation per node
          }
        }
      }

      return {
        Literal(node) {
          const parent = node.parent;
          if (parent?.type === "JSXAttribute" && parent.name?.name === "className") {
            check(node.value, node);
          }
        },
        TemplateLiteral(node) {
          const parent = node.parent;
          if (parent?.type === "JSXAttribute" && parent.name?.name === "className") {
            for (const quasis of node.quasis) {
              check(quasis.value.raw, quasis);
            }
          }
        },
      };
    },
  },
};
