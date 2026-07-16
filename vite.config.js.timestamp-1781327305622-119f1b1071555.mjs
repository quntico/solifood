// vite.config.js
import path3 from "node:path";
import react from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@vitejs/plugin-react/dist/index.js";
import { createLogger, defineConfig } from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/vite/dist/node/index.js";

// plugins/visual-editor/vite-plugin-react-inline-editor.js
import path2 from "path";
import { parse as parse2 } from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/parser/lib/index.js";
import traverseBabel2 from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/traverse/lib/index.js";
import * as t from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/types/lib/index.js";
import fs2 from "fs";

// plugins/utils/ast-utils.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import generate from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/generator/lib/index.js";
import { parse } from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/parser/lib/index.js";
import traverseBabel from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/traverse/lib/index.js";
import {
  isJSXIdentifier,
  isJSXMemberExpression
} from "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/node_modules/@babel/types/lib/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/plugins/utils/ast-utils.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname2 = path.dirname(__filename);
var VITE_PROJECT_ROOT = path.resolve(__dirname2, "../..");
function validateFilePath(filePath) {
  if (!filePath) {
    return { isValid: false, error: "Missing filePath" };
  }
  const absoluteFilePath = path.resolve(VITE_PROJECT_ROOT, filePath);
  if (filePath.includes("..") || !absoluteFilePath.startsWith(VITE_PROJECT_ROOT) || absoluteFilePath.includes("node_modules")) {
    return { isValid: false, error: "Invalid path" };
  }
  if (!fs.existsSync(absoluteFilePath)) {
    return { isValid: false, error: "File not found" };
  }
  return { isValid: true, absolutePath: absoluteFilePath };
}
function parseFileToAST(absoluteFilePath) {
  const content = fs.readFileSync(absoluteFilePath, "utf-8");
  return parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
    errorRecovery: true
  });
}
function findJSXElementAtPosition(ast, line, column) {
  let targetNodePath = null;
  let closestNodePath = null;
  let closestDistance = Infinity;
  const allNodesOnLine = [];
  const visitor = {
    JSXOpeningElement(path4) {
      const node = path4.node;
      if (node.loc) {
        if (node.loc.start.line === line && Math.abs(node.loc.start.column - column) <= 1) {
          targetNodePath = path4;
          path4.stop();
          return;
        }
        if (node.loc.start.line === line) {
          allNodesOnLine.push({
            path: path4,
            column: node.loc.start.column,
            distance: Math.abs(node.loc.start.column - column)
          });
        }
        if (node.loc.start.line === line) {
          const distance = Math.abs(node.loc.start.column - column);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestNodePath = path4;
          }
        }
      }
    },
    // Also check JSXElement nodes that contain the position
    JSXElement(path4) {
      var _a;
      const node = path4.node;
      if (!node.loc) {
        return;
      }
      if (node.loc.start.line > line || node.loc.end.line < line) {
        return;
      }
      if (!((_a = path4.node.openingElement) == null ? void 0 : _a.loc)) {
        return;
      }
      const openingLine = path4.node.openingElement.loc.start.line;
      const openingCol = path4.node.openingElement.loc.start.column;
      if (openingLine === line) {
        const distance = Math.abs(openingCol - column);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNodePath = path4.get("openingElement");
        }
        return;
      }
      if (openingLine < line) {
        const distance = (line - openingLine) * 100;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNodePath = path4.get("openingElement");
        }
      }
    }
  };
  traverseBabel.default(ast, visitor);
  const threshold = closestDistance < 100 ? 50 : 500;
  return targetNodePath || (closestDistance <= threshold ? closestNodePath : null);
}
function generateCode(node, options = {}) {
  const generateFunction = generate.default || generate;
  const output = generateFunction(node, options);
  return output.code;
}
function generateSourceWithMap(ast, sourceFileName, originalCode) {
  const generateFunction = generate.default || generate;
  return generateFunction(ast, {
    sourceMaps: true,
    sourceFileName
  }, originalCode);
}

// plugins/visual-editor/vite-plugin-react-inline-editor.js
var EDITABLE_HTML_TAGS = ["a", "Button", "button", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "Label", "img"];
function parseEditId(editId) {
  const parts = editId.split(":");
  if (parts.length < 3) {
    return null;
  }
  const column = parseInt(parts.at(-1), 10);
  const line = parseInt(parts.at(-2), 10);
  const filePath = parts.slice(0, -2).join(":");
  if (!filePath || isNaN(line) || isNaN(column)) {
    return null;
  }
  return { filePath, line, column };
}
function checkTagNameEditable(openingElementNode, editableTagsList) {
  if (!openingElementNode || !openingElementNode.name)
    return false;
  const nameNode = openingElementNode.name;
  if (nameNode.type === "JSXIdentifier" && editableTagsList.includes(nameNode.name)) {
    return true;
  }
  if (nameNode.type === "JSXMemberExpression" && nameNode.property && nameNode.property.type === "JSXIdentifier" && editableTagsList.includes(nameNode.property.name)) {
    return true;
  }
  return false;
}
function validateImageSrc(openingNode) {
  if (!openingNode || !openingNode.name || openingNode.name.name !== "img") {
    return { isValid: true, reason: null };
  }
  const hasPropsSpread = openingNode.attributes.some(
    (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
  );
  if (hasPropsSpread) {
    return { isValid: false, reason: "props-spread" };
  }
  const srcAttr = openingNode.attributes.find(
    (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
  );
  if (!srcAttr) {
    return { isValid: false, reason: "missing-src" };
  }
  if (!t.isStringLiteral(srcAttr.value)) {
    return { isValid: false, reason: "dynamic-src" };
  }
  if (!srcAttr.value.value || srcAttr.value.value.trim() === "") {
    return { isValid: false, reason: "empty-src" };
  }
  return { isValid: true, reason: null };
}
function inlineEditPlugin() {
  return {
    name: "vite-inline-edit-plugin",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(jsx|tsx)$/.test(id) || !id.startsWith(VITE_PROJECT_ROOT) || id.includes("node_modules")) {
        return null;
      }
      const relativeFilePath = path2.relative(VITE_PROJECT_ROOT, id);
      const webRelativeFilePath = relativeFilePath.split(path2.sep).join("/");
      try {
        const babelAst = parse2(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
          errorRecovery: true
        });
        let attributesAdded = 0;
        traverseBabel2.default(babelAst, {
          enter(path4) {
            if (path4.isJSXOpeningElement()) {
              const openingNode = path4.node;
              const elementNode = path4.parentPath.node;
              if (!openingNode.loc) {
                return;
              }
              const alreadyHasId = openingNode.attributes.some(
                (attr) => t.isJSXAttribute(attr) && attr.name.name === "data-edit-id"
              );
              if (alreadyHasId) {
                return;
              }
              const isCurrentElementEditable = checkTagNameEditable(openingNode, EDITABLE_HTML_TAGS);
              if (!isCurrentElementEditable) {
                return;
              }
              const imageValidation = validateImageSrc(openingNode);
              if (!imageValidation.isValid) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              let shouldBeDisabledDueToChildren = false;
              if (t.isJSXElement(elementNode) && elementNode.children) {
                const hasPropsSpread = openingNode.attributes.some(
                  (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
                );
                const hasDynamicChild = elementNode.children.some(
                  (child) => t.isJSXExpressionContainer(child)
                );
                if (hasDynamicChild || hasPropsSpread) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (!shouldBeDisabledDueToChildren && t.isJSXElement(elementNode) && elementNode.children) {
                const hasEditableJsxChild = elementNode.children.some((child) => {
                  if (t.isJSXElement(child)) {
                    return checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS);
                  }
                  return false;
                });
                if (hasEditableJsxChild) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (shouldBeDisabledDueToChildren) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              if (t.isJSXElement(elementNode) && elementNode.children && elementNode.children.length > 0) {
                let hasNonEditableJsxChild = false;
                for (const child of elementNode.children) {
                  if (t.isJSXElement(child)) {
                    if (!checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS)) {
                      hasNonEditableJsxChild = true;
                      break;
                    }
                  }
                }
                if (hasNonEditableJsxChild) {
                  const disabledAttribute = t.jsxAttribute(
                    t.jsxIdentifier("data-edit-disabled"),
                    t.stringLiteral("true")
                  );
                  openingNode.attributes.push(disabledAttribute);
                  attributesAdded++;
                  return;
                }
              }
              let currentAncestorCandidatePath = path4.parentPath.parentPath;
              while (currentAncestorCandidatePath) {
                const ancestorJsxElementPath = currentAncestorCandidatePath.isJSXElement() ? currentAncestorCandidatePath : currentAncestorCandidatePath.findParent((p) => p.isJSXElement());
                if (!ancestorJsxElementPath) {
                  break;
                }
                if (checkTagNameEditable(ancestorJsxElementPath.node.openingElement, EDITABLE_HTML_TAGS)) {
                  return;
                }
                currentAncestorCandidatePath = ancestorJsxElementPath.parentPath;
              }
              const line = openingNode.loc.start.line;
              const column = openingNode.loc.start.column + 1;
              const editId = `${webRelativeFilePath}:${line}:${column}`;
              const idAttribute = t.jsxAttribute(
                t.jsxIdentifier("data-edit-id"),
                t.stringLiteral(editId)
              );
              openingNode.attributes.push(idAttribute);
              attributesAdded++;
            }
          }
        });
        if (attributesAdded > 0) {
          const output = generateSourceWithMap(babelAst, webRelativeFilePath, code);
          return { code: output.code, map: output.map };
        }
        return null;
      } catch (error) {
        console.error(`[vite][visual-editor] Error transforming ${id}:`, error);
        return null;
      }
    },
    // Updates source code based on the changes received from the client
    configureServer(server) {
      server.middlewares.use("/api/apply-edit", async (req, res, next) => {
        if (req.method !== "POST")
          return next();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          var _a;
          let absoluteFilePath = "";
          try {
            const { editId, newFullText } = JSON.parse(body);
            if (!editId || typeof newFullText === "undefined") {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Missing editId or newFullText" }));
            }
            const parsedId = parseEditId(editId);
            if (!parsedId) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid editId format (filePath:line:column)" }));
            }
            const { filePath, line, column } = parsedId;
            const validation = validateFilePath(filePath);
            if (!validation.isValid) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: validation.error }));
            }
            absoluteFilePath = validation.absolutePath;
            const originalContent = fs2.readFileSync(absoluteFilePath, "utf-8");
            const babelAst = parseFileToAST(absoluteFilePath);
            const targetNodePath = findJSXElementAtPosition(babelAst, line, column + 1);
            if (!targetNodePath) {
              res.writeHead(404, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Target node not found by line/column", editId }));
            }
            const targetOpeningElement = targetNodePath.node;
            const parentElementNode = (_a = targetNodePath.parentPath) == null ? void 0 : _a.node;
            const isImageElement = targetOpeningElement.name && targetOpeningElement.name.name === "img";
            let beforeCode = "";
            let afterCode = "";
            let modified = false;
            if (isImageElement) {
              beforeCode = generateCode(targetOpeningElement);
              const srcAttr = targetOpeningElement.attributes.find(
                (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
              );
              if (srcAttr && t.isStringLiteral(srcAttr.value)) {
                srcAttr.value = t.stringLiteral(newFullText);
                modified = true;
                afterCode = generateCode(targetOpeningElement);
              }
            } else {
              if (parentElementNode && t.isJSXElement(parentElementNode)) {
                beforeCode = generateCode(parentElementNode);
                parentElementNode.children = [];
                if (newFullText && newFullText.trim() !== "") {
                  const newTextNode = t.jsxText(newFullText);
                  parentElementNode.children.push(newTextNode);
                }
                modified = true;
                afterCode = generateCode(parentElementNode);
              }
            }
            if (!modified) {
              res.writeHead(409, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Could not apply changes to AST." }));
            }
            const webRelativeFilePath = path2.relative(VITE_PROJECT_ROOT, absoluteFilePath).split(path2.sep).join("/");
            const output = generateSourceWithMap(babelAst, webRelativeFilePath, originalContent);
            const newContent = output.code;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              success: true,
              newFileContent: newContent,
              beforeCode,
              afterCode
            }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error during edit application." }));
          }
        });
      });
    }
  };
}

// plugins/visual-editor/vite-plugin-edit-mode.js
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// plugins/visual-editor/visual-editor-config.js
var EDIT_MODE_STYLES = `
	#root[data-edit-mode-enabled="true"] [data-edit-id] {
		cursor: pointer; 
		outline: 2px dashed #357DF9; 
		outline-offset: 2px;
		min-height: 1em;
	}
	#root[data-edit-mode-enabled="true"] img[data-edit-id] {
		outline-offset: -2px;
	}
	#root[data-edit-mode-enabled="true"] {
		cursor: pointer;
	}
	#root[data-edit-mode-enabled="true"] [data-edit-id]:hover {
		background-color: #357DF933;
		outline-color: #357DF9; 
	}

	@keyframes fadeInTooltip {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	#inline-editor-disabled-tooltip {
		display: none; 
		opacity: 0; 
		position: absolute;
		background-color: #1D1E20;
		color: white;
		padding: 4px 8px;
		border-radius: 8px;
		z-index: 10001;
		font-size: 14px;
		border: 1px solid #3B3D4A;
		max-width: 184px;
		text-align: center;
	}

	#inline-editor-disabled-tooltip.tooltip-active {
		display: block;
		animation: fadeInTooltip 0.2s ease-out forwards;
	}
`;

