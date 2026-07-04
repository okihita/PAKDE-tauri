/**
 * Local ESLint rules — loaded inline via flat config.
 */
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
};
