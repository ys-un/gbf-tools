import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoMqHoeM-g6ZsoWoZnW12gw0Lm_Cr-Lgk",
  authDomain: "gbf-tools-e14f6.firebaseapp.com",
  projectId: "gbf-tools-e14f6",
  storageBucket: "gbf-tools-e14f6.firebasestorage.app",
  messagingSenderId: "25369871701",
  appId: "1:25369871701:web:fce43a5e275fef658adbdc",
  measurementId: "G-0SY8J19VY0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const registeredTools = new Map();
const saveTimers = new Map();
let currentUser = null;
let authInitialized = false;

const loginButton = document.getElementById("googleLoginBtn");
const logoutButton = document.getElementById("logoutBtn");
const userArea = document.getElementById("authUser");
const userName = document.getElementById("authUserName");
const userPhoto = document.getElementById("authUserPhoto");
const authMessage = document.getElementById("authMessage");

function setAuthMessage(message, type = "") {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `auth_message${type ? ` ${type}` : ""}`;
}

function updateAuthUI(user) {
  if (!loginButton || !logoutButton || !userArea) return;

  if (user) {
    loginButton.hidden = true;
    userArea.hidden = false;
    logoutButton.hidden = false;
    userName.textContent = user.displayName || user.email || "ログイン中";

    if (user.photoURL) {
      userPhoto.src = user.photoURL;
      userPhoto.hidden = false;
    } else {
      userPhoto.removeAttribute("src");
      userPhoto.hidden = true;
    }

    setAuthMessage("クラウド同期中", "is_syncing");
  } else {
    loginButton.hidden = false;
    userArea.hidden = true;
    logoutButton.hidden = true;
    setAuthMessage("未ログイン：この端末に保存されます");
  }
}

function toolDocRef(toolName) {
  if (!currentUser) return null;
  return doc(db, "users", currentUser.uid, "tools", toolName);
}

async function syncRegisteredTool(toolName, handlers) {
  if (!currentUser) return;

  const ref = toolDocRef(toolName);
  if (!ref) return;

  try {
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const cloudData = snapshot.data()?.data;
      if (cloudData && typeof cloudData === "object") {
        handlers.applyData(cloudData);
      }
    } else {
      const localData = handlers.getLocalData();
      await setDoc(ref, {
        data: localData,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error(`${toolName} の同期に失敗しました。`, error);
    setAuthMessage("同期に失敗しました", "is_error");
  }
}

async function syncAllTools() {
  if (!currentUser) return;

  setAuthMessage("クラウド同期中", "is_syncing");

  await Promise.all(
    [...registeredTools.entries()].map(([toolName, handlers]) =>
      syncRegisteredTool(toolName, handlers)
    )
  );

  setAuthMessage("クラウド同期済み", "is_success");
}

async function saveToolData(toolName, data) {
  if (!currentUser) return;

  const ref = toolDocRef(toolName);
  if (!ref) return;

  setAuthMessage("保存中", "is_syncing");

  try {
    await setDoc(ref, {
      data,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setAuthMessage("クラウド保存済み", "is_success");
  } catch (error) {
    console.error(`${toolName} の保存に失敗しました。`, error);
    setAuthMessage("保存に失敗しました", "is_error");
  }
}

window.GBFCloud = {
  get user() {
    return currentUser;
  },

  registerTool(toolName, handlers) {
    if (
      !toolName ||
      typeof handlers?.getLocalData !== "function" ||
      typeof handlers?.applyData !== "function"
    ) {
      console.error("registerTool の設定が正しくありません。", toolName);
      return;
    }

    registeredTools.set(toolName, handlers);

    if (authInitialized && currentUser) {
      syncRegisteredTool(toolName, handlers).then(() => {
        setAuthMessage("クラウド同期済み", "is_success");
      });
    }
  },

  queueSave(toolName, data, delay = 500) {
    if (!currentUser) return;

    if (saveTimers.has(toolName)) {
      clearTimeout(saveTimers.get(toolName));
    }

    const timerId = setTimeout(() => {
      saveTimers.delete(toolName);
      saveToolData(toolName, data);
    }, delay);

    saveTimers.set(toolName, timerId);
  },

  async saveNow(toolName, data) {
    if (saveTimers.has(toolName)) {
      clearTimeout(saveTimers.get(toolName));
      saveTimers.delete(toolName);
    }
    await saveToolData(toolName, data);
  }
};

document.dispatchEvent(new CustomEvent("gbf-cloud-api-ready"));

loginButton?.addEventListener("click", async () => {
  loginButton.disabled = true;
  setAuthMessage("ログイン処理中", "is_syncing");

  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Googleログインに失敗しました。", error);

    if (error.code === "auth/popup-closed-by-user") {
      setAuthMessage("ログインをキャンセルしました");
    } else if (error.code === "auth/unauthorized-domain") {
      setAuthMessage("Firebaseで公開ドメインの許可が必要です", "is_error");
    } else {
      setAuthMessage("ログインに失敗しました", "is_error");
    }
  } finally {
    loginButton.disabled = false;
  }
});

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await signOut(auth);
  } catch (error) {
    console.error("ログアウトに失敗しました。", error);
    setAuthMessage("ログアウトに失敗しました", "is_error");
  } finally {
    logoutButton.disabled = false;
  }
});

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("ログイン状態の保持設定に失敗しました。", error);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  authInitialized = true;
  updateAuthUI(user);

  document.dispatchEvent(new CustomEvent("gbf-auth-changed", {
    detail: { user }
  }));

  if (user) {
    await syncAllTools();
  }
});
