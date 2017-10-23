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
  let schema = validator.schemas[uri];
  if (schema) {
    return validator.validate(instance, schema);
  }
  validator.unresolvedRefs.unshift(uri);
  while (validator.unresolvedRefs.length > 0) {
    let ref = validator.unresolvedRefs.shift();
    if (ref) {
      let name = ref.replace('/', path.sep) + '.json';
      let schemaPath = path.join(__dirname, '..', '..', '..', 'public', 'schema', name);
      let schemaData = JSON.parse(fs.readFileSync(schemaPath, 'UTF-8'));
      validator.addSchema(<jsonschema.Schema> schemaData, ref);
    }
  }
  return validator.validate(instance, validator.schemas[uri]);
};


export function checkValid(name: string): (res: supertest.Response) => void {
  return (res) => {
    let result = validate(res.body, name);
    for (let error of result.errors) {
      let msg = 'Schema validation failed: ' + error.toString();
      throw new AssertionError({ message: msg });
    }
  };
};
