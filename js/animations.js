document.querySelectorAll('.nav-bar a').forEach(link => {
  link.addEventListener('mousemove', function(e) {
    const rect = link.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    link.style.backgroundPosition = `${100 - percent}% 0`;
  });
  link.addEventListener('mouseleave', function() {
    link.style.backgroundPosition = `100% 0`;
  });
});