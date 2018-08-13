/**
 * Convenient wrapper for the jsonschema library with Supertest integration
 */
import { AssertionError } from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import * as jsonschema from 'jsonschema';
import * as supertest from 'supertest';

const schemaBasePath = path.resolve(__dirname, '..', '..', '..', 'public', 'schema');

export const validator = new jsonschema.Validator();

export function validate(instance: any, uri: string): jsonschema.ValidatorResult {
  let schema = validator.schemas[uri];
  if (schema) {
    return validator.validate(instance, schema);
  }
  validator.unresolvedRefs.unshift(uri);
  while (validator.unresolvedRefs.length > 0) {
    const ref = validator.unresolvedRefs.shift();
    if (ref) {
      let pathname = url.parse(ref).pathname;
      if (!pathname) {
        throw new Error(`Path name missing for schema ref: ${ref}`);
      }
      if (!pathname.endsWith('.json')) {
        pathname += '.json';
      }
      const schemaPath = path.resolve(schemaBasePath, ...pathname.split('/'));
      const schemaData = fs.readFileSync(schemaPath, 'UTF-8');
      schema = JSON.parse(schemaData);
      validator.addSchema(schema, ref);
    }
  }
  return validator.validate(instance, validator.schemas[uri]);
}


export function checkValid(name: string): (res: supertest.Response) => void {
  return (res) => {
    const result = validate(res.body, name);
    for (const error of result.errors) {
      const msg = 'Schema validation failed: ' + error.toString();
      throw new AssertionError({ message: msg });
    }
  };
}
