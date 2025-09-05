// Import your Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase config
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

// Reference to members container
const membersContainer = document.querySelector(".members-grid");

// Define role priority order
const rolePriority = {
    "president": 1,
    "vice president": 2,
    "secretary": 3,
    "joint secretary": 4,
    "operation head": 5,
    "tech head": 6,
    "senior member": 7
};

async function fetchMembers() {
    const membersSnapshot = await getDocs(collection(db, "members"));
    const members = [];

    membersSnapshot.forEach(doc => {
        members.push({ id: doc.id, ...doc.data() });
    });

    // Group members by role
    const membersByRole = {};
    
    members.forEach(member => {
        const role = member.role ? member.role.toLowerCase() : "other";
        if (!membersByRole[role]) {
            membersByRole[role] = [];
        }
        membersByRole[role].push(member);
    });

    // Render members in the specified order
    let cardIndex = 0;

    // Helper function to render a group of members with the same role
    const renderRoleGroup = (role) => {
        if (membersByRole[role]) {
            membersByRole[role].forEach(member => {
                const isPresident = role === "president";
                const card = createMemberCard(member, isPresident, cardIndex++);
                membersContainer.appendChild(card);
            });
        }
    };

    // Render in the specified order
    renderRoleGroup("president");
    renderRoleGroup("vice president");
    renderRoleGroup("secretary");
    renderRoleGroup("joint secretary");
    renderRoleGroup("operation head");
    renderRoleGroup("tech head");
    renderRoleGroup("senior member");
    
    // Render any other roles that might exist
    Object.keys(membersByRole).forEach(role => {
        if (!rolePriority[role]) {
            renderRoleGroup(role);
        }
    });
}

function createMemberCard(member, isPresident, index) {
    const card = document.createElement("div");
    card.className = isPresident ? "member-card prez" : "member-card";
    card.style.backgroundImage = `url(${member.imageURL})`;
    card.dataset.index = index;
    
    // Add member info to the card
    const memberInfo = document.createElement("div");
    memberInfo.className = "member-info";
    
    const name = document.createElement("div");
    name.textContent = member.name || "Member";
    
    const role = document.createElement("div");
    role.className = "role";
    role.textContent = member.role || "";
    
    memberInfo.appendChild(name);
    memberInfo.appendChild(role);
    card.appendChild(memberInfo);
    
    return card;
}

// Run fetch on load
fetchMembers();

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.navbar ul');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.navbar ul a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
});
