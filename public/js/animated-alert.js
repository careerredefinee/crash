// Show animated ATM card-style success alert with tick and cracker/firework burst
function showAnimatedSuccessAlert(message = 'Successfully sent') {
  // Remove existing alert if present
  const existing = document.querySelector('.animated-success-alert');
  if (existing) existing.remove();

  // Create alert box
  const alert = document.createElement('div');
  alert.className = 'animated-success-alert';
  alert.innerHTML = `
    <div class="card-glow"></div>
    <div class="confetti"></div>
    <span class="checkmark">
      <svg width="160" height="160" style="display:block;">
        <circle class="circle" cx="80" cy="80" r="70" fill="#fff" stroke="#38d996" stroke-width="10"/>
        <polyline class="tick" points="52,94 78,122 120,62" fill="none" stroke="#38d996" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#tickShadow)"/>
        <defs>
          <filter id="tickShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#1e824c" flood-opacity="0.18"/>
          </filter>
        </defs>
      </svg>
    </span>
    <div class="alert-msg" style="font-size:2.1rem; color:#267a4e; margin-top:20px;">${message}</div>
  `;
  document.body.appendChild(alert);

  // Add cracker/firework burst
  const colors = ["#38d996","#f7c873","#f76c6c","#5c8df6","#ffb6e6","#fffae6","#fff","#e6ffed","#d1e7dd","#c3aaff"];
  const confetti = alert.querySelector('.confetti');
  const burstCount = 18;
  for (let i=0; i<burstCount; i++) {
    const angle = (2 * Math.PI * i) / burstCount;
    // Main firework line
    const line = document.createElement('span');
    line.style.position = 'absolute';
    line.style.left = '50%';
    line.style.top = '50%';
    line.style.width = '6px';
    line.style.height = '60px';
    line.style.background = colors[i % colors.length];
    line.style.borderRadius = '4px';
    line.style.transform = `translate(-50%,-50%) rotate(${angle * 180 / Math.PI}deg) scaleY(0.3)`;
    line.style.opacity = '0.95';
    line.style.pointerEvents = 'none';
    line.style.animation = `crackerBurstLine 1.4s ${0.05*i}s cubic-bezier(.5,1.6,.4,1.2) forwards`;
    confetti.appendChild(line);
    // Spark at end
    for (let j=0; j<4; j++) {
      const spark = document.createElement('span');
      spark.style.position = 'absolute';
      spark.style.left = '50%';
      spark.style.top = '50%';
      spark.style.width = 18 + Math.random()*10 + 'px';
      spark.style.height = 18 + Math.random()*10 + 'px';
      spark.style.background = colors[(i+j)%colors.length];
      spark.style.borderRadius = '50%';
      spark.style.opacity = '0.8';
      spark.style.pointerEvents = 'none';
      spark.style.animation = `crackerSpark 1.5s ${0.12*i+0.04*j}s cubic-bezier(.5,1.6,.4,1.2) forwards`;
      spark.style.transform = `translate(-50%,-50%) scale(0.5)`;
      // Spread end points
      const dist = 180 + Math.random()*60;
      const theta = angle + (Math.random()-0.5)*0.23;
      spark.dataset.tx = Math.cos(theta)*dist;
      spark.dataset.ty = Math.sin(theta)*dist;
      confetti.appendChild(spark);
    }
  }
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 900);
  }, 3200);

  // Animate sparks with JS for more natural movement
  setTimeout(() => {
    const sparks = confetti.querySelectorAll('span');
    sparks.forEach(spark => {
      if (spark.dataset.tx) {
        spark.animate([
          { transform: 'translate(-50%,-50%) scale(0.5)', opacity: 0.8 },
          { transform: `translate(calc(-50% + ${spark.dataset.tx}px), calc(-50% + ${spark.dataset.ty}px)) scale(1.2)`, opacity: 0.05 }
        ], {
          duration: 1400 + Math.random()*400,
          easing: 'cubic-bezier(.5,1.6,.4,1.2)',
          fill: 'forwards',
          delay: 0
        });
      }
    });
  }, 60);
}

// Keyframes for cracker/firework burst (inject into page if not present)
(function(){
  const styleId = 'animated-alert-burst-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes crackerBurstLine {
        0% { opacity: 0.95; transform: translate(-50%,-50%) scaleY(0.3); }
        60% { opacity: 1; transform: translate(-50%,-50%) scaleY(1.15); }
        100% { opacity: 0; transform: translate(-50%,-50%) scaleY(0.3) scale(1.6); }
      }
      @keyframes crackerSpark {
        0% { opacity: 0.8; transform: translate(-50%,-50%) scale(0.5); }
        60% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();

