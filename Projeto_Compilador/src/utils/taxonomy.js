/**
 * In‐memory taxonomy tree.
 * Starts empty, and new tag‐paths will be added as resources arrive.
 *
 * Example structure after adding "Atividades/Desporto/Corrida" and "Pessoal/Fotografia":
 * {
 *   Atividades: {
 *     Desporto: {
 *       Corrida: {}
 *     }
 *   },
 *   Pessoal: {
 *     Fotografia: {}
 *   }
 * }
 */
const hierarchy = {};

/**
 * Add a single slash‐delimited tag path into the hierarchy.
 *
 * @param {string} pathString  e.g. "Atividades/Desporto/Corrida"
 */
function addTagPath(pathString) {
  if (typeof pathString !== "string" || !pathString.trim()) return;

  const levels = pathString
    .split("/")
    .map((level) => level.trim())
    .filter(Boolean);
  let current = hierarchy;

  for (const level of levels) {
    if (!current[level]) {
      // Create a new branch if it doesn't exist
      current[level] = {};
    }
    current = current[level];
  }
}

/**
 * Given a resource object (with metadata.tags = [ "Foo/Bar", ... ]),
 * register all its tags into the hierarchy.
 *
 * @param {Object} resource
 * @param {string[]} resource.metadata.tags
 */
function registerResourceTags(resource) {
  if (!resource || !resource.metadata || !Array.isArray(resource.metadata.tags))
    return;
  for (const tagPath of resource.metadata.tags) {
    addTagPath(tagPath);
  }
}

/**
 * Recursively flatten the hierarchy into an array of full tag paths.
 *
 * If no node is provided, we default to the global `hierarchy`.
 *
 * Example: given
 * {
 *   Pessoal: { Fotografia: {} },
 *   Atividades: { Desporto: { Corrida: {} } }
 * }
 * returns [ "Pessoal", "Pessoal/Fotografia", "Atividades", "Atividades/Desporto", "Atividades/Desporto/Corrida" ]
 *
 * @param {Object} node      A subtree of the hierarchy (default: full hierarchy)
 * @param {string} prefix    The prefix path built so far (default: "")
 * @returns {string[]}       Flat list of all paths
 */
function getFlatTags(node = hierarchy, prefix = "") {
  return Object.entries(node).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}/${key}` : key;
    // If `child` has its own children, include them recursively
    const hasChildren =
      child && typeof child === "object" && Object.keys(child).length > 0;
    if (hasChildren) {
      return [path, ...getFlatTags(child, path)];
    } else {
      return [path];
    }
  });
}

/**
 * Optional utility: rebuild the entire in‐memory hierarchy
 * from a list of resources (e.g. on server startup or periodic sync).
 * This clears the current hierarchy and repopulates it from scratch.
 *
 * @param {Array<Object>} resources   Each resource must have metadata.tags = [ ... ]
 */
function rebuildHierarchyFromResources(resources) {
  // Clear out the old hierarchy
  Object.keys(hierarchy).forEach((k) => delete hierarchy[k]);
  // Add each resource’s tags
  if (Array.isArray(resources)) {
    for (const r of resources) {
      registerResourceTags(r);
    }
  }
}

/**
 * Adiciona (sem apagar nada) as tags de cada recurso.
 * Recursos antigos permanecem; só entram novos ramos se ainda não existirem.
 */
function updateHierarchyWithResources(resources) {
  if (!Array.isArray(resources)) return;
  for (const r of resources) {
    registerResourceTags(r);
  }
}

module.exports = {
  hierarchy,
  addTagPath,
  registerResourceTags,
  rebuildHierarchyFromResources,
  updateHierarchyWithResources,
  getFlatTags,
};
