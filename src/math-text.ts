// Currency symbols must stay literal, including between two amounts.
export function splitMath(text:string){return text.split(/((?<!R)\$\$[\s\S]*?\$\$|(?<!R)\$[^$\n]+(?<!R)\$)/g);}
