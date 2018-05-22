/**
 * Convenient wrapper for the jsonschema library with Supertest integration
 */
import { AssertionError } from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as jsonschema from 'jsonschema';
import * as supertest from 'supertest';

export const validator = new jsonschema.Validator();

export function validate(instance: any, uri: string): jsonschema.ValidatorResult {
  const schema = validator.schemas[uri];
  if (schema) {
    return validator.validate(instance, schema);
  }
  validator.unresolvedRefs.unshift(uri);
  while (validator.unresolvedRefs.length > 0) {
    const ref = validator.unresolvedRefs.shift();
    if (ref) {
      const name = ref.replace('/', path.sep) + '.json';
      const schemaPath = path.join(__dirname, '..', '..', '..', 'public', 'schema', name);
      const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'UTF-8'));
      validator.addSchema(schemaData as jsonschema.Schema, ref);
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
