#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "=== 开始编译打包【问筊.app】原生桌面应用 ==="

APP_NAME="问筊.app"
CONTENTS_DIR="$APP_NAME/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# 创建 macOS 标准 App 目录结构
rm -rf "$APP_NAME"
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

echo "正在调用 Apple Clang 编译原生 Cocoa / WebKit 独立外壳..."
clang -O2 \
  -framework Cocoa \
  -framework WebKit \
  desktop/main.m \
  -o "$MACOS_DIR/WenJiao"

echo "拷贝前端文件、图标与动画资源..."
cp index.html "$RESOURCES_DIR/"
cp -r css "$RESOURCES_DIR/"
cp -r js "$RESOURCES_DIR/"
if [ -f "desktop/AppIcon.icns" ]; then
  cp desktop/AppIcon.icns "$RESOURCES_DIR/"
fi

echo "生成 App Info.plist..."
cat << 'EOF' > "$CONTENTS_DIR/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>WenJiao</string>
    <key>CFBundleIdentifier</key>
    <string>com.wenjiao.app</string>
    <key>CFBundleName</key>
    <string>问筊</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

chmod +x "$MACOS_DIR/WenJiao"

# 生成 start.command
cat << 'EOF' > start.command
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -d "$DIR/问筊.app" ]; then
  open "$DIR/问筊.app"
elif [ -d "$DIR/问筊-Tauri.app" ]; then
  open "$DIR/问筊-Tauri.app"
else
  open "$DIR/index.html"
fi
EOF
chmod +x start.command

echo "=== 构建成功！==="
ls -lh "$MACOS_DIR/WenJiao"
echo "已在当前目录生成【问筊.app】以及一键启动脚本【start.command】"
