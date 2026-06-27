fetch("https://api.github.com/repos/NikhilGoral28/SwasthPath/git/trees/main?recursive=1").then(r=>r.json()).then(d=>{
  if (d.tree) {
    console.log(d.tree.filter(f=>f.type==='blob' && f.path.startsWith('lib/')).map(f=>f.path).join('\n'))
  } else {
    console.log(d)
  }
});
