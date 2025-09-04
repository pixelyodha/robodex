// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBNaxvvv_w3DimTJHIbLWRNpGyZDR9ET70",
  authDomain: "robodex-4f848.firebaseapp.com",
  projectId: "robodex-4f848",
  storageBucket: "robodex-4f848.firebasestorage.app",
  messagingSenderId: "28240235204",
  appId: "1:28240235204:web:2e7c3cdbb59dd6aa139791",
  measurementId: "G-BRWP89KCJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const galleryGrid = document.querySelector(".gallery-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxCaption = document.querySelector(".lightbox-caption");
const closeLightbox = document.querySelector(".close-lightbox");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");

// Gallery items array and current index for lightbox navigation
let galleryItems = [];
let currentIndex = 0;

// Fetch gallery items from Firebase
async function fetchGalleryItems() {
  try {
    const querySnapshot = await getDocs(collection(db, "gallery"));
    
    if (querySnapshot.empty) {
      console.log("No gallery items found in the database.");
      // Add sample gallery items if no data exists
      addSampleGalleryItems();
      return;
    }
    
    let index = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      galleryItems.push(data);
      createGalleryItem(data, index++);
    });
    
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    // Add sample gallery items if there's an error
    addSampleGalleryItems();
  }
}

// Create gallery item
function createGalleryItem(item, index) {
  const galleryItem = document.createElement("div");
  galleryItem.className = "gallery-item";
  galleryItem.dataset.category = item.category || "all";
  galleryItem.dataset.index = index;
  galleryItem.dataset.type = item.mediaType || "image";
  
  if (item.mediaType === "video") {
    // Video item
    galleryItem.innerHTML = `
      <div class="video-thumbnail">
        ${getVideoPlatformIcon(item.videoPlatform)}
        <img src="${getVideoThumbnail(item.videoId, item.videoPlatform)}" alt="${item.title}">
        <div class="play-button"></div>
      </div>
      <div class="gallery-caption">
        <div>${item.title}</div>
        <div class="gallery-date">${item.date}</div>
      </div>
    `;
  } else {
    // Image item (default)
    galleryItem.innerHTML = `
      <img src="${item.imageURL}" alt="${item.title}">
      <div class="gallery-caption">
        <div>${item.title}</div>
        <div class="gallery-date">${item.date}</div>
      </div>
    `;
  }
  
  galleryItem.addEventListener("click", () => {
    openLightbox(index);
  });
  
  galleryGrid.appendChild(galleryItem);
}

// Get video thumbnail from platform and ID
function getVideoThumbnail(videoId, platform) {
  if (platform === 'youtube') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  } else if (platform === 'vimeo') {
    // Vimeo doesn't have an easy thumbnail URL format,
    // so we'll use a placeholder
    return 'https://via.placeholder.com/640x360/0048FF/FFFFFF?text=Vimeo+Video';
  }
  return 'https://via.placeholder.com/640x360/0048FF/FFFFFF?text=Video';
}

// Get platform icon
function getVideoPlatformIcon(platform) {
  if (platform === 'youtube') {
    return '<div class="platform-icon youtube-icon"></div>';
  } else if (platform === 'vimeo') {
    return '<div class="platform-icon vimeo-icon"></div>';
  }
  return '';
}

// Add sample gallery items if no data exists
function addSampleGalleryItems() {
  const sampleItems = [
    {
      title: "Annual Robotics Competition",
      date: "May 2025",
      imageURL: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&auto=format&fit=crop",
      category: "competitions",
      mediaType: "image",
      description: "Students showcasing their robots in the annual competition."
    },
    {
      title: "Arduino Workshop Video",
      date: "February 2025",
      videoURL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
      videoPlatform: "youtube",
      category: "workshops",
      mediaType: "video",
      description: "A tutorial on Arduino programming basics."
    },
    {
      title: "Line Following Robot",
      date: "November 2024",
      imageURL: "https://images.unsplash.com/photo-1535378273068-9bb67d5b37a4?w=800&auto=format&fit=crop",
      category: "projects",
      mediaType: "image",
      description: "Our team's line following robot in action."
    }
  ];
  
  galleryItems = sampleItems;
  
  sampleItems.forEach((item, index) => {
    createGalleryItem(item, index);
  });
}

// Filter gallery items
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    
    const filterValue = button.getAttribute("data-filter");
    
    // Filter the items
    const items = document.querySelectorAll(".gallery-item");
    items.forEach(item => {
      if (filterValue === "all" || item.dataset.category === filterValue) {
        item.style.display = "block";
        // Add a small animation
        setTimeout(() => {
          item.style.transform = "scale(1)";
          item.style.opacity = "1";
        }, 50);
      } else {
        item.style.transform = "scale(0.8)";
        item.style.opacity = "0";
        setTimeout(() => {
          item.style.display = "none";
        }, 300);
      }
    });
  });
});

// Lightbox functions
function openLightbox(index) {
  currentIndex = index;
  const item = galleryItems[index];
  
  // Reset lightbox content
  lightboxImg.style.display = "none";
  lightboxVideo.style.display = "none";
  lightboxVideo.innerHTML = "";
  
  if (item.mediaType === "video") {
    // Video content
    if (item.videoPlatform === "youtube") {
      lightboxVideo.innerHTML = `
        <iframe width="100%" height="100%" 
          src="https://www.youtube.com/embed/${item.videoId}?autoplay=1" 
          title="${item.title}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    } else if (item.videoPlatform === "vimeo") {
      lightboxVideo.innerHTML = `
        <iframe width="100%" height="100%" 
          src="https://player.vimeo.com/video/${item.videoId}?autoplay=1" 
          title="${item.title}" 
          frameborder="0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    }
    lightboxVideo.style.display = "block";
  } else {
    // Image content
    lightboxImg.src = item.imageURL;
    lightboxImg.style.display = "block";
  }
  
  lightboxCaption.innerHTML = `
    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${item.title}</div>
    <div style="color: var(--hover-text-color);">${item.date}</div>
    ${item.description ? `<div style="margin-top: 0.5rem;">${item.description}</div>` : ''}
  `;
  
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent scrolling when lightbox is open
  
  // Update navigation buttons visibility
  updateNavButtons();
}

function closeLightboxHandler() {
  lightbox.classList.remove("active");
  document.body.style.overflow = ""; // Re-enable scrolling
  
  // Stop videos when closing lightbox
  lightboxVideo.innerHTML = "";
}

function navigateGallery(direction) {
  currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
  openLightbox(currentIndex);
}

function updateNavButtons() {
  // Always show both buttons for circular navigation
  prevBtn.style.display = "flex";
  nextBtn.style.display = "flex";
}

// Event Listeners
closeLightbox.addEventListener("click", closeLightboxHandler);
prevBtn.addEventListener("click", () => navigateGallery(-1));
nextBtn.addEventListener("click", () => navigateGallery(1));

// Close lightbox with escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("active")) {
    closeLightboxHandler();
  } else if (e.key === "ArrowLeft" && lightbox.classList.contains("active")) {
    navigateGallery(-1);
  } else if (e.key === "ArrowRight" && lightbox.classList.contains("active")) {
    navigateGallery(1);
  }
});

// Click outside to close
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    closeLightboxHandler();
  }
});

// Initialize
fetchGalleryItems();