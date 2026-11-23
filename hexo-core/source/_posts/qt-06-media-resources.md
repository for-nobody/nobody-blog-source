---
title: "6. 添加媒体文件"
date: 2026-11-24 00:00:00
categories: [教程]
tags: [Qt]
---

在 Qt 中显示图片，最常用的控件其实是 **QLabel**（没错，就是你用来显示文字的那个）。
但是，这里有一个关键点：**不要直接写图片在硬盘上的绝对路径**（比如 `C:\User\Desktop\1.png`），因为当你把 `.exe` 发给别人时，他的电脑上没有这个路径。
我们要学习使用 **Qt 资源系统 (.qrc)**。
#### 步骤 1：创建资源文件
1. 在左侧项目文件夹上右键 -> **添加新文件... (Add New...)**。
2. 选择 **Qt** -> **Qt Resource File**。
3. 取个名字，比如 `res`，完成后会生成一个 `res.qrc`。  
#### 步骤 2：添加图片
1. 在项目根目录下创建一个文件夹叫 `images`，把你的图片（比如 `logo.png`）放进去。
- 如果这一步有问题：对于test项目文件夹右键，发现“添加新文件”为灰色，可以在菜单栏“文件”中选择“新建文件”（“Add New File”），之后按照本步骤2的剩余条列操作之后，在`CMakeLists.txt`里面的set函数添加`set(PROJECT_SOURCES res.qrc)`这一项，CMake会识别新建立的文件。
2. 在 Qt Creator 里双击 `res.qrc`，点击下方的 **添加 (Add)** -> **添加前缀 (Add Prefix)**，默认是 `/`。
3. 点击 **添加 (Add)** -> **添加文件 (Add Files)**，选择你的图片。
4. **保存所有文件**（这很重要，CMake 才会识别）。
#### 步骤 3：在代码中显示图片
你可以直接在 UI 设计器里设置，也可以用代码：
- **方法 A：在 UI 设计器里设置（最快）**
	1. 双击 `test.ui`，选中一个 **QLabel**。
	2. 在右侧属性栏找到 **pixmap** 属性。
	3. 点击小箭头选择“选择资源”，选中你的图片。
	4. （可选）勾选 **scaledContents**，图片就会自动拉伸填满 Label。
		这里有一个非常实用的“坑”：如果你直接勾选 `scaledContents`，图片会像拉面一样被扯变形。
		如果你想让图片**保持比例**（比如正方形图片永远是正方形），代码应该这样写：
```C++
// 1. 加载图片
QPixmap pix(":/images/logo.png");

// 2. 缩放图片，保持比例 (Keep Aspect Ratio)
// Qt::KeepAspectRatio 保证图片不失真
// Qt::SmoothTransformation 让缩放后的图片没有锯齿
QPixmap scaledPix = pix.scaled(ui->label->size(), 
                               Qt::KeepAspectRatio, 
                               Qt::SmoothTransformation);

// 3. 显示
ui->label->setPixmap(scaledPix);
```
- **方法 B：在代码中设置**
```C++
// 在构造函数里
QPixmap pix(":/images/logo.png"); // 注意前缀是冒号
ui->label->setPixmap(pix);
ui->label->setScaledContents(true); // 让图片随 Label 大小缩放
```
