#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -d "$DIR/问筊.app" ]; then
  open "$DIR/问筊.app"
elif [ -d "$DIR/问筊-Tauri.app" ]; then
  open "$DIR/问筊-Tauri.app"
else
  open "$DIR/index.html"
fi
