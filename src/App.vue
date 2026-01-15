<script setup lang="ts">
import { ref, onMounted, computed, provide, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { STORAGE_KEYS } from "./utils/constants";

import { translations, type Language } from "./utils/translations";

// Types
type ThemeMode = "light" | "dark" | "system";
type LangMode = "ES" | "EN" | "system";

const router = useRouter();
const route = useRoute();

// State
const themeMode = ref<ThemeMode>("system");
const langMode = ref<LangMode>("system");
const showMobileMenu = ref(false);

// Auth State
const isAuthenticated = ref(localStorage.getItem("isAuthenticated") === "true");

// Listen for login event
window.addEventListener("auth-change", () => {
  isAuthenticated.value = localStorage.getItem("isAuthenticated") === "true";
});

function handleLogout() {
  localStorage.removeItem("isAuthenticated");
  isAuthenticated.value = false;
  router.push("/login");
}

// Translations imported from ./utils/translations

// System Detection
const systemThemeDark = window.matchMedia("(prefers-color-scheme: dark)");

// Computed Properties

function isLanguage(value: string): value is Language {
  return value === "ES" || value === "EN";
}

const effectiveLanguage = computed<Language>(() => {
  if (langMode.value === "system") {
    const browserLang = (
      navigator.language?.split("-")[0] ?? "EN"
    ).toUpperCase();
    return isLanguage(browserLang) ? browserLang : "EN";
  }

  return langMode.value;
});

const t = computed(() => {
  return translations[effectiveLanguage.value] ?? translations.EN;
});

// Provide translations to children
provide(
  "translations",
  computed(() => ({
    ...translations.EN,
    ...translations[effectiveLanguage.value],
  }))
);

// Update html lang attribute
watch(
  effectiveLanguage,
  (newLang: string) => {
    document.documentElement.lang = newLang.toLowerCase();
  },
  { immediate: true }
);

const navItems = computed(() => [
  { path: "/", label: t.value.dashboard, icon: "fas fa-chart-pie" },
  { path: "/needs", label: t.value.needs, icon: "fas fa-home" },
  { path: "/expenses", label: t.value.expenses, icon: "fas fa-shopping-bag" },
  { path: "/savings", label: t.value.savings, icon: "fas fa-piggy-bank" },
  { path: "/analytics", label: t.value.analytics, icon: "fas fa-chart-line" },
  { path: "/configuration", label: t.value.configuration, icon: "fas fa-cog" },
]);

const themeIcon = computed(() => {
  if (themeMode.value === "system") return "fas fa-desktop";
  return themeMode.value === "light" ? "fas fa-sun" : "fas fa-moon";
});

// Theme Logic
function applyTheme() {
  const isDark =
    themeMode.value === "dark" ||
    (themeMode.value === "system" && systemThemeDark.matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function toggleTheme() {
  const modes: ThemeMode[] = ["light", "dark", "system"];
  const currentIndex = modes.indexOf(themeMode.value);
  const nextMode = modes[(currentIndex + 1) % modes.length];
  if (nextMode) {
    themeMode.value = nextMode;
    localStorage.setItem(STORAGE_KEYS.THEME, themeMode.value);
    applyTheme();
  }
}

// Language Logic
function toggleLanguage() {
  const modes: LangMode[] = ["ES", "EN", "system"];
  const currentIndex = modes.indexOf(langMode.value);
  const nextMode = modes[(currentIndex + 1) % modes.length];
  if (nextMode) {
    langMode.value = nextMode;
    localStorage.setItem("finance_lang_mode", langMode.value);
  }
}

// Initialize
onMounted(() => {
  // Load Theme
  const savedTheme = localStorage.getItem(
    STORAGE_KEYS.THEME
  ) as ThemeMode | null;
  if (savedTheme) themeMode.value = savedTheme;

  // Load Language
  const savedLang = localStorage.getItem(
    "finance_lang_mode"
  ) as LangMode | null;
  if (savedLang) langMode.value = savedLang;

  // Initial Apply
  applyTheme();

  // Listen for system theme changes
  systemThemeDark.addEventListener("change", () => {
    if (themeMode.value === "system") applyTheme();
  });
});

function navigateTo(path: string) {
  router.push(path);
  showMobileMenu.value = false;
}

function isActive(path: string) {
  return route.path === path;
}

const user = {
  name: "Usuario",
  avatar:
    "https://ui-avatars.com/api/?name=Usuario&background=0D8ABC&color=fff",
};
</script>

<template>
  <div class="app-container">
    <a href="#main-content" class="skip-link">
      {{ t.a11y.skipToContent }}
    </a>

    <aside
      v-if="isAuthenticated"
      class="sidebar"
      :class="{ 'mobile-hidden': !showMobileMenu }"
      role="complementary"
      :aria-label="t.sidebar"
    >
      <div class="sidebar-header">
        <span class="brand-icon" aria-hidden="true">
          <i class="fas fa-wallet"></i>
        </span>
        <span class="brand-name">SwiftCash</span>
        <button
          class="close-sidebar-btn"
          @click="showMobileMenu = false"
          :aria-label="t.a11y.closeSidebar"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="sidebar-content">
        <nav class="nav-links" :aria-label="t.a11y.primaryNavigation">
          <button
            v-for="item in navItems"
            :key="item.path"
            class="nav-link"
            :class="{ active: isActive(item.path) }"
            @click="navigateTo(item.path)"
            :aria-current="isActive(item.path) ? 'page' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">
              <i :class="item.icon"></i>
            </span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <div class="sidebar-footer">
        <p class="copyright">© 2026 FinanceApp</p>
      </div>
    </aside>

    <!-- Main Wrapper -->
    <div class="main-wrapper" :class="{ 'full-width': !isAuthenticated }">
      <!-- Top Header -->
      <header v-if="isAuthenticated" class="top-header">
        <div class="header-left">
          <button
            class="mobile-menu-toggle"
            @click="showMobileMenu = true"
            :aria-label="t.a11y.openSidebar"
          >
            <i class="fas fa-bars" aria-hidden="true"></i>
          </button>
          <h2 class="current-page-title">
            {{
              route.path === "/"
                ? t.dashboard
                : route.path === "/needs"
                ? t.needs
                : route.path === "/expenses"
                ? t.expenses
                : route.path === "/savings"
                ? t.savings
                : route.path === "/analytics"
                ? t.analytics
                : route.path === "/configuration"
                ? t.configuration
                : "FinanceApp"
            }}
          </h2>
        </div>

        <div class="header-right">
          <!-- Theme Toggle -->
          <button
            class="icon-btn theme-toggle"
            @click="toggleTheme"
            :title="t.a11y.themeToggle"
            :aria-label="t.a11y.themeToggle"
          >
            <i :class="themeIcon" aria-hidden="true"></i>
            <span
              class="mode-badge"
              v-if="themeMode === 'system'"
              aria-hidden="true"
              >A</span
            >
          </button>

          <!-- Language Toggle -->
          <button
            class="icon-btn language-toggle"
            @click="toggleLanguage"
            :title="t.a11y.langToggle"
            :aria-label="t.a11y.langToggle"
          >
            <span class="lang-text" aria-hidden="true">{{
              langMode === "system" ? "SYS" : langMode
            }}</span>
          </button>

          <!-- Profile -->
          <div class="profile-section">
            <img
              :src="user.avatar"
              :alt="t.a11y.profileAvatar.replace('{name}', user.name)"
              class="profile-avatar border-2 border-primary"
            />
            <span class="profile-name">{{ user.name }}</span>
            <button
              class="icon-btn logout-btn"
              @click="handleLogout"
              :title="t.a11y.logout"
              :aria-label="t.a11y.logout"
            >
              <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main id="main-content" class="main-content" tabindex="-1">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: "Inter", sans-serif; /* Ensuring a nice font if imported, else fallback */
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-color);
  color: white;
  padding: 8px 16px;
  z-index: 2000;
  transition: top 0.2s;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 8px 0;
}

.skip-link:focus {
  top: 0;
}

/* Sidebar Styling */
.sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
}

