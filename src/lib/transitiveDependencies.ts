import { DependencyNode } from '../types.js';

export interface TransitiveDependency {
  name: string;
  version: string | null;
  dev: boolean;
  path: string[];
}

const flattenTree = (
  tree: DependencyNode,
  depth: number | undefined,
  path: string[],
  checked: Set<string>,
): TransitiveDependency[] => {
  const treeDeps = tree?.dependencies ?? {};

  if (depth === 0) {
    return [];
  }

  return Object.entries(treeDeps).flatMap(([name, node]) => {
    if (checked.has(name)) {
      return [];
    }
    checked.add(name);

    const currentPath = [...path, name];

    const current = {
      name,
      version: node?.version ?? null,
      dev: !!node?.dev,
      path: currentPath,
    };

    const children = flattenTree(
      node,
      depth !== undefined ? depth - 1 : undefined,
      currentPath,
      checked,
    );

    return [current, ...children];
  });
};

export const transitiveDependencies = (
  tree: DependencyNode,
  depth?: number,
): TransitiveDependency[] => {
  return flattenTree(tree, depth, [], new Set<string>());
};
