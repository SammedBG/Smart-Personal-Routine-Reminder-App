# How to Install Android Development Environment (Windows)

Follow these steps in order. After each step, **close and reopen PowerShell** (or restart your PC) so environment variables are applied.

---

## Step 1: Install Java JDK 17

1. Go to **https://adoptium.net/temurin/releases/**
2. Choose:
   - **Version:** 17 (LTS)
   - **Operating System:** Windows
   - **Architecture:** x64
3. Download the **.msi** installer.
4. Run the installer. Use the default install path (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`).
5. **Set JAVA_HOME** (replace the path with your actual install path if different):
   - Press **Win + R**, type `sysdm.cpl`, Enter.
   - Go to **Advanced** tab → **Environment Variables**.
   - Under **User variables**, click **New**:
     - Variable name: `JAVA_HOME`
     - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot`
   - Click OK. Then **New** again:
     - Variable name: `Path`
     - Variable value: `%JAVA_HOME%\bin`
   - (If **Path** already exists, click **Edit** → **New** → add `%JAVA_HOME%\bin`)
   - OK out of all dialogs.
6. **Verify:** Open a **new** PowerShell and run:
   ```powershell
   java -version
   ```
   You should see something like `openjdk version "17.x.x"`.

---

## Step 2: Install Android Studio

1. Go to **https://developer.android.com/studio**
2. Download **Android Studio** for Windows and run the installer.
3. During setup, choose **Standard** install. Let it download the Android SDK (this can take a while).
4. When Android Studio opens:
   - Go to **Settings** (or **File → Settings**).
   - **Languages & Frameworks → Android SDK** (or **Appearance & Behavior → System Settings → Android SDK**).
   - On the **SDK Platform** tab, ensure at least one version is installed (e.g. **Android 14.0 (API 34)**). If not, check it and click **Apply**.
   - On the **SDK Tools** tab, ensure **Android SDK Build-Tools** and **Android SDK Platform-Tools** are installed. Check them and **Apply** if needed.
   - Note your **Android SDK Location** (e.g. `C:\Users\YourName\AppData\Local\Android\Sdk`). You will use it in Step 3.

---

## Step 3: Add Android SDK to PATH (so `adb` works)

1. Open **Environment Variables** again (Win + R → `sysdm.cpl` → Advanced → Environment Variables).
2. Under **User variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: your SDK path, e.g
   `C:\Users\My\AppData\Local\Android\Sdk`
3. Edit **Path** (User variables):
   - Add: `%ANDROID_HOME%\platform-tools`
   - Add: `%ANDROID_HOME%\emulator`
   (So that `adb` and `emulator` are found.)
4. OK out of all dialogs.
5. **Verify:** Open a **new** PowerShell and run:
   ```powershell
   adb version
   ```
   You should see version info, not "not recognized".

---

## Step 4: Create an Android emulator (AVD)

1. Open **Android Studio**.
2. Go to **Tools → Device Manager** (or the phone/tablet icon in the toolbar).
3. Click **Create Device** (or **Create Virtual Device**).
4. Pick a phone (e.g. **Pixel 6**) → **Next**.
5. Choose a system image (e.g. **API 34**). If it says "Download" next to it, click to download first, then select it → **Next**.
6. Name the AVD (e.g. "Pixel_6_API_34") → **Finish**.
7. In Device Manager, click the **Play** button next to your AVD to **start the emulator**. Wait until the Android home screen appears.

---

## Step 5: Run the app

1. With the **emulator running** (or a physical device connected via USB with USB debugging on), open PowerShell.
2. Go to the mobile folder:
   ```powershell
   cd "C:\Users\My\Desktop\Smart Personal Routine Reminder App\mobile"
   ```
3. Run:
   ```powershell
   npm run android
   ```

The app will build and install on the emulator/device. The first build can take several minutes.

---

## Quick checklist

| Step | What to do | How to check |
|------|------------|---------------|
| 1 | Install JDK 17, set JAVA_HOME and add `%JAVA_HOME%\bin` to Path | `java -version` shows 17.x |
| 2 | Install Android Studio, install SDK Platform + Build-Tools | SDK path exists (e.g. `C:\Users\...\Android\Sdk`) |
| 3 | Set ANDROID_HOME, add `platform-tools` and `emulator` to Path | `adb version` works |
| 4 | Create and start an AVD in Device Manager | Emulator window shows Android home screen |
| 5 | Run `npm run android` from `mobile` folder | App installs and opens on emulator |

---

## If something fails

- **"JAVA_HOME is not set"**  
  Step 1 not done or terminal opened before setting env vars. Set JAVA_HOME, add `%JAVA_HOME%\bin` to Path, then **close and reopen** PowerShell.

- **"adb is not recognized"**  
  Step 3 not done. Add `%ANDROID_HOME%\platform-tools` to Path and restart the terminal.

- **"No emulators found"**  
  Step 4 not done. Create an AVD in Android Studio → Device Manager and **start it** (click Play) before running `npm run android`.

- **Gradle or build errors**  
  Run `npx react-native doctor` in the `mobile` folder and fix any reported issues.
