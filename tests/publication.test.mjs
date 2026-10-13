import test from 'node:test';
import assert from 'node:assert/strict';
import {publicText} from '../scripts/publication.mjs';

test('publication preserves SCIM routes and code delimiters while removing home-directory provenance',()=>{
  const scim='`PUT /Users/{id}` and `/Users/{id}/Groups`; `GET /Users`.';
  assert.equal(publicText(scim),scim);
  const localPath=['','Users','alice','Desktop','service','main.go'].join('/');
  assert.equal(publicText(`Build path \`${localPath}\`.`),'Build path `[LOCAL_PATH]`.');
  assert.equal(publicText('Use `/tmp/example.json` in the operator command.'),'Use `/tmp/example.json` in the operator command.');
  assert.equal(publicText('Evidence `/tmp/pa-run/result.json`.',{temporaryPaths:true}),'Evidence `[TEMP_PATH]`.');
});
