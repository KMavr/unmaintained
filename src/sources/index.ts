import { Sources } from '../types.js';
import { fetchNpmPackage } from './npmRegistry.js';

export const defaultSources: Sources = {
  fetchPackage: fetchNpmPackage,
};
