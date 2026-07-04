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
          },
          additionalProperties: false,
        },
      ],
    },
    create(context) {
      const [options = {}] = context.options;
      const max = options.max ?? 500;

      return {
        "Program:exit"(node) {
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
};
