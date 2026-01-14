<script setup lang="ts">
import { ref, inject } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref("");
const password = ref("");
const error = ref("");
const t: any = inject("translations");

function handleLogin() {
  if (username.value === "admin" && password.value === "admin") {
    localStorage.setItem("isAuthenticated", "true");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  } else {
    error.value = t.value.login.invalidCreds;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand">
        <i class="fas fa-wallet brand-icon" aria-hidden="true"></i>
        <h1>{{ t.login.brandName }}</h1>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">{{ t.login.username }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            :placeholder="t.login.usernamePlaceholder"
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label for="password">{{ t.login.password }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="t.login.passwordPlaceholder"
            required
          />
        </div>

        <p v-if="error" class="error-msg" role="alert">{{ error }}</p>

        <button type="submit" class="login-btn">
          {{ t.login.signIn }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.login-card {
  background: var(--card-bg, #ffffff);
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.dark .login-card {
  background: #1f2937; /* Fallback dark bg if variable not set */
}

.brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  font-size: 40px;
  color: var(--primary-color, #3b82f6);
  margin-bottom: 12px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-msg {
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
</style>
