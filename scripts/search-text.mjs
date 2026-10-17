import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {marked}=require('../vendor/marked.cjs');

// marked escapes inline text for HTML; the search index stores plain text.
const unescapeHtml=text=>text.replace(/&(?:amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[entity]));

// Walk every token, not only the top-level ones: table and list tokens have no
// `.text`, so their cells and items are reached through their children. Inline
// children join without a separator (marked splits `A\_B` into three tokens);
// block children are separated by a space.
function plainText(tokens,separator=' '){
  return tokens.map(token=>{
    if(token.type==='table')return [...token.header,...token.rows.flat()].map(cell=>plainText(cell.tokens,'')).join(' ');
    if(token.type==='list')return token.items.map(item=>plainText(item.tokens)).join(' ');
    if(token.tokens)return plainText(token.tokens,token.type==='blockquote'?' ':'');
    if(token.type==='code'||token.type==='html')return token.text; // raw source text
    return token.type==='br'?' ':unescapeHtml(token.text||'');
  }).join(separator);
}

// The words a reader sees on a rendered Markdown page, for docs/search-index.json.
export function searchText(markdown){
  return plainText(marked.lexer(markdown,{gfm:true})).replace(/\s+/g,' ').trim();
}
