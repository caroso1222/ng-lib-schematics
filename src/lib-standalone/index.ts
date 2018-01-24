import {
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { Schema as LibraryOptions } from './schema';


export default function LibStandalone(options: LibraryOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return tree;
  };
}