.sidebar-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  font-size: 20px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.brand-icon {
  color: var(--primary-color);
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.3));
}

.close-sidebar-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  display: none; /* Only show on mobile */
}

.sidebar-content {
  flex: 1;
  padding: 24px 16px;
  overflow-y: auto;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  transform: translateX(4px);
}

.nav-link.active {
  background: rgba(16, 185, 129, 0.1);
  color: var(--primary-color);
  font-weight: 600;
}

.nav-icon {
  width: 24px;
  text-align: center;
  font-size: 16px;
}

.sidebar-footer {
  padding: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  border-top: 1px solid var(--border-color);
}

/* Main Wrapper Styling */
.main-wrapper {
  flex: 1;
  margin-left: 260px; /* Width of sidebar */
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.main-wrapper.full-width {
  margin-left: 0 !important;
}

/* Header Styling */
.top-header {
  height: 70px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 900;
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: none;
}

@media (min-width: 769px) {
  .current-page-title {
    display: block;
  }
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-primary);
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--button-bg, transparent);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  position: relative; /* For badge positioning */
}

.mode-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--primary-color);
  color: white;
  font-size: 8px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
}

.icon-btn:hover {
  background: var(--hover-bg);
  transform: translateY(-2px);
}

.lang-text {
  font-weight: 700;
  font-size: 12px;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--border-color);
  margin-left: 8px;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

/* Main Content Styling */
.main-content {
  flex: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);
  }

  .sidebar.mobile-hidden {
    transform: translateX(-100%);
  }

}

/* Re-override for correct mobile logic with Vue state */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
  }

  .sidebar {
    transform: translateX(0); 
  }

  .sidebar.mobile-hidden {
    transform: translateX(-100%);
  }

  .close-sidebar-btn {
    display: block;
  }

  .main-wrapper {
    margin-left: 0;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .profile-name {
    display: none;
  }

  .main-content {
    padding: 16px;
  }

  .top-header {
    padding: 0 16px;
  }
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
