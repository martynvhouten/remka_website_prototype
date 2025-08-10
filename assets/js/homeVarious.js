(function(){
  function slugify(s){
    return String(s||'').toLowerCase().normalize('NFD').replace(/[^\p{Letter}\p{Number}]+/gu,'-').replace(/(^-|-$)/g,'');
  }
  function byTag(tag){
    try { return (window.RemkaVarious||[]).filter(i => Array.isArray(i.tagSlugs) && i.tagSlugs.includes(tag)); } catch { return []; }
  }
  function enhanceHomeCategories(){
    try {
      const section = Array.from(document.querySelectorAll('section')).find(s => s.querySelector('.section-title')?.textContent?.includes('Categorieën'));
      const grid = section ? section.querySelector('div.grid') : null; if(!grid) return;
      const cards = grid.querySelectorAll('a.card');
      cards.forEach((card) => {
        const labelEl = card.querySelector('span.font-medium');
        const label = (labelEl && labelEl.textContent) ? labelEl.textContent.trim() : '';
        const tag = slugify(label);
        const pool = byTag(tag);
        const img = card.querySelector('img');
        const pick = pool[0] || (window.RemkaVarious||[])[0];
        if(img && pick && pick.src){ img.src = pick.src; img.alt = pick.alt || label || 'Categorie'; }
      });
    } catch {}
  }

  document.addEventListener('various:ready', enhanceHomeCategories);
})();


