/**
 * Convenient wrapper for the jsonschema library with Supertest integration
 */
import { AssertionError } from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as jsonschema from 'jsonschema';
import * as supertest from 'supertest';

export const validator = new jsonschema.Validator();

const cache = new Map<string, jsonschema.Schema>();


export function validate(instance: any, name: string): jsonschema.ValidatorResult {
  let cachedSchema = cache.get(name);
  if (cachedSchema) {
    return validator.validate(instance, cachedSchema);
  }
  let schemaPath = path.resolve(__dirname, '..', 'jsonschema', name + '.json');
  let schema = <jsonschema.Schema> JSON.parse(fs.readFileSync(schemaPath, 'UTF-8'));
  cache.set(name, schema);
  return validator.validate(instance, schema);
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
