export const browserOnly=import.meta.env?.MODE==='pages';
export const assetBase=import.meta.env?.BASE_URL||'/';
export function assetURL(url:string,base=assetBase){return url.startsWith('/')&&!url.startsWith('//')?base+url.slice(1):url;}
export function pageURL(path:string,hosted=browserOnly,base=assetBase){return hosted?base+'#'+path:path;}
export function currentPath(){return browserOnly?(window.location.hash.startsWith('#/')?window.location.hash.slice(1):'/'):window.location.pathname;}
