// RedCore — home page: draws the desk illustrations in the "new categories" banner
(() => {
  const CFG = window.RC_DESK;
  if (!CFG || !window.RCDeskPreview) return;
  const desk = document.querySelector('[data-home-art="desk"]');
  const pc = document.querySelector('[data-home-art="pc"]');
  if (desk) desk.innerHTML = window.RCDeskPreview.thumb({ width: 160, depth: 75, arm: 120, height: 'fixed', shape: 'curve', material: 'wood', top: 'oak', legs: 'black', extras: ['rgb', 'shelf', 'mat', 'charger'] });
  const pathDesk = document.querySelector('[data-home-art="path-desk"]');
  if (pathDesk) pathDesk.innerHTML = window.RCDeskPreview.thumb({ width: 150, depth: 70, arm: 110, height: 'fixed', shape: 'corner', material: 'wood', top: 'oak', legs: 'black', extras: ['rgb', 'mat'] });
  const g = CFG.pcDesk.models[1];
  if (pc) pc.innerHTML = window.RCDeskPreview.thumb({ arm: 120, ...g.desk }, { pc: true, lighting: g.lighting });
})();
