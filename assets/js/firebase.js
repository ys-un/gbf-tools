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

provider.setCustomParameters({
  prompt: "select_account"
});

const registeredTools = new Map();
const saveTimers = new Map();
const pendingSaves = new Map();

let currentUser = null;
let authInitialized = false;
let flushPromise = null;

const SAVE_DELAY = 1000;

const loginButton = document.getElementById("googleLoginBtn");
const logoutButton = document.getElementById("logoutBtn");
const userArea = document.getElementById("authUser");
const userName = document.getElementById("authUserName");
const userPhoto = document.getElementById("authUserPhoto");
const authMessage = document.getElementById("authMessage");

function setAuthMessage(message, type = "") {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = message;
  authMessage.className = `auth_message${type ? ` ${type}` : ""}`;
}

function resetUserDisplay() {
  if (userName) {
    userName.textContent = "";
  }

  if (userPhoto) {
    userPhoto.removeAttribute("src");
    userPhoto.removeAttribute("alt");
    userPhoto.hidden = true;
  }
}

function updateAuthUI(user) {
  if (!loginButton || !logoutButton || !userArea) {
    return;
  }

  if (user) {
    loginButton.hidden = true;
    userArea.hidden = false;
    logoutButton.hidden = false;

    if (userName) {
      userName.textContent =
        user.displayName ||
        user.email ||
        "ログイン中";
    }

    if (userPhoto) {
      if (user.photoURL) {
        userPhoto.src = user.photoURL;
        userPhoto.alt = `${user.displayName || "ユーザー"}のプロフィール画像`;
        userPhoto.hidden = false;
      } else {
        userPhoto.removeAttribute("src");
        userPhoto.removeAttribute("alt");
        userPhoto.hidden = true;
      }
    }

    setAuthMessage("クラウド同期中", "is_syncing");
    return;
  }

  resetUserDisplay();

  loginButton.hidden = false;
  userArea.hidden = true;
  logoutButton.hidden = true;

  setAuthMessage("未ログイン：この端末に保存されます");
}

function toolDocRef(toolName) {
  if (!currentUser) {
    return null;
  }

  return doc(
    db,
    "users",
    currentUser.uid,
    "tools",
    toolName
  );
}

async function syncRegisteredTool(toolName, handlers) {
  if (!currentUser) {
    return;
  }

  const ref = toolDocRef(toolName);

  if (!ref) {
    return;
  }

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
  if (!currentUser) {
    return;
  }

  setAuthMessage("クラウド同期中", "is_syncing");

  await Promise.all(
    [...registeredTools.entries()].map(([toolName, handlers]) =>
      syncRegisteredTool(toolName, handlers)
    )
  );

  setAuthMessage("クラウド同期済み", "is_success");
}

async function saveToolData(toolName, data) {
  if (!currentUser) {
    return false;
  }

  const ref = toolDocRef(toolName);

  if (!ref) {
    return false;
  }

  setAuthMessage("保存中", "is_syncing");

  try {
    await setDoc(
      ref,
      {
        data,
        updatedAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    setAuthMessage("クラウド保存済み", "is_success");
    return true;
  } catch (error) {
    console.error(`${toolName} の保存に失敗しました。`, error);
    setAuthMessage("保存に失敗しました", "is_error");
    return false;
  }
}

async function flushPendingSaves() {
  if (!currentUser || pendingSaves.size === 0) {
    return;
  }

  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    const saves = [...pendingSaves.entries()];

    saves.forEach(([toolName]) => {
      const timerId = saveTimers.get(toolName);

      if (timerId) {
        clearTimeout(timerId);
      }

      saveTimers.delete(toolName);
    });

    pendingSaves.clear();

    await Promise.all(
      saves.map(([toolName, data]) =>
        saveToolData(toolName, data)
      )
    );
  })();

  try {
    await flushPromise;
  } finally {
    flushPromise = null;
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
      console.error(
        "registerTool の設定が正しくありません。",
        toolName
      );
      return;
    }

    registeredTools.set(toolName, handlers);

    if (authInitialized && currentUser) {
      syncRegisteredTool(toolName, handlers).then(() => {
        setAuthMessage("クラウド同期済み", "is_success");
      });
    }
  },

  queueSave(toolName, data, delay = SAVE_DELAY) {
    if (!currentUser) {
      return;
    }

    pendingSaves.set(toolName, data);
    setAuthMessage("保存待機中…", "is_syncing");

    if (saveTimers.has(toolName)) {
      clearTimeout(saveTimers.get(toolName));
    }

    const timerId = setTimeout(async () => {
      saveTimers.delete(toolName);

      const pendingData = pendingSaves.get(toolName);
      pendingSaves.delete(toolName);

      if (pendingData !== undefined) {
        await saveToolData(toolName, pendingData);
      }
    }, delay);

    saveTimers.set(toolName, timerId);
  },

  async saveNow(toolName, data) {
    const timerId = saveTimers.get(toolName);

    if (timerId) {
      clearTimeout(timerId);
    }

    saveTimers.delete(toolName);
    pendingSaves.delete(toolName);

    await saveToolData(toolName, data);
  },

  async flush() {
    await flushPendingSaves();
  }
};

document.dispatchEvent(
  new CustomEvent("gbf-cloud-api-ready")
);

loginButton?.addEventListener("click", async () => {
  loginButton.disabled = true;
  setAuthMessage("ログイン処理中", "is_syncing");

  try {
    await setPersistence(
      auth,
      browserLocalPersistence
    );

    await signInWithPopup(
      auth,
      provider
    );
  } catch (error) {
    console.error("Googleログインに失敗しました。", error);

    if (error.code === "auth/popup-closed-by-user") {
      setAuthMessage("ログインをキャンセルしました");
    } else if (error.code === "auth/unauthorized-domain") {
      setAuthMessage(
        "Firebaseで公開ドメインの許可が必要です",
        "is_error"
      );
    } else {
      setAuthMessage("ログインに失敗しました", "is_error");
    }
  } finally {
    loginButton.disabled = false;
  }
});

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;
  setAuthMessage("保存してログアウト中…", "is_syncing");

  try {
    await flushPendingSaves();
    await signOut(auth);
  } catch (error) {
    console.error("ログアウトに失敗しました。", error);
    setAuthMessage("ログアウトに失敗しました", "is_error");
  } finally {
    logoutButton.disabled = false;
  }
});

setPersistence(
  auth,
  browserLocalPersistence
).catch((error) => {
  console.error(
    "ログイン状態の保持設定に失敗しました。",
    error
  );
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  authInitialized = true;
  updateAuthUI(user);

  document.dispatchEvent(
    new CustomEvent(
      "gbf-auth-changed",
      {
        detail: {
          user
        }
      }
    )
  );

  if (user) {
    await syncAllTools();
  }
});

/*
 * ページを閉じる・移動する直前に、保存待ちデータを可能な限り送信します。
 * localStorageへの保存は各ツール側ですでに即時実行されるため、
 * 通信が間に合わない場合でもこの端末の入力値は残ります。
 */
window.addEventListener("pagehide", () => {
  void flushPendingSaves();
});

window.addEventListener("beforeunload", () => {
  void flushPendingSaves();
});

/*
 * スマホでアプリを閉じる・別アプリへ切り替えるケースへの補助対応。
 */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    void flushPendingSaves();
  }
});
