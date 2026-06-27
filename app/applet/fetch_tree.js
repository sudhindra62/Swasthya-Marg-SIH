fetch('https://api.github.com/repos/NikhilGoral28/SwasthPath/git/trees/main?recursive=1').then(r=>r.json()).then(j=>console.log(j.tree.filter(t=>t.type==='blob').map(t=>t.path).join('\n')));
