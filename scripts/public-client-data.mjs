import {parse} from 'acorn';

// Kizárólag szintaktikus literálok: a letöltött kliensből semmit nem futtatunk.
const unknown=Symbol('non-literal');
function literal(node,env){
  if(!node)return unknown;
  if(node.type==='Literal')return node.regex||typeof node.value==='bigint'?unknown:node.value;
  if(node.type==='Identifier')return env.has(node.name)?env.get(node.name):unknown;
  if(node.type==='CallExpression'&&node.arguments.length===1&&node.callee.type==='MemberExpression'&&!node.callee.computed&&node.callee.object.name==='JSON'&&node.callee.property.name==='parse'&&node.arguments[0].type==='Literal'&&typeof node.arguments[0].value==='string'){
    try{return JSON.parse(node.arguments[0].value,(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))throw Error('Tiltott JSON-kulcs');return value;});}catch{return unknown;}
  }
  if(node.type==='UnaryExpression'){
    const value=literal(node.argument,env);if(value===unknown)return unknown;
    if(node.operator==='!'&&['number','boolean'].includes(typeof value))return !value;
    if(node.operator==='-'&&typeof value==='number')return -value;
    if(node.operator==='+'&&typeof value==='number')return value;
    return unknown;
  }
  if(node.type==='BinaryExpression'){
    const a=literal(node.left,env),b=literal(node.right,env);if(typeof a!=='number'||typeof b!=='number')return unknown;
    const value=node.operator==='+'?a+b:node.operator==='-'?a-b:node.operator==='*'?a*b:node.operator==='/'?a/b:NaN;
    return Number.isFinite(value)?value:unknown;
  }
  if(node.type==='ArrayExpression'){
    const values=node.elements.map(x=>literal(x,env));return values.includes(unknown)?unknown:values;
  }
  if(node.type==='ObjectExpression'){
    const out={};
    for(const prop of node.properties){
      if(prop.type!=='Property'||prop.kind!=='init'||prop.method)return unknown;
      const key=prop.computed?literal(prop.key,env):prop.key.name??prop.key.value;
      const value=literal(prop.value,env);
      if(!['string','number'].includes(typeof key)||['__proto__','constructor','prototype'].includes(String(key))||value===unknown)return unknown;
      out[key]=value;
    }
    return out;
  }
  return unknown;
}
export function staticModule(text){
  const ast=parse(text,{ecmaVersion:'latest',sourceType:'module'}),env=new Map(),exports={};
  for(const statement of ast.body){
    const declaration=statement.type==='ExportNamedDeclaration'?statement.declaration:statement;
    if(declaration?.type==='VariableDeclaration'&&declaration.kind==='const')for(const entry of declaration.declarations){
      if(entry.id.type!=='Identifier')continue;
      const value=literal(entry.init,env);if(value!==unknown)env.set(entry.id.name,value);
    }
    if(statement.type==='ExportDefaultDeclaration'){
      const value=literal(statement.declaration,env);if(value!==unknown)exports.default=value;
    }
    if(statement.type==='ExportNamedDeclaration')for(const spec of statement.specifiers){if(env.has(spec.local.name))exports[spec.exported.name??spec.exported.value]=env.get(spec.local.name);}
  }
  const namespaces={};
  function walk(node){
    if(!node||typeof node!=='object')return;
    if(node.type==='Property'&&!node.computed){
      const key=node.key?.value??node.key?.name,match=typeof key==='string'?key.match(/^\.\/([a-z0-9_-]+)\.hu\.json$/):null;
      if(match){const value=literal(node.value,env);if(value!==unknown)namespaces[match[1]]=value;}
    }
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);
  }
  walk(ast);
  return {values:Object.fromEntries(env),exports,namespaces};
}
export function clientReferences(text,base){
  const urls=new Set();
  for(const match of text.matchAll(/["']((?:assets\/|\.\/)[A-Za-z0-9_./-]+\.js)["']/g)){
    const url=new URL(match[1],match[1].startsWith('assets/')?'https://stonestorm.gg/':base);
    if(url.origin==='https://stonestorm.gg'&&url.pathname.startsWith('/assets/'))urls.add(url.href);
  }
  return [...urls];
}
