---
slug: android-status-bar-color
title: Android 状态栏颜色设置在jetpack compose中
authors: [hcisme]
tags: [android, jetpack_compose]
---

---

# Kotlin Jetpack Compose 状态栏设置笔记

本文记录如何在 Kotlin Jetpack Compose 中设置状态栏颜色，同时区分了 API 21–API 34 与 API 35+ 的差异。

---

## 1. 使用 `window.statusBarColor` (API 21 - API 34)

- **API 历史：**
  - **Added in API level 21**
  - **Deprecated in API level 35**

- **方法签名：**
  ```java
  public abstract void setStatusBarColor(int color)
  ```

- **使用方法：**
```kotlin
val context = LocalContext.current
val window = (context as Activity).window
window.statusBarColor = Color.Blue.toArgb()
```
---

## 2. API 35 及以上官方推荐

- **官方描述说明：**  
  在 API 35 及以后的版本中，该方法已经废弃，官方建议不再直接使用 `window.statusBarColor`，而是通过为 `WindowInsets.Type.statusBars()` 绘制合适的背景来实现类似效果。

---

## 3. 使用自定义绘制设置状态栏背景（Compose 示例）

在 Compose 中，可以结合 `LocalDensity` 和 `WindowInsets` 来自定义绘制状态栏背景：

```kotlin
val density = LocalDensity.current
val statusBarHeight = WindowInsets.statusBars.getTop(density)

Box(
    modifier = Modifier
        .fillMaxWidth()
        .height(with(density) { statusBarHeight.toDp() })
        .background(Color(0xFF6200EA))
  )
```

---

## 4. 使用WindowInsetsControllerCompat设置状态栏亮色暗色模式

```kotlin
val insetsControllerCompat = WindowInsetsControllerCompat(
  window, 
  window.decorView
)
insetsControllerCompat.apply {
    isAppearanceLightStatusBars = false / true
    isAppearanceLightNavigationBars = false / true
}
```