// plugins/visual-editor/vite-plugin-edit-mode.js
var __vite_injected_original_import_meta_url2 = "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/plugins/visual-editor/vite-plugin-edit-mode.js";
var __filename2 = fileURLToPath2(__vite_injected_original_import_meta_url2);
var __dirname3 = resolve(__filename2, "..");
function inlineEditDevPlugin() {
  return {
    name: "vite:inline-edit-dev",
    apply: "serve",
    transformIndexHtml() {
      const scriptPath = resolve(__dirname3, "edit-mode-script.js");
      const scriptContent = readFileSync(scriptPath, "utf-8");
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: scriptContent,
          injectTo: "body"
        },
        {
          tag: "style",
          children: EDIT_MODE_STYLES,
          injectTo: "head"
        }
      ];
    }
  };
}

// plugins/vite-plugin-iframe-route-restoration.js
function iframeRouteRestorationPlugin() {
  return {
    name: "vite:iframe-route-restoration",
    apply: "serve",
    transformIndexHtml() {
      const script = `
      const ALLOWED_PARENT_ORIGINS = [
          "https://horizons.hostinger.com",
          "https://horizons.hostinger.dev",
          "https://horizons-frontend-local.hostinger.dev",
      ];

        // Check to see if the page is in an iframe
        if (window.self !== window.top) {
          const STORAGE_KEY = 'horizons-iframe-saved-route';

          const getCurrentRoute = () => location.pathname + location.search + location.hash;

          const save = () => {
            try {
              const currentRoute = getCurrentRoute();
              sessionStorage.setItem(STORAGE_KEY, currentRoute);
              window.parent.postMessage({message: 'route-changed', route: currentRoute}, '*');
            } catch {}
          };

          const replaceHistoryState = (url) => {
            try {
              history.replaceState(null, '', url);
              window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
              return true;
            } catch {}
            return false;
          };

          const restore = () => {
            try {
              const saved = sessionStorage.getItem(STORAGE_KEY);
              if (!saved) return;

              if (!saved.startsWith('/')) {
                sessionStorage.removeItem(STORAGE_KEY);
                return;
              }

              const current = getCurrentRoute();
              if (current !== saved) {
                if (!replaceHistoryState(saved)) {
                  replaceHistoryState('/');
                }

                requestAnimationFrame(() => setTimeout(() => {
                  try {
                    const text = (document.body?.innerText || '').trim();

                    // If the restored route results in too little content, assume it is invalid and navigate home
                    if (text.length < 50) {
                      replaceHistoryState('/');
                    }
                  } catch {}
                }, 1000));
              }
            } catch {}
          };

          const originalPushState = history.pushState;
          history.pushState = function(...args) {
            originalPushState.apply(this, args);
            save();
          };

          const originalReplaceState = history.replaceState;
          history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            save();
          };

          const getParentOrigin = () => {
              if (
                  window.location.ancestorOrigins &&
                  window.location.ancestorOrigins.length > 0
              ) {
                  return window.location.ancestorOrigins[0];
              }

              if (document.referrer) {
                  try {
                      return new URL(document.referrer).origin;
                  } catch (e) {
                      console.warn("Invalid referrer URL:", document.referrer);
                  }
              }

              return null;
          };

          window.addEventListener('popstate', save);
          window.addEventListener('hashchange', save);
          window.addEventListener("message", function (event) {
              const parentOrigin = getParentOrigin();

              if (event.data?.type === "redirect-home" && parentOrigin && ALLOWED_PARENT_ORIGINS.includes(parentOrigin)) {
                const saved = sessionStorage.getItem(STORAGE_KEY);

                if(saved && saved !== '/') {
                  replaceHistoryState('/')
                }
              }
          });

          restore();
        }
      `;
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: script,
          injectTo: "head"
        }
      ];
    }
  };
}

// plugins/selection-mode/vite-plugin-selection-mode.js
import { readFileSync as readFileSync2 } from "node:fs";
import { resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var __vite_injected_original_import_meta_url3 = "file:///C:/Users/fredd/OneDrive/Desktop/CENTERS%202.5/SOLIFOOD%20CENTER%202.0/plugins/selection-mode/vite-plugin-selection-mode.js";
var __filename3 = fileURLToPath3(__vite_injected_original_import_meta_url3);
var __dirname4 = resolve2(__filename3, "..");
function selectionModePlugin() {
  return {
    name: "vite:selection-mode",
    apply: "serve",
    transformIndexHtml() {
      const scriptPath = resolve2(__dirname4, "selection-mode-script.js");
      const scriptContent = readFileSync2(scriptPath, "utf-8");
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: scriptContent,
          injectTo: "body"
        }
      ];
    }
  };
}

