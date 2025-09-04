// Loading animation and content reveal
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.getElementById('main-content');
  const centerContent = document.querySelector('.center-content');
  const navItems = document.querySelectorAll('.navbar li');

  // Delay for loading screen
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');

    setTimeout(() => {
      loadingScreen.style.display = 'none';
      mainContent.classList.remove('hidden');
      mainContent.classList.add('fade-in');

      // Animate nav items
      navItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, index * 200);
      });

      // Animate center content
      setTimeout(() => {
        centerContent.style.opacity = '1';
        centerContent.style.transform = 'translateY(0)';
      }, navItems.length * 200);

    }, 1000);
  }, 4000);
});

// Initial styles for animation
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.navbar li');
  const centerContent = document.querySelector('.center-content');

  navItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(-20px)';
    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  centerContent.style.opacity = '0';
  centerContent.style.transform = 'translateY(20px)';
  centerContent.style.transition = 'opacity 1s ease, transform 1s ease';
});

// Optional parallax effect on mousemove
document.addEventListener('mousemove', (e) => {
  const centerContent = document.querySelector('.center-content');
  const { clientX, clientY } = e;
  const { innerWidth, innerHeight } = window;

  const xOffset = (clientX - innerWidth / 2) / innerWidth * 20;
  const yOffset = (clientY - innerHeight / 2) / innerHeight * 20;

  centerContent.style.transform = `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px))`;
});
