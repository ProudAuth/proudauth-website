// Preserve protocol paths such as /Users/{id}; redact filesystem provenance only.
export function publicText(text,{temporaryPaths=false}={}){
  const sanitized=text.replace(/\/Users\/[A-Za-z0-9_.-]+\/[^\s"'<>`]+/g,'[LOCAL_PATH]');
  return temporaryPaths?sanitized.replace(/\/tmp\/[^\s"'<>`]+/g,'[TEMP_PATH]'):sanitized;
}