// vite.config.js
var __vite_injected_original_dirname = "C:\\Users\\fredd\\OneDrive\\Desktop\\CENTERS 2.5\\SOLIFOOD CENTER 2.0";
var isDev = process.env.NODE_ENV !== "production";
var configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;
var configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;
var configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;
var configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;
var configNavigationHandler = `
if (window.navigation && window.self !== window.top) {
	window.navigation.addEventListener('navigate', (event) => {
		const url = event.destination.url;

		try {
			const destinationUrl = new URL(url);
			const destinationOrigin = destinationUrl.origin;
			const currentOrigin = window.location.origin;

			if (destinationOrigin === currentOrigin) {
				return;
			}
		} catch (error) {
			return;
		}

		window.parent.postMessage({
			type: 'horizons-navigation-error',
			url,
		}, '*');
	});
}
`;
var addTransformIndexHtml = {
  name: "add-transform-index-html",
  transformIndexHtml(html) {
    const tags = [
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsRuntimeErrorHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsViteErrorHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsConsoleErrroHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configWindowFetchMonkeyPatch,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configNavigationHandler,
        injectTo: "head"
      }
    ];
    if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
      tags.push(
        {
          tag: "script",
          attrs: {
            src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
            "template-redirect-url": process.env.TEMPLATE_REDIRECT_URL
          },
          injectTo: "head"
        }
      );
    }
    return {
      html,
      tags
    };
  }
};
console.warn = () => {
};
var logger = createLogger();
var loggerError = logger.error;
logger.error = (msg, options) => {
  var _a;
  if ((_a = options == null ? void 0 : options.error) == null ? void 0 : _a.toString().includes("CssSyntaxError: [postcss]")) {
    return;
  }
  loggerError(msg, options);
};
var vite_config_default = defineConfig({
  customLogger: logger,
  plugins: [
    ...isDev ? [inlineEditPlugin(), inlineEditDevPlugin(), iframeRouteRestorationPlugin(), selectionModePlugin()] : [],
    react(),
    addTransformIndexHtml
  ],
  server: {
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless"
    },
    allowedHosts: true
  },
  resolve: {
    extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
    alias: {
      "@": path3.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAicGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLXJlYWN0LWlubGluZS1lZGl0b3IuanMiLCAicGx1Z2lucy91dGlscy9hc3QtdXRpbHMuanMiLCAicGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLWVkaXQtbW9kZS5qcyIsICJwbHVnaW5zL3Zpc3VhbC1lZGl0b3IvdmlzdWFsLWVkaXRvci1jb25maWcuanMiLCAicGx1Z2lucy92aXRlLXBsdWdpbi1pZnJhbWUtcm91dGUtcmVzdG9yYXRpb24uanMiLCAicGx1Z2lucy9zZWxlY3Rpb24tbW9kZS92aXRlLXBsdWdpbi1zZWxlY3Rpb24tbW9kZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyZWRkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQ0VOVEVSUyAyLjVcXFxcU09MSUZPT0QgQ0VOVEVSIDIuMFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9mcmVkZC9PbmVEcml2ZS9EZXNrdG9wL0NFTlRFUlMlMjAyLjUvU09MSUZPT0QlMjBDRU5URVIlMjAyLjAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGNyZWF0ZUxvZ2dlciwgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgaW5saW5lRWRpdFBsdWdpbiBmcm9tICcuL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1yZWFjdC1pbmxpbmUtZWRpdG9yLmpzJztcbmltcG9ydCBlZGl0TW9kZURldlBsdWdpbiBmcm9tICcuL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1lZGl0LW1vZGUuanMnO1xuaW1wb3J0IGlmcmFtZVJvdXRlUmVzdG9yYXRpb25QbHVnaW4gZnJvbSAnLi9wbHVnaW5zL3ZpdGUtcGx1Z2luLWlmcmFtZS1yb3V0ZS1yZXN0b3JhdGlvbi5qcyc7XG5pbXBvcnQgc2VsZWN0aW9uTW9kZVBsdWdpbiBmcm9tICcuL3BsdWdpbnMvc2VsZWN0aW9uLW1vZGUvdml0ZS1wbHVnaW4tc2VsZWN0aW9uLW1vZGUuanMnO1xuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbic7XG5cbmNvbnN0IGNvbmZpZ0hvcml6b25zVml0ZUVycm9ySGFuZGxlciA9IGBcbmNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuXHRmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xuXHRcdGZvciAoY29uc3QgYWRkZWROb2RlIG9mIG11dGF0aW9uLmFkZGVkTm9kZXMpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0YWRkZWROb2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSAmJlxuXHRcdFx0XHQoXG5cdFx0XHRcdFx0YWRkZWROb2RlLnRhZ05hbWU/LnRvTG93ZXJDYXNlKCkgPT09ICd2aXRlLWVycm9yLW92ZXJsYXknIHx8XG5cdFx0XHRcdFx0YWRkZWROb2RlLmNsYXNzTGlzdD8uY29udGFpbnMoJ2JhY2tkcm9wJylcblx0XHRcdFx0KVxuXHRcdFx0KSB7XG5cdFx0XHRcdGhhbmRsZVZpdGVPdmVybGF5KGFkZGVkTm9kZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTtcblxub2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHtcblx0Y2hpbGRMaXN0OiB0cnVlLFxuXHRzdWJ0cmVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gaGFuZGxlVml0ZU92ZXJsYXkobm9kZSkge1xuXHRpZiAoIW5vZGUuc2hhZG93Um9vdCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IGJhY2tkcm9wID0gbm9kZS5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3IoJy5iYWNrZHJvcCcpO1xuXG5cdGlmIChiYWNrZHJvcCkge1xuXHRcdGNvbnN0IG92ZXJsYXlIdG1sID0gYmFja2Ryb3Aub3V0ZXJIVE1MO1xuXHRcdGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcblx0XHRjb25zdCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKG92ZXJsYXlIdG1sLCAndGV4dC9odG1sJyk7XG5cdFx0Y29uc3QgbWVzc2FnZUJvZHlFbGVtZW50ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlLWJvZHknKTtcblx0XHRjb25zdCBmaWxlRWxlbWVudCA9IGRvYy5xdWVyeVNlbGVjdG9yKCcuZmlsZScpO1xuXHRcdGNvbnN0IG1lc3NhZ2VUZXh0ID0gbWVzc2FnZUJvZHlFbGVtZW50ID8gbWVzc2FnZUJvZHlFbGVtZW50LnRleHRDb250ZW50LnRyaW0oKSA6ICcnO1xuXHRcdGNvbnN0IGZpbGVUZXh0ID0gZmlsZUVsZW1lbnQgPyBmaWxlRWxlbWVudC50ZXh0Q29udGVudC50cmltKCkgOiAnJztcblx0XHRjb25zdCBlcnJvciA9IG1lc3NhZ2VUZXh0ICsgKGZpbGVUZXh0ID8gJyBGaWxlOicgKyBmaWxlVGV4dCA6ICcnKTtcblxuXHRcdHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogJ2hvcml6b25zLXZpdGUtZXJyb3InLFxuXHRcdFx0ZXJyb3IsXG5cdFx0fSwgJyonKTtcblx0fVxufVxuYDtcblxuY29uc3QgY29uZmlnSG9yaXpvbnNSdW50aW1lRXJyb3JIYW5kbGVyID0gYFxud2luZG93Lm9uZXJyb3IgPSAobWVzc2FnZSwgc291cmNlLCBsaW5lbm8sIGNvbG5vLCBlcnJvck9iaikgPT4ge1xuXHRjb25zdCBlcnJvckRldGFpbHMgPSBlcnJvck9iaiA/IEpTT04uc3RyaW5naWZ5KHtcblx0XHRuYW1lOiBlcnJvck9iai5uYW1lLFxuXHRcdG1lc3NhZ2U6IGVycm9yT2JqLm1lc3NhZ2UsXG5cdFx0c3RhY2s6IGVycm9yT2JqLnN0YWNrLFxuXHRcdHNvdXJjZSxcblx0XHRsaW5lbm8sXG5cdFx0Y29sbm8sXG5cdH0pIDogbnVsbDtcblxuXHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcblx0XHR0eXBlOiAnaG9yaXpvbnMtcnVudGltZS1lcnJvcicsXG5cdFx0bWVzc2FnZSxcblx0XHRlcnJvcjogZXJyb3JEZXRhaWxzXG5cdH0sICcqJyk7XG59O1xuYDtcblxuY29uc3QgY29uZmlnSG9yaXpvbnNDb25zb2xlRXJycm9IYW5kbGVyID0gYFxuY29uc3Qgb3JpZ2luYWxDb25zb2xlRXJyb3IgPSBjb25zb2xlLmVycm9yO1xuY29uc29sZS5lcnJvciA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblx0b3JpZ2luYWxDb25zb2xlRXJyb3IuYXBwbHkoY29uc29sZSwgYXJncyk7XG5cblx0bGV0IGVycm9yU3RyaW5nID0gJyc7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgYXJnID0gYXJnc1tpXTtcblx0XHRpZiAoYXJnIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdGVycm9yU3RyaW5nID0gYXJnLnN0YWNrIHx8IFxcYFxcJHthcmcubmFtZX06IFxcJHthcmcubWVzc2FnZX1cXGA7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblxuXHRpZiAoIWVycm9yU3RyaW5nKSB7XG5cdFx0ZXJyb3JTdHJpbmcgPSBhcmdzLm1hcChhcmcgPT4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgPyBKU09OLnN0cmluZ2lmeShhcmcpIDogU3RyaW5nKGFyZykpLmpvaW4oJyAnKTtcblx0fVxuXG5cdHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2Uoe1xuXHRcdHR5cGU6ICdob3Jpem9ucy1jb25zb2xlLWVycm9yJyxcblx0XHRlcnJvcjogZXJyb3JTdHJpbmdcblx0fSwgJyonKTtcbn07XG5gO1xuXG5jb25zdCBjb25maWdXaW5kb3dGZXRjaE1vbmtleVBhdGNoID0gYFxuY29uc3Qgb3JpZ2luYWxGZXRjaCA9IHdpbmRvdy5mZXRjaDtcblxud2luZG93LmZldGNoID0gZnVuY3Rpb24oLi4uYXJncykge1xuXHRjb25zdCB1cmwgPSBhcmdzWzBdIGluc3RhbmNlb2YgUmVxdWVzdCA/IGFyZ3NbMF0udXJsIDogYXJnc1swXTtcblxuXHQvLyBTa2lwIFdlYlNvY2tldCBVUkxzXG5cdGlmICh1cmwuc3RhcnRzV2l0aCgnd3M6JykgfHwgdXJsLnN0YXJ0c1dpdGgoJ3dzczonKSkge1xuXHRcdHJldHVybiBvcmlnaW5hbEZldGNoLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHR9XG5cblx0cmV0dXJuIG9yaWdpbmFsRmV0Y2guYXBwbHkodGhpcywgYXJncylcblx0XHQudGhlbihhc3luYyByZXNwb25zZSA9PiB7XG5cdFx0XHRjb25zdCBjb250ZW50VHlwZSA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdDb250ZW50LVR5cGUnKSB8fCAnJztcblxuXHRcdFx0Ly8gRXhjbHVkZSBIVE1MIGRvY3VtZW50IHJlc3BvbnNlc1xuXHRcdFx0Y29uc3QgaXNEb2N1bWVudFJlc3BvbnNlID1cblx0XHRcdFx0Y29udGVudFR5cGUuaW5jbHVkZXMoJ3RleHQvaHRtbCcpIHx8XG5cdFx0XHRcdGNvbnRlbnRUeXBlLmluY2x1ZGVzKCdhcHBsaWNhdGlvbi94aHRtbCt4bWwnKTtcblxuXHRcdFx0aWYgKCFyZXNwb25zZS5vayAmJiAhaXNEb2N1bWVudFJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzcG9uc2VDbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XG5cdFx0XHRcdFx0Y29uc3QgZXJyb3JGcm9tUmVzID0gYXdhaXQgcmVzcG9uc2VDbG9uZS50ZXh0KCk7XG5cdFx0XHRcdFx0Y29uc3QgcmVxdWVzdFVybCA9IHJlc3BvbnNlLnVybDtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKFxcYEZldGNoIGVycm9yIGZyb20gXFwke3JlcXVlc3RVcmx9OiBcXCR7ZXJyb3JGcm9tUmVzfVxcYCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9KVxuXHRcdC5jYXRjaChlcnJvciA9PiB7XG5cdFx0XHRpZiAoIXVybC5tYXRjaCgvXFwuaHRtbD8kL2kpKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aHJvdyBlcnJvcjtcblx0XHR9KTtcbn07XG5gO1xuXG5jb25zdCBjb25maWdOYXZpZ2F0aW9uSGFuZGxlciA9IGBcbmlmICh3aW5kb3cubmF2aWdhdGlvbiAmJiB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xuXHR3aW5kb3cubmF2aWdhdGlvbi5hZGRFdmVudExpc3RlbmVyKCduYXZpZ2F0ZScsIChldmVudCkgPT4ge1xuXHRcdGNvbnN0IHVybCA9IGV2ZW50LmRlc3RpbmF0aW9uLnVybDtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBkZXN0aW5hdGlvblVybCA9IG5ldyBVUkwodXJsKTtcblx0XHRcdGNvbnN0IGRlc3RpbmF0aW9uT3JpZ2luID0gZGVzdGluYXRpb25Vcmwub3JpZ2luO1xuXHRcdFx0Y29uc3QgY3VycmVudE9yaWdpbiA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW47XG5cblx0XHRcdGlmIChkZXN0aW5hdGlvbk9yaWdpbiA9PT0gY3VycmVudE9yaWdpbikge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6ICdob3Jpem9ucy1uYXZpZ2F0aW9uLWVycm9yJyxcblx0XHRcdHVybCxcblx0XHR9LCAnKicpO1xuXHR9KTtcbn1cbmA7XG5cbmNvbnN0IGFkZFRyYW5zZm9ybUluZGV4SHRtbCA9IHtcblx0bmFtZTogJ2FkZC10cmFuc2Zvcm0taW5kZXgtaHRtbCcsXG5cdHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XG5cdFx0Y29uc3QgdGFncyA9IFtcblx0XHRcdHtcblx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0YXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcblx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ0hvcml6b25zUnVudGltZUVycm9ySGFuZGxlcixcblx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdGNoaWxkcmVuOiBjb25maWdIb3Jpem9uc1ZpdGVFcnJvckhhbmRsZXIsXG5cdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0YWc6ICdzY3JpcHQnLFxuXHRcdFx0XHRhdHRyczogeyB0eXBlOiAnbW9kdWxlJyB9LFxuXHRcdFx0XHRjaGlsZHJlbjogY29uZmlnSG9yaXpvbnNDb25zb2xlRXJycm9IYW5kbGVyLFxuXHRcdFx0XHRpbmplY3RUbzogJ2hlYWQnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0YXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcblx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ1dpbmRvd0ZldGNoTW9ua2V5UGF0Y2gsXG5cdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0YWc6ICdzY3JpcHQnLFxuXHRcdFx0XHRhdHRyczogeyB0eXBlOiAnbW9kdWxlJyB9LFxuXHRcdFx0XHRjaGlsZHJlbjogY29uZmlnTmF2aWdhdGlvbkhhbmRsZXIsXG5cdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHR9LFxuXHRcdF07XG5cblx0XHRpZiAoIWlzRGV2ICYmIHByb2Nlc3MuZW52LlRFTVBMQVRFX0JBTk5FUl9TQ1JJUFRfVVJMICYmIHByb2Nlc3MuZW52LlRFTVBMQVRFX1JFRElSRUNUX1VSTCkge1xuXHRcdFx0dGFncy5wdXNoKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0XHRhdHRyczoge1xuXHRcdFx0XHRcdFx0c3JjOiBwcm9jZXNzLmVudi5URU1QTEFURV9CQU5ORVJfU0NSSVBUX1VSTCxcblx0XHRcdFx0XHRcdCd0ZW1wbGF0ZS1yZWRpcmVjdC11cmwnOiBwcm9jZXNzLmVudi5URU1QTEFURV9SRURJUkVDVF9VUkwsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRpbmplY3RUbzogJ2hlYWQnLFxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRodG1sLFxuXHRcdFx0dGFncyxcblx0XHR9O1xuXHR9LFxufTtcblxuY29uc29sZS53YXJuID0gKCkgPT4geyB9O1xuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoKVxuY29uc3QgbG9nZ2VyRXJyb3IgPSBsb2dnZXIuZXJyb3JcblxubG9nZ2VyLmVycm9yID0gKG1zZywgb3B0aW9ucykgPT4ge1xuXHRpZiAob3B0aW9ucz8uZXJyb3I/LnRvU3RyaW5nKCkuaW5jbHVkZXMoJ0Nzc1N5bnRheEVycm9yOiBbcG9zdGNzc10nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxvZ2dlckVycm9yKG1zZywgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdGN1c3RvbUxvZ2dlcjogbG9nZ2VyLFxuXHRwbHVnaW5zOiBbXG5cdFx0Li4uKGlzRGV2ID8gW2lubGluZUVkaXRQbHVnaW4oKSwgZWRpdE1vZGVEZXZQbHVnaW4oKSwgaWZyYW1lUm91dGVSZXN0b3JhdGlvblBsdWdpbigpLCBzZWxlY3Rpb25Nb2RlUGx1Z2luKCldIDogW10pLFxuXHRcdHJlYWN0KCksXG5cdFx0YWRkVHJhbnNmb3JtSW5kZXhIdG1sXG5cdF0sXG5cdHNlcnZlcjoge1xuXHRcdGNvcnM6IHRydWUsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAnY3JlZGVudGlhbGxlc3MnLFxuXHRcdH0sXG5cdFx0YWxsb3dlZEhvc3RzOiB0cnVlLFxuXHR9LFxuXHRyZXNvbHZlOiB7XG5cdFx0ZXh0ZW5zaW9uczogWycuanN4JywgJy5qcycsICcudHN4JywgJy50cycsICcuanNvbicsXSxcblx0XHRhbGlhczoge1xuXHRcdFx0J0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcblx0XHR9LFxuXHR9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyZWRkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQ0VOVEVSUyAyLjVcXFxcU09MSUZPT0QgQ0VOVEVSIDIuMFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyZWRkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQ0VOVEVSUyAyLjVcXFxcU09MSUZPT0QgQ0VOVEVSIDIuMFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcXFxcdml0ZS1wbHVnaW4tcmVhY3QtaW5saW5lLWVkaXRvci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJlZGQvT25lRHJpdmUvRGVza3RvcC9DRU5URVJTJTIwMi41L1NPTElGT09EJTIwQ0VOVEVSJTIwMi4wL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1yZWFjdC1pbmxpbmUtZWRpdG9yLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ0BiYWJlbC9wYXJzZXInO1xuaW1wb3J0IHRyYXZlcnNlQmFiZWwgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBcblx0dmFsaWRhdGVGaWxlUGF0aCwgXG5cdHBhcnNlRmlsZVRvQVNULCBcblx0ZmluZEpTWEVsZW1lbnRBdFBvc2l0aW9uLFxuXHRnZW5lcmF0ZUNvZGUsXG5cdGdlbmVyYXRlU291cmNlV2l0aE1hcCxcblx0VklURV9QUk9KRUNUX1JPT1Rcbn0gZnJvbSAnLi4vdXRpbHMvYXN0LXV0aWxzLmpzJztcblxuY29uc3QgRURJVEFCTEVfSFRNTF9UQUdTID0gW1wiYVwiLCBcIkJ1dHRvblwiLCBcImJ1dHRvblwiLCBcInBcIiwgXCJzcGFuXCIsIFwiaDFcIiwgXCJoMlwiLCBcImgzXCIsIFwiaDRcIiwgXCJoNVwiLCBcImg2XCIsIFwibGFiZWxcIiwgXCJMYWJlbFwiLCBcImltZ1wiXTtcblxuZnVuY3Rpb24gcGFyc2VFZGl0SWQoZWRpdElkKSB7XG5cdGNvbnN0IHBhcnRzID0gZWRpdElkLnNwbGl0KCc6Jyk7XG5cblx0aWYgKHBhcnRzLmxlbmd0aCA8IDMpIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdGNvbnN0IGNvbHVtbiA9IHBhcnNlSW50KHBhcnRzLmF0KC0xKSwgMTApO1xuXHRjb25zdCBsaW5lID0gcGFyc2VJbnQocGFydHMuYXQoLTIpLCAxMCk7XG5cdGNvbnN0IGZpbGVQYXRoID0gcGFydHMuc2xpY2UoMCwgLTIpLmpvaW4oJzonKTtcblxuXHRpZiAoIWZpbGVQYXRoIHx8IGlzTmFOKGxpbmUpIHx8IGlzTmFOKGNvbHVtbikpIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdHJldHVybiB7IGZpbGVQYXRoLCBsaW5lLCBjb2x1bW4gfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tUYWdOYW1lRWRpdGFibGUob3BlbmluZ0VsZW1lbnROb2RlLCBlZGl0YWJsZVRhZ3NMaXN0KSB7XG5cdGlmICghb3BlbmluZ0VsZW1lbnROb2RlIHx8ICFvcGVuaW5nRWxlbWVudE5vZGUubmFtZSkgcmV0dXJuIGZhbHNlO1xuXHRjb25zdCBuYW1lTm9kZSA9IG9wZW5pbmdFbGVtZW50Tm9kZS5uYW1lO1xuXG5cdC8vIENoZWNrIDE6IERpcmVjdCBuYW1lIChmb3IgPHA+LCA8QnV0dG9uPilcblx0aWYgKG5hbWVOb2RlLnR5cGUgPT09ICdKU1hJZGVudGlmaWVyJyAmJiBlZGl0YWJsZVRhZ3NMaXN0LmluY2x1ZGVzKG5hbWVOb2RlLm5hbWUpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBDaGVjayAyOiBQcm9wZXJ0eSBuYW1lIG9mIGEgbWVtYmVyIGV4cHJlc3Npb24gKGZvciA8bW90aW9uLmgxPiwgY2hlY2sgaWYgXCJoMVwiIGlzIGluIGVkaXRhYmxlVGFnc0xpc3QpXG5cdGlmIChuYW1lTm9kZS50eXBlID09PSAnSlNYTWVtYmVyRXhwcmVzc2lvbicgJiYgbmFtZU5vZGUucHJvcGVydHkgJiYgbmFtZU5vZGUucHJvcGVydHkudHlwZSA9PT0gJ0pTWElkZW50aWZpZXInICYmIGVkaXRhYmxlVGFnc0xpc3QuaW5jbHVkZXMobmFtZU5vZGUucHJvcGVydHkubmFtZSkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVJbWFnZVNyYyhvcGVuaW5nTm9kZSkge1xuXHRpZiAoIW9wZW5pbmdOb2RlIHx8ICFvcGVuaW5nTm9kZS5uYW1lIHx8IG9wZW5pbmdOb2RlLm5hbWUubmFtZSAhPT0gJ2ltZycpIHtcblx0XHRyZXR1cm4geyBpc1ZhbGlkOiB0cnVlLCByZWFzb246IG51bGwgfTsgLy8gTm90IGFuIGltYWdlLCBza2lwIHZhbGlkYXRpb25cblx0fVxuXG5cdGNvbnN0IGhhc1Byb3BzU3ByZWFkID0gb3BlbmluZ05vZGUuYXR0cmlidXRlcy5zb21lKGF0dHIgPT5cblx0XHR0LmlzSlNYU3ByZWFkQXR0cmlidXRlKGF0dHIpICYmXG5cdFx0YXR0ci5hcmd1bWVudCAmJlxuXHRcdHQuaXNJZGVudGlmaWVyKGF0dHIuYXJndW1lbnQpICYmXG5cdFx0YXR0ci5hcmd1bWVudC5uYW1lID09PSAncHJvcHMnXG5cdCk7XG5cblx0aWYgKGhhc1Byb3BzU3ByZWFkKSB7XG5cdFx0cmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIHJlYXNvbjogJ3Byb3BzLXNwcmVhZCcgfTtcblx0fVxuXG5cdGNvbnN0IHNyY0F0dHIgPSBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLmZpbmQoYXR0ciA9PlxuXHRcdHQuaXNKU1hBdHRyaWJ1dGUoYXR0cikgJiZcblx0XHRhdHRyLm5hbWUgJiZcblx0XHRhdHRyLm5hbWUubmFtZSA9PT0gJ3NyYydcblx0KTtcblxuXHRpZiAoIXNyY0F0dHIpIHtcblx0XHRyZXR1cm4geyBpc1ZhbGlkOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1zcmMnIH07XG5cdH1cblxuXHRpZiAoIXQuaXNTdHJpbmdMaXRlcmFsKHNyY0F0dHIudmFsdWUpKSB7XG5cdFx0cmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIHJlYXNvbjogJ2R5bmFtaWMtc3JjJyB9O1xuXHR9XG5cblx0aWYgKCFzcmNBdHRyLnZhbHVlLnZhbHVlIHx8IHNyY0F0dHIudmFsdWUudmFsdWUudHJpbSgpID09PSAnJykge1xuXHRcdHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCByZWFzb246ICdlbXB0eS1zcmMnIH07XG5cdH1cblxuXHRyZXR1cm4geyBpc1ZhbGlkOiB0cnVlLCByZWFzb246IG51bGwgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5saW5lRWRpdFBsdWdpbigpIHtcblx0cmV0dXJuIHtcblx0XHRuYW1lOiAndml0ZS1pbmxpbmUtZWRpdC1wbHVnaW4nLFxuXHRcdGVuZm9yY2U6ICdwcmUnLFxuXG5cdFx0dHJhbnNmb3JtKGNvZGUsIGlkKSB7XG5cdFx0XHRpZiAoIS9cXC4oanN4fHRzeCkkLy50ZXN0KGlkKSB8fCAhaWQuc3RhcnRzV2l0aChWSVRFX1BST0pFQ1RfUk9PVCkgfHwgaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gcGF0aC5yZWxhdGl2ZShWSVRFX1BST0pFQ1RfUk9PVCwgaWQpO1xuXHRcdFx0Y29uc3Qgd2ViUmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlRmlsZVBhdGguc3BsaXQocGF0aC5zZXApLmpvaW4oJy8nKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgYmFiZWxBc3QgPSBwYXJzZShjb2RlLCB7XG5cdFx0XHRcdFx0c291cmNlVHlwZTogJ21vZHVsZScsXG5cdFx0XHRcdFx0cGx1Z2luczogWydqc3gnLCAndHlwZXNjcmlwdCddLFxuXHRcdFx0XHRcdGVycm9yUmVjb3Zlcnk6IHRydWVcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bGV0IGF0dHJpYnV0ZXNBZGRlZCA9IDA7XG5cblx0XHRcdFx0dHJhdmVyc2VCYWJlbC5kZWZhdWx0KGJhYmVsQXN0LCB7XG5cdFx0XHRcdFx0ZW50ZXIocGF0aCkge1xuXHRcdFx0XHRcdFx0aWYgKHBhdGguaXNKU1hPcGVuaW5nRWxlbWVudCgpKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG9wZW5pbmdOb2RlID0gcGF0aC5ub2RlO1xuXHRcdFx0XHRcdFx0XHRjb25zdCBlbGVtZW50Tm9kZSA9IHBhdGgucGFyZW50UGF0aC5ub2RlOyAvLyBUaGUgSlNYRWxlbWVudCBpdHNlbGZcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW9wZW5pbmdOb2RlLmxvYykge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IGFscmVhZHlIYXNJZCA9IG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMuc29tZShcblx0XHRcdFx0XHRcdFx0XHQoYXR0cikgPT4gdC5pc0pTWEF0dHJpYnV0ZShhdHRyKSAmJiBhdHRyLm5hbWUubmFtZSA9PT0gJ2RhdGEtZWRpdC1pZCdcblx0XHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoYWxyZWFkeUhhc0lkKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Ly8gQ29uZGl0aW9uIDE6IElzIHRoZSBjdXJyZW50IGVsZW1lbnQgdGFnIHR5cGUgZWRpdGFibGU/XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGlzQ3VycmVudEVsZW1lbnRFZGl0YWJsZSA9IGNoZWNrVGFnTmFtZUVkaXRhYmxlKG9wZW5pbmdOb2RlLCBFRElUQUJMRV9IVE1MX1RBR1MpO1xuXHRcdFx0XHRcdFx0XHRpZiAoIWlzQ3VycmVudEVsZW1lbnRFZGl0YWJsZSkge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IGltYWdlVmFsaWRhdGlvbiA9IHZhbGlkYXRlSW1hZ2VTcmMob3BlbmluZ05vZGUpO1xuXHRcdFx0XHRcdFx0XHRpZiAoIWltYWdlVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgZGlzYWJsZWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcblx0XHRcdFx0XHRcdFx0XHRcdHQuanN4SWRlbnRpZmllcignZGF0YS1lZGl0LWRpc2FibGVkJyksXG5cdFx0XHRcdFx0XHRcdFx0XHR0LnN0cmluZ0xpdGVyYWwoJ3RydWUnKVxuXHRcdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdFx0b3BlbmluZ05vZGUuYXR0cmlidXRlcy5wdXNoKGRpc2FibGVkQXR0cmlidXRlKTtcblx0XHRcdFx0XHRcdFx0XHRhdHRyaWJ1dGVzQWRkZWQrKztcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRsZXQgc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4gPSBmYWxzZTtcblxuXHRcdFx0XHRcdFx0XHQvLyBDb25kaXRpb24gMjogRG9lcyB0aGUgZWxlbWVudCBoYXZlIGR5bmFtaWMgb3IgZWRpdGFibGUgY2hpbGRyZW5cblx0XHRcdFx0XHRcdFx0aWYgKHQuaXNKU1hFbGVtZW50KGVsZW1lbnROb2RlKSAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbikge1xuXHRcdFx0XHRcdFx0XHRcdC8vIENoZWNrIGlmIGVsZW1lbnQgaGFzIHsuLi5wcm9wc30gc3ByZWFkIGF0dHJpYnV0ZSAtIGRpc2FibGUgZWRpdGluZyBpZiBpdCBkb2VzXG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgaGFzUHJvcHNTcHJlYWQgPSBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnNvbWUoYXR0ciA9PiB0LmlzSlNYU3ByZWFkQXR0cmlidXRlKGF0dHIpXG5cdFx0XHRcdFx0XHRcdFx0XHQmJiBhdHRyLmFyZ3VtZW50XG5cdFx0XHRcdFx0XHRcdFx0XHQmJiB0LmlzSWRlbnRpZmllcihhdHRyLmFyZ3VtZW50KVxuXHRcdFx0XHRcdFx0XHRcdFx0JiYgYXR0ci5hcmd1bWVudC5uYW1lID09PSAncHJvcHMnXG5cdFx0XHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGhhc0R5bmFtaWNDaGlsZCA9IGVsZW1lbnROb2RlLmNoaWxkcmVuLnNvbWUoY2hpbGQgPT5cblx0XHRcdFx0XHRcdFx0XHRcdHQuaXNKU1hFeHByZXNzaW9uQ29udGFpbmVyKGNoaWxkKVxuXHRcdFx0XHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoaGFzRHluYW1pY0NoaWxkIHx8IGhhc1Byb3BzU3ByZWFkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbiA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKCFzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbiAmJiB0LmlzSlNYRWxlbWVudChlbGVtZW50Tm9kZSkgJiYgZWxlbWVudE5vZGUuY2hpbGRyZW4pIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBoYXNFZGl0YWJsZUpzeENoaWxkID0gZWxlbWVudE5vZGUuY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAodC5pc0pTWEVsZW1lbnQoY2hpbGQpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBjaGVja1RhZ05hbWVFZGl0YWJsZShjaGlsZC5vcGVuaW5nRWxlbWVudCwgRURJVEFCTEVfSFRNTF9UQUdTKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGhhc0VkaXRhYmxlSnN4Q2hpbGQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHNob3VsZEJlRGlzYWJsZWREdWVUb0NoaWxkcmVuID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAoc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4pIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBkaXNhYmxlZEF0dHJpYnV0ZSA9IHQuanN4QXR0cmlidXRlKFxuXHRcdFx0XHRcdFx0XHRcdFx0dC5qc3hJZGVudGlmaWVyKCdkYXRhLWVkaXQtZGlzYWJsZWQnKSxcblx0XHRcdFx0XHRcdFx0XHRcdHQuc3RyaW5nTGl0ZXJhbCgndHJ1ZScpXG5cdFx0XHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0XHRcdG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMucHVzaChkaXNhYmxlZEF0dHJpYnV0ZSk7XG5cdFx0XHRcdFx0XHRcdFx0YXR0cmlidXRlc0FkZGVkKys7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Ly8gQ29uZGl0aW9uIDM6IFBhcmVudCBpcyBub24tZWRpdGFibGUgaWYgQVQgTEVBU1QgT05FIGNoaWxkIEpTWEVsZW1lbnQgaXMgYSBub24tZWRpdGFibGUgdHlwZS5cblx0XHRcdFx0XHRcdFx0aWYgKHQuaXNKU1hFbGVtZW50KGVsZW1lbnROb2RlKSAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbiAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IGhhc05vbkVkaXRhYmxlSnN4Q2hpbGQgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IGNoaWxkIG9mIGVsZW1lbnROb2RlLmNoaWxkcmVuKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAodC5pc0pTWEVsZW1lbnQoY2hpbGQpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICghY2hlY2tUYWdOYW1lRWRpdGFibGUoY2hpbGQub3BlbmluZ0VsZW1lbnQsIEVESVRBQkxFX0hUTUxfVEFHUykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRoYXNOb25FZGl0YWJsZUpzeENoaWxkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRpZiAoaGFzTm9uRWRpdGFibGVKc3hDaGlsZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgZGlzYWJsZWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcblx0XHRcdFx0XHRcdFx0XHRcdFx0dC5qc3hJZGVudGlmaWVyKCdkYXRhLWVkaXQtZGlzYWJsZWQnKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0dC5zdHJpbmdMaXRlcmFsKFwidHJ1ZVwiKVxuXHRcdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0XHRcdG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMucHVzaChkaXNhYmxlZEF0dHJpYnV0ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRhdHRyaWJ1dGVzQWRkZWQrKztcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvLyBDb25kaXRpb24gNDogSXMgYW55IGFuY2VzdG9yIEpTWEVsZW1lbnQgYWxzbyBlZGl0YWJsZT9cblx0XHRcdFx0XHRcdFx0bGV0IGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGggPSBwYXRoLnBhcmVudFBhdGgucGFyZW50UGF0aDtcblx0XHRcdFx0XHRcdFx0d2hpbGUgKGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGgpIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBhbmNlc3RvckpzeEVsZW1lbnRQYXRoID0gY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aC5pc0pTWEVsZW1lbnQoKVxuXHRcdFx0XHRcdFx0XHRcdFx0PyBjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoXG5cdFx0XHRcdFx0XHRcdFx0XHQ6IGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGguZmluZFBhcmVudChwID0+IHAuaXNKU1hFbGVtZW50KCkpO1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFhbmNlc3RvckpzeEVsZW1lbnRQYXRoKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoY2hlY2tUYWdOYW1lRWRpdGFibGUoYW5jZXN0b3JKc3hFbGVtZW50UGF0aC5ub2RlLm9wZW5pbmdFbGVtZW50LCBFRElUQUJMRV9IVE1MX1RBR1MpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGggPSBhbmNlc3RvckpzeEVsZW1lbnRQYXRoLnBhcmVudFBhdGg7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRjb25zdCBsaW5lID0gb3BlbmluZ05vZGUubG9jLnN0YXJ0LmxpbmU7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGNvbHVtbiA9IG9wZW5pbmdOb2RlLmxvYy5zdGFydC5jb2x1bW4gKyAxO1xuXHRcdFx0XHRcdFx0XHRjb25zdCBlZGl0SWQgPSBgJHt3ZWJSZWxhdGl2ZUZpbGVQYXRofToke2xpbmV9OiR7Y29sdW1ufWA7XG5cblx0XHRcdFx0XHRcdFx0Y29uc3QgaWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcblx0XHRcdFx0XHRcdFx0XHR0LmpzeElkZW50aWZpZXIoJ2RhdGEtZWRpdC1pZCcpLFxuXHRcdFx0XHRcdFx0XHRcdHQuc3RyaW5nTGl0ZXJhbChlZGl0SWQpXG5cdFx0XHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRcdFx0b3BlbmluZ05vZGUuYXR0cmlidXRlcy5wdXNoKGlkQXR0cmlidXRlKTtcblx0XHRcdFx0XHRcdFx0YXR0cmlidXRlc0FkZGVkKys7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpZiAoYXR0cmlidXRlc0FkZGVkID4gMCkge1xuXHRcdFx0XHRcdGNvbnN0IG91dHB1dCA9IGdlbmVyYXRlU291cmNlV2l0aE1hcChiYWJlbEFzdCwgd2ViUmVsYXRpdmVGaWxlUGF0aCwgY29kZSk7XG5cdFx0XHRcdFx0cmV0dXJuIHsgY29kZTogb3V0cHV0LmNvZGUsIG1hcDogb3V0cHV0Lm1hcCB9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbdml0ZV1bdmlzdWFsLWVkaXRvcl0gRXJyb3IgdHJhbnNmb3JtaW5nICR7aWR9OmAsIGVycm9yKTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cdFx0fSxcblxuXG5cdFx0Ly8gVXBkYXRlcyBzb3VyY2UgY29kZSBiYXNlZCBvbiB0aGUgY2hhbmdlcyByZWNlaXZlZCBmcm9tIHRoZSBjbGllbnRcblx0XHRjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG5cdFx0XHRzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FwcGx5LWVkaXQnLCBhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcblx0XHRcdFx0aWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykgcmV0dXJuIG5leHQoKTtcblxuXHRcdFx0XHRsZXQgYm9keSA9ICcnO1xuXHRcdFx0XHRyZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTsgfSk7XG5cblx0XHRcdFx0cmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0bGV0IGFic29sdXRlRmlsZVBhdGggPSAnJztcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBlZGl0SWQsIG5ld0Z1bGxUZXh0IH0gPSBKU09OLnBhcnNlKGJvZHkpO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWVkaXRJZCB8fCB0eXBlb2YgbmV3RnVsbFRleHQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdFx0XHRcdHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIGVkaXRJZCBvciBuZXdGdWxsVGV4dCcgfSkpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjb25zdCBwYXJzZWRJZCA9IHBhcnNlRWRpdElkKGVkaXRJZCk7XG5cdFx0XHRcdFx0XHRpZiAoIXBhcnNlZElkKSB7XG5cdFx0XHRcdFx0XHRcdHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnZhbGlkIGVkaXRJZCBmb3JtYXQgKGZpbGVQYXRoOmxpbmU6Y29sdW1uKScgfSkpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjb25zdCB7IGZpbGVQYXRoLCBsaW5lLCBjb2x1bW4gfSA9IHBhcnNlZElkO1xuXG5cdFx0XHRcdFx0XHQvLyBWYWxpZGF0ZSBmaWxlIHBhdGhcblx0XHRcdFx0XHRcdGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUZpbGVQYXRoKGZpbGVQYXRoKTtcblx0XHRcdFx0XHRcdGlmICghdmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG5cdFx0XHRcdFx0XHRcdHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IHZhbGlkYXRpb24uZXJyb3IgfSkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YWJzb2x1dGVGaWxlUGF0aCA9IHZhbGlkYXRpb24uYWJzb2x1dGVQYXRoO1xuXG5cdFx0XHRcdFx0XHQvLyBQYXJzZSBBU1Rcblx0XHRcdFx0XHRcdGNvbnN0IG9yaWdpbmFsQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhhYnNvbHV0ZUZpbGVQYXRoLCAndXRmLTgnKTtcblx0XHRcdFx0XHRcdGNvbnN0IGJhYmVsQXN0ID0gcGFyc2VGaWxlVG9BU1QoYWJzb2x1dGVGaWxlUGF0aCk7XG5cblx0XHRcdFx0XHRcdC8vIEZpbmQgdGFyZ2V0IG5vZGUgKG5vdGU6IGFwcGx5LWVkaXQgdXNlcyBjb2x1bW4rMSlcblx0XHRcdFx0XHRcdGNvbnN0IHRhcmdldE5vZGVQYXRoID0gZmluZEpTWEVsZW1lbnRBdFBvc2l0aW9uKGJhYmVsQXN0LCBsaW5lLCBjb2x1bW4gKyAxKTtcblxuXHRcdFx0XHRcdFx0aWYgKCF0YXJnZXROb2RlUGF0aCkge1xuXHRcdFx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwNCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnVGFyZ2V0IG5vZGUgbm90IGZvdW5kIGJ5IGxpbmUvY29sdW1uJywgZWRpdElkIH0pKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgdGFyZ2V0T3BlbmluZ0VsZW1lbnQgPSB0YXJnZXROb2RlUGF0aC5ub2RlO1xuXHRcdFx0XHRcdFx0Y29uc3QgcGFyZW50RWxlbWVudE5vZGUgPSB0YXJnZXROb2RlUGF0aC5wYXJlbnRQYXRoPy5ub2RlO1xuXG5cdFx0XHRcdFx0XHRjb25zdCBpc0ltYWdlRWxlbWVudCA9IHRhcmdldE9wZW5pbmdFbGVtZW50Lm5hbWUgJiYgdGFyZ2V0T3BlbmluZ0VsZW1lbnQubmFtZS5uYW1lID09PSAnaW1nJztcblxuXHRcdFx0XHRcdFx0bGV0IGJlZm9yZUNvZGUgPSAnJztcblx0XHRcdFx0XHRcdGxldCBhZnRlckNvZGUgPSAnJztcblx0XHRcdFx0XHRcdGxldCBtb2RpZmllZCA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRpZiAoaXNJbWFnZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0Ly8gSGFuZGxlIGltYWdlIHNyYyBhdHRyaWJ1dGUgdXBkYXRlXG5cdFx0XHRcdFx0XHRcdGJlZm9yZUNvZGUgPSBnZW5lcmF0ZUNvZGUodGFyZ2V0T3BlbmluZ0VsZW1lbnQpO1xuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IHNyY0F0dHIgPSB0YXJnZXRPcGVuaW5nRWxlbWVudC5hdHRyaWJ1dGVzLmZpbmQoYXR0ciA9PlxuXHRcdFx0XHRcdFx0XHRcdHQuaXNKU1hBdHRyaWJ1dGUoYXR0cikgJiYgYXR0ci5uYW1lICYmIGF0dHIubmFtZS5uYW1lID09PSAnc3JjJ1xuXHRcdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChzcmNBdHRyICYmIHQuaXNTdHJpbmdMaXRlcmFsKHNyY0F0dHIudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0c3JjQXR0ci52YWx1ZSA9IHQuc3RyaW5nTGl0ZXJhbChuZXdGdWxsVGV4dCk7XG5cdFx0XHRcdFx0XHRcdFx0bW9kaWZpZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdGFmdGVyQ29kZSA9IGdlbmVyYXRlQ29kZSh0YXJnZXRPcGVuaW5nRWxlbWVudCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50Tm9kZSAmJiB0LmlzSlNYRWxlbWVudChwYXJlbnRFbGVtZW50Tm9kZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRiZWZvcmVDb2RlID0gZ2VuZXJhdGVDb2RlKHBhcmVudEVsZW1lbnROb2RlKTtcblxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnROb2RlLmNoaWxkcmVuID0gW107XG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5ld0Z1bGxUZXh0ICYmIG5ld0Z1bGxUZXh0LnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IG5ld1RleHROb2RlID0gdC5qc3hUZXh0KG5ld0Z1bGxUZXh0KTtcblx0XHRcdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnROb2RlLmNoaWxkcmVuLnB1c2gobmV3VGV4dE5vZGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRtb2RpZmllZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0YWZ0ZXJDb2RlID0gZ2VuZXJhdGVDb2RlKHBhcmVudEVsZW1lbnROb2RlKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIW1vZGlmaWVkKSB7XG5cdFx0XHRcdFx0XHRcdHJlcy53cml0ZUhlYWQoNDA5LCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdDb3VsZCBub3QgYXBwbHkgY2hhbmdlcyB0byBBU1QuJyB9KSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnN0IHdlYlJlbGF0aXZlRmlsZVBhdGggPSBwYXRoLnJlbGF0aXZlKFZJVEVfUFJPSkVDVF9ST09ULCBhYnNvbHV0ZUZpbGVQYXRoKS5zcGxpdChwYXRoLnNlcCkuam9pbignLycpO1xuXHRcdFx0XHRcdFx0Y29uc3Qgb3V0cHV0ID0gZ2VuZXJhdGVTb3VyY2VXaXRoTWFwKGJhYmVsQXN0LCB3ZWJSZWxhdGl2ZUZpbGVQYXRoLCBvcmlnaW5hbENvbnRlbnQpO1xuXHRcdFx0XHRcdFx0Y29uc3QgbmV3Q29udGVudCA9IG91dHB1dC5jb2RlO1xuXG5cdFx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuXHRcdFx0XHRcdFx0cmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRcdFx0XHRcdG5ld0ZpbGVDb250ZW50OiBuZXdDb250ZW50LFxuXHRcdFx0XHRcdFx0XHRiZWZvcmVDb2RlLFxuXHRcdFx0XHRcdFx0XHRhZnRlckNvZGUsXG5cdFx0XHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0cmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcblx0XHRcdFx0XHRcdHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBkdXJpbmcgZWRpdCBhcHBsaWNhdGlvbi4nIH0pKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHBsdWdpbnNcXFxcdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyZWRkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQ0VOVEVSUyAyLjVcXFxcU09MSUZPT0QgQ0VOVEVSIDIuMFxcXFxwbHVnaW5zXFxcXHV0aWxzXFxcXGFzdC11dGlscy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJlZGQvT25lRHJpdmUvRGVza3RvcC9DRU5URVJTJTIwMi41L1NPTElGT09EJTIwQ0VOVEVSJTIwMi4wL3BsdWdpbnMvdXRpbHMvYXN0LXV0aWxzLmpzXCI7aW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgZ2VuZXJhdGUgZnJvbSAnQGJhYmVsL2dlbmVyYXRvcic7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ0BiYWJlbC9wYXJzZXInO1xuaW1wb3J0IHRyYXZlcnNlQmFiZWwgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCB7XG5cdGlzSlNYSWRlbnRpZmllcixcblx0aXNKU1hNZW1iZXJFeHByZXNzaW9uLFxufSBmcm9tICdAYmFiZWwvdHlwZXMnO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpO1xuY29uc3QgVklURV9QUk9KRUNUX1JPT1QgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4nKTtcblxuLy8gQmxhY2tsaXN0IG9mIGNvbXBvbmVudHMgdGhhdCBzaG91bGQgbm90IGJlIGV4dHJhY3RlZCAodXRpbGl0eS9ub24tdmlzdWFsIGNvbXBvbmVudHMpXG5jb25zdCBDT01QT05FTlRfQkxBQ0tMSVNUID0gbmV3IFNldChbXG5cdCdIZWxtZXQnLFxuXHQnSGVsbWV0UHJvdmlkZXInLFxuXHQnSGVhZCcsXG5cdCdoZWFkJyxcblx0J01ldGEnLFxuXHQnbWV0YScsXG5cdCdTY3JpcHQnLFxuXHQnc2NyaXB0Jyxcblx0J05vU2NyaXB0Jyxcblx0J25vc2NyaXB0Jyxcblx0J1N0eWxlJyxcblx0J3N0eWxlJyxcblx0J3RpdGxlJyxcblx0J1RpdGxlJyxcblx0J2xpbmsnLFxuXHQnTGluaycsXG5dKTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBhIGZpbGUgcGF0aCBpcyBzYWZlIHRvIGFjY2Vzc1xuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoIC0gUmVsYXRpdmUgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyB7eyBpc1ZhbGlkOiBib29sZWFuLCBhYnNvbHV0ZVBhdGg/OiBzdHJpbmcsIGVycm9yPzogc3RyaW5nIH19IC0gT2JqZWN0IGNvbnRhaW5pbmcgdmFsaWRhdGlvbiByZXN1bHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRmlsZVBhdGgoZmlsZVBhdGgpIHtcblx0aWYgKCFmaWxlUGF0aCkge1xuXHRcdHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCBlcnJvcjogJ01pc3NpbmcgZmlsZVBhdGgnIH07XG5cdH1cblxuXHRjb25zdCBhYnNvbHV0ZUZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKFZJVEVfUFJPSkVDVF9ST09ULCBmaWxlUGF0aCk7XG5cblx0aWYgKGZpbGVQYXRoLmluY2x1ZGVzKCcuLicpXG5cdFx0fHwgIWFic29sdXRlRmlsZVBhdGguc3RhcnRzV2l0aChWSVRFX1BST0pFQ1RfUk9PVClcblx0XHR8fCBhYnNvbHV0ZUZpbGVQYXRoLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuXHRcdHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCBlcnJvcjogJ0ludmFsaWQgcGF0aCcgfTtcblx0fVxuXG5cdGlmICghZnMuZXhpc3RzU3luYyhhYnNvbHV0ZUZpbGVQYXRoKSkge1xuXHRcdHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCBlcnJvcjogJ0ZpbGUgbm90IGZvdW5kJyB9O1xuXHR9XG5cblx0cmV0dXJuIHsgaXNWYWxpZDogdHJ1ZSwgYWJzb2x1dGVQYXRoOiBhYnNvbHV0ZUZpbGVQYXRoIH07XG59XG5cbi8qKlxuICogUGFyc2VzIGEgZmlsZSBpbnRvIGEgQmFiZWwgQVNUXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJzb2x1dGVGaWxlUGF0aCAtIEFic29sdXRlIHBhdGggdG8gZmlsZVxuICogQHJldHVybnMge29iamVjdH0gQmFiZWwgQVNUXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGVUb0FTVChhYnNvbHV0ZUZpbGVQYXRoKSB7XG5cdGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoYWJzb2x1dGVGaWxlUGF0aCwgJ3V0Zi04Jyk7XG5cblx0cmV0dXJuIHBhcnNlKGNvbnRlbnQsIHtcblx0XHRzb3VyY2VUeXBlOiAnbW9kdWxlJyxcblx0XHRwbHVnaW5zOiBbJ2pzeCcsICd0eXBlc2NyaXB0J10sXG5cdFx0ZXJyb3JSZWNvdmVyeTogdHJ1ZSxcblx0fSk7XG59XG5cbi8qKlxuICogRmluZHMgYSBKU1ggb3BlbmluZyBlbGVtZW50IGF0IGEgc3BlY2lmaWMgbGluZSBhbmQgY29sdW1uXG4gKiBAcGFyYW0ge29iamVjdH0gYXN0IC0gQmFiZWwgQVNUXG4gKiBAcGFyYW0ge251bWJlcn0gbGluZSAtIExpbmUgbnVtYmVyICgxLWluZGV4ZWQpXG4gKiBAcGFyYW0ge251bWJlcn0gY29sdW1uIC0gQ29sdW1uIG51bWJlciAoMC1pbmRleGVkIGZvciBnZXQtY29kZS1ibG9jaywgMS1pbmRleGVkIGZvciBhcHBseS1lZGl0KVxuICogQHJldHVybnMge29iamVjdCB8IG51bGx9IEJhYmVsIHBhdGggdG8gdGhlIEpTWCBvcGVuaW5nIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRKU1hFbGVtZW50QXRQb3NpdGlvbihhc3QsIGxpbmUsIGNvbHVtbikge1xuXHRsZXQgdGFyZ2V0Tm9kZVBhdGggPSBudWxsO1xuXHRsZXQgY2xvc2VzdE5vZGVQYXRoID0gbnVsbDtcblx0bGV0IGNsb3Nlc3REaXN0YW5jZSA9IEluZmluaXR5O1xuXHRjb25zdCBhbGxOb2Rlc09uTGluZSA9IFtdO1xuXG5cdGNvbnN0IHZpc2l0b3IgPSB7XG5cdFx0SlNYT3BlbmluZ0VsZW1lbnQocGF0aCkge1xuXHRcdFx0Y29uc3Qgbm9kZSA9IHBhdGgubm9kZTtcblx0XHRcdGlmIChub2RlLmxvYykge1xuXHRcdFx0XHQvLyBFeGFjdCBtYXRjaCAod2l0aCB0b2xlcmFuY2UgZm9yIG9mZi1ieS1vbmUgY29sdW1uIGRpZmZlcmVuY2VzKVxuXHRcdFx0XHRpZiAobm9kZS5sb2Muc3RhcnQubGluZSA9PT0gbGluZVxuXHRcdFx0XHRcdCYmIE1hdGguYWJzKG5vZGUubG9jLnN0YXJ0LmNvbHVtbiAtIGNvbHVtbikgPD0gMSkge1xuXHRcdFx0XHRcdHRhcmdldE5vZGVQYXRoID0gcGF0aDtcblx0XHRcdFx0XHRwYXRoLnN0b3AoKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBUcmFjayBhbGwgbm9kZXMgb24gdGhlIHNhbWUgbGluZVxuXHRcdFx0XHRpZiAobm9kZS5sb2Muc3RhcnQubGluZSA9PT0gbGluZSkge1xuXHRcdFx0XHRcdGFsbE5vZGVzT25MaW5lLnB1c2goe1xuXHRcdFx0XHRcdFx0cGF0aCxcblx0XHRcdFx0XHRcdGNvbHVtbjogbm9kZS5sb2Muc3RhcnQuY29sdW1uLFxuXHRcdFx0XHRcdFx0ZGlzdGFuY2U6IE1hdGguYWJzKG5vZGUubG9jLnN0YXJ0LmNvbHVtbiAtIGNvbHVtbiksXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBUcmFjayBjbG9zZXN0IG1hdGNoIG9uIHRoZSBzYW1lIGxpbmUgZm9yIGZhbGxiYWNrXG5cdFx0XHRcdGlmIChub2RlLmxvYy5zdGFydC5saW5lID09PSBsaW5lKSB7XG5cdFx0XHRcdFx0Y29uc3QgZGlzdGFuY2UgPSBNYXRoLmFicyhub2RlLmxvYy5zdGFydC5jb2x1bW4gLSBjb2x1bW4pO1xuXHRcdFx0XHRcdGlmIChkaXN0YW5jZSA8IGNsb3Nlc3REaXN0YW5jZSkge1xuXHRcdFx0XHRcdFx0Y2xvc2VzdERpc3RhbmNlID0gZGlzdGFuY2U7XG5cdFx0XHRcdFx0XHRjbG9zZXN0Tm9kZVBhdGggPSBwYXRoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gQWxzbyBjaGVjayBKU1hFbGVtZW50IG5vZGVzIHRoYXQgY29udGFpbiB0aGUgcG9zaXRpb25cblx0XHRKU1hFbGVtZW50KHBhdGgpIHtcblx0XHRcdGNvbnN0IG5vZGUgPSBwYXRoLm5vZGU7XG5cdFx0XHRpZiAoIW5vZGUubG9jKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hlY2sgaWYgdGhpcyBlbGVtZW50IHNwYW5zIHRoZSB0YXJnZXQgbGluZSAoZm9yIG11bHRpLWxpbmUgZWxlbWVudHMpXG5cdFx0XHRpZiAobm9kZS5sb2Muc3RhcnQubGluZSA+IGxpbmUgfHwgbm9kZS5sb2MuZW5kLmxpbmUgPCBsaW5lKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgd2UncmUgaW5zaWRlIHRoaXMgZWxlbWVudCdzIHJhbmdlLCBjb25zaWRlciBpdHMgb3BlbmluZyBlbGVtZW50XG5cdFx0XHRpZiAoIXBhdGgubm9kZS5vcGVuaW5nRWxlbWVudD8ubG9jKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3Qgb3BlbmluZ0xpbmUgPSBwYXRoLm5vZGUub3BlbmluZ0VsZW1lbnQubG9jLnN0YXJ0LmxpbmU7XG5cdFx0XHRjb25zdCBvcGVuaW5nQ29sID0gcGF0aC5ub2RlLm9wZW5pbmdFbGVtZW50LmxvYy5zdGFydC5jb2x1bW47XG5cblx0XHRcdC8vIFByZWZlciBlbGVtZW50cyB0aGF0IHN0YXJ0IG9uIHRoZSBleGFjdCBsaW5lXG5cdFx0XHRpZiAob3BlbmluZ0xpbmUgPT09IGxpbmUpIHtcblx0XHRcdFx0Y29uc3QgZGlzdGFuY2UgPSBNYXRoLmFicyhvcGVuaW5nQ29sIC0gY29sdW1uKTtcblx0XHRcdFx0aWYgKGRpc3RhbmNlIDwgY2xvc2VzdERpc3RhbmNlKSB7XG5cdFx0XHRcdFx0Y2xvc2VzdERpc3RhbmNlID0gZGlzdGFuY2U7XG5cdFx0XHRcdFx0Y2xvc2VzdE5vZGVQYXRoID0gcGF0aC5nZXQoJ29wZW5pbmdFbGVtZW50Jyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBIYW5kbGUgZWxlbWVudHMgdGhhdCBzdGFydCBiZWZvcmUgdGhlIHRhcmdldCBsaW5lXG5cdFx0XHRpZiAob3BlbmluZ0xpbmUgPCBsaW5lKSB7XG5cdFx0XHRcdGNvbnN0IGRpc3RhbmNlID0gKGxpbmUgLSBvcGVuaW5nTGluZSkgKiAxMDA7IC8vIFBlbmFsaXplIGJ5IGxpbmUgZGlzdGFuY2Vcblx0XHRcdFx0aWYgKGRpc3RhbmNlIDwgY2xvc2VzdERpc3RhbmNlKSB7XG5cdFx0XHRcdFx0Y2xvc2VzdERpc3RhbmNlID0gZGlzdGFuY2U7XG5cdFx0XHRcdFx0Y2xvc2VzdE5vZGVQYXRoID0gcGF0aC5nZXQoJ29wZW5pbmdFbGVtZW50Jyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHR9O1xuXG5cdHRyYXZlcnNlQmFiZWwuZGVmYXVsdChhc3QsIHZpc2l0b3IpO1xuXG5cdC8vIFJldHVybiBleGFjdCBtYXRjaCBpZiBmb3VuZCwgb3RoZXJ3aXNlIHJldHVybiBjbG9zZXN0IG1hdGNoIGlmIHdpdGhpbiByZWFzb25hYmxlIGRpc3RhbmNlXG5cdC8vIFVzZSBsYXJnZXIgdGhyZXNob2xkICg1MCBjaGFycykgZm9yIHNhbWUtbGluZSBlbGVtZW50cywgNSBsaW5lcyBmb3IgbXVsdGktbGluZSBlbGVtZW50c1xuXHRjb25zdCB0aHJlc2hvbGQgPSBjbG9zZXN0RGlzdGFuY2UgPCAxMDAgPyA1MCA6IDUwMDtcblx0cmV0dXJuIHRhcmdldE5vZGVQYXRoIHx8IChjbG9zZXN0RGlzdGFuY2UgPD0gdGhyZXNob2xkID8gY2xvc2VzdE5vZGVQYXRoIDogbnVsbCk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgSlNYIGVsZW1lbnQgbmFtZSBpcyBibGFja2xpc3RlZFxuICogQHBhcmFtIHtvYmplY3R9IGpzeE9wZW5pbmdFbGVtZW50IC0gQmFiZWwgSlNYIG9wZW5pbmcgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiBibGFja2xpc3RlZFxuICovXG5mdW5jdGlvbiBpc0JsYWNrbGlzdGVkQ29tcG9uZW50KGpzeE9wZW5pbmdFbGVtZW50KSB7XG5cdGlmICghanN4T3BlbmluZ0VsZW1lbnQgfHwgIWpzeE9wZW5pbmdFbGVtZW50Lm5hbWUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBIYW5kbGUgSlNYSWRlbnRpZmllciAoZS5nLiwgPEhlbG1ldD4pXG5cdGlmIChpc0pTWElkZW50aWZpZXIoanN4T3BlbmluZ0VsZW1lbnQubmFtZSkpIHtcblx0XHRyZXR1cm4gQ09NUE9ORU5UX0JMQUNLTElTVC5oYXMoanN4T3BlbmluZ0VsZW1lbnQubmFtZS5uYW1lKTtcblx0fVxuXG5cdC8vIEhhbmRsZSBKU1hNZW1iZXJFeHByZXNzaW9uIChlLmcuLCA8UmVhY3QuRnJhZ21lbnQ+KVxuXHRpZiAoaXNKU1hNZW1iZXJFeHByZXNzaW9uKGpzeE9wZW5pbmdFbGVtZW50Lm5hbWUpKSB7XG5cdFx0bGV0IGN1cnJlbnQgPSBqc3hPcGVuaW5nRWxlbWVudC5uYW1lO1xuXHRcdHdoaWxlIChpc0pTWE1lbWJlckV4cHJlc3Npb24oY3VycmVudCkpIHtcblx0XHRcdGN1cnJlbnQgPSBjdXJyZW50LnByb3BlcnR5O1xuXHRcdH1cblx0XHRpZiAoaXNKU1hJZGVudGlmaWVyKGN1cnJlbnQpKSB7XG5cdFx0XHRyZXR1cm4gQ09NUE9ORU5UX0JMQUNLTElTVC5oYXMoY3VycmVudC5uYW1lKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGNvZGUgZnJvbSBhbiBBU1Qgbm9kZVxuICogQHBhcmFtIHtvYmplY3R9IG5vZGUgLSBCYWJlbCBBU1Qgbm9kZVxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgLSBHZW5lcmF0b3Igb3B0aW9uc1xuICogQHJldHVybnMge3N0cmluZ30gR2VuZXJhdGVkIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29kZShub2RlLCBvcHRpb25zID0ge30pIHtcblx0Y29uc3QgZ2VuZXJhdGVGdW5jdGlvbiA9IGdlbmVyYXRlLmRlZmF1bHQgfHwgZ2VuZXJhdGU7XG5cdGNvbnN0IG91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24obm9kZSwgb3B0aW9ucyk7XG5cdHJldHVybiBvdXRwdXQuY29kZTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBmdWxsIHNvdXJjZSBmaWxlIGZyb20gQVNUIHdpdGggc291cmNlIG1hcHNcbiAqIEBwYXJhbSB7b2JqZWN0fSBhc3QgLSBCYWJlbCBBU1RcbiAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VGaWxlTmFtZSAtIFNvdXJjZSBmaWxlIG5hbWUgZm9yIHNvdXJjZSBtYXBcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbENvZGUgLSBPcmlnaW5hbCBzb3VyY2UgY29kZVxuICogQHJldHVybnMge3tjb2RlOiBzdHJpbmcsIG1hcDogb2JqZWN0fX0gLSBPYmplY3QgY29udGFpbmluZyBnZW5lcmF0ZWQgY29kZSBhbmQgc291cmNlIG1hcFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVTb3VyY2VXaXRoTWFwKGFzdCwgc291cmNlRmlsZU5hbWUsIG9yaWdpbmFsQ29kZSkge1xuXHRjb25zdCBnZW5lcmF0ZUZ1bmN0aW9uID0gZ2VuZXJhdGUuZGVmYXVsdCB8fCBnZW5lcmF0ZTtcblx0cmV0dXJuIGdlbmVyYXRlRnVuY3Rpb24oYXN0LCB7XG5cdFx0c291cmNlTWFwczogdHJ1ZSxcblx0XHRzb3VyY2VGaWxlTmFtZSxcblx0fSwgb3JpZ2luYWxDb2RlKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBjb2RlIGJsb2NrcyBmcm9tIGEgSlNYIGVsZW1lbnQgYXQgYSBzcGVjaWZpYyBsb2NhdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoIC0gUmVsYXRpdmUgZmlsZSBwYXRoXG4gKiBAcGFyYW0ge251bWJlcn0gbGluZSAtIExpbmUgbnVtYmVyXG4gKiBAcGFyYW0ge251bWJlcn0gY29sdW1uIC0gQ29sdW1uIG51bWJlclxuICogQHBhcmFtIHtvYmplY3R9IFtkb21Db250ZXh0XSAtIE9wdGlvbmFsIERPTSBjb250ZXh0IHRvIHJldHVybiBvbiBmYWlsdXJlXG4gKiBAcmV0dXJucyB7e3N1Y2Nlc3M6IGJvb2xlYW4sIGZpbGVQYXRoPzogc3RyaW5nLCBzcGVjaWZpY0xpbmU/OiBzdHJpbmcsIGVycm9yPzogc3RyaW5nLCBkb21Db250ZXh0Pzogb2JqZWN0fX0gLSBPYmplY3Qgd2l0aCBtZXRhZGF0YSBmb3IgTExNXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Q29kZUJsb2NrcyhmaWxlUGF0aCwgbGluZSwgY29sdW1uLCBkb21Db250ZXh0KSB7XG5cdHRyeSB7XG5cdFx0Ly8gVmFsaWRhdGUgZmlsZSBwYXRoXG5cdFx0Y29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRmlsZVBhdGgoZmlsZVBhdGgpO1xuXHRcdGlmICghdmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG5cdFx0XHRyZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHZhbGlkYXRpb24uZXJyb3IsIGRvbUNvbnRleHQgfTtcblx0XHR9XG5cblx0XHQvLyBQYXJzZSBBU1Rcblx0XHRjb25zdCBhc3QgPSBwYXJzZUZpbGVUb0FTVCh2YWxpZGF0aW9uLmFic29sdXRlUGF0aCk7XG5cblx0XHQvLyBGaW5kIHRhcmdldCBub2RlXG5cdFx0Y29uc3QgdGFyZ2V0Tm9kZVBhdGggPSBmaW5kSlNYRWxlbWVudEF0UG9zaXRpb24oYXN0LCBsaW5lLCBjb2x1bW4pO1xuXG5cdFx0aWYgKCF0YXJnZXROb2RlUGF0aCkge1xuXHRcdFx0cmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVGFyZ2V0IG5vZGUgbm90IGZvdW5kIGF0IHNwZWNpZmllZCBsaW5lL2NvbHVtbicsIGRvbUNvbnRleHQgfTtcblx0XHR9XG5cblx0XHQvLyBDaGVjayBpZiB0aGUgdGFyZ2V0IG5vZGUgaXMgYSBibGFja2xpc3RlZCBjb21wb25lbnRcblx0XHRjb25zdCBpc0JsYWNrbGlzdGVkID0gaXNCbGFja2xpc3RlZENvbXBvbmVudCh0YXJnZXROb2RlUGF0aC5ub2RlKTtcblxuXHRcdGlmIChpc0JsYWNrbGlzdGVkKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRmaWxlUGF0aCxcblx0XHRcdFx0c3BlY2lmaWNMaW5lOiAnJyxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gR2V0IHNwZWNpZmljIGxpbmUgY29kZVxuXHRcdGNvbnN0IHNwZWNpZmljTGluZSA9IGdlbmVyYXRlQ29kZSh0YXJnZXROb2RlUGF0aC5wYXJlbnRQYXRoPy5ub2RlIHx8IHRhcmdldE5vZGVQYXRoLm5vZGUpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRmaWxlUGF0aCxcblx0XHRcdHNwZWNpZmljTGluZSxcblx0XHR9O1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGNvbnNvbGUuZXJyb3IoJ1thc3QtdXRpbHNdIEVycm9yIGV4dHJhY3RpbmcgY29kZSBibG9ja3M6JywgZXJyb3IpO1xuXHRcdHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBleHRyYWN0IGNvZGUgYmxvY2tzJywgZG9tQ29udGV4dCB9O1xuXHR9XG59XG5cbi8qKlxuICogUHJvamVjdCByb290IHBhdGhcbiAqL1xuZXhwb3J0IHsgVklURV9QUk9KRUNUX1JPT1QgfTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclxcXFx2aXRlLXBsdWdpbi1lZGl0LW1vZGUuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2ZyZWRkL09uZURyaXZlL0Rlc2t0b3AvQ0VOVEVSUyUyMDIuNS9TT0xJRk9PRCUyMENFTlRFUiUyMDIuMC9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tZWRpdC1tb2RlLmpzXCI7aW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBFRElUX01PREVfU1RZTEVTIH0gZnJvbSAnLi92aXN1YWwtZWRpdG9yLWNvbmZpZyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSByZXNvbHZlKF9fZmlsZW5hbWUsICcuLicpO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbmxpbmVFZGl0RGV2UGx1Z2luKCkge1xuXHRyZXR1cm4ge1xuXHRcdG5hbWU6ICd2aXRlOmlubGluZS1lZGl0LWRldicsXG5cdFx0YXBwbHk6ICdzZXJ2ZScsXG5cdFx0dHJhbnNmb3JtSW5kZXhIdG1sKCkge1xuXHRcdFx0Y29uc3Qgc2NyaXB0UGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnZWRpdC1tb2RlLXNjcmlwdC5qcycpO1xuXHRcdFx0Y29uc3Qgc2NyaXB0Q29udGVudCA9IHJlYWRGaWxlU3luYyhzY3JpcHRQYXRoLCAndXRmLTgnKTtcblxuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdFx0YXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcblx0XHRcdFx0XHRjaGlsZHJlbjogc2NyaXB0Q29udGVudCxcblx0XHRcdFx0XHRpbmplY3RUbzogJ2JvZHknXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0YWc6ICdzdHlsZScsXG5cdFx0XHRcdFx0Y2hpbGRyZW46IEVESVRfTU9ERV9TVFlMRVMsXG5cdFx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJ1xuXHRcdFx0XHR9XG5cdFx0XHRdO1xuXHRcdH1cblx0fTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclxcXFx2aXN1YWwtZWRpdG9yLWNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJlZGQvT25lRHJpdmUvRGVza3RvcC9DRU5URVJTJTIwMi41L1NPTElGT09EJTIwQ0VOVEVSJTIwMi4wL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXN1YWwtZWRpdG9yLWNvbmZpZy5qc1wiO2V4cG9ydCBjb25zdCBQT1BVUF9TVFlMRVMgPSBgXG4jaW5saW5lLWVkaXRvci1wb3B1cCB7XG5cdHdpZHRoOiAzNjBweDtcblx0cG9zaXRpb246IGZpeGVkO1xuXHR6LWluZGV4OiAxMDAwMDtcblx0YmFja2dyb3VuZDogIzE2MTcxODtcblx0Y29sb3I6IHdoaXRlO1xuXHRib3JkZXI6IDFweCBzb2xpZCAjNGE1NTY4O1xuXHRib3JkZXItcmFkaXVzOiAxNnB4O1xuXHRwYWRkaW5nOiA4cHg7XG5cdGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSgwLDAsMCwwLjIpO1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRnYXA6IDEwcHg7XG5cdGRpc3BsYXk6IG5vbmU7XG59XG5cbkBtZWRpYSAobWF4LXdpZHRoOiA3NjhweCkge1xuXHQjaW5saW5lLWVkaXRvci1wb3B1cCB7XG5cdFx0d2lkdGg6IGNhbGMoMTAwJSAtIDIwcHgpO1xuXHR9XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwLmlzLWFjdGl2ZSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdHRvcDogNTAlO1xuXHRsZWZ0OiA1MCU7XG5cdHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cC5pcy1kaXNhYmxlZC12aWV3IHtcblx0cGFkZGluZzogMTBweCAxNXB4O1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCB0ZXh0YXJlYSB7XG5cdGhlaWdodDogMTAwcHg7XG5cdHBhZGRpbmc6IDRweCA4cHg7XG5cdGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXHRjb2xvcjogd2hpdGU7XG5cdGZvbnQtZmFtaWx5OiBpbmhlcml0O1xuXHRmb250LXNpemU6IDAuODc1cmVtO1xuXHRsaW5lLWhlaWdodDogMS40Mjtcblx0cmVzaXplOiBub25lO1xuXHRvdXRsaW5lOiBub25lO1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAuYnV0dG9uLWNvbnRhaW5lciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG5cdGdhcDogMTBweDtcbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAgLnBvcHVwLWJ1dHRvbiB7XG5cdGJvcmRlcjogbm9uZTtcblx0cGFkZGluZzogNnB4IDE2cHg7XG5cdGJvcmRlci1yYWRpdXM6IDhweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHRmb250LXNpemU6IDAuNzVyZW07XG5cdGZvbnQtd2VpZ2h0OiA3MDA7XG5cdGhlaWdodDogMzRweDtcblx0b3V0bGluZTogbm9uZTtcbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAgLnNhdmUtYnV0dG9uIHtcblx0YmFja2dyb3VuZDogIzY3M2RlNjtcblx0Y29sb3I6IHdoaXRlO1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAuY2FuY2VsLWJ1dHRvbiB7XG5cdGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXHRib3JkZXI6IDFweCBzb2xpZCAjM2IzZDRhO1xuXHRjb2xvcjogd2hpdGU7XG5cblx0Jjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IzQ3NDk1ODtcblx0fVxufVxuYDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcHVwSFRNTFRlbXBsYXRlKHNhdmVMYWJlbCwgY2FuY2VsTGFiZWwpIHtcblx0cmV0dXJuIGBcblx0PHRleHRhcmVhPjwvdGV4dGFyZWE+XG5cdDxkaXYgY2xhc3M9XCJidXR0b24tY29udGFpbmVyXCI+XG5cdFx0PGJ1dHRvbiBjbGFzcz1cInBvcHVwLWJ1dHRvbiBjYW5jZWwtYnV0dG9uXCI+JHtjYW5jZWxMYWJlbH08L2J1dHRvbj5cblx0XHQ8YnV0dG9uIGNsYXNzPVwicG9wdXAtYnV0dG9uIHNhdmUtYnV0dG9uXCI+JHtzYXZlTGFiZWx9PC9idXR0b24+XG5cdDwvZGl2PlxuXHRgO1xufVxuXG5leHBvcnQgY29uc3QgRURJVF9NT0RFX1NUWUxFUyA9IGBcblx0I3Jvb3RbZGF0YS1lZGl0LW1vZGUtZW5hYmxlZD1cInRydWVcIl0gW2RhdGEtZWRpdC1pZF0ge1xuXHRcdGN1cnNvcjogcG9pbnRlcjsgXG5cdFx0b3V0bGluZTogMnB4IGRhc2hlZCAjMzU3REY5OyBcblx0XHRvdXRsaW5lLW9mZnNldDogMnB4O1xuXHRcdG1pbi1oZWlnaHQ6IDFlbTtcblx0fVxuXHQjcm9vdFtkYXRhLWVkaXQtbW9kZS1lbmFibGVkPVwidHJ1ZVwiXSBpbWdbZGF0YS1lZGl0LWlkXSB7XG5cdFx0b3V0bGluZS1vZmZzZXQ6IC0ycHg7XG5cdH1cblx0I3Jvb3RbZGF0YS1lZGl0LW1vZGUtZW5hYmxlZD1cInRydWVcIl0ge1xuXHRcdGN1cnNvcjogcG9pbnRlcjtcblx0fVxuXHQjcm9vdFtkYXRhLWVkaXQtbW9kZS1lbmFibGVkPVwidHJ1ZVwiXSBbZGF0YS1lZGl0LWlkXTpob3ZlciB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogIzM1N0RGOTMzO1xuXHRcdG91dGxpbmUtY29sb3I6ICMzNTdERjk7IFxuXHR9XG5cblx0QGtleWZyYW1lcyBmYWRlSW5Ub29sdGlwIHtcblx0XHRmcm9tIHtcblx0XHRcdG9wYWNpdHk6IDA7XG5cdFx0XHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNXB4KTtcblx0XHR9XG5cdFx0dG8ge1xuXHRcdFx0b3BhY2l0eTogMTtcblx0XHRcdHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTtcblx0XHR9XG5cdH1cblxuXHQjaW5saW5lLWVkaXRvci1kaXNhYmxlZC10b29sdGlwIHtcblx0XHRkaXNwbGF5OiBub25lOyBcblx0XHRvcGFjaXR5OiAwOyBcblx0XHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogIzFEMUUyMDtcblx0XHRjb2xvcjogd2hpdGU7XG5cdFx0cGFkZGluZzogNHB4IDhweDtcblx0XHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdFx0ei1pbmRleDogMTAwMDE7XG5cdFx0Zm9udC1zaXplOiAxNHB4O1xuXHRcdGJvcmRlcjogMXB4IHNvbGlkICMzQjNENEE7XG5cdFx0bWF4LXdpZHRoOiAxODRweDtcblx0XHR0ZXh0LWFsaWduOiBjZW50ZXI7XG5cdH1cblxuXHQjaW5saW5lLWVkaXRvci1kaXNhYmxlZC10b29sdGlwLnRvb2x0aXAtYWN0aXZlIHtcblx0XHRkaXNwbGF5OiBibG9jaztcblx0XHRhbmltYXRpb246IGZhZGVJblRvb2x0aXAgMC4ycyBlYXNlLW91dCBmb3J3YXJkcztcblx0fVxuYDtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJlZGRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxDRU5URVJTIDIuNVxcXFxTT0xJRk9PRCBDRU5URVIgMi4wXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyZWRkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQ0VOVEVSUyAyLjVcXFxcU09MSUZPT0QgQ0VOVEVSIDIuMFxcXFxwbHVnaW5zXFxcXHZpdGUtcGx1Z2luLWlmcmFtZS1yb3V0ZS1yZXN0b3JhdGlvbi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJlZGQvT25lRHJpdmUvRGVza3RvcC9DRU5URVJTJTIwMi41L1NPTElGT09EJTIwQ0VOVEVSJTIwMi4wL3BsdWdpbnMvdml0ZS1wbHVnaW4taWZyYW1lLXJvdXRlLXJlc3RvcmF0aW9uLmpzXCI7ZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaWZyYW1lUm91dGVSZXN0b3JhdGlvblBsdWdpbigpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndml0ZTppZnJhbWUtcm91dGUtcmVzdG9yYXRpb24nLFxuICAgIGFwcGx5OiAnc2VydmUnLFxuICAgIHRyYW5zZm9ybUluZGV4SHRtbCgpIHtcbiAgICAgIGNvbnN0IHNjcmlwdCA9IGBcbiAgICAgIGNvbnN0IEFMTE9XRURfUEFSRU5UX09SSUdJTlMgPSBbXG4gICAgICAgICAgXCJodHRwczovL2hvcml6b25zLmhvc3Rpbmdlci5jb21cIixcbiAgICAgICAgICBcImh0dHBzOi8vaG9yaXpvbnMuaG9zdGluZ2VyLmRldlwiLFxuICAgICAgICAgIFwiaHR0cHM6Ly9ob3Jpem9ucy1mcm9udGVuZC1sb2NhbC5ob3N0aW5nZXIuZGV2XCIsXG4gICAgICBdO1xuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgcGFnZSBpcyBpbiBhbiBpZnJhbWVcbiAgICAgICAgaWYgKHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wKSB7XG4gICAgICAgICAgY29uc3QgU1RPUkFHRV9LRVkgPSAnaG9yaXpvbnMtaWZyYW1lLXNhdmVkLXJvdXRlJztcblxuICAgICAgICAgIGNvbnN0IGdldEN1cnJlbnRSb3V0ZSA9ICgpID0+IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoICsgbG9jYXRpb24uaGFzaDtcblxuICAgICAgICAgIGNvbnN0IHNhdmUgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Um91dGUgPSBnZXRDdXJyZW50Um91dGUoKTtcbiAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShTVE9SQUdFX0tFWSwgY3VycmVudFJvdXRlKTtcbiAgICAgICAgICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7bWVzc2FnZTogJ3JvdXRlLWNoYW5nZWQnLCByb3V0ZTogY3VycmVudFJvdXRlfSwgJyonKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgcmVwbGFjZUhpc3RvcnlTdGF0ZSA9ICh1cmwpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKG51bGwsICcnLCB1cmwpO1xuICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgUG9wU3RhdGVFdmVudCgncG9wc3RhdGUnLCB7IHN0YXRlOiBoaXN0b3J5LnN0YXRlIH0pKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IHJlc3RvcmUgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzYXZlZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oU1RPUkFHRV9LRVkpO1xuICAgICAgICAgICAgICBpZiAoIXNhdmVkKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgaWYgKCFzYXZlZC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFNUT1JBR0VfS0VZKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gZ2V0Q3VycmVudFJvdXRlKCk7XG4gICAgICAgICAgICAgIGlmIChjdXJyZW50ICE9PSBzYXZlZCkge1xuICAgICAgICAgICAgICAgIGlmICghcmVwbGFjZUhpc3RvcnlTdGF0ZShzYXZlZCkpIHtcbiAgICAgICAgICAgICAgICAgIHJlcGxhY2VIaXN0b3J5U3RhdGUoJy8nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gKGRvY3VtZW50LmJvZHk/LmlubmVyVGV4dCB8fCAnJykudHJpbSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZXN0b3JlZCByb3V0ZSByZXN1bHRzIGluIHRvbyBsaXR0bGUgY29udGVudCwgYXNzdW1lIGl0IGlzIGludmFsaWQgYW5kIG5hdmlnYXRlIGhvbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoIDwgNTApIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXBsYWNlSGlzdG9yeVN0YXRlKCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgICAgICB9LCAxMDAwKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWxQdXNoU3RhdGUgPSBoaXN0b3J5LnB1c2hTdGF0ZTtcbiAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsUHVzaFN0YXRlLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgc2F2ZSgpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBvcmlnaW5hbFJlcGxhY2VTdGF0ZSA9IGhpc3RvcnkucmVwbGFjZVN0YXRlO1xuICAgICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgICAgICAgb3JpZ2luYWxSZXBsYWNlU3RhdGUuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IGdldFBhcmVudE9yaWdpbiA9ICgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmFuY2VzdG9yT3JpZ2lucyAmJlxuICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmFuY2VzdG9yT3JpZ2lucy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5hbmNlc3Rvck9yaWdpbnNbMF07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVmZXJyZXIpIHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVUkwoZG9jdW1lbnQucmVmZXJyZXIpLm9yaWdpbjtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJJbnZhbGlkIHJlZmVycmVyIFVSTDpcIiwgZG9jdW1lbnQucmVmZXJyZXIpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHNhdmUpO1xuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgc2F2ZSk7XG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICBjb25zdCBwYXJlbnRPcmlnaW4gPSBnZXRQYXJlbnRPcmlnaW4oKTtcblxuICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YT8udHlwZSA9PT0gXCJyZWRpcmVjdC1ob21lXCIgJiYgcGFyZW50T3JpZ2luICYmIEFMTE9XRURfUEFSRU5UX09SSUdJTlMuaW5jbHVkZXMocGFyZW50T3JpZ2luKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTVE9SQUdFX0tFWSk7XG5cbiAgICAgICAgICAgICAgICBpZihzYXZlZCAmJiBzYXZlZCAhPT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICByZXBsYWNlSGlzdG9yeVN0YXRlKCcvJylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJlc3RvcmUoKTtcbiAgICAgICAgfVxuICAgICAgYDtcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHRhZzogJ3NjcmlwdCcsXG4gICAgICAgICAgYXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcbiAgICAgICAgICBjaGlsZHJlbjogc2NyaXB0LFxuICAgICAgICAgIGluamVjdFRvOiAnaGVhZCdcbiAgICAgICAgfVxuICAgICAgXTtcbiAgICB9XG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyZWRkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcQ0VOVEVSUyAyLjVcXFxcU09MSUZPT0QgQ0VOVEVSIDIuMFxcXFxwbHVnaW5zXFxcXHNlbGVjdGlvbi1tb2RlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxmcmVkZFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXENFTlRFUlMgMi41XFxcXFNPTElGT09EIENFTlRFUiAyLjBcXFxccGx1Z2luc1xcXFxzZWxlY3Rpb24tbW9kZVxcXFx2aXRlLXBsdWdpbi1zZWxlY3Rpb24tbW9kZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJlZGQvT25lRHJpdmUvRGVza3RvcC9DRU5URVJTJTIwMi41L1NPTElGT09EJTIwQ0VOVEVSJTIwMi4wL3BsdWdpbnMvc2VsZWN0aW9uLW1vZGUvdml0ZS1wbHVnaW4tc2VsZWN0aW9uLW1vZGUuanNcIjtpbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHJlc29sdmUoX19maWxlbmFtZSwgJy4uJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNlbGVjdGlvbk1vZGVQbHVnaW4oKSB7XG5cdHJldHVybiB7XG5cdFx0bmFtZTogJ3ZpdGU6c2VsZWN0aW9uLW1vZGUnLFxuXHRcdGFwcGx5OiAnc2VydmUnLFxuXG5cdFx0dHJhbnNmb3JtSW5kZXhIdG1sKCkge1xuXHRcdFx0Y29uc3Qgc2NyaXB0UGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnc2VsZWN0aW9uLW1vZGUtc2NyaXB0LmpzJyk7XG5cdFx0XHRjb25zdCBzY3JpcHRDb250ZW50ID0gcmVhZEZpbGVTeW5jKHNjcmlwdFBhdGgsICd1dGYtOCcpO1xuXG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0XHRhdHRyczogeyB0eXBlOiAnbW9kdWxlJyB9LFxuXHRcdFx0XHRcdGNoaWxkcmVuOiBzY3JpcHRDb250ZW50LFxuXHRcdFx0XHRcdGluamVjdFRvOiAnYm9keScsXG5cdFx0XHRc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QUFBQSxJQUNuRCxPQUFPO0FBQUEsTUFDTixLQUFLQyxNQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3JDO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiLCAicGF0aCIsICJwYXJzZSIsICJ0cmF2ZXJzZUJhYmVsIiwgImZzIiwgIl9fZGlybmFtZSIsICJwYXRoIiwgInBhdGgiLCAicGFyc2UiLCAidHJhdmVyc2VCYWJlbCIsICJmcyIsICJmaWxlVVJMVG9QYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiX19maWxlbmFtZSIsICJmaWxlVVJMVG9QYXRoIiwgIl9fZGlybmFtZSIsICJyZWFkRmlsZVN5bmMiLCAicmVzb2x2ZSIsICJmaWxlVVJMVG9QYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiX19maWxlbmFtZSIsICJmaWxlVVJMVG9QYXRoIiwgIl9fZGlybmFtZSIsICJyZXNvbHZlIiwgInJlYWRGaWxlU3luYyIsICJwYXRoIl0KfQo=
